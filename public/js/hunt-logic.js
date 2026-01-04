// Prevent debugging and inspect element access
setInterval(function () {
  debugger;
}, 100);
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("keydown", (e) => {
  if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && e.keyCode == 73)) {
    e.preventDefault();
  }
});

const HuntGame = {
  actions: {
    E1: "VINYL_SPIN",
    E2: "PORTRAIT_STILL",
    E3: "LOVE_KEYWORD",
    E4: "FLOWER_POWER",
    E5: "UIT_COMBO",
    E6: "GRAD_CAP",
  },

  init() {
    this.setupVinylEgg();
    this.setupPortraitEgg();
    this.setupKeyboardEgg();
    this.setupCapTossEgg();
  },

  // Claim secret easter egg from server
  async claimSecret(actionName) {
    const nickname = localStorage.getItem("guestName") || "Anonymous";
    try {
      const response = await fetch("/api/hunt/claim-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName, nickname: nickname }),
      });

      const data = await response.json();
      if (data.success) {
        this.notify(data.flag, data.message);
      }
    } catch (err) {
      console.error("Failed to claim secret:", err);
    }
  },

  // Click 5 times into vinyl record
  setupVinylEgg() {
    let count = 0;
    const vinyl = document.querySelector(".vinyl-wrapper");
    if (vinyl) {
      vinyl.addEventListener("click", () => {
        count++;
        if (count === 5) {
          this.claimSecret(this.actions.E1);
          count = 0;
        }
      });
    }
  },

  // Hover 5 seconds on portrait image
  setupPortraitEgg() {
    let timer;
    const portrait = document.querySelector(".portrait-img");
    if (portrait) {
      portrait.addEventListener("mouseenter", () => {
        timer = setTimeout(() => this.claimSecret(this.actions.E2), 200);
      });
      portrait.addEventListener("mouseleave", () => clearTimeout(timer));
    }
  },

  // Type "UIT" on keyboard
  setupKeyboardEgg() {
    let buffer = "";
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }
      if (e.key.length !== 1) return;
      buffer += e.key.toUpperCase();
      buffer = buffer.slice(-3);

      if (buffer === "UIT") {
        this.claimSecret(this.actions.E5);
        buffer = "";
      }
    });
  },

  // Drag flower-4.png 5 times
  flowerCount: 0,
  checkFlowerEgg(flowerSrc) {
    if (flowerSrc && flowerSrc.includes("flower-4.png")) {
      this.flowerCount++;
      if (this.flowerCount === 5) {
        this.claimSecret(this.actions.E4);
        this.flowerCount = 0;
      }
    }
  },

  // Drag and toss graduation cap
  setupCapTossEgg() {
    const cap = document.getElementById("grad-cap-egg");
    if (!cap) return;

    let isDragging = false;
    let startY = 0;

    cap.addEventListener("mousedown", (e) => {
      isDragging = true;
      startY = e.clientY;
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      cap.style.bottom = "auto";
      cap.style.top = e.clientY - 20 + "px";
    });

    window.addEventListener("mouseup", (e) => {
      if (!isDragging) return;
      isDragging = false;

      if (startY - e.clientY > 300) {
        this.triggerCapFlight(cap);
      } else {
        cap.style.top = "auto";
        cap.style.bottom = "20px";
      }
    });
  },

  triggerCapFlight(cap) {
    cap.style.transition = "all 1s ease-in";
    cap.style.top = "-100px";
    cap.style.opacity = "0";

    setTimeout(() => {
      this.claimSecret(this.actions.E6);
    }, 500);
  },

  // Notify user of found Easter Egg
  notify(flag) {
    const msg = document.createElement("div");
    msg.className = "egg-alert";
    msg.innerHTML = `You found Easter Egg!<br><b>${flag}</b><br><small>Save it to enter the Ranking page</small>`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 8000);
    console.log("Found:", flag);
  },
};

document.addEventListener("DOMContentLoaded", () => HuntGame.init());
