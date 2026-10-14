const socket = io(`http://${window.location.hostname}:5500`);
socket.on("connect", () => {
  console.log("CONTROL: Berhasil terhubung ke server!");
  // Memperkenalkan diri sebagai ControlPanel
  socket.emit("registerClient", { name: "RightDisplay" });
});
const teamDisplayContainer = document.querySelector(".team-display-container");
let isMuted = true;
const playSound = (src) => {
  const sound = new Audio(src);
  sound.play().catch((error) => {
    console.warn(`Peringatan saat memutar suara: ${error}`);
  });
};
// --- Mengambil semua elemen dari HTML ---
const teamNameEl = document.getElementById("team-name");
const scoreBars = document.querySelectorAll(
  ".score-group.score-right .score-bar"
);
const banSlots = document.querySelectorAll(".ban-slots .ban-slot");
const pickSlots = document.querySelectorAll(".player-grid .hero-pick-slot");
const playerNameBars = document.querySelectorAll(
  ".player-grid .player-name-bar"
);
const playerCards = document.querySelectorAll(".player-grid .player-card"); // Ambil kartu pemain

// Variabel untuk menyimpan urutan draft
let draftSequence = [];
socket.on("playAnimationIn", () => {
  if (teamDisplayContainer) {
    teamDisplayContainer.classList.add("animate-in");
  }
  isMuted = false;
  console.log("AUDIO: Unmuted");
});

socket.on("playAnimationOut", () => {
  if (teamDisplayContainer) {
    teamDisplayContainer.classList.remove("animate-in");
  }
  isMuted = true;
  console.log("AUDIO: Muted");
});
const playPickAnimation = (slot, hero) => {
  // Bersihkan slot dari sisa animasi sebelumnya
  slot
    .querySelectorAll(".hero-stats-overlay, .hero-name-overlay")
    .forEach((el) => el.remove());

  // 1. Animasi Hero Masuk (Efek Usap/Reveal)
  const heroImg = document.createElement("img");
  heroImg.src = `assets/images/otherDisplay/pick/${hero.imageFile}`;
  slot.appendChild(heroImg);

  // Memicu animasi dengan menambahkan kelas 'is-visible'
  setTimeout(() => heroImg.classList.add("is-visible"), 50);

  // Setelah hero selesai di-"usap"...
  heroImg.addEventListener(
    "transitionend",
    () => {
      // 2. Animasi Stats Masuk (Usap dari atas)
      const statsOverlay = document.createElement("div");
      statsOverlay.className = "hero-stats-overlay";
      statsOverlay.innerHTML = `
            <span class="stat-label">PICK</span>
            <span class="stat-value">${hero.stats.picks}</span>
            <span class="stat-label">WINRATE</span>
            <span class="stat-value">${hero.stats.winrate}</span>
        `;
      slot.appendChild(statsOverlay);
      setTimeout(() => statsOverlay.classList.add("slide-in"), 50);

      // Setelah stats masuk...
      statsOverlay.addEventListener("transitionend", (e) => {
        // Pastikan event ini hanya dari animasi 'slide-in', bukan 'slide-out'
        if (!statsOverlay.classList.contains("slide-out")) {
          // 3. Tahan Stats selama 4 detik, lalu keluarkan
          setTimeout(() => {
            statsOverlay.classList.add("slide-out");
          }, 4000);
        } else {
          // 4. Setelah stats keluar, Animasi Nama Hero Masuk (dari kanan)
          const nameOverlay = document.createElement("div");
          nameOverlay.className = "hero-name-overlay from-right"; // Perbedaan di sini
          nameOverlay.innerText = hero.name;
          slot.appendChild(nameOverlay);
          setTimeout(() => nameOverlay.classList.add("slide-in"), 50);

          // Hapus stats dari DOM setelah animasinya selesai
          statsOverlay.remove();
        }
      });
    },
    { once: true }
  ); // Listener hanya berjalan sekali
};
const updateDisplay = (state) => {
  const teamState = state.teamRight;

  teamNameEl.innerText = teamState.name || "TEAM NAME";
  scoreBars.forEach((bar, index) =>
    bar.classList.toggle("active", index < teamState.score)
  );

  const reversedPlayers = [...teamState.players].reverse();
  reversedPlayers.forEach((player, i) => {
    if (playerNameBars[i]) {
      playerNameBars[i].innerText = player.name || `PLAYER ${5 - i}`;
    }
    const pickSlot = pickSlots[i];
    let photoOverlay = pickSlot.querySelector(".player-photo-overlay");
    if (player.photo) {
      if (!photoOverlay) {
        photoOverlay = document.createElement("div");
        photoOverlay.className = "player-photo-overlay";
        pickSlot.appendChild(photoOverlay);
      }
      photoOverlay.style.backgroundImage = `url('${player.photo}')`;
    } else if (photoOverlay) {
      photoOverlay.remove();
    }
  });

  teamState.bans.forEach((hero, i) => {
    const slot = banSlots[i];
    const currentHeroName = slot.dataset.heroName || "none";

    if (hero && hero.name !== currentHeroName) {
      playSound("assets/audio/sfx/draft.mp3");
      slot.innerHTML = "";
      slot.dataset.heroName = hero.name;

      const img = document.createElement("img");
      img.src = `assets/images/otherDisplay/ban/${hero.imageFile}`;
      slot.appendChild(img);

      setTimeout(() => {
        img.classList.add("slide-in");
      }, 50);

      img.addEventListener(
        "transitionend",
        () => {
          // MEMBUAT DIV GLOW SECARA DINAMIS
          const glowDiv = document.createElement("div");
          glowDiv.className = "glow-overlay";
          slot.appendChild(glowDiv);

          // Hapus div glow setelah animasinya selesai
          glowDiv.addEventListener(
            "animationend",
            () => {
              glowDiv.remove();
            },
            { once: true }
          );

          // Jadikan gambar grayscale di tengah durasi glow
          setTimeout(() => {
            img.classList.add("grayscaled");
          }, 400);
        },
        { once: true }
      );
    } else if (!hero && currentHeroName !== "none") {
      slot.innerHTML = "";
      slot.dataset.heroName = "none";
    }
  });

  const reversedPicks = [...teamState.picks].reverse();
  reversedPicks.forEach((hero, i) => {
    const slot = pickSlots[i];
    const currentHeroName = slot.dataset.heroName || "none";
    let photoOverlay = slot.querySelector(".player-photo-overlay");

    if (hero && hero.name !== currentHeroName) {
      slot.dataset.heroName = hero.name;

      // --- AUDIO DITAMBAHKAN DI SINI ---
      playSound("assets/audio/sfx/pick.mp3"); // Suara efek pick
      if (hero.voiceoverFile) {
        playSound(`assets/audio/voiceover/${hero.voiceoverFile}`); // Suara voice over hero
      }
      // ------------------------------------

      playPickAnimation(slot, hero);
      if (photoOverlay) slot.appendChild(photoOverlay);
    } else if (!hero && currentHeroName !== "none") {
      slot.innerHTML = "";
      slot.dataset.heroName = "none";
      if (photoOverlay) slot.appendChild(photoOverlay);
    }
  });

  document
    .querySelectorAll(".player-photo-overlay")
    .forEach((overlay) => overlay.classList.remove("active-turn"));

  if (
    state.activeTeam === "right" &&
    state.currentTurn > -1 &&
    draftSequence.length > 0
  ) {
    const currentStep = draftSequence[state.currentTurn];
    if (currentStep && currentStep.slots) {
      currentStep.slots.forEach((slotIndex) => {
        const reversedIndex = 4 - slotIndex;
        const activeOverlay = pickSlots[reversedIndex]?.querySelector(
          ".player-photo-overlay"
        );
        if (activeOverlay) activeOverlay.classList.add("active-turn");
      });
    }
  }
};

socket.on("stateUpdate", (payload) => {
  if (payload && payload.state) {
    if (payload.sequence) {
      draftSequence = payload.sequence;
    }
    updateDisplay(payload.state);
  }
});
