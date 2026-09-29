(function(U, n, l, v, e, y, B, k) {
    "use strict";

    const { FormSection: N, FormInput: f, FormRow: A, FormSwitch: S } = v.Forms;
    const F = l.findByProps("getCurrentUser", "getUser");
    const O = l.findByProps("getChannel", "getChannelId");
    const $ = l.findByProps("getChannelId", "getLastSelectedChannelId");
    const _ = l.findByProps("openLazy", "hideActionSheet");
    const w = l.findByProps("ActionSheetRow")?.ActionSheetRow ?? v.Forms.FormRow;
    const G = l.findByStoreName("MessageStore");
    const j = l.findByStoreName("UserStore");
    const R = l.findByProps("sendMessage", "startEditMessage", "editMessage");
    const Navigation = l.findByProps("transitionTo") || n.Navigation;
    
    const ChannelStore = l.findByStoreName("ChannelStore");
    const PrivateChannelActions = l.findByProps("openPrivateChannel") || l.findByModules("openPrivateChannel")[0];
    
    const editedMessageCache = new Map();
    let isEditingLocally = !1;

    function generateSnowflake(timestamp) {
        return ((new Date(timestamp).getTime() - 14200704e5) * 4194304).toString();
    }

    function parseJSONSafely(str) {
        try {
            return JSON.parse(str);
        } catch (err1) {
            try {
                const cleaned = str.replace(/,\s*([\]}])/g, '$1');
                return JSON.parse(cleaned);
            } catch (err2) {
                console.error("Failed to parse script JSON:", err2);
                return null;
            }
        }
    }

    async function getOrCreateGroupChannel(targetUserId) {
        if (!targetUserId) return null;
        const currentUser = F.getCurrentUser() || j.getCurrentUser();
        const myId = currentUser?.id;
        
        const dmChannels = ChannelStore?.getPrivateChannels?.() || {};
        for (const channelId in dmChannels) {
            const channel = dmChannels[channelId];
            if (channel && channel.type === 3 && channel.recipients?.includes(targetUserId)) {
                return channel.id;
            }
        }

        if (PrivateChannelActions?.openPrivateChannel) {
            try {
                const res = await PrivateChannelActions.openPrivateChannel([targetUserId, myId]);
                return typeof res === "string" ? res : (res?.id || res?.channelId);
            } catch (err) {
                console.error("Failed to open group private channel:", err);
            }
        }
        return null;
    }

    async function injectFakeMessage(channelId, userId, content, customTimestamp, messageId) {
        const id = messageId || generateSnowflake(customTimestamp || new Date().toISOString());
        try {
            const currentUser = F.getCurrentUser() || j.getCurrentUser();
            let user = null;
            
            if (userId === currentUser?.id) {
                user = currentUser;
            } else {
                user = F.getUser(userId) || j.getUser(userId);
            }

            const timestamp = customTimestamp || new Date().toISOString();
            const messageData = {
                id: id,
                type: 0,
                channel_id: channelId,
                author: {
                    id: userId,
                    username: user ? user.username : (userId === otherUserIdCache ? "TargetUser" : "User"),
                    discriminator: user ? user.discriminator : "0001",
                    avatar: user ? user.avatar : null,
                    bot: user ? user.bot : !1
                },
                content: content,
                mentions: [],
                mention_roles: [],
                pinned: !1,
                tts: !1,
                attachments: [],
                embeds: [],
                timestamp: timestamp,
                edited_timestamp: null,
                state: "SENT",
                fake: !0
            };

            n.FluxDispatcher.dispatch({
                type: "MESSAGE_CREATE",
                channelId: channelId,
                message: messageData,
                otherPluginBypass: !0
            });

            try {
                n.FluxDispatcher.dispatch({
                    type: "CHANNEL_UPDATE",
                    channel: { id: channelId, last_message_id: id }
                });
            } catch {}

            try {
                n.FluxDispatcher.dispatch({
                    type: "MESSAGE_ACK",
                    channelId: channelId,
                    messageId: id,
                    manual: !0,
                    immediate: !0
                });
            } catch {}
        } catch {}
    }

    function saveMessagesToStorage(messages) {
        e.storage.savedMessages = messages;
        e.storage._lastUpdate = Date.now();
    }

    function addStoredMessage(channelId, userId, content, messageId, timestamp) {
        const messages = e.storage.savedMessages || [];
        messages.push({
            id: messageId,
            channelId: channelId,
            userId: userId,
            content: content,
            timestamp: timestamp,
            createdAt: Date.now()
        });
        saveMessagesToStorage(messages);
    }

    function reloadSavedMessagesForChannel(channelId) {
        (e.storage.savedMessages || []).filter(function(msg) {
            return msg.channelId === channelId;
        }).forEach(function(msg) {
            injectFakeMessage(msg.channelId, msg.userId, msg.content, msg.timestamp, msg.id);
        });
    }

    function getCurrentChannelId() {
        return $?.getChannelId() || O?.getChannelId?.() || null;
    }

    let userContextMenuPatch = null;
    let channelSelectSub = null;
    let patches = [];
    let dispatchUnpatch = null;
    let otherUserIdCache = "";

    var PluginModule = {
        onLoad() {
            dispatchUnpatch = y.before("dispatch", n.FluxDispatcher, function(args) {
                const [event] = args;
                if (event.type === "MESSAGE_UPDATE" && event.message?.fake && !event.otherPluginBypass && !isEditingLocally) {
                    return [];
                }
            });

            try {
                const userContext = l.findByProps("openUserContextMenu");
                userContext?.openUserContextMenu && (userContextMenuPatch = y.after("openUserContextMenu", userContext, function(args) {
                    const targetUserId = args[0]?.userId || args[0]?.user?.id;
                    targetUserId && (e.storage.otherUserId = targetUserId);
                }));
            } catch {}

            try {
                channelSelectSub = n.FluxDispatcher.subscribe("CHANNEL_SELECT", function(event) {
                    const channelId = event?.channelId;
                    channelId && setTimeout(function() {
                        return reloadSavedMessagesForChannel(channelId);
                    }, 500);
                });
            } catch {}

            const activeChannel = getCurrentChannelId();
            activeChannel && setTimeout(function() {
                return reloadSavedMessagesForChannel(activeChannel);
            }, 1e3);

            patches.push(y.before("openLazy", _, function([args, componentKey, extra]) {
                const targetMessage = extra?.message;
                if (componentKey !== "MessageLongPressActionSheet" || !targetMessage || !args) return;

                args.then(function(loadedModule) {
                    const unpatchDefault = y.after("default", loadedModule, function(methodArgs, res) {
                        setTimeout(unpatchDefault, 0);
                        const actionSheetRow = k.findInReactTree(res, function(node) {
                            return node?.[0]?.type?.name === "ActionSheetRow";
                        });
                        if (!actionSheetRow) return;

                        const currentUser = j.getCurrentUser();
                        const targetMsgObj = G.getMessage(targetMessage.channel_id, targetMessage.id) ?? targetMessage;

                        if (targetMsgObj.author.id === currentUser.id || actionSheetRow.some(function(row) {
                            return row?.props?.label === "Edit Locally";
                        })) return;

                        const markUnreadIndex = Math.max(actionSheetRow.findIndex(function(row) {
                            return row.props.message === n.i18n.Messages.MARK_UNREAD;
                        }), 0);

                        const handleEditLocally = function() {
                            isEditingLocally = !0;
                            editedMessageCache.has(targetMsgObj.id) || editedMessageCache.set(targetMsgObj.id, JSON.parse(JSON.stringify(targetMsgObj)));
                            _.hideActionSheet();
                            R.startEditMessage(targetMsgObj.channel_id, targetMsgObj.id, targetMsgObj.content);
                        };

                        actionSheetRow.splice(markUnreadIndex, 0, n.React.createElement(w, {
                            label: "Edit Locally",
                            icon: n.React.createElement(w.Icon, { source: B.getAssetIDByName("ic_edit_24px") }),
                            onPress: handleEditLocally
                        }));
                    });
                });
            }));

            patches.push(y.before("editMessage", R, function(args) {
                const [channelId, messageId, newContent] = args;
                if (isEditingLocally) {
                    const originalMessage = editedMessageCache.get(messageId);
                    if (!originalMessage) return;

                    const savedList = e.storage.savedMessages || [];
                    const savedItem = savedList.find(function(item) {
                        return item.id === messageId;
                    });
                    
                    savedItem && (savedItem.content = newContent.content, saveMessagesToStorage(savedList));

                    n.FluxDispatcher.dispatch({
                        type: "MESSAGE_UPDATE",
                        message: { ...originalMessage, content: newContent.content, edited_timestamp: null },
                        otherPluginBypass: !0
                    });
                    return [];
                }
            }));

            patches.push(y.after("endEditMessage", R, function() {
                isEditingLocally && (isEditingLocally = !1);
            }));
        },

        onUnload() {
            userContextMenuPatch && (userContextMenuPatch(), userContextMenuPatch = null);
            channelSelectSub && (n.FluxDispatcher.unsubscribe("CHANNEL_SELECT", channelSelectSub), channelSelectSub = null);
            dispatchUnpatch && (dispatchUnpatch(), dispatchUnpatch = null);
            patches.forEach(function(unpatch) { return unpatch(); });
            patches = [];
            editedMessageCache.clear();
        },

        settings: function() {
            const [otherUserId, setOtherUserId] = n.React.useState(e.storage.otherUserId || "");
            const [isGroupDM, setIsGroupDM] = n.React.useState(e.storage.isGroupDM || false);
            
            otherUserIdCache = otherUserId;
            const foundOtherUser = otherUserId ? (F.getUser(otherUserId) || j.getUser(otherUserId)) : null;
            const savedCount = (e.storage.savedMessages || []).length;
            
            const defaultScript = JSON.stringify([
                { sender: "other", text: "Hey, are you ready for the trade?", delay: 0 },
                { sender: "me", text: "Yeah, sending it over now.", delay: 1 },
                { sender: "other", text: "Awesome, received! Pleasure doing business.", delay: 2 }
            ], null, 2);

            const scriptInput = e.storage.scriptInput || defaultScript;

            return n.React.createElement(v.Forms.Form, {},
                n.React.createElement(N, { title: "Automated DM Conversation Generator" },
                    n.React.createElement(f, {
                        title: "Other User ID",
                        placeholder: "Enter the user ID of the other person",
                        value: otherUserId,
                        onChange: function(val) { 
                            const cleanVal = val || "";
                            setOtherUserId(cleanVal);
                            e.storage.otherUserId = cleanVal;
                            otherUserIdCache = cleanVal;
                        },
                        helperText: "Long-press any user to copy their ID and paste it here."
                    }),
                    n.React.createElement(A, {
                        label: "Create as Group DM",
                        subLabel: "Toggle on to target a Group DM instead of a 1-on-1 Direct Message.",
                        trailing: n.React.createElement(S, {
                            value: isGroupDM,
                            onValueChange: function(val) {
                                setIsGroupDM(val);
                                e.storage.isGroupDM = val;
                            }
                        }),
                        onPress: function() {
                            const nextVal = !isGroupDM;
                            setIsGroupDM(nextVal);
                            e.storage.isGroupDM = nextVal;
                        }
                    }),
                    n.React.createElement(A, {
                        label: "Play Out Full Conversation",
                        subLabel: `${savedCount} messages saved locally | Mode: ${isGroupDM ? "Group DM" : "Direct Message"}`,
                        onPress: async function() {
                            const currentUserObj = F.getCurrentUser() || j.getCurrentUser();
                            const myUserId = currentUserObj?.id;
                            if (!myUserId) return;

                            let channelId = null;

                            if (!isGroupDM) {
                                // 1-on-1 mode: Simply use the channel you are CURRENTLY looking at. No lookups, no redirects!
                                channelId = getCurrentChannelId();
                                if (!channelId) return;
                            } else {
                                // Group mode: fetch or create group DM channel and redirect
                                if (!otherUserId) return;
                                channelId = await getOrCreateGroupChannel(otherUserId);
                                if (!channelId) return;
                            }

                            const parsedScript = parseJSONSafely(e.storage.scriptInput || defaultScript);
                            if (!Array.isArray(parsedScript)) return;

                            let baseTime = Date.now() - (10 * 60000);

                            for (const line of parsedScript) {
                                const delayMinutes = typeof line.delay === "number" ? line.delay : 0;
                                baseTime += delayMinutes * 60000;

                                const senderId = line.sender === "me" ? myUserId : otherUserId;
                                if (!senderId) continue;

                                const isoString = new Date(baseTime).toISOString();
                                const snowflakeId = generateSnowflake(isoString);

                                await injectFakeMessage(channelId, senderId, line.text, isoString, snowflakeId);
                                addStoredMessage(channelId, senderId, line.text, snowflakeId, isoString);
                            }

                            // Only redirect if it's explicitly a group DM
                            if (isGroupDM) {
                                try {
                                    if (Navigation?.transitionTo) {
                                        Navigation.transitionTo(`/channels/@me/${channelId}`);
                                    }
                                } catch (err) {}
                            }
                        }
                    }),
                    n.React.createElement(v.Forms.FormText, {
                        type: "description",
                        style: { marginBottom: 16, paddingLeft: 8, color: "#b9bbbe" }
                    }, otherUserId ? `Target Status: ${foundOtherUser ? `Found (@${foundOtherUser.username})` : "ID Cached (User not fully loaded in cache)"} | Type: ${isGroupDM ? "Group Chat" : "1-on-1 DM"}` : "Status: No User ID provided yet."),
                    n.React.createElement(f, {
                        title: "Conversation Script (JSON Table)",
                        placeholder: "Define 'me', 'other', and 'delay' (in minutes) for each message",
                        value: scriptInput,
                        onChange: function(val) { e.storage.scriptInput = val || ""; },
                        multiline: !0
                    })
                )
            );
        }
    };

    U.default = PluginModule;
    Object.defineProperty(U, "__esModule", { value: !0 });
    return U;
})({}, vendetta.metro.common, vendetta.metro, vendetta.ui.components, vendetta.plugin, vendetta.patcher, vendetta.ui.assets, vendetta.utils);
