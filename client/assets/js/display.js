const socket = io(`http://${window.location.hostname}:5500`);
socket.on("connect", () => {
  console.log("CONTROL: Berhasil terhubung ke server!");
  // Memperkenalkan diri sebagai ControlPanel
  socket.emit("registerClient", { name: "Display" });
});
const teamNameDisplayLeft = document.querySelector(".team-left .team-name");
const teamNameDisplayRight = document.querySelector(".team-right .team-name");
const scoreBarsLeft = document.querySelectorAll(".score-left .score-bar");
const scoreBarsRight = document.querySelectorAll(".score-right .score-bar");
const playerNameDisplaysLeft = document.querySelectorAll(
  ".team-left .player-name"
);
const playerNameDisplaysRight = document.querySelectorAll(
  ".team-right .player-name"
);
const banSlotsLeft = document.querySelectorAll(".team-left .ban-slot");
const banSlotsRight = document.querySelectorAll(".team-right .ban-slot");
const pickSlotsLeft = document.querySelectorAll(".team-left .pick-slot");
const pickSlotsRight = document.querySelectorAll(".team-right .pick-slot");
const phaseText = document.querySelector(".phase-text");
const arrowLeft = document.querySelector(".arrow-left");
const arrowRight = document.querySelector(".arrow-right");
const mainTimerDisplay = document.querySelector(".main-timer");
const turnTimerFillLeft = document.querySelector(
  ".turn-timer-bar.left-bar .timer-fill"
);
const turnTimerFillRight = document.querySelector(
  ".turn-timer-bar.right-bar .timer-fill"
);
const mapShuffleContainer = document.querySelector(".map-shuffle");
const mapStrip = document.querySelector(".map-strip"); // Menggunakan map-strip sekarang
const maps = document.querySelectorAll(".map-shuffle .map");
const triangleArrow = document.querySelector(".triangle-arrow");

// Tentukan posisi akhir untuk setiap map
const mapPositions = {
  dangerous: 0,
  broken: -284, // 254px (lebar map) + 30px (gap)
  expanding: -568, // 284 * 2
  flying: -852, // 284 * 3
};

// GANTI FUNGSI INI DI display.js
// GANTI SELURUH FUNGSI INI DI display.js

// GANTI SELURUH FUNGSI INI DI display.js

// GANTI SELURUH FUNGSI INI DI display.js

socket.on("playMapShuffle", (data) => {
  const selectedMapClass = data.map;
  // Target yang benar untuk header teks
  const mapHeader = document.querySelector(".map-selection");

  const arrowPositions = {
    dangerous: -426,
    broken: -142,
    expanding: 142,
    flying: 426,
  };

  const mapGlowFiles = {
    dangerous: "dangerousGrass_glow.png",
    broken: "brokenWalls_glow.png",
    expanding: "expandingRiver_glow.png",
    flying: "flyingCloud_glow.png",
  };

  const mapDisplayNames = {
    dangerous: "DANGEROUS GRASS",
    broken: "BROKEN WALLS",
    expanding: "EXPANDING RIVER",
    flying: "FLYING CLOUD",
  };

  const finalArrowPosition = arrowPositions[selectedMapClass];
  const finalGlowImage = mapGlowFiles[selectedMapClass];
  const finalMapName = mapDisplayNames[selectedMapClass];

  if (mapShuffleContainer && triangleArrow && mapStrip) {
    // 1. Tampilkan kontainer & reset kondisi awal
    mapShuffleContainer.classList.add("visible");
    // Reset teks header HANYA saat animasi BARU dimulai
    if (mapHeader) mapHeader.innerText = "";
    maps.forEach((map) => {
      map.classList.remove("selected");
      const overlay = map.querySelector(".glow-overlay");
      if (overlay) {
        overlay.classList.remove("blinking");
        overlay.style.backgroundImage = "none";
      }
    });
    triangleArrow.style.transition = "none";

    // 2. Buat & jalankan rangkaian animasi lengkap (tidak berubah)
    const keyframes = [
      { transform: "translateX(0px)", offset: 0 },
      { transform: "translateX(550px)", offset: 0.15 },
      { transform: "translateX(-550px)", offset: 0.3 },
      { transform: "translateX(300px)", offset: 0.45 },
      { transform: "translateX(-400px)", offset: 0.625 },
      { transform: `translateX(${finalArrowPosition}px)`, offset: 1 },
    ];
    triangleArrow.animate(keyframes, {
      duration: 4000,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      fill: "forwards",
    });

    // 3. Highlight map terpilih dan ubah header
    setTimeout(() => {
      const selectedMapEl = document.querySelector(`.map.${selectedMapClass}`);
      if (selectedMapEl) {
        if (mapHeader) mapHeader.innerText = finalMapName; // Ubah teks saat terpilih
        selectedMapEl.classList.add("selected");
        const glowOverlay = selectedMapEl.querySelector(".glow-overlay");
        if (finalGlowImage) {
          glowOverlay.style.backgroundImage = `url(assets/images/map/${finalGlowImage})`;
          glowOverlay.classList.add("blinking");
        }
      }
    }, 3800);

    // 4. Sembunyikan & RESET properti visual (tapi BUKAN teks header)
    setTimeout(() => {
      mapShuffleContainer.classList.remove("visible");
      setTimeout(() => {
        // PERBAIKAN: Baris yang mereset teks header DIHAPUS dari sini
        triangleArrow.style.transform = "translateX(0px)";
        maps.forEach((map) => {
          map.classList.remove("selected");
          const overlay = map.querySelector(".glow-overlay");
          if (overlay) {
            overlay.classList.remove("blinking");
            overlay.style.backgroundImage = "none";
          }
        });
      }, 500);
    }, 8000);
  }
});
let timerAnimationId = null;
let currentActiveTeam = "none";
let currentTurnDuration = 50;
let draftSequence = [];
let isMuted = true;

const playSound = (src) => {
  // Jika sedang dalam kondisi mute, jangan putar suara
  if (isMuted) {
    console.log(`AUDIO DIBLOKIR (Muted): ${src}`);
    return;
  }
  const sound = new Audio(src);
  sound.play().catch((error) => {
    console.warn(`Peringatan saat memutar suara: ${error}`);
  });
};

const updateScoreBars = (bars, score) => {
  bars.forEach((bar, index) => {
    if (index < score) bar.classList.add("active");
    else bar.classList.remove("active");
  });
};

const playPickAnimation = (slot, hero) => {
  const oldStats = slot.querySelector(".hero-stats");
  if (oldStats) oldStats.remove();
  const oldName = slot.querySelector(".hero-name-overlay");
  if (oldName) oldName.remove();
  const oldHeroVideo = slot.querySelector("video:not(.stinger-video)");

  const stinger = document.createElement("video");
  stinger.src = "assets/videos/stinger.webm";
  stinger.className = "stinger-video";
  stinger.autoplay = true;
  stinger.muted = true;
  stinger.playsInline = true;
  slot.appendChild(stinger);

  setTimeout(() => {
    if (oldHeroVideo) oldHeroVideo.remove();
    const newHeroVideo = document.createElement("video");
    newHeroVideo.src = `assets/videos/heroPick/${hero.videoFile}`;
    newHeroVideo.autoplay = true;
    newHeroVideo.loop = true;
    newHeroVideo.muted = true;
    newHeroVideo.playsInline = true;
    slot.appendChild(newHeroVideo);
  }, 500);

  stinger.addEventListener(
    "ended",
    () => {
      stinger.remove();
      if (hero.stats) {
        const statsContainer = document.createElement("div");
        statsContainer.className = "hero-stats";
        statsContainer.innerHTML = `<span class="stat-label">PICK</span><span class="stat-value">${hero.stats.picks}</span><span class="stat-label">WINRATE</span><span class="stat-value">${hero.stats.winrate}</span>`;
        slot.appendChild(statsContainer);
        setTimeout(() => {
          statsContainer.classList.add("hiding");
          statsContainer.addEventListener("animationend", () =>
            statsContainer.remove()
          );
        }, 4000);
      }

      const nameContainer = document.createElement("div");
      nameContainer.className = "hero-name-overlay";
      nameContainer.innerText = hero.name;
      slot.appendChild(nameContainer);
    },
    { once: true }
  );
};
const draftContainer = document.querySelector(".draft-container");

socket.on("playAnimationIn", () => {
  if (draftContainer) {
    draftContainer.classList.add("animate-in");
    isMuted = false;
    console.log("AUDIO: Unmuted");
  }
});

socket.on("playAnimationOut", () => {
  if (draftContainer) {
    draftContainer.classList.remove("animate-in");
    isMuted = true;
    console.log("AUDIO: Muted");
  }
});
const instantUpdatePick = (slot, hero) => {
  const existingVideo = slot.querySelector("video");
  const existingName = slot.querySelector(".hero-name-overlay");
  if (hero) {
    const newVideoSrc = `assets/videos/heroPick/${hero.videoFile}`;
    if (existingVideo) {
      if (!existingVideo.src.includes(newVideoSrc)) {
        existingVideo.src = newVideoSrc;
        existingVideo.load();
        existingVideo.play();
      }
    } else {
      const newVideo = document.createElement("video");
      newVideo.src = newVideoSrc;
      newVideo.autoplay = true;
      newVideo.loop = true;
      newVideo.muted = true;
      newVideo.playsInline = true;
      slot.appendChild(newVideo);
    }
    if (existingName) {
      existingName.innerText = hero.name;
    } else {
      const newName = document.createElement("div");
      newName.className = "hero-name-overlay";
      newName.innerText = hero.name;
      slot.appendChild(newName);
    }
  } else {
    slot.innerHTML = "";
  }
};

const animateTimer = (
  duration,
  activeBar,
  inactiveBar,
  animateBoth = false
) => {
  const startTime = Date.now();
  const durationMs = duration * 1000;

  if (inactiveBar) inactiveBar.style.width = "100%";

  function animationLoop() {
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, durationMs - elapsedTime);
    const percentage = (remainingTime / durationMs) * 100;
    const secondsLeft = Math.ceil(remainingTime / 1000);

    if (mainTimerDisplay) mainTimerDisplay.innerText = secondsLeft;

    if (animateBoth) {
      if (activeBar) activeBar.style.width = percentage + "%";
      if (inactiveBar) inactiveBar.style.width = percentage + "%";
    } else {
      if (activeBar) activeBar.style.width = percentage + "%";
    }

    if (remainingTime > 0) {
      timerAnimationId = requestAnimationFrame(animationLoop);
    } else {
      if (activeBar) activeBar.style.width = "0%";
      if (inactiveBar) inactiveBar.style.width = "0%";
      if (mainTimerDisplay) mainTimerDisplay.innerText = 0;
    }
  }
  cancelAnimationFrame(timerAnimationId);
  animationLoop();
};

const updateDisplay = (state, source) => {
  currentActiveTeam = state.activeTeam;
  currentTurnDuration = state.currentPhase === "LAST CHANGE" ? 30 : 50;

  if (phaseText) phaseText.innerText = state.currentPhase || "DRAFTING";
  if (arrowLeft)
    arrowLeft.classList.toggle("active", state.activeTeam === "left");
  if (arrowRight)
    arrowRight.classList.toggle("active", state.activeTeam === "right");

  teamNameDisplayLeft.innerText = state.teamLeft.name || "TEAM NAME";
  teamNameDisplayRight.innerText = state.teamRight.name || "TEAM NAME";
  updateScoreBars(scoreBarsLeft, state.teamLeft.score);
  updateScoreBars(scoreBarsRight, state.teamRight.score);

  const renderTeamContent = (
    teamState,
    nameElements,
    banElements,
    pickElements
  ) => {
    teamState.players.forEach((player, i) => {
      nameElements[i].innerText = player.name || "PLAYER NAME";
      let photoOverlay = pickElements[i].querySelector(".player-photo-overlay");
      if (player.photo) {
        if (!photoOverlay) {
          photoOverlay = document.createElement("div");
          photoOverlay.className = "player-photo-overlay";
          pickElements[i].appendChild(photoOverlay);
        }
        photoOverlay.style.backgroundImage = `url('${player.photo}')`;
      } else {
        if (photoOverlay) photoOverlay.remove();
      }
    });

    teamState.bans.forEach((hero, i) => {
      const slot = banElements[i];
      // --- PERBAIKAN DI SINI ---
      // Tambahkan pengecekan untuk memastikan slot-nya ada sebelum diproses
      if (slot) {
        if ((slot.dataset.heroId || null) !== (hero ? hero.name : null)) {
          slot.dataset.heroId = hero ? hero.name : null;
          if (hero) {
            playSound("assets/audio/sfx/draft.mp3");
            slot.innerHTML = `<img src="assets/images/HeroBan/${hero.imageFile}" alt="${hero.name}">`;
            const img = slot.querySelector("img");
            slot.classList.add("animate-ban");
            setTimeout(() => img.classList.add("grayscaled"), 800);
            setTimeout(() => slot.classList.remove("animate-ban"), 1300);
          } else {
            slot.innerHTML = "";
          }
        }
      }
    });

    teamState.picks.forEach((hero, i) => {
      const slot = pickElements[i];
      if ((slot.dataset.heroName || null) !== (hero ? hero.name : null)) {
        slot.dataset.heroName = hero ? hero.name : null;
        if (source === "pick" && hero) {
          playSound("assets/audio/sfx/pick.mp3");
          if (hero.voiceoverFile) {
            playSound(`assets/audio/voiceover/${hero.voiceoverFile}`);
          }
        }

        if (
          source === "swap" ||
          source === "connect" ||
          source === "reset" ||
          source === "playerPhoto"
        ) {
          instantUpdatePick(slot, hero);
        } else {
          playPickAnimation(slot, hero);
        }
      }
    });
  };

  renderTeamContent(
    state.teamLeft,
    playerNameDisplaysLeft,
    banSlotsLeft,
    pickSlotsLeft
  );
  renderTeamContent(
    state.teamRight,
    playerNameDisplaysRight,
    banSlotsRight,
    pickSlotsRight
  );

  document
    .querySelectorAll(".player-photo-overlay")
    .forEach((p) => p.classList.remove("active-turn"));
  if (
    state.currentTurn > -1 &&
    state.activeTeam !== "none" &&
    draftSequence.length > 0
  ) {
    const currentStep = draftSequence[state.currentTurn];
    if (currentStep && currentStep.slots) {
      const targetPickSlots =
        state.activeTeam === "left" ? pickSlotsLeft : pickSlotsRight;
      currentStep.slots.forEach((slotIndex) => {
        const targetSlot = targetPickSlots[slotIndex];
        if (targetSlot) {
          const activeOverlay = targetSlot.querySelector(
            ".player-photo-overlay"
          );
          if (activeOverlay) {
            activeOverlay.classList.add("active-turn");
          }
        }
      });
    }
  }
};

socket.on("stateUpdate", (payload) => {
  if (!payload || !payload.state) return;
  if (payload.sequence) draftSequence = payload.sequence;
  updateDisplay(payload.state, payload.source);
});

socket.on("startTimer", ({ duration }) => {
  if (currentActiveTeam === "left") {
    animateTimer(duration, turnTimerFillLeft, turnTimerFillRight, false);
  } else if (currentActiveTeam === "right") {
    animateTimer(duration, turnTimerFillRight, turnTimerFillLeft, false);
  } else if (currentActiveTeam === "none") {
    animateTimer(duration, turnTimerFillLeft, turnTimerFillRight, true);
  }
});

socket.on("stopTimer", () => {
  cancelAnimationFrame(timerAnimationId);
  if (mainTimerDisplay) mainTimerDisplay.innerText = 50;
  if (turnTimerFillLeft) turnTimerFillLeft.style.width = "100%";
  if (turnTimerFillRight) turnTimerFillRight.style.width = "100%";
});
