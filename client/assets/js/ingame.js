const socket = io(`http://${window.location.hostname}:5500`);

socket.on("connect", () => {
  socket.emit("registerClient", { name: "InGame" });
});

const notificationsWrapper = document.getElementById("notifications-wrapper");
const equipmentItemsContainer = document.querySelector(".equipmentItems");
let currentItems = { left: [], right: [] };

// --- FUNGSI UTAMA UNTUK MENANGANI SEMUA NOTIFIKASI ---
const showNotification = (data) => {
  if (!data.event) return;

  const notifElement = document.createElement("div");
  let notificationBuilt = false;

  if (data.team && data.playerIndex !== undefined) {
    notifElement.className = `notification pos-${data.team}-${data.playerIndex}`;
  } else {
    notifElement.className = "notification";
  }

  switch (data.event) {
    case "spawn_lord":
    case "spawn_turtle":
    case "wiped_out":
      notifElement.classList.add(data.event, "visible");
      notifElement.innerHTML = `<video src="${data.videoSrc}" autoplay muted playsinline></video>`;
      notifElement.querySelector("video").onended = () => notifElement.remove();
      notificationBuilt = true;
      break;

    case "first_blood":
    case "triple_kill":
    case "maniac":
    case "savage":
    case "turtle_kill":
    case "lord_kill":
      notifElement.classList.add(data.event, "visible");
      const videoTemplate = `${data.event}_template.webm`;
      notifElement.innerHTML = `
                <video class="background-video" src="assets/videos/notifications/${videoTemplate}" autoplay muted playsinline></video>
                <div class="player-photo" style="background-image: url('${data.player.photo}')"></div>
                <div class="player-name"><p>${data.player.name}</p></div>`;
      notifElement.querySelector(".background-video").onended = () =>
        notifElement.remove();
      notificationBuilt = true;
      break;
    case "turtle_steal":
    case "lord_steal":
      notifElement.classList.add(data.event, "visible");
      const videoTemplateSteal = `${data.event}.webm`;
      notifElement.innerHTML = `
                <video class="background-video" src="assets/videos/notifications/${videoTemplateSteal}" autoplay muted playsinline></video>
                <div class="player-photo" style="background-image: url('${data.player.photo}')"></div>
                <div class="player-name"><p>${data.player.name}</p></div>`;
      notifElement.querySelector(".background-video").onended = () =>
        notifElement.remove();
      notificationBuilt = true;
      break;
    case "level_4":
    case "level_15":
      // Pastikan data pemain ada sebelum melanjutkan
      if (!data.player) break;

      notifElement.classList.add("level-up");
      if (data.team === "right") {
        notifElement.classList.add("layout-right");
      }
      notifElement.innerHTML = `
                <div class="role-icon" style="background-image: url('assets/images/roles/${
                  data.player.role || "exp"
                }.png')"></div>
                <div class="level-panel">${
                  data.event === "level_4" ? "LV 4" : "LV 15"
                }</div>
                <div class="player-name-banner">${
                  data.player.name || "PLAYER NAME"
                }</div>
            `;
      setTimeout(() => notifElement.remove(), 6500);
      notificationBuilt = true;
      break;

    case "item_purchase":
      notifElement.classList.add("item-purchase");
      if (data.team === "right") {
        notifElement.classList.add("layout-right");
      }
      notifElement.innerHTML = `
                <div class="hero-icon-container"><div class="hero-icon"></div></div>
                <div class="item-slots-container">${Array(6)
                  .fill('<div class="item-slot"></div>')
                  .join("")}</div>
            `;
      notifElement.querySelector(
        ".hero-icon"
      ).style.backgroundImage = `url(assets/images/heroItems/${data.hero.imageFile})`;
      const itemSlots = notifElement.querySelectorAll(".item-slot");
      data.player.items.forEach((item, index) => {
        if (item && index !== data.newItemSlotIndex) {
          const folder = item.type === "miniItem" ? "miniItems" : "items";
          itemSlots[
            index
          ].style.backgroundImage = `url(assets/images/${folder}/${item.imageFile})`;
        }
      });
      const newItemEl = document.createElement("div");
      newItemEl.className = "new-item-animation";
      const newItemFolder =
        data.newItem.type === "miniItem" ? "miniItems" : "items";
      newItemEl.style.backgroundImage = `url(assets/images/${newItemFolder}/${data.newItem.imageFile})`;
      notifElement.appendChild(newItemEl);

      setTimeout(() => {
        notifElement.classList.add("visible");
        setTimeout(() => {
          newItemEl.style.transform = "translateY(-50%) scale(1.2)";
          newItemEl.style.opacity = 1;
        }, 500);
        setTimeout(() => {
          const slotsContainer = notifElement.querySelector(
            ".item-slots-container"
          );
          slotsContainer.className += ` pos-${data.newItemSlotIndex}`;
          const finalX = parseFloat(
            getComputedStyle(slotsContainer).getPropertyValue("--target-x")
          );
          const finalY = parseFloat(
            getComputedStyle(slotsContainer).getPropertyValue("--target-y")
          );
          newItemEl.style.transform = `translate(${finalX}px, ${finalY}px) scale(0.55)`;
        }, 1000);
        setTimeout(() => {
          itemSlots[data.newItemSlotIndex].style.backgroundImage =
            newItemEl.style.backgroundImage;
          newItemEl.remove();
          notifElement.classList.add("hiding");
          setTimeout(() => notifElement.remove(), 800);
        }, 3000);
      }, 50);

      notificationBuilt = true;
      break;
  }

  if (notificationBuilt) {
    notificationsWrapper.appendChild(notifElement);
  }
};

// --- FUNGSI UNTUK MENGISI .equipmentItems ---
const updateEquipmentItems = (state) => {
  if (!equipmentItemsContainer) return;
  ["left", "right"].forEach((side) => {
    const team = side === "left" ? state.teamLeft : state.teamRight;
    const playerRows = equipmentItemsContainer.querySelectorAll(
      `.item-player.${side} .player`
    );
    playerRows.forEach((row, pIndex) => {
      const playerItems = team.players[pIndex].items;
      const itemSlots = row.querySelectorAll(".item");
      itemSlots.forEach((slot, iIndex) => {
        const itemData = playerItems[iIndex];
        if (itemData) {
          const folder = itemData.type === "miniItem" ? "miniItems" : "items";
          slot.style.backgroundImage = `url(assets/images/${folder}/${itemData.imageFile})`;
          slot.style.backgroundSize = "contain";
        } else {
          slot.style.backgroundImage = "none";
        }
      });
    });
    const heroSlots = equipmentItemsContainer.querySelectorAll(
      `.hero-player.${side} .hero`
    );
    heroSlots.forEach((slot, i) => {
      const hero = team.picks[i];
      if (hero)
        slot.style.backgroundImage = `url(assets/images/postGame/${hero.imageFile})`;
    });
  });
};

const checkForNewItem = (state) => {
  ["left", "right"].forEach((side) => {
    const team = side === "left" ? state.teamLeft : state.teamRight;
    team.players.forEach((player, playerIndex) => {
      // Pastikan array item lama sudah ada
      if (!currentItems[side][playerIndex]) {
        currentItems[side][playerIndex] = Array(6).fill(null);
      }

      const oldItems = currentItems[side][playerIndex];
      const newItems = player.items;
      let newPurchaseIndex = -1;

      // --- LOGIKA BARU UNTUK MENDETEKSI PERUBAHAN ITEM ---
      for (let i = 0; i < newItems.length; i++) {
        const newItem = newItems[i];
        const oldItem = oldItems[i];

        // Cek apakah ada item baru di slot ini DAN item tersebut BERBEDA dari yang lama.
        // Ini akan mencakup 2 skenario:
        // 1. Slot kosong menjadi terisi (oldItem adalah null).
        // 2. Item lama diganti item baru (oldItem.name !== newItem.name).
        if (newItem && (!oldItem || oldItem.name !== newItem.name)) {
          newPurchaseIndex = i;
          break; // Temukan perubahan pertama, lalu hentikan loop
        }
      }
      // ----------------------------------------------------

      // Pemicu animasi hanya jika item baru yang terdeteksi adalah "item" jadi (bukan miniItem)
      if (
        newPurchaseIndex !== -1 &&
        newItems[newPurchaseIndex].type === "item"
      ) {
        showNotification({
          event: "item_purchase",
          team: side,
          playerIndex: playerIndex,
          player: player,
          hero: team.picks[playerIndex],
          newItem: newItems[newPurchaseIndex],
          newItemSlotIndex: newPurchaseIndex,
        });
      }
    });

    // Perbarui state 'currentItems' untuk pengecekan berikutnya
    currentItems[side] = team.players.map((p) =>
      p.items.map((item) => (item ? { ...item } : null))
    );
  });
};

const updateMatchScore = (state) => {
  // 1. Pilih semua elemen yang relevan di papan skor
  const teamLeftNameEl = document.querySelector(".matchScore .team-left");
  const teamRightNameEl = document.querySelector(".matchScore .team-right");
  const scoreLeftEl = document.querySelector(".matchScore .score-left");
  const scoreRightEl = document.querySelector(".matchScore .score-right");

  // Pastikan semua elemen ada sebelum melanjutkan
  if (!teamLeftNameEl || !teamRightNameEl || !scoreLeftEl || !scoreRightEl) {
    return;
  }

  // 2. Update skor langsung dari state
  scoreLeftEl.innerText = state.teamLeft.score;
  scoreRightEl.innerText = state.teamRight.score;

  // 3. Fungsi kecil untuk update nama tim dan menyesuaikan font
  const adjustTeamName = (element, name) => {
    element.innerText = name; // Set nama tim

    // Reset kelas agar pengecekan lebar akurat
    element.classList.remove("shrink-font");

    // Cek jika lebar teks melebihi 80% dari lebar kontainer (100px * 0.8 = 80px)
    if (element.scrollWidth > 80) {
      element.classList.add("shrink-font");
    }
  };

  // 4. Jalankan fungsi untuk kedua tim
  adjustTeamName(teamLeftNameEl, state.teamLeft.name);
  adjustTeamName(teamRightNameEl, state.teamRight.name);
};

socket.on("toggleScoreMatch", (data) => {
  const matchScore = document.querySelector(".matchScore");

  // LOG 3: Cek apakah halaman in-game menerima event
  console.log(
    `INGAME: Menerima perintah 'toggleScoreMatch' -> action: ${data.action}`
  );

  if (!matchScore) {
    console.error("INGAME ERROR: Elemen .matchScore tidak ditemukan!");
    return;
  }

  if (data.action === "show") {
    matchScore.classList.add("visible");
  } else if (data.action === "hide") {
    matchScore.classList.remove("visible");
  }
});
// --- LISTENER UTAMA DARI SERVER ---
socket.on("stateUpdate", (payload) => {
  if (payload && payload.state) {
    updateEquipmentItems(payload.state);
    checkForNewItem(payload.state);
    updateMatchScore(payload.state);
  }
});

socket.on("equipmentItemsState", (data) => {
  if (equipmentItemsContainer) {
    if (data.action === "show") {
      equipmentItemsContainer.classList.add("visible");
    } else if (data.action === "hide") {
      equipmentItemsContainer.classList.remove("visible");
    }
  }
});

socket.on("showNotification", (data) => {
  showNotification(data);
});
