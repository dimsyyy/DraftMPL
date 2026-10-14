const socket = io(`http://${window.location.hostname}:5500`);
socket.on("connect", () => {
  console.log("CONTROL: Berhasil terhubung ke server!");
  // Memperkenalkan diri sebagai ControlPanel
  socket.emit("registerClient", { name: "ControlPanel" });
});
const populateStateFromInputs = () => {
  const state = {};
  // Logika untuk mengisi state dari semua input, select, dll.
  // Ini memastikan data yang disimpan selalu yang terbaru, bahkan sebelum dikirim ke server
  // (Implementasi detail bisa ditambahkan jika diperlukan, tapi stateUpdate sudah cukup)
  return state;
};

// GANTI SELURUH FUNGSI INI DI control.js
const populateItemDropdowns = async () => {
  try {
    const response = await fetch("/api/items");
    const items = await response.json();

    const dataList = document.getElementById("item-list-data");
    if (!dataList) return;

    dataList.innerHTML = ""; // Kosongkan daftar lama

    // Buat <option> untuk setiap item di dalam datalist
    items.forEach((item) => {
      const option = document.createElement("option");
      // Value sekarang hanya nama, data lengkap akan kita cari nanti
      option.value = item.name;
      dataList.appendChild(option);
    });

    console.log(
      `CONTROL: Berhasil memuat ${items.length} item ke dalam datalist.`
    );
  } catch (error) {
    console.error("CONTROL ERROR: Gagal mengambil daftar item:", error);
  }
};

// --- FUNGSI BARU UNTUK MENGISI FORM DARI DATA STATE ---
const populateInputsFromState = (state) => {
  // Mengisi nama tim & skor
  const teamNameInputLeft = document.querySelector(
    ".left-panel .team-name-input"
  );
  if (document.activeElement !== teamNameInputLeft)
    teamNameInputLeft.value = state.teamLeft.name;
  document.querySelector(".left-panel .score-display").innerText =
    state.teamLeft.score;

  const teamNameInputRight = document.querySelector(
    ".right-panel .team-name-input"
  );
  if (document.activeElement !== teamNameInputRight)
    teamNameInputRight.value = state.teamRight.name;
  document.querySelector(".right-panel .score-display").innerText =
    state.teamRight.score;

  // Mengisi data pemain (Nama, Role, Spell, Pick, Ban)
  ["left", "right"].forEach((side) => {
    const teamPanelClass = side === "left" ? ".left-panel" : ".right-panel";
    const teamState = side === "left" ? state.teamLeft : state.teamRight;

    document
      .querySelectorAll(`${teamPanelClass} .player-row`)
      .forEach((row, index) => {
        const player = teamState.players[index];
        if (!player) return;

        const nameInput = row.querySelector(".player-name-input");
        if (document.activeElement !== nameInput) nameInput.value = player.name;

        const roleSelect = row.querySelector(".role-select");
        if (document.activeElement !== roleSelect)
          roleSelect.value = player.role || "";

        const spellSelect = row.querySelector(".spell-select");
        if (document.activeElement !== spellSelect)
          spellSelect.value = player.spell || "";

        const pickInput = row.querySelector(".pick-input");
        if (document.activeElement !== pickInput)
          pickInput.value = teamState.picks[index]?.name || "";

        const banInput = row.querySelector(".ban-input");
        if (banInput && document.activeElement !== banInput) {
          banInput.value = teamState.bans[index]?.name || "";
        }
      });
  });

  // Mengisi data global, notifikasi, dll (jika ada yang perlu diisi ulang)
  console.log("CONTROL: Input dasar berhasil diisi dari state.");
};

const populateItemsFromState = (state) => {
  ["left", "right"].forEach((side) => {
    const itemPanel = document.querySelector(`.item-panel.${side}`);
    const teamState = side === "left" ? state.teamLeft : state.teamRight;

    itemPanel.querySelectorAll(".item-row").forEach((row, playerIndex) => {
      const player = teamState.players[playerIndex];
      if (!player) return;

      const itemInputs = row.querySelectorAll(".item-select");
      player.items.forEach((item, itemIndex) => {
        const input = itemInputs[itemIndex];
        if (input && document.activeElement !== input) {
          input.value = item?.name || "";
        }
      });
    });
  });
  console.log("CONTROL: Input item berhasil diisi dari state.");
};

const loadPhotosFromStorage = () => {
  const allPlayerRows = document.querySelectorAll(".player-row");
  allPlayerRows.forEach((row) => {
    const team = row.closest(".team-panel").classList.contains("left-panel")
      ? "left"
      : "right";
    const playerIndex = Array.from(row.parentElement.children).indexOf(row);
    const photoId = `photo_${team}_${playerIndex}`;
    const savedImage = localStorage.getItem(photoId);
    if (savedImage) {
      const photoContainer = row.querySelector(".player-photo");
      photoContainer.style.backgroundImage = `url('${savedImage}')`;
      photoContainer.style.backgroundSize = "cover";
      photoContainer.style.backgroundPosition = "center";
      photoContainer.style.backgroundRepeat = "no-repeat";
    }
  });
};

const populateHeroDataList = (usedHeroes = []) => {
  const dataList = document.querySelector("#hero-list-data");
  if (!dataList) return;
  dataList.innerHTML = "";
  const usedHeroNames = usedHeroes.map((h) => h.name);
  heroList.forEach((hero) => {
    const option = document.createElement("option");
    option.value = hero.name;
    if (usedHeroNames.includes(hero.name)) {
      option.disabled = true;
    }
    dataList.appendChild(option);
  });
};

const updateSwapDropdowns = (state) => {
  const allTeamSwapControls = document.querySelectorAll(".team-swap-controls");
  allTeamSwapControls.forEach((controls) => {
    const teamSide = controls
      .closest(".team-panel")
      .classList.contains("left-panel")
      ? "left"
      : "right";
    const teamState = teamSide === "left" ? state.teamLeft : state.teamRight;
    const dropdowns = controls.querySelectorAll(".swap-player-select");
    dropdowns.forEach((dropdown) => {
      const selectedValue = dropdown.value;
      dropdown.innerHTML = '<option value="">-- Pilih Pemain --</option>';
      teamState.picks.forEach((hero, index) => {
        if (hero) {
          const playerName =
            teamState.players[index].name || `PLAYER ${index + 1}`;
          const option = new Option(`${playerName} (${hero.name})`, index);
          dropdown.add(option);
        }
      });
      dropdown.value = selectedValue;
    });
  });
};

const initializeEventListeners = () => {
  const scheduleInputs = document.querySelectorAll(".schedule-inputs input");
  scheduleInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      socket.emit("updateSchedule", {
        index: index,
        text: e.target.value,
      });
    });
  });
  document
    .querySelector(".left-panel .team-name-input")
    .addEventListener("input", (e) =>
      socket.emit("updateTeamName", { team: "left", name: e.target.value })
    );
  document
    .querySelector(".right-panel .team-name-input")
    .addEventListener("input", (e) =>
      socket.emit("updateTeamName", { team: "right", name: e.target.value })
    );

  // Nama Pemain
  document.querySelectorAll(".player-name-input").forEach((input) => {
    input.addEventListener("input", (event) => {
      const team = input.closest(".team-panel").classList.contains("left-panel")
        ? "left"
        : "right";
      const playerIndex = Array.from(
        input.closest(".players-list").children
      ).indexOf(input.closest(".player-row"));
      socket.emit("updatePlayerName", {
        team,
        playerIndex,
        name: event.target.value,
      });
    });
  });

  // Skor
  document.querySelectorAll(".score-control").forEach((control) => {
    const team = control.closest(".team-panel").classList.contains("left-panel")
      ? "left"
      : "right";
    control
      .querySelector(".plus")
      .addEventListener("click", () =>
        socket.emit("updateScore", { team, action: "increment" })
      );
    control
      .querySelector(".minus")
      .addEventListener("click", () =>
        socket.emit("updateScore", { team, action: "decrement" })
      );
  });

  document.querySelectorAll(".player-row").forEach((row) => {
    const uploadButton = row.querySelector(".upload-btn");
    const photoInput = row.querySelector(".photo-input");
    const photoContainer = row.querySelector(".player-photo");

    if (uploadButton && photoInput && photoContainer) {
      uploadButton.addEventListener("click", () => {
        photoInput.click();
      });

      // GANTI SELURUH BLOK INI DI control.js untuk KUALITAS TERBAIK & STABIL

      photoInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
          const img = new Image();

          img.onload = () => {
            // Kita tetapkan lebar maksimal yang ideal. 800px adalah resolusi
            // yang sangat baik untuk kontainer 384px.
            const MAX_WIDTH = 800;

            let width = img.width;
            let height = img.height;

            // Jika lebar gambar lebih besar dari batas maksimal, kita ubah ukurannya
            if (width > MAX_WIDTH) {
              const ratio = MAX_WIDTH / width;
              width = MAX_WIDTH;
              height = height * ratio;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            // Dapatkan data URL dari gambar yang ukurannya sudah dioptimalkan
            const resizedImageData = canvas.toDataURL("image/png");

            photoContainer.style.backgroundImage = `url('${resizedImageData}')`;
            photoContainer.style.backgroundSize = "cover";
            photoContainer.style.backgroundPosition = "center";

            const team = row
              .closest(".team-panel")
              .classList.contains("left-panel")
              ? "left"
              : "right";
            const playerIndex = Array.from(row.parentElement.children).indexOf(
              row
            );
            const photoId = `photo_${team}_${playerIndex}`;

            localStorage.setItem(photoId, resizedImageData);

            socket.emit("updatePlayerPhoto", {
              team: team,
              playerIndex: playerIndex,
              photoData: resizedImageData,
            });
          };

          img.src = e.target.result;
        };

        reader.readAsDataURL(file);
      });
    }
  });
  const startLineupLeftBtn = document.querySelector("#start-lineup-left-btn");
  const startLineupRightBtn = document.querySelector("#start-lineup-right-btn");
  const stopLineupBtn = document.querySelector("#stop-lineup-btn");

  if (startLineupLeftBtn) {
    startLineupLeftBtn.addEventListener("click", () => {
      socket.emit("triggerLineup", { action: "show", team: "left" });
    });
  }
  if (startLineupRightBtn) {
    startLineupRightBtn.addEventListener("click", () => {
      socket.emit("triggerLineup", { action: "show", team: "right" });
    });
  }
  if (stopLineupBtn) {
    stopLineupBtn.addEventListener("click", () => {
      socket.emit("triggerLineup", { action: "hide" });
    });
  }

  // Ban & Pick
  document.querySelectorAll(".ban-input").forEach((input, index) => {
    input.addEventListener("change", (e) => {
      const team = index < 5 ? "left" : "right";
      const banIndex = index % 5;
      const hero = heroList.find((h) => h.name === e.target.value);
      socket.emit("updateBan", { team, banIndex, hero: hero || null });
    });
  });
  document.querySelectorAll(".pick-input").forEach((input, index) => {
    input.addEventListener("change", (e) => {
      const team = index < 5 ? "left" : "right";
      const playerIndex = index % 5;
      const hero = heroList.find((h) => h.name === e.target.value);
      socket.emit("updatePick", { team, playerIndex, hero: hero || null });
    });
  });

  // Swap
  document.querySelectorAll(".team-swap-controls").forEach((controls) => {
    const team = controls
      .closest(".team-panel")
      .classList.contains("left-panel")
      ? "left"
      : "right";
    const swapButton = controls.querySelector(".execute-team-swap-btn");
    const dropdowns = controls.querySelectorAll(".swap-player-select");
    swapButton.addEventListener("click", () => {
      const playerIndex1 = dropdowns[0].value;
      const playerIndex2 = dropdowns[1].value;
      if (playerIndex1 && playerIndex2 && playerIndex1 !== playerIndex2) {
        socket.emit("swapHeroes", {
          team,
          playerIndex1: parseInt(playerIndex1),
          playerIndex2: parseInt(playerIndex2),
        });
      } else {
        alert("Pilih dua pemain yang berbeda untuk ditukar.");
      }
    });
  });
  const startMapShuffleBtn = document.querySelector("#start-map-shuffle-btn");
  if (startMapShuffleBtn) {
    startMapShuffleBtn.addEventListener("click", () => {
      const mapSelect = document.querySelector("#map-select");
      const selectedMap = mapSelect.value; // Contoh: "dangerous"

      if (selectedMap) {
        socket.emit("startMapShuffle", { map: selectedMap });
      }
    });
  }
  const startPrematchAnimBtn = document.querySelector(
    "#start-prematch-animation-btn"
  );
  if (startPrematchAnimBtn) {
    startPrematchAnimBtn.addEventListener("click", () => {
      socket.emit("startPrematchAnimation");
    });
  }

  document.querySelectorAll(".spell-select").forEach((select) => {
    select.addEventListener("change", (event) => {
      const team = select
        .closest(".team-panel")
        .classList.contains("left-panel")
        ? "left"
        : "right";
      const playerIndex = Array.from(
        select.closest(".players-list").children
      ).indexOf(select.closest(".player-row"));
      socket.emit("updatePlayerSpell", {
        team: team,
        playerIndex: playerIndex,
        spell: event.target.value,
      });
    });
  });
  document
    .querySelector("#start-btn")
    .addEventListener("click", () => socket.emit("startDraft"));
  document
    .querySelector("#next-btn")
    .addEventListener("click", () => socket.emit("nextTurn"));
  const resetBtn = document.querySelector("#reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Apakah Anda yakin ingin mereset semua data draf?")) {
        // Hapus data dari localStorage
        localStorage.removeItem("draftState");
        localStorage.clear(); // Hapus juga foto pemain
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith("photo_")) {
            localStorage.removeItem(key);
            i--; // Sesuaikan indeks setelah item dihapus
          }
        }
        // Kirim perintah reset ke server
        socket.emit("resetDraft");
        window.location.reload();
        // Kosongkan semua input di halaman
        document
          .querySelectorAll('input[type="text"], input[type="number"]')
          .forEach((input) => (input.value = ""));
        document
          .querySelectorAll("select")
          .forEach((select) => (select.selectedIndex = 0));
        const allPhotoContainers = document.querySelectorAll(".player-photo");
        allPhotoContainers.forEach((container) => {
          container.style.backgroundImage = "none";
        });
        console.log(
          "CONTROL: Semua data, termasuk localStorage, telah direset."
        );
      }
    });
  }
  document.querySelector("#swap-team-btn").addEventListener("click", () => {
    if (confirm("Apakah Anda yakin ingin menukar kedua tim?")) {
      socket.emit("swapTeams");
    }
  });
  const animInBtn = document.querySelector("#start-anim-in-btn");
  if (animInBtn) {
    animInBtn.addEventListener("click", () =>
      socket.emit("triggerAnimationIn")
    );
  }

  const animOutBtn = document.querySelector("#start-anim-out-btn");
  if (animOutBtn) {
    animOutBtn.addEventListener("click", () =>
      socket.emit("triggerAnimationOut")
    );
  }
  const spawnLordBtn = document.querySelector("#notif-spawn-lord");
  if (spawnLordBtn) {
    spawnLordBtn.addEventListener("click", () => {
      socket.emit("triggerNotification", {
        event: "spawn_lord",
        videoSrc: "assets/videos/notifications/spawn_lord.webm", // Kirim juga path videonya
      });
    });
  }
  const spawnTurtleBtn = document.querySelector("#notif-spawn-turtle");
  if (spawnTurtleBtn) {
    spawnTurtleBtn.addEventListener("click", () => {
      socket.emit("triggerNotification", {
        event: "spawn_turtle",
        videoSrc: "assets/videos/notifications/spawn_turtle.webm", // Kirim juga path videonya
      });
    });
  }
  const wipedOutBtn = document.querySelector("#notif-wiped-out");
  if (wipedOutBtn) {
    wipedOutBtn.addEventListener("click", () => {
      socket.emit("triggerNotification", {
        event: "wiped_out",
        videoSrc: "assets/videos/notifications/wiped_out.webm", // Kirim juga path videonya
      });
    });
  }
  const playerNotifRows = document.querySelectorAll(".player-notif-row");
  playerNotifRows.forEach((row) => {
    const team = row
      .closest(".team-notifications")
      .classList.contains("left-team")
      ? "left"
      : "right";
    const playerIndex = Array.from(row.parentElement.children).indexOf(row);

    const actionButtons = row.querySelectorAll("button[data-event]");

    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const eventType = button.dataset.event;
        console.log(
          `${eventType} diklik untuk Tim: ${team}, Player Index: ${playerIndex}`
        );
        socket.emit("triggerNotification", {
          event: eventType,
          team: team,
          playerIndex: playerIndex,
        });
      });
    });
  });
  document.querySelectorAll(".role-select").forEach((select) => {
    select.addEventListener("change", (event) => {
      const team = select
        .closest(".team-panel")
        .classList.contains("left-panel")
        ? "left"
        : "right";
      const playerIndex = Array.from(
        select.closest(".players-list").children
      ).indexOf(select.closest(".player-row"));

      socket.emit("updatePlayerRole", {
        team: team,
        playerIndex: playerIndex,
        role: event.target.value,
      });
    });
  });
  const startCountdownBtn = document.querySelector("#start-countdown-btn");
  const minutesInput = document.querySelector("#countdown-minutes");
  const secondsInput = document.querySelector("#countdown-seconds");
  const adsFolderInput = document.querySelector("#ads-folder-input");

  if (startCountdownBtn && minutesInput && secondsInput) {
    startCountdownBtn.addEventListener("click", () => {
      const minutes = parseInt(minutesInput.value) || 0;
      const seconds = parseInt(secondsInput.value) || 0;
      const totalDuration = minutes * 60 + seconds;

      if (totalDuration > 0) {
        socket.emit("startCountdown", { duration: totalDuration });
      }
    });
  }

  if (adsFolderInput) {
    adsFolderInput.addEventListener("change", (event) => {
      const files = event.target.files;
      const videoPlaylist = [];

      for (const file of files) {
        videoPlaylist.push(file.name);
      }

      if (videoPlaylist.length > 0) {
        socket.emit("adsPlaylist", videoPlaylist);
        alert(`${videoPlaylist.length} video iklan telah dimuat!`);
      }
    });
  }
  const startGameTimerBtn = document.querySelector("#start-game-time-btn");
  const stopGameTimerBtn = document.querySelector("#stop-game-time-btn");
  const resetGameTimerBtn = document.querySelector("#reset-game-time-btn");
  const minutesTimerInput = document.querySelector("#game-timer-minutes");
  const secondsTimerInput = document.querySelector("#game-timer-seconds");

  // 2. BARU GUNAKAN VARIABELNYA DI BAWAH INI
  if (startGameTimerBtn) {
    startGameTimerBtn.addEventListener("click", () => {
      const minutes = parseInt(minutesTimerInput.value) || 0;
      const seconds = parseInt(secondsTimerInput.value) || 0;
      const startTimeInSeconds = minutes * 60 + seconds;
      console.log(
        `CONTROL: Mengirim event 'gameTimer start' dengan waktu: ${startTimeInSeconds} detik`
      );
      socket.emit("gameTimer", {
        action: "start",
        startTime: startTimeInSeconds,
      });
    });
  }

  if (stopGameTimerBtn) {
    stopGameTimerBtn.addEventListener("click", () => {
      console.log("CONTROL: Mengirim event 'gameTimer stop'");
      socket.emit("gameTimer", { action: "stop" });
    });
  }

  if (resetGameTimerBtn) {
    resetGameTimerBtn.addEventListener("click", () => {
      minutesTimerInput.value = "0";
      secondsTimerInput.value = "0";
      console.log("CONTROL: Mengirim event 'gameTimer reset'");
      socket.emit("gameTimer", { action: "reset" });
    });
  }

  // File: control.js (tambahkan di dalam initializeEventListeners)

  const startMvpBtn = document.querySelector("#start-mvp-btn");
  if (startMvpBtn) {
    startMvpBtn.addEventListener("click", () => {
      socket.emit("triggerMvpAnimation", { action: "show" });
    });
  }

  const stopMvpBtn = document.querySelector("#stop-mvp-btn");
  if (stopMvpBtn) {
    stopMvpBtn.addEventListener("click", () => {
      socket.emit("triggerMvpAnimation", { action: "hide" });
    });
  }

  document
    .querySelector("#set-winner-left")
    .addEventListener("click", () =>
      socket.emit("setVictoryStatus", { winner: "left" })
    );
  document
    .querySelector("#set-winner-right")
    .addEventListener("click", () =>
      socket.emit("setVictoryStatus", { winner: "right" })
    );
  // GANTI SEMUA LISTENER STATISTIK LAMA DENGAN BLOK BARU INI DI control.js

  // Listener untuk Gold Global
  document.querySelector("#global-gold-left").addEventListener("input", (e) => {
    socket.emit("updateStat", {
      type: "globalText",
      team: "left",
      stat: "gold",
      value: e.target.value,
    });
  });
  document
    .querySelector("#global-gold-right")
    .addEventListener("input", (e) => {
      socket.emit("updateStat", {
        type: "globalText",
        team: "right",
        stat: "gold",
        value: e.target.value,
      });
    });

  // Listener untuk Tombol Counter (+/-)
  document.querySelectorAll(".stat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      socket.emit("updateStat", {
        type: "globalCounter",
        team: btn.dataset.team,
        stat: btn.dataset.stat,
        action: btn.classList.contains("plus") ? "increment" : "decrement",
      });
    });
  });

  // Listener untuk Input Gold & KDA Pemain
  document.querySelectorAll(".player-stats-panel").forEach((panel) => {
    const team = panel.classList.contains("left") ? "left" : "right";
    panel.querySelectorAll(".player-stat-row").forEach((row, index) => {
      const goldInput = row.querySelector('input[type="text"]');
      const kdaInputs = row.querySelectorAll('input[type="number"]');
      const tpInput = row.querySelectorAll('input[type="text"]')[1]; // Ambil input TP%

      // Listener Gold
      goldInput.addEventListener("input", (e) => {
        socket.emit("updateStat", {
          type: "playerGold",
          team,
          index,
          value: e.target.value,
        });
      });

      // Listener TP%
      // File: control.js

      // Listener diubah menjadi Damage
      if (tpInput) {
        // Nama variabel tpInput tidak masalah, tidak perlu diubah
        tpInput.addEventListener("input", (e) => {
          socket.emit("updateStat", {
            type: "playerDamage", // <-- Tipe BARU
            team,
            index,
            value: e.target.value,
          });
        });
      }

      // Listener KDA
      const kdaMap =
        team === "left"
          ? ["kill", "death", "assist"]
          : ["assist", "death", "kill"];
      kdaInputs.forEach((input, kdaIndex) => {
        input.addEventListener("input", (e) => {
          socket.emit("updateStat", {
            type: "playerKDA",
            team,
            index,
            kda: kdaMap[kdaIndex],
            value: e.target.value,
          });
        });
      });
    });
  });
  document.querySelectorAll(".item-panel").forEach((panel) => {
    const team = panel.classList.contains("left") ? "left" : "right";

    panel.querySelectorAll(".item-row").forEach((row, playerIndex) => {
      row.querySelectorAll(".item-select").forEach((input, itemIndex) => {
        input.addEventListener("change", (e) => {
          // Sekarang team, playerIndex, dan itemIndex sudah pasti benar
          // karena didapat dari loop di luar listener.
          console.log(
            `Item diubah: Tim=${team}, Player=${playerIndex}, ItemSlot=${itemIndex}, Nama=${e.target.value}`
          );

          socket.emit("updatePlayerItemByName", {
            team,
            playerIndex,
            itemIndex,
            itemName: e.target.value,
          });
        });
      });
    });
  });
  const slideUpBtn = document.querySelector("#item-slide-up-btn");
  if (slideUpBtn) {
    slideUpBtn.addEventListener("click", () => {
      socket.emit("toggleEquipmentItems", { action: "show" });
    });
  }

  const slideDownBtn = document.querySelector("#item-slide-down-btn");
  if (slideDownBtn) {
    slideDownBtn.addEventListener("click", () => {
      socket.emit("toggleEquipmentItems", { action: "hide" });
    });
  }
  const gameTimeInput = document.querySelector("#global-game-time");
  if (gameTimeInput) {
    gameTimeInput.addEventListener("input", (e) => {
      socket.emit("updateGameDuration", { duration: e.target.value });
    });
  }
  const startPostgameAnimBtn = document.querySelector(
    "#start-postgame-animation-btn"
  );
  if (startPostgameAnimBtn) {
    startPostgameAnimBtn.addEventListener("click", () => {
      socket.emit("startPostgameAnimation");
    });
  }
  const scoreMatchInBtn = document.querySelector(
    "#start-scorematch-animation-btn"
  );
  if (scoreMatchInBtn) {
    scoreMatchInBtn.addEventListener("click", () => {
      // LOG 1: Cek apakah klik tombol terdeteksi
      console.log(
        "CONTROL: Tombol 'Score Match IN' diklik, mengirim 'show'..."
      );
      socket.emit("toggleScoreMatch", { action: "show" });
    });
  }

  const startVictoryAnimBtn = document.querySelector(
    "#start-victory-animation-btn"
  );
  if (startVictoryAnimBtn) {
    startVictoryAnimBtn.addEventListener("click", () => {
      socket.emit("triggerVictoryAnimation");
    });
  }

  const scoreMatchOutBtn = document.querySelector(
    "#stop-scorematch-animation-btn"
  );
  if (scoreMatchOutBtn) {
    scoreMatchOutBtn.addEventListener("click", () => {
      // LOG 1: Cek apakah klik tombol terdeteksi
      console.log(
        "CONTROL: Tombol 'Score Match OUT' diklik, mengirim 'hide'..."
      );
      socket.emit("toggleScoreMatch", { action: "hide" });
    });
  }
};

socket.on("stateUpdate", (payload) => {
  if (!payload || !payload.state) return;
  const state = payload.state;

  const teamNameInputLeft = document.querySelector(
    ".left-panel .team-name-input"
  );
  if (document.activeElement !== teamNameInputLeft) {
    teamNameInputLeft.value =
      state.teamLeft.name === "TEAM NAME" ? "" : state.teamLeft.name;
  }
  const teamNameInputRight = document.querySelector(
    ".right-panel .team-name-input"
  );
  if (document.activeElement !== teamNameInputRight) {
    teamNameInputRight.value =
      state.teamRight.name === "TEAM NAME" ? "" : state.teamRight.name;
  }
  document.querySelector(".left-panel .score-display").innerText =
    state.teamLeft.score;
  document.querySelector(".right-panel .score-display").innerText =
    state.teamRight.score;

  document
    .querySelectorAll(".left-panel .player-name-input")
    .forEach((input, index) => {
      if (document.activeElement !== input) {
        input.value =
          state.teamLeft.players[index].name === "PLAYER NAME"
            ? ""
            : state.teamLeft.players[index].name;
      }
    });
  document
    .querySelectorAll(".right-panel .player-name-input")
    .forEach((input, index) => {
      if (document.activeElement !== input) {
        input.value =
          state.teamRight.players[index].name === "PLAYER NAME"
            ? ""
            : state.teamRight.players[index].name;
      }
    });

  document.querySelectorAll(".ban-input").forEach((input, index) => {
    if (document.activeElement !== input) {
      const team = index < 5 ? "left" : "right";
      const banIndex = index % 5;
      const bannedHero =
        team === "left"
          ? state.teamLeft.bans[banIndex]
          : state.teamRight.bans[banIndex];
      input.value = bannedHero ? bannedHero.name : "";
    }
  });

  document.querySelectorAll(".pick-input").forEach((input, index) => {
    if (document.activeElement !== input) {
      const team = index < 5 ? "left" : "right";
      const playerIndex = index % 5;
      const pickedHero =
        team === "left"
          ? state.teamLeft.picks[playerIndex]
          : state.teamRight.picks[playerIndex];
      input.value = pickedHero ? pickedHero.name : "";
    }
  });
  document
    .querySelectorAll(".left-panel .role-select")
    .forEach((select, index) => {
      if (state.teamLeft.players[index]) {
        select.value = state.teamLeft.players[index].role || "";
      }
    });
  document
    .querySelectorAll(".right-panel .role-select")
    .forEach((select, index) => {
      if (state.teamRight.players[index]) {
        select.value = state.teamRight.players[index].role || "";
      }
    });
  const heroLabelsLeft = document.querySelectorAll(
    ".left-team .hero-name-label"
  );
  state.teamLeft.picks.forEach((pickedHero, index) => {
    if (heroLabelsLeft[index]) {
      heroLabelsLeft[index].innerText = pickedHero
        ? pickedHero.name.toLowerCase()
        : `HERO ${index + 1}`;
    }
  });

  const heroLabelsRight = document.querySelectorAll(
    ".right-team .hero-name-label"
  );
  state.teamRight.picks.forEach((pickedHero, index) => {
    if (heroLabelsRight[index]) {
      heroLabelsRight[index].innerText = pickedHero
        ? pickedHero.name.toLowerCase()
        : `HERO ${index + 1}`;
    }
  });
  localStorage.setItem("draftState", JSON.stringify(state));
  console.log("CONTROL: State disimpan ke localStorage.");

  populateInputsFromState(state);
  populateItemsFromState(state);
  populateHeroDataList(state.usedHeroes);
  updateSwapDropdowns(state);

  document
    .querySelectorAll(".item-panel.left .hero-name-label")
    .forEach((label, i) => {
      const pickedHero = state.teamLeft.picks[i];
      label.innerText = pickedHero
        ? pickedHero.name.toUpperCase()
        : `HERO ${i + 1}`;
    });
  document
    .querySelectorAll(".item-panel.right .hero-name-label")
    .forEach((label, i) => {
      const pickedHero = state.teamRight.picks[i];
      label.innerText = pickedHero
        ? pickedHero.name.toUpperCase()
        : `HERO ${i + 1}`;
    });
  // Update form dengan data terbaru (kecuali elemen yang sedang aktif diketik)
});

document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();
  populateItemDropdowns();

  const savedState = localStorage.getItem("draftState");
  if (savedState) {
    console.log(
      "CONTROL: Menemukan state di localStorage, mengirim ke server..."
    );
    socket.emit("restoreState", JSON.parse(savedState));
  } else {
    populateHeroDataList();
  }

  loadPhotosFromStorage();
});
