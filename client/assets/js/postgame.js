const socket = io(`http://${window.location.hostname}:5500`);
socket.on("connect", () => {
  console.log("CONTROL: Berhasil terhubung ke server!");
  // Memperkenalkan diri sebagai ControlPanel
  socket.emit("registerClient", { name: "Postgame" });
});
socket.on("connect", () => {
  console.log(
    "%cPOSTGAME: Berhasil terhubung ke server!",
    "color: green; font-weight: bold;"
  );
});
socket.on("disconnect", () => {
  console.log(
    "%cPOSTGAME: Terputus dari server.",
    "color: red; font-weight: bold;"
  );
});

const updateHeader = (state) => {
  // --- Target Elemen ---
  const headerLeftContainer = document.querySelector(".header .team.left");
  const headerRightContainer = document.querySelector(".header .team.right");
  const totalKillsLeftEl = document.querySelector(
    ".center-info .total-kill-left"
  );
  const totalKillsRightEl = document.querySelector(
    ".center-info .total-kill-right"
  );
  const scoreBarsLeft = document.querySelectorAll(
    ".center-info .scores.left .score"
  );
  const scoreBarsRight = document.querySelectorAll(
    ".center-info .scores.right .score"
  );

  // --- Update Data Tim Kanan (yang tampil di sisi KIRI header) ---
  const teamRightState = state.teamRight;
  if (headerLeftContainer) {
    const teamNameEl = headerLeftContainer.querySelector(".team-name");
    const statusEls = headerLeftContainer.querySelectorAll(".status");
    const statusClass = teamRightState.status === "victory" ? "vic" : "def";

    // Target 1: .team-name
    teamNameEl.innerText = teamRightState.name;
    teamNameEl.className = `team-name ${statusClass}`;

    // Target 2 & 3: .status dan .status.glow
    statusEls.forEach((el) => {
      el.classList.remove("vic", "def");
      el.classList.add(statusClass);
      el.innerText = teamRightState.status === "victory" ? "VICTORY" : "DEFEAT";
    });
  }
  if (totalKillsLeftEl) totalKillsLeftEl.innerText = teamRightState.kills;
  if (scoreBarsLeft)
    scoreBarsLeft.forEach((bar, i) =>
      bar.classList.toggle("active", i < teamRightState.score)
    );

  // --- Update Data Tim Kiri (yang tampil di sisi KANAN header) ---
  const teamLeftState = state.teamLeft;
  if (headerRightContainer) {
    const teamNameEl = headerRightContainer.querySelector(".team-name");
    const statusEls = headerRightContainer.querySelectorAll(".status");
    const statusClass = teamLeftState.status === "victory" ? "vic" : "def";

    // Target 1: .team-name
    teamNameEl.innerText = teamLeftState.name;
    teamNameEl.className = `team-name ${statusClass}`;

    // Target 2 & 3: .status dan .status.glow
    statusEls.forEach((el) => {
      el.classList.remove("vic", "def");
      el.classList.add(statusClass);
      el.innerText = teamLeftState.status === "victory" ? "VICTORY" : "DEFEAT";
    });
  }
  if (totalKillsRightEl) totalKillsRightEl.innerText = teamLeftState.kills;
  if (scoreBarsRight)
    scoreBarsRight.forEach((bar, i) =>
      bar.classList.toggle("active", i < teamLeftState.score)
    );
};

const updateMiddleStats = (state) => {
  document.querySelector(".middle .game-duration-display").innerText =
    state.gameDuration || "00:00";
  document.querySelector(".middle .gold.left").innerText = state.teamLeft.gold;
  document.querySelector(".middle .gold.right").innerText =
    state.teamRight.gold;
  document.querySelector(".middle .turret.left").innerText =
    state.teamLeft.turret;
  document.querySelector(".middle .turret.right").innerText =
    state.teamRight.turret;
  document.querySelector(".middle .lord.left").innerText = state.teamLeft.lord;
  document.querySelector(".middle .lord.right").innerText =
    state.teamRight.lord;
  document.querySelector(".middle .turtle.left").innerText =
    state.teamLeft.turtle;
  document.querySelector(".middle .turtle.right").innerText =
    state.teamRight.turtle;
  document.querySelector(".middle .red.left").innerText =
    state.teamLeft.redBuff;
  document.querySelector(".middle .red.right").innerText =
    state.teamRight.redBuff;
  document.querySelector(".middle .purple.left").innerText =
    state.teamLeft.purpleBuff;
  document.querySelector(".middle .purple.right").innerText =
    state.teamRight.purpleBuff;
};

const updatePlayerCards = (side, teamState) => {
  const cards = document.querySelectorAll(`.team-state.${side} .card`);
  cards.forEach((card, i) => {
    const player = teamState.players[i];
    const hero = teamState.picks[i];

    if (!player || !hero) return;

    // Memastikan semua elemen ada sebelum diupdate
    const heroPhotoEl = card.querySelector(".hero-photo");
    if (heroPhotoEl)
      heroPhotoEl.src = `assets/images/postGame/${hero.imageFile}`;

    const playerPhotoEl = card.querySelector(".player-photo");
    if (playerPhotoEl) playerPhotoEl.src = player.photo;

    const kdaValueEl = card.querySelector(".kda-value");
    if (kdaValueEl)
      kdaValueEl.innerText = `${player.kda.kill}/${player.kda.death}/${player.kda.assist}`;

    const goldValueEl = card.querySelector(".gold-value");
    if (goldValueEl) goldValueEl.innerText = player.gold;

    const playerNameEl = card.querySelector(".player-name");
    if (playerNameEl) playerNameEl.innerText = player.name;

    const heroNameEl = card.querySelector(".hero-name");
    if (heroNameEl) heroNameEl.innerText = hero.name;

    const spellEl = card.querySelector(".battle-spell");
    if (spellEl) {
      if (player.spell) {
        spellEl.style.backgroundImage = `url(assets/images/battlespell/${player.spell}.png)`;
        spellEl.style.backgroundSize = "cover";
      } else {
        spellEl.style.backgroundImage = "none";
      }
    }

    // --- LOGIKA ITEM DIPERBAIKI DAN DIBUAT LEBIH ROBUST ---
    const itemEls = card.querySelectorAll(".item");
    if (itemEls.length > 0) {
      player.items.forEach((itemData, itemIndex) => {
        const itemEl = itemEls[itemIndex];
        if (itemEl) {
          // Pastikan elemen item ada
          if (itemData) {
            const folder = itemData.type === "miniItem" ? "miniItems" : "items";
            itemEl.style.backgroundImage = `url(assets/images/${folder}/${itemData.imageFile})`;
            itemEl.style.backgroundSize = "cover";
            itemEl.style.backgroundRepeat = "no-repeat";
            itemEl.style.backgroundPosition = "center";
          } else {
            itemEl.style.backgroundImage = "none";
          }
        }
      });
    }
  });
};

socket.on("stateUpdate", (payload) => {
  if (!payload || !payload.state) return;
  const state = payload.state;
  const gameDurationEl = document.querySelector(".game-duration-display");
  if (gameDurationEl) {
    gameDurationEl.innerText = state.gameDuration || "00:00";
  }
  updateHeader(state);
  updateMiddleStats(state);
  updatePlayerCards("left", state.teamLeft);
  updatePlayerCards("right", state.teamRight);
});

// --- LISTENER BARU UNTUK MEMICU ANIMASI ---
socket.on("animatePostgame", () => {
  const body = document.querySelector("body");

  // 1. Reset animasi dengan menghapus kelasnya
  body.classList.remove("play-animation");

  // 2. Beri jeda sangat singkat agar browser sempat me-reset posisi
  setTimeout(() => {
    // 3. Picu animasi dengan menambahkan kelasnya kembali
    body.classList.add("play-animation");
  }, 100); // Jeda 100ms
});
