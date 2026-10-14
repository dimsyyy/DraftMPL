// File: assets/js/mvp.js (KODE BARU YANG DIPERBAIKI)

const socket = io(`http://${window.location.hostname}:5500`);

// Variabel untuk menyimpan state terbaru yang diterima dari server
let localState = null;

socket.on("connect", () => {
  console.log("MVP: Berhasil terhubung ke server!");
  socket.emit("registerClient", { name: "MVP_Display" });
});

// Fungsi untuk mengisi semua data di halaman MVP
const updateMvpDisplay = (state) => {
  if (!state || !state.mvp) {
    console.log("MVP: Belum ada data MVP yang dipilih.");
    return;
  }
  const teamSide = state.mvp.team;
  const teamData = teamSide === "left" ? state.teamLeft : state.teamRight;
  const mvpPlayer = teamData.players[state.mvp.playerIndex];
  const mvpHero = teamData.picks[state.mvp.playerIndex];

  if (!mvpPlayer || !mvpHero) {
    console.error(
      "MVP ERROR: Data pemain atau hero untuk MVP tidak ditemukan!"
    );
    return;
  }

  // --- Mulai mengisi elemen HTML ---
  document.querySelector(".pogame").innerText = "PLAYER OF THE GAME";
  const heroImageFile = mvpHero.imageFile.replace(".png", ".webp");
  document.querySelector(
    ".hero-container img"
  ).src = `assets/images/heroState/webp/${heroImageFile}`;

  const spellEl = document.querySelector(".spell-img img");
  if (mvpPlayer.spell)
    spellEl.src = `assets/images/BattleSpell/${mvpPlayer.spell}.png`;

  const itemEls = document.querySelectorAll(".item-img .item img");
  mvpPlayer.items.forEach((itemData, i) => {
    if (itemEls[i]) {
      if (itemData) {
        const folder = itemData.type === "miniItem" ? "miniItems" : "items";
        itemEls[i].src = `assets/images/${folder}/${itemData.imageFile}`;
      } else {
        itemEls[i].src = "";
      }
    }
  });

  document.querySelector(
    ".kda-value"
  ).innerText = `${mvpPlayer.kda.kill} / ${mvpPlayer.kda.death} / ${mvpPlayer.kda.assist}`;
  document.querySelector(".goldValue").innerText = mvpPlayer.gold;
  document.querySelector(".damageValue").innerText = mvpPlayer.damage || "0";
  document.querySelector(".player-img img").src = mvpPlayer.photo;
  document.querySelector(".player-name").innerText = mvpPlayer.name;

  const roleEl = document.querySelector(".role img");
  if (mvpPlayer.role) roleEl.src = `assets/images/roles/${mvpPlayer.role}.png`;
};

// Listener ini SEKARANG HANYA BERTUGAS MENYIMPAN STATE TERBARU
socket.on("stateUpdate", (payload) => {
  if (payload && payload.state) {
    localState = payload.state; // Simpan state terbaru ke variabel localState
    console.log("MVP: State terbaru diterima dan disimpan.");
  }
});

// Listener ini SEKARANG BERTUGAS MENGISI DATA DAN MEMICU ANIMASI
socket.on("animateMvp", (data) => {
  const container = document.querySelector(".mvp-container");
  if (!container) return;

  if (data.action === "show") {
    // 1. Panggil fungsi update, gunakan state terbaru yang sudah kita simpan
    if (localState) {
      updateMvpDisplay(localState);
    }

    // 2. Beri jeda sesaat (50ms) agar browser selesai mengisi data
    setTimeout(() => {
      // 3. Baru picu animasi
      container.classList.remove("animate-out");
      container.classList.add("animate-in");
    }, 50);
  } else {
    // hide
    container.classList.remove("animate-in");
    container.classList.add("animate-out");
  }
});
