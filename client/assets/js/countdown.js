const socket = io(`http://${window.location.hostname}:5500`);

socket.on("connect", () => {
  console.log("COUNTDOWN: Berhasil terhubung ke server!");
  socket.emit("registerClient", { name: "Countdown" });
});

// --- SELEKSI SEMUA ELEMEN ---
const mainContentEl = document.querySelector(".main-content");
const secondaryContentEl = document.querySelector(".secondary-content");
const countdownTimerEl = document.getElementById("countdown-timer");
const countdownTimerEl2 = document.getElementById("countdown-timer2");
const adsContainerEl = document.querySelector(".ads-container");
const adVideoPlayer = document.getElementById("ad-video-player");
const matchElements = document.querySelectorAll(".schedule .team-match .match");
const startOverlay = document.getElementById("click-to-start-overlay");
// --- VARIABEL GLOBAL ---
let countdownInterval = null;
let rosterAnimationInterval = null;
let currentPlayerIndex = 0;
let adsPlaylist = [];
let currentAdIndex = 0;
let isMutedGlobally = false;

if (startOverlay) {
  const hasInteracted = localStorage.getItem("audioUnlocked_countdown");
  if (hasInteracted) {
    startOverlay.style.display = "none";
  } else {
    startOverlay.addEventListener(
      "click",
      () => {
        startOverlay.style.display = "none";
        localStorage.setItem("audioUnlocked_countdown", "true");
        if (adVideoPlayer && adVideoPlayer.src) {
          adVideoPlayer
            .play()
            .catch((e) =>
              console.warn(
                "Interaksi tercatat. Video akan diputar oleh sistem."
              )
            );
        }
      },
      { once: true }
    );
  }
}

// --- FUNGSI-FUNGSI ---
const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const fadeAudioOut = (videoElement, duration = 1500) => {
  if (!videoElement || videoElement.volume === 0) return;
  let currentVolume = videoElement.volume;
  const step = currentVolume / (duration / 50);
  const fadeInterval = setInterval(() => {
    currentVolume -= step;
    if (currentVolume <= 0) {
      videoElement.volume = 0;
      videoElement.muted = true;
      clearInterval(fadeInterval);
    } else {
      videoElement.volume = currentVolume;
    }
  }, 50);
};

const playNextAd = () => {
  if (adsPlaylist.length === 0 || !adVideoPlayer) return;
  currentAdIndex = (currentAdIndex + 1) % adsPlaylist.length;
  const nextVideoFile = adsPlaylist[currentAdIndex];
  adVideoPlayer.src = `assets/videos/ads/${nextVideoFile}`;
  adVideoPlayer.muted = isMutedGlobally;
  if (!isMutedGlobally) adVideoPlayer.volume = 1;
  adVideoPlayer
    .play()
    .catch((e) => console.error("Gagal memutar video iklan:", e));
};

if (adVideoPlayer) {
  adVideoPlayer.onended = playNextAd;
}

const performMainTransition = () => {
  if (mainContentEl && secondaryContentEl) {
    mainContentEl.classList.add("hiding");
    isMutedGlobally = true;
    if (adVideoPlayer) {
      fadeAudioOut(adVideoPlayer, 1500);
    }
    setTimeout(() => {
      secondaryContentEl.classList.add("visible");
      socket.emit("requestState");
    }, 800);
  }
};

const animatePlayer = (playerData, side) => {
  const photoContainerEl = document.querySelector(
    `.secondary-content .team.${side} .players`
  );
  const photoEl = photoContainerEl.querySelector("img.player");
  const nameEl = document.querySelector(
    `.secondary-content .team.${side} .player-name`
  );
  const roleEl = document.querySelector(
    `.secondary-content .team.${side} .player-role`
  );

  if (!playerData || !photoEl || !nameEl || !roleEl) return;
  const inClass = side === "left" ? "animate-in-left" : "animate-in-right";
  const outClass = side === "left" ? "animate-out-left" : "animate-out-right";
  [photoContainerEl, nameEl, roleEl].forEach((el) => {
    el.className = el.className
      .replace(/animate-in-.*|animate-out-.*|animate-wipe-.*|/g, "")
      .trim();
  });
  photoEl.src = playerData.photo;
  nameEl.innerText = playerData.name;
  roleEl.querySelector(
    "img"
  ).src = `assets/images/roles/${playerData.role}.png`;
  photoContainerEl.classList.add(inClass);
  nameEl.classList.add(inClass);
  roleEl.classList.add("animate-wipe-in");
  setTimeout(() => {
    photoContainerEl.classList.add(outClass);
    nameEl.classList.add(outClass);
    roleEl.classList.add("animate-wipe-out");
  }, 7000);
};

const startRosterAnimation = (state) => {
  clearInterval(rosterAnimationInterval);
  currentPlayerIndex = 0;
  const animateBothTeams = () => {
    animatePlayer(state.teamLeft.players[currentPlayerIndex], "left");
    animatePlayer(state.teamRight.players[currentPlayerIndex], "right");
    currentPlayerIndex = (currentPlayerIndex + 1) % 5;
  };
  animateBothTeams();
  rosterAnimationInterval = setInterval(animateBothTeams, 8000);
};

// --- LISTENER DARI SERVER ---
socket.on("countdownStarted", (data) => {
  let remainingTime = data.duration;
  clearInterval(countdownInterval);
  isMutedGlobally = false;
  if (adVideoPlayer) {
    adVideoPlayer.muted = false;
    adVideoPlayer.volume = 1;
  }
  if (mainContentEl) mainContentEl.classList.remove("hiding");
  if (secondaryContentEl) secondaryContentEl.classList.remove("visible");

  const updateTimers = () => {
    const formattedTime = formatTime(remainingTime);
    if (countdownTimerEl) countdownTimerEl.innerText = formattedTime;
    if (countdownTimerEl2) countdownTimerEl2.innerText = formattedTime;
  };
  updateTimers();
  countdownInterval = setInterval(() => {
    remainingTime--;
    if (remainingTime >= 0) {
      updateTimers();
      if (remainingTime === 300) {
        performMainTransition();
      }
    } else {
      clearInterval(countdownInterval);
    }
  }, 1000);
});

socket.on("playlistUpdated", (playlist) => {
  adsPlaylist = playlist;
  currentAdIndex = -1;
  playNextAd();
});

socket.on("stateUpdate", (payload) => {
  if (payload && payload.state && payload.state.matchSchedule) {
    const schedule = payload.state.matchSchedule;
    if (matchElements && matchElements.length > 0) {
      matchElements.forEach((el, index) => {
        el.innerText = schedule[index] || "";
      });
    }
  }
});

socket.on("startRosterAnimation", (state) => {
  startRosterAnimation(state);
});
