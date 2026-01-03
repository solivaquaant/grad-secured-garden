let TARGET_DATE = null;
let CURRENT_USER = null;

// DOM element references
const lockBtn = document.getElementById("lock-btn");
const authForm = document.getElementById("auth-form");
const statusText = document.getElementById("status-text");
const inputField = document.getElementById("guest-pass");
const enterBtn = document.getElementById("enter-btn");
const rsvpForm = document.getElementById("rsvp-form");
const bgMusic = document.getElementById("bg-music");
const musicControl = document.getElementById("music-control");

// Initialize application on page load
window.onload = function () {
  initButterflies();

  lockBtn.addEventListener("click", initiateUnlock);
  enterBtn.addEventListener("click", validateInput);
  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validateInput();
  });

  rsvpForm.addEventListener("submit", handleRSVP);
  musicControl.addEventListener("click", toggleMusic);
};

// Show authentication form when lock is clicked
function initiateUnlock() {
  lockBtn.style.display = "none";
  authForm.style.display = "flex";
  setTimeout(() => {
    authForm.style.opacity = "1";
    inputField.focus();
  }, 50);
  statusText.innerText = "AUTHENTICATION REQUIRED";
}

// Validate guest name and authenticate with server
async function validateInput() {
  const name = inputField.value.trim();
  if (!name) return;

  statusText.innerText = "VERIFYING IDENTITY...";

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (data.success) {
      CURRENT_USER = data.guestName;
      document.getElementById("user-display").innerText = CURRENT_USER;

      updateEventDetails(data.eventConfig);
      TARGET_DATE = new Date(data.eventConfig.date).getTime();
      startCountdown();
      triggerCinematicEntry();
    } else {
      showError("ACCESS DENIED");
    }
  } catch (error) {
    console.error(error);
    showError("SERVER ERROR");
  }
}

// Display error message with temporary styling
function showError(msg) {
  statusText.style.color = "var(--error)";
  statusText.innerText = msg;
  setTimeout(() => {
    statusText.style.color = "var(--cream)";
    statusText.innerText = "TRY AGAIN";
  }, 2000);
}

// Update page with personalized event information
function updateEventDetails(config) {
  const dateObj = new Date(config.date);

  const dateStr = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  document.getElementById("dynamic-date").innerText = dateStr;
  document.getElementById("dynamic-time").innerText = timeStr;
  document.getElementById("dynamic-location").innerText =
    config.locationName + " (" + config.address + ")";
  document.getElementById("map-iframe").src = config.mapUrl;
}

// Handle guest message submission and display confirmation
async function handleRSVP(e) {
  e.preventDefault();
  const rsvpContainer = document.getElementById("rsvp-container");
  const msgInput = document.getElementById("rsvp-message");
  const content = msgInput.value.trim();

  if (!content) return;

  try {
    const response = await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName: CURRENT_USER, content }),
    });

    if (response.ok) {
      gsap.to(rsvpContainer, {
        opacity: 0,
        y: -10,
        duration: 0.4,
        onComplete: () => {
          rsvpContainer.innerHTML = `
        <div style="padding: 40px; font-family: var(--font-head); border: 1px dashed var(--gold);">
          <i class="fas fa-heart" style="color: #ff758f; font-size: 2.5rem; margin-bottom: 15px;"></i>
          <h3 style="font-size: 1.5rem; margin-bottom: 10px;">Thank you, ${CURRENT_USER}!</h3>
          <p style="opacity: 0.8; font-size: 1.1rem; margin-bottom: 20px;">Your wish has been planted in the garden.</p>
          <a href="/guestbook.html" style="
            display: inline-block;
            color: var(---gold);
            font-family: var(--font-tech);
            font-size: 0.8rem;
            text-decoration: none;
            border: 1px solid var(--gold);
            padding: 8px 20px;
            transition: all 0.3s;
          " onmouseover="this.style.background='var(--gold)'" onmouseout="this.style.background='transparent'">
            VISIT THE WISH WALL →
          </a>
        </div>
      `;
          gsap.to(rsvpContainer, { opacity: 1, y: 0, duration: 0.4 });
        },
      });
      fireConfetti();
    }
  } catch (err) {
    console.error("Error sending message:", err);
  }
}

// Display toast notification with animation
function showSuccessToast(message) {
  const toast = document.createElement("div");
  toast.className = "success-toast";
  toast.innerText = message;
  document.body.appendChild(toast);

  gsap.to(toast, { opacity: 1, y: -20, duration: 0.5 });
  gsap.to(toast, {
    opacity: 0,
    y: 0,
    duration: 0.5,
    delay: 3,
    onComplete: () => toast.remove(),
  });
}

function showErrorToast(message) {
  showSuccessToast(message);
}

// Start countdown timer to event date
function startCountdown() {
  if (!TARGET_DATE) return;

  setInterval(() => {
    const now = new Date().getTime();
    const dist = TARGET_DATE - now;
    if (dist < 0) return;

    const days = Math.floor(dist / (1000 * 60 * 60 * 24));
    const hours = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((dist % (1000 * 60)) / 1000);

    document.getElementById("d-val").innerText = String(days).padStart(2, "0");
    document.getElementById("h-val").innerText = String(hours).padStart(2, "0");
    document.getElementById("m-val").innerText = String(minutes).padStart(
      2,
      "0"
    );
    document.getElementById("s-val").innerText = String(seconds).padStart(
      2,
      "0"
    );
  }, 1000);
}

// Create floating butterfly animations in background
function initButterflies() {
  const container = document.getElementById("butterfly-container");
  const colors = ["#FFE4E1", "#E6E6FA", "#FFFACD"];

  setInterval(() => {
    if (document.hidden) return;
    const b = document.createElement("div");
    b.classList.add("butterfly");
    b.style.left = Math.random() * 100 + "vw";
    b.style.top = "100vh";
    b.style.background = colors[Math.floor(Math.random() * colors.length)];
    b.style.animation = `float-across ${
      Math.random() * 5 + 8
    }s linear forwards`;
    container.appendChild(b);
    setTimeout(() => b.remove(), 13000);
  }, 1000);
}

// Orchestrate gate opening and envelope reveal animation sequence
function triggerCinematicEntry() {
  bgMusic.volume = 0.2;
  bgMusic
    .play()
    .then(() => {
      musicControl.classList.add("music-playing");
    })
    .catch((e) => {
      console.log("Audio requires interaction");
      musicControl.classList.add("music-muted");
    });

  statusText.innerText = "ACCESS GRANTED";
  statusText.style.color = "var(--gold)";
  authForm.style.opacity = "0";

  const tl = gsap.timeline();

  tl.to(".gate-left", { xPercent: -100, duration: 2, ease: "power2.inOut" })
    .to(
      ".gate-right",
      { xPercent: 100, duration: 2, ease: "power2.inOut" },
      "<"
    )
    .to("#interface-box", { opacity: 0, duration: 0.5 }, "<0.5")
    .to("#gate-container", { pointerEvents: "none" }, "<")
    .set("#envelope-wrapper", { opacity: 1, pointerEvents: "auto" })
    .to(
      ".envelope-flap",
      { rotationX: 180, duration: 0.8, ease: "back.out(1.7)" },
      "-=0.15"
    )
    .call(playHandwritingAnimation)
    .to(".letter-preview", { y: -50, duration: 0.5 })
    .to("#envelope-wrapper", {
      scale: 3,
      opacity: 0,
      duration: 1.5,
      ease: "power2.in",
    })
    .to("#envelope-wrapper", { pointerEvents: "none" })
    .to("#main-scroll-container", { opacity: 1, duration: 1 }, "-=0.5")
    .call(initScrollAnimations);

  setTimeout(() => {
    document.querySelector(".envelope-flap").classList.add("behind");
  }, 100);
}

// Simulate typewriter effect for handwritten message
function playHandwritingAnimation() {
  const text = "To you";
  const element = document.getElementById("handwriting-msg");
  let i = 0;
  element.innerHTML = "";
  function typeChar() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typeChar, 100 + Math.random() * 100);
    }
  }
  typeChar();
}

// Set up scroll-triggered animations for main content sections
function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  gsap.to("#parallax-bg", {
    yPercent: 20,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    },
  });

  gsap.from(".hero-stagger", {
    y: 50,
    opacity: 0,
    duration: 1.2,
    stagger: 0.2,
    ease: "power3.out",
  });

  gsap.from(".sun-glow", {
    scale: 0.5,
    opacity: 0,
    duration: 2,
    ease: "power2.out",
  });

  gsap.to("#draw-line", {
    height: "100%",
    ease: "none",
    scrollTrigger: {
      trigger: ".timeline-wrapper",
      start: "top center",
      end: "bottom center",
      scrub: 1,
    },
  });

  gsap.utils.toArray(".timeline-event").forEach((event) => {
    ScrollTrigger.create({
      trigger: event,
      start: "top center",
      onEnter: () => event.classList.add("active"),
      onLeaveBack: () => event.classList.remove("active"),
    });
  });

  gsap.to("#google-map", {
    scale: 1,
    opacity: 1,
    duration: 1,
    scrollTrigger: { trigger: "#chapter-destination", start: "top 60%" },
  });

  ScrollTrigger.create({
    trigger: "#chapter-closing",
    start: "top 70%",
    onEnter: () => fireConfetti(),
  });
}

// Generate animated confetti particles
function fireConfetti() {
  const chapter = document.getElementById("chapter-closing");
  const colors = ["#ffc1cc", "#ffd966", "#c8e6c9", "#fff9e6"];
  for (let i = 0; i < 50; i++) {
    const conf = document.createElement("div");
    conf.classList.add("confetti-piece");
    conf.style.left = Math.random() * 100 + "%";
    conf.style.background = colors[Math.floor(Math.random() * colors.length)];
    conf.style.transform = `rotate(${Math.random() * 360}deg)`;
    chapter.appendChild(conf);

    gsap.to(conf, {
      y: Math.random() * 200 + 100,
      x: (Math.random() - 0.5) * 100,
      opacity: 1,
      rotation: Math.random() * 720,
      duration: Math.random() * 2 + 1,
      onComplete: () => conf.remove(),
    });
  }
}

// Toggle background music playback and update UI
function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
    musicControl.classList.add("music-playing");
    musicControl.classList.remove("music-muted");
  } else {
    bgMusic.pause();
    musicControl.classList.remove("music-playing");
    musicControl.classList.add("music-muted");
  }
}

// Guestbook page functionality (only runs on guestbook.html)
(() => {
  const wishWallEl = document.getElementById("wish-wall");
  if (!wishWallEl) return;

  // Fetch and display all guest messages on the wish wall
  async function loadWishes() {
    try {
      const response = await fetch("/api/messages");
      const wishes = await response.json();
      const container = document.getElementById("wish-wall");

      if (wishes.length === 0) {
        container.innerHTML =
          "<p style='grid-column: 1/-1; text-align: center; font-family: var(--font-body); opacity: 0.5;'>No wishes yet. Be the first one!</p>";
        return;
      }

      container.innerHTML = wishes
        .map(
          (w) => `
                  <div class="wish-card">
                      <span>&ldquo;</span>
                      <p>${w.content}</p>
                  </div>
              `
        )
        .join("");

      gsap.to(".wish-card", {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        stagger: 0.15,
        ease: "back.out(1.7)",
        startAt: { y: 50, scale: 0.9 },
      });
    } catch (err) {
      console.error("Failed to load wishes");
    }
  }
  loadWishes();

  // Initialize butterfly animations for guestbook page
  function initButterflies() {
    const container = document.getElementById("butterfly-container");
    const colors = ["#FFE4E1", "#E6E6FA", "#FFFACD"];

    setInterval(() => {
      if (document.hidden) return;
      const b = document.createElement("div");
      b.classList.add("butterfly");
      b.style.left = Math.random() * 100 + "vw";
      b.style.top = "110vh";
      b.style.background = colors[Math.floor(Math.random() * colors.length)];
      b.style.animation = `float-across ${
        Math.random() * 5 + 8
      }s linear forwards`;
      container.appendChild(b);
      setTimeout(() => b.remove(), 13000);
    }, 1000);
  }

  initButterflies();
})();

document.addEventListener("DOMContentLoaded", () => {
  const draggables = document.querySelectorAll(".draggable-flower");
  const dropZone = document.getElementById("flower-basket");
  const container = document.getElementById("placed-flowers-container");
  const resetBtn = document.getElementById("reset-flowers");

  draggables.forEach((flower) => {
    flower.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("imgSrc", flower.src);
      e.dataTransfer.setData("type", flower.dataset.type);
      flower.style.opacity = "0.5";
    });

    flower.addEventListener("dragend", () => {
      flower.style.opacity = "1";
    });
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();

    const imgSrc = e.dataTransfer.getData("imgSrc");
    const rect = dropZone.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newFlower = document.createElement("img");
    newFlower.src = imgSrc;
    newFlower.className = "placed-flower";
    newFlower.style.left = `${x}px`;
    newFlower.style.top = `${y}px`;
    const randomRotation = Math.floor(Math.random() * 40) - 20;
    newFlower.style.transform = `translate(-50%, -50%) rotate(${randomRotation}deg)`;
    container.appendChild(newFlower);
  });

  resetBtn.addEventListener("click", () => {
    gsap.to(".placed-flower", {
      opacity: 0,
      scale: 0.5,
      duration: 0.3,
      stagger: 0.05,
      onComplete: () => {
        container.innerHTML = "";
      },
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("save-flowers");
  const dropZone = document.getElementById("flower-basket");

  saveBtn.addEventListener("click", async () => {
    saveBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Packaging bouquet...';
    saveBtn.disabled = true;

    try {
      const canvas = await html2canvas(dropZone, {
        backgroundColor: getComputedStyle(
          document.documentElement
        ).getPropertyValue("--cream"),
        logging: false,
        useCORS: true,
        scale: 2,
      });
      const imageData = canvas.toDataURL("image/jpeg", 0.9);

      const link = document.createElement("a");
      link.download = `bouquet-${Date.now()}.png`;
      link.href = imageData;
      link.click();

      const response = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: CURRENT_USER,
          bouquetImage: imageData,
        }),
      });

      if (response.ok) {
      }
    } catch (error) {
      console.error("Error:", error);
      showErrorToast("Can't save image. Please try again.");
    } finally {
      saveBtn.innerHTML = '<i class="fas fa-camera"></i> Gửi tặng & Tải ảnh';
      saveBtn.disabled = false;
    }
  });
});
