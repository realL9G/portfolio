document.addEventListener("DOMContentLoaded", function () {
  const techInfo = {
    robloxstudio: {
      name: "Roblox Studio",
      category: "Game Engine / IDE",
      color: "#009fff",
      description:
        "Roblox Studio is the official IDE for creating games and experiences on Roblox. It provides a comprehensive set of tools for 3D modeling, scripting, terrain editing, and game testing.",
      useCase:
        "My primary environment for building, testing, and publishing Roblox games.",
    },
    luau: {
      name: "Luau",
      category: "Programming Language",
      color: "#00A2FF",
      description:
        "Luau is a fast, small, safe, gradually typed scripting language derived from Lua. It's the primary language used for Roblox game development, offering improved performance and type checking.",
      useCase:
        "I use Luau for all Roblox scripting, including game logic, systems architecture, and performance-critical code.",
    },
    python: {
      name: "Python",
      category: "Programming Language",
      color: "#ffd040",
      description:
        "Python is a high-level, interpreted programming language known for its simplicity and versatility. It's widely used for scripting, automation, data analysis, and backend development.",
      useCase:
        "I use Python for build automation, data processing scripts, analytics tools, and creating development utilities that support my Roblox workflow.",
    },
    vscode: {
      name: "VS Code",
      category: "Code Editor",
      color: "#007ACC",
      description:
        "Visual Studio Code is a lightweight but powerful source code editor with built-in support for debugging, version control, and extensions.",
      useCase: "My primary development environment for most of my development.",
    },
    git: {
      name: "Git",
      category: "Version Control",
      color: "#F05032",
      description:
        "Git is a distributed version control system that tracks changes in source code. It enables collaboration and maintains a complete history of your project.",
      useCase:
        "Critical for all my projects - version control, collaboration, backup, and tracking changes across development.",
    },
    profileservice: {
      name: "ProfileService",
      category: "Data Management",
      color: "#10B981",
      description:
        "ProfileService is a robust player data management solution for Roblox. It handles session locking, auto-saving, and data corruption prevention.",
      useCase:
        "Essential for reliable player data persistence, preventing data loss and handling edge cases automatically.",
    },
  };

  const techModalHTML = `
        <div class="tech-modal" id="techModal">
            <div class="tech-modal-window">
                <div class="modal-header">
                    <div class="modal-traffic-lights">
                        <div class="modal-traffic-light close" id="techModalClose"></div>
                        <div class="modal-traffic-light minimize"></div>
                        <div class="modal-traffic-light maximize"></div>
                    </div>
                    <div class="modal-title">Tech Info</div>
                    <div class="modal-esc-hint">[ESC] to close</div>
                </div>
                <div class="tech-modal-content" id="techModalContent">
                    <!-- Content will be injected here -->
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", techModalHTML);

  const modal = document.getElementById("techModal");
  const modalClose = document.getElementById("techModalClose");
  const modalContent = document.getElementById("techModalContent");
  const techTags = document.querySelectorAll(".tag[data-tech]");

  function typeWriter(element, text, speed = 10) {
    let i = 0;
    element.textContent = "";

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }

    type();
  }

  techTags.forEach((tag) => {
    tag.addEventListener("click", function () {
      const techKey = this.getAttribute("data-tech");
      const info = techInfo[techKey];

      if (info) {
        openTechModal(info);
      }
    });
  });

  function openTechModal(info) {
    const iconName = info.name.toLowerCase().replace(/\s+/g, "");
    const iconPath = `images/icons/${iconName}.svg`;

    modalContent.innerHTML = `
        <img src="${iconPath}" alt="${info.name}" class="tech-modal-icon">
        <h3 style="color: ${info.color}">${info.name}</h3>
        <p class="tech-category">${info.category}</p>
        <div class="tech-section">
            <strong>What is it?</strong><br>
            <span class="typing-text" id="descriptionText"></span>
        </div>
        <div class="tech-section" style="margin-top: 16px;">
            <strong>How I use it:</strong><br>
            <span class="typing-text" id="useCaseText"></span>
        </div>
    `;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      const descriptionElement = document.getElementById("descriptionText");
      const useCaseElement = document.getElementById("useCaseText");

      typeWriter(descriptionElement, info.description, 8);

      setTimeout(
        () => {
          typeWriter(useCaseElement, info.useCase, 8);
        },
        info.description.length * 8 + 100,
      );
    }, 100);
  }

  function closeTechModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  modalClose.addEventListener("click", closeTechModal);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeTechModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeTechModal();
    }
  });
});
