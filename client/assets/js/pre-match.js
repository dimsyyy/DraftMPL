const socket = io(`http://${window.location.hostname}:5500`);
socket.on("connect", () => {
  console.log("CONTROL: Berhasil terhubung ke server!");
  // Memperkenalkan diri sebagai ControlPanel
  socket.emit("registerClient", { name: "Prematch" });
});
// --- Mengambil semua elemen dari HTML ---
const container = document.querySelector(".container");
const leftTeamRow = document.querySelector(".team-row.left");
const rightTeamRow = document.querySelector(".team-row.right");
const middleSection = document.querySelector(".middle");
const leftTeamCards = document.querySelectorAll(".team-row.left .player-card");
const rightTeamCards = document.querySelectorAll(
  ".team-row.right .player-card"
);
const leftTeamNameEl = document.querySelector(".team-name.left .team-left");
const leftScoreEl = document.querySelector(".score.left");
const rightTeamNameEl = document.querySelector(".team-name.right .team-right");
const rightScoreEl = document.querySelector(".score.right");

// --- Fungsi untuk mengisi data satu baris tim ---
const populateTeamRow = (cards, teamState) => {
  cards.forEach((card, index) => {
    const player = teamState.players[index];
    const hero = teamState.picks[index];

    const heroPhotoEl = card.querySelector(".hero-photo");
    const playerPhotoEl = card.querySelector(".player-photo");
    const roleIconEl = card.querySelector(".role-icon");
    const playerNameEl = card.querySelector(".player-name");
    const battleSpellEl = card.querySelector(".battle-spell"); // <-- ELEMEN BARU DIAMBIL

    if (hero && heroPhotoEl) {
      heroPhotoEl.src = `assets/images/heroState/webp/${hero.imageFile.replace(
        ".png",
        ".webp"
      )}`;
      heroPhotoEl.style.opacity = 1;
    } else if (heroPhotoEl) {
      heroPhotoEl.style.opacity = 0;
    }

    if (player && player.name && playerNameEl) {
      playerNameEl.innerText = player.name || "PLAYER NAME";
    }

    if (player && player.photo && playerPhotoEl) {
      playerPhotoEl.src = player.photo;
      playerPhotoEl.style.opacity = 1;
    } else if (playerPhotoEl) {
      playerPhotoEl.style.opacity = 0;
    }

    if (player && player.role && roleIconEl) {
      roleIconEl.src = `assets/images/roles/${player.role}.png`;
      roleIconEl.style.opacity = 1;
    } else if (roleIconEl) {
      roleIconEl.style.opacity = 0;
    }

    // --- LOGIKA BARU UNTUK BATTLE SPELL ---
    if (player && player.spell && battleSpellEl) {
      battleSpellEl.src = `assets/images/battlespell/${player.spell}.png`;
      battleSpellEl.style.opacity = 1;
    } else if (battleSpellEl) {
      battleSpellEl.style.opacity = 0;
    }
  });
};

// --- FUNGSI ANIMASI (Tidak berubah) ---
const runAnimationSequence = (state) => {
  // Reset posisi awal semua elemen
  container.classList.remove("play-animation");
  leftTeamRow.classList.remove("slide-up");
  rightTeamRow.classList.remove("slide-down");
  document.querySelectorAll(".player-photo").forEach((p) => {
    p.classList.remove("wipe-in", "wipe-out");
  });

  // Beri jeda sangat singkat agar browser sempat me-reset posisi
  setTimeout(() => {
    // Stage 1 & 2: Slide tim masuk, lalu middle fade-in
    container.classList.add("play-animation");

    // Stage 3: Geser tim keluar (setelah 2 detik)
    setTimeout(() => {
      leftTeamRow.classList.add("slide-up");
      rightTeamRow.classList.add("slide-down");
    }, 2000); // 1s untuk slide-in + 1s jeda

    // Stage 4: Animasi wipe-in foto pemain (setelah 3.5 detik)
    setTimeout(() => {
      const allCards = [...leftTeamCards, ...rightTeamCards];
      allCards.forEach((card) => {
        const playerPhoto = card.querySelector(".player-photo");
        if (playerPhoto && playerPhoto.src) {
          playerPhoto.classList.add("wipe-in");
        }
      });
    }, 3500); // 2s dari awal + 1.5s jeda

    // Stage 5: Animasi wipe-out (setelah 8 detik total)
    setTimeout(() => {
      document.querySelectorAll(".player-photo.wipe-in").forEach((photo) => {
        photo.classList.add("wipe-out");
        // Hapus elemen setelah animasi selesai agar tidak menumpuk
        photo.addEventListener("transitionend", () => photo.remove(), {
          once: true,
        });
      });
    }, 8000); // 3.5s dari awal + 4s tahan + 0.5s jeda
  }, 50); // Jeda 50ms
};

// --- Listener dari Server (Tidak berubah) ---
socket.on("stateUpdate", (payload) => {
  if (!payload || !payload.state) return;
  const state = payload.state;
  populateTeamRow(leftTeamCards, state.teamLeft);
  populateTeamRow(rightTeamCards, state.teamRight);
  if (leftTeamNameEl) leftTeamNameEl.innerText = state.teamLeft.name;
  if (rightTeamNameEl) rightTeamNameEl.innerText = state.teamRight.name;
  if (typeof fitTeamNames === "function") fitTeamNames();
  if (leftScoreEl) leftScoreEl.innerText = state.teamLeft.score;
  if (rightScoreEl) rightScoreEl.innerText = state.teamRight.score;
});

socket.on("animatePrematch", () => {
  fetch(`http://${window.location.hostname}:5500/state`)
    .then((res) => res.json())
    .then((state) => {
      populateTeamRow(leftTeamCards, state.teamLeft);
      populateTeamRow(rightTeamCards, state.teamRight);
      runAnimationSequence(state);
    });
});
