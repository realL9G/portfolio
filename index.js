(function(U, n, l, v, e, y, B, k) {
    "use strict";

    const { FormSection: N, FormInput: f, FormRow: A } = v.Forms;
    const F = l.findByProps("getCurrentUser", "getUser");
    const O = l.findByProps("getChannel", "getChannelId");
    const $ = l.findByProps("getChannelId", "getLastSelectedChannelId");
    const _ = l.findByProps("openLazy", "hideActionSheet");
    const w = l.findByProps("ActionSheetRow")?.ActionSheetRow ?? v.Forms.FormRow;
    const G = l.findByStoreName("MessageStore");
    const j = l.findByStoreName("UserStore");
    const R = l.findByProps("sendMessage", "startEditMessage", "editMessage");
    
    // Discord Native Toast module for mobile popups
    const Toasts = l.findByProps("showToast", "openToast") || l.findByModules("showToast")[0];

    const ChannelStore = l.findByStoreName("ChannelStore");
    const PrivateChannelActions = l.findByProps("openPrivateChannel") || l.findByModules("openPrivateChannel")[0];
    
    const editedMessageCache = new Map();
    let isEditingLocally = !1;

    function generateSnowflake(timestamp) {
        return ((new Date(timestamp).getTime() - 14200704e5) * 4194304).toString();
    }

    function showNotification(message) {
        try {
            if (Toasts?.showToast) {
                Toasts.showToast({
                    message: message,
                    id: Date.now()
                });
                return;
            }
        } catch {}
        // Fallback console log if native toast isn't available
        console.log("[DM Generator]: " + message);
    }

    async function getOrCreateDMChannel(targetUserId) {
        if (!targetUserId) return null;
        const dmChannels = ChannelStore?.getPrivateChannels?.() || {};
        for (const channelId in dmChannels) {
            const channel = dmChannels[channelId];
            if (channel && channel.recipients && channel.recipients.includes(targetUserId)) {
                return channel.id;
            }
        }
        if (PrivateChannelActions?.openPrivateChannel) {
            try {
                return await PrivateChannelActions.openPrivateChannel(targetUserId);
            } catch (err) {
                console.error("Failed to open private channel:", err);
                return null;
            }
        }
        return null;
    }

    async function injectFakeMessage(channelId, userId, content, customTimestamp, messageId) {
        const id = messageId || generateSnowflake(customTimestamp || new Date().toISOString());
        try {
            const currentUser = F.getCurrentUser();
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
                    username: user ? user.username : "TargetUser",
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
            const [scriptInput, setScriptInput] = n.React.useState(e.storage.scriptInput || JSON.stringify([
                { sender: "other", text: "Hey, are you ready for the trade?" },
                { sender: "me", text: "Yeah, sending it over now. nigha" },
                { sender: "other", text: "Awesome, received! Pleasure doing business." }
            ], null, 2));

            const foundOtherUser = otherUserId ? (F.getUser(otherUserId) || j.getUser(otherUserId)) : null;
            const savedCount = (e.storage.savedMessages || []).length;

            return n.React.createElement(v.Forms.Form, {},
                n.React.createElement(N, { title: "Automated DM Conversation Generator" },
                    n.React.createElement(f, {
                        title: "Other User ID",
                        placeholder: "Enter the user ID of the other person",
                        value: otherUserId,
                        onChange: function(val) { 
                            const textVal = typeof val === "object" ? (val?.nativeEvent?.text || val?.target?.value || "") : (val || "");
                            const trimmed = textVal.trim();
                            setOtherUserId(trimmed);
                            e.storage.otherUserId = trimmed;
                        },
                        helperText: foundOtherUser ? `User: ${foundOtherUser.username}` : otherUserId ? "User not found in cache (open their profile/DM once first)" : "Long-press a user to grab ID"
                    }),
                    n.React.createElement(A, {
                        label: "Play Out Full Conversation",
                        subLabel: `${savedCount} messages saved locally | Target: ${otherUserId || "None"}`,
                        onPress: async function() {
                            const targetId = otherUserId || e.storage.otherUserId;
                            if (!targetId) {
                                showNotification("Error: Please provide a target User ID first.");
                                return;
                            }

                            const channelId = await getOrCreateDMChannel(targetId);
                            if (!channelId) {
                                showNotification("Error: Could not resolve DM channel for target ID.");
                                return;
                            }

                            let parsedScript;
                            try {
                                parsedScript = JSON.parse(scriptInput || e.storage.scriptInput);
                            } catch (err) {
                                showNotification("Error: Invalid JSON script format.");
                                return;
                            }

                            let baseTime = new Date().getTime() - (parsedScript.length * 30000);

                            const myUserId = F.getCurrentUser()?.id;
                            for (const line of parsedScript) {
                                const senderId = line.sender === "me" ? myUserId : targetId;
                                if (!senderId) continue;

                                baseTime += 30000;
                                const isoString = new Date(baseTime).toISOString();
                                const snowflakeId = generateSnowflake(isoString);

                                await injectFakeMessage(channelId, senderId, line.text, isoString, snowflakeId);
                                addStoredMessage(channelId, senderId, line.text, snowflakeId, isoString);
                            }

                            showNotification("Conversation playback complete!");
                        }
                    }),
                    n.React.createElement(f, {
                        title: "Conversation Script (JSON Table)",
                        placeholder: "Define 'me' and 'other' script messages",
                        value: scriptInput,
                        onChange: function(val) { 
                            const textVal = typeof val === "object" ? (val?.nativeEvent?.text || val?.target?.value || "") : (val || "");
                            setScriptInput(textVal);
                            e.storage.scriptInput = textVal; 
                        },
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
