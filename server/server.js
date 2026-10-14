const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const fs = require("fs");

app.use(express.static(path.join(__dirname, "../client")));
app.get("/assets/videos/:folder/:videoName", (req, res) => {
  const videoPath = path.join(
    __dirname,
    "../client/assets/videos",
    req.params.folder,
    req.params.videoName
  );

  if (!fs.existsSync(videoPath)) {
    console.error("Video tidak ditemukan di:", videoPath);
    return res.status(404).send("Video not found");
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});
// Ban 10
const draftSequence = [
  { team: "left", phase: "BAN PHASE", type: "ban", slots: [0] },
  { team: "right", phase: "BAN PHASE", type: "ban", slots: [0] },
  { team: "left", phase: "BAN PHASE", type: "ban", slots: [1] },
  { team: "right", phase: "BAN PHASE", type: "ban", slots: [1] },
  { team: "left", phase: "BAN PHASE", type: "ban", slots: [2] },
  { team: "right", phase: "BAN PHASE", type: "ban", slots: [2] },
  { team: "left", phase: "PICK PHASE", type: "pick", slots: [0] },
  { team: "right", phase: "PICK PHASE", type: "pick", slots: [0, 1] }, // Double Pick
  { team: "left", phase: "PICK PHASE", type: "pick", slots: [1, 2] }, // Double Pick
  { team: "right", phase: "PICK PHASE", type: "pick", slots: [2] },
  { team: "right", phase: "BAN PHASE", type: "ban", slots: [3] },
  { team: "left", phase: "BAN PHASE", type: "ban", slots: [3] },
  { team: "right", phase: "BAN PHASE", type: "ban", slots: [4] },
  { team: "left", phase: "BAN PHASE", type: "ban", slots: [4] },
  { team: "right", phase: "PICK PHASE", type: "pick", slots: [3] },
  { team: "left", phase: "PICK PHASE", type: "pick", slots: [3, 4] }, // Double Pick
  { team: "right", phase: "PICK PHASE", type: "pick", slots: [4] },
  { team: "none", phase: "LAST CHANGE", type: "last_change", slots: [] },
];

// Ban 6
// const draftSequence = [
//   // --- FASE BAN AWAL (6 BAN) ---
//   { team: "left", phase: "BAN PHASE", type: "ban", slots: [0] },
//   { team: "right", phase: "BAN PHASE", type: "ban", slots: [0] },
//   { team: "left", phase: "BAN PHASE", type: "ban", slots: [1] },
//   { team: "right", phase: "BAN PHASE", type: "ban", slots: [1] },
//   { team: "left", phase: "BAN PHASE", type: "ban", slots: [2] },
//   { team: "right", phase: "BAN PHASE", type: "ban", slots: [2] },

//   // --- FASE PICK ---
//   { team: "left", phase: "PICK PHASE", type: "pick", slots: [0] },
//   { team: "right", phase: "PICK PHASE", type: "pick", slots: [0, 1] }, // Double Pick
//   { team: "left", phase: "PICK PHASE", type: "pick", slots: [1, 2] }, // Double Pick
//   { team: "right", phase: "PICK PHASE", type: "pick", slots: [2] },
//   { team: "right", phase: "PICK PHASE", type: "pick", slots: [3] },
//   { team: "left", phase: "PICK PHASE", type: "pick", slots: [3, 4] }, // Double Pick
//   { team: "right", phase: "PICK PHASE", type: "pick", slots: [4] },
//   { team: "none", phase: "LAST CHANGE", type: "last_change", slots: [] },
// ];
let draftState = {};
let gameTimerInterval = null;
let currentGameTime = 0;
// GANTI FUNGSI INI DI server.js
const resetState = () => {
  draftState = {
    teamLeft: {
      name: "TEAM NAME",
      score: 0,
      kills: 0,
      gold: "0k",
      goldAdvantage: "",
      turret: 0,
      lord: 0,
      turtle: 0,
      status: "none",
      redBuff: 0, // <-- Diperbaiki
      purpleBuff: 0, // <-- Diperbaiki
      players: Array.from({ length: 5 }, () => ({
        name: "PLAYER NAME",
        photo: null,
        role: null,
        spell: null,
        kda: { kill: 0, death: 0, assist: 0 },
        gold: "0",
        tp: "0%",
        damage: "0",
        items: Array(6).fill(null),
      })),
      bans: Array(5).fill(null),
      picks: Array(5).fill(null),
    },
    teamRight: {
      name: "TEAM NAME",
      score: 0,
      kills: 0,
      gold: "0k",
      goldAdvantage: "",
      turret: 0,
      lord: 0,
      turtle: 0,
      status: "none",
      redBuff: 0, // <-- Diperbaiki
      purpleBuff: 0, // <-- Diperbaiki
      players: Array.from({ length: 5 }, () => ({
        name: "PLAYER NAME",
        photo: null,
        spell: null,
        role: null,
        kda: { kill: 0, death: 0, assist: 0 },
        gold: "0",
        damage: "0",
        tp: "0%",
        items: Array(6).fill(null),
      })),
      bans: Array(5).fill(null),
      picks: Array(5).fill(null),
    },
    matchSchedule: ["MATCH 1", "MATCH 2", "MATCH 3"],
    usedHeroes: [],
    currentTurn: -1,
    activeTeam: "none",
    currentPhase: "DRAFTING",
    mvp: null,
    gameDuration: "00:00",
  };
};

const startTimer = (duration = 50) => io.emit("startTimer", { duration });

resetState();
// Middleware untuk membaca JSON dari body request
app.use(express.json());

// Endpoint yang akan menerima data dari Python
app.post("/update_ocr", (req, res) => {
  const data = req.body; // Data dari Python
  process.stdout.write(
    `Menerima data OCR: Kill B:${data.kill_biru}, M:${data.kill_merah} | Gold B:${data.gold_biru}, M:${data.gold_merah}\r`
  );

  // Perbarui draftState dengan data baru dari Python
  // Tim Kiri (Biru)
  if (data.kill_biru !== undefined) draftState.teamLeft.kills = data.kill_biru;
  if (data.gold_biru !== undefined) draftState.teamLeft.gold = data.gold_biru;
  if (data.turret_biru !== undefined)
    draftState.teamLeft.turret = data.turret_biru;
  if (data.lord_biru !== undefined) draftState.teamLeft.lord = data.lord_biru;
  if (data.turtle_biru !== undefined)
    draftState.teamLeft.turtle = data.turtle_biru;
  if (data.gold_advantage_biru !== undefined)
    draftState.teamLeft.goldAdvantage = data.gold_advantage_biru;
  // Tim Kanan (Merah)
  if (data.kill_merah !== undefined)
    draftState.teamRight.kills = data.kill_merah;
  if (data.gold_merah !== undefined)
    draftState.teamRight.gold = data.gold_merah;
  if (data.turret_merah !== undefined)
    draftState.teamRight.turret = data.turret_merah;
  if (data.lord_merah !== undefined)
    draftState.teamRight.lord = data.lord_merah;
  if (data.turtle_merah !== undefined)
    draftState.teamRight.turtle = data.turtle_merah;
  if (data.gold_advantage_merah !== undefined)
    draftState.teamRight.goldAdvantage = data.gold_advantage_merah;
  // Timer
  if (data.timer_menit !== undefined)
    draftState.gameTimeMinutes = data.timer_menit;
  if (data.timer_detik !== undefined)
    draftState.gameTimeSeconds = data.timer_detik;

  // Siarkan state yang sudah diperbarui ke semua klien
  io.emit("stateUpdate", { state: draftState, source: "ocrUpdate" });

  res.sendStatus(200); // Kirim balasan "OK" ke Python
});

// GANTI SELURUH FUNGSI INI DI server.js

const getAllItems = () => {
  // PERBAIKAN PATH: Mundur satu direktori dari /server ke root proyek, lalu masuk ke /client
  const itemsPath = path.join(
    __dirname,
    "..",
    "client",
    "assets",
    "images",
    "items"
  );
  const miniItemsPath = path.join(
    __dirname,
    "..",
    "client",
    "assets",
    "images",
    "miniItems"
  );
  let allItems = [];

  console.log("SERVER: Mencoba membaca folder item dari:", itemsPath);
  console.log("SERVER: Mencoba membaca folder miniItem dari:", miniItemsPath);

  try {
    const mainItems = fs.readdirSync(itemsPath);
    mainItems.forEach((file) => {
      if (file.endsWith(".png")) {
        allItems.push({
          name: file
            .replace(".png", "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          imageFile: file,
          type: "item",
        });
      }
    });
    console.log(`SERVER: Ditemukan ${mainItems.length} item utama.`);
  } catch (error) {
    console.error("SERVER ERROR: Gagal membaca folder items:", error);
  }

  try {
    const miniItems = fs.readdirSync(miniItemsPath);
    miniItems.forEach((file) => {
      if (file.endsWith(".png")) {
        allItems.push({
          name: file
            .replace(".png", "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          imageFile: file,
          type: "miniItem",
        });
      }
    });
    console.log(`SERVER: Ditemukan ${miniItems.length} mini item.`);
  } catch (error) {
    console.error("SERVER ERROR: Gagal membaca folder miniItems:", error);
  }

  allItems.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`SERVER: Total ${allItems.length} item berhasil dimuat.`);
  return allItems;
};

// Simpan daftar item ke dalam variabel saat server pertama kali jalan
const itemList = getAllItems();

// Simpan daftar item ke dalam variabel saat server pertama kali jalan

app.get("/state", (req, res) => {
  res.json(draftState);
});
app.get("/api/items", (req, res) => {
  res.json(itemList);
});

io.on("connection", (socket) => {
  let clientName = "User Tanpa Nama"; // Nama default

  // 1. Handler baru untuk menerima "perkenalan diri" dari klien
  socket.on("registerClient", (data) => {
    clientName = data.name || "User Tanpa Nama";
    console.log(`User terhubung: ${clientName} (ID: ${socket.id})`);
  });
  socket.emit("stateUpdate", {
    state: draftState,
    source: "connect",
    sequence: draftSequence,
  });
  socket.on("requestState", () => {
    // Kirim state terbaru ke semua klien untuk memulai animasi roster
    io.emit("startRosterAnimation", draftState);
  });
  socket.on("updateSchedule", (data) => {
    if (
      draftState.matchSchedule &&
      draftState.matchSchedule[data.index] !== undefined
    ) {
      draftState.matchSchedule[data.index] = data.text;
      io.emit("stateUpdate", { state: draftState, source: "scheduleUpdate" });
    }
  });
  socket.on("updateTeamName", (data) => {
    if (data.team === "left") draftState.teamLeft.name = data.name;
    else if (data.team === "right") draftState.teamRight.name = data.name;
    io.emit("stateUpdate", {
      state: draftState,
      source: "teamName",
      sequence: draftSequence,
    });
  });

  socket.on("updateScore", (data) => {
    const team =
      data.team === "left" ? draftState.teamLeft : draftState.teamRight;
    if (data.action === "increment" && team.score < 3) team.score++;
    else if (data.action === "decrement" && team.score > 0) team.score--;
    io.emit("stateUpdate", {
      state: draftState,
      source: "score",
      sequence: draftSequence,
    });
  });

  socket.on("updatePlayerName", (data) => {
    const team =
      data.team === "left" ? draftState.teamLeft : draftState.teamRight;
    team.players[data.playerIndex] = {
      ...team.players[data.playerIndex],
      name: data.name,
    };
    io.emit("stateUpdate", {
      state: draftState,
      source: "playerName",
      sequence: draftSequence,
    });
  });

  socket.on("updatePlayerPhoto", (data) => {
    const team =
      data.team === "left" ? draftState.teamLeft : draftState.teamRight;
    team.players[data.playerIndex] = {
      ...team.players[data.playerIndex],
      photo: data.photoData,
    };
    io.emit("stateUpdate", {
      state: draftState,
      source: "playerPhoto",
      sequence: draftSequence,
    });
  });
  socket.on("triggerLineup", (data) => {
    if (data.action === "show") {
      const teamData =
        data.team === "left" ? draftState.teamLeft : draftState.teamRight;
      // Kirim event ke klien bersama dengan data tim yang relevan
      io.emit("showLineup", { action: "show", team: teamData });
      console.log(`SERVER: Menampilkan lineup untuk tim ${data.team}`);
    } else {
      // Cukup kirim perintah 'hide'
      io.emit("showLineup", { action: "hide" });
      console.log("SERVER: Menyembunyikan lineup");
    }
  });
  socket.on("triggerMvpAnimation", (data) => {
    // Cukup teruskan perintah 'show' atau 'hide' ke halaman MVP
    io.emit("animateMvp", { action: data.action });
    console.log(`SERVER: Memicu animasi MVP -> ${data.action}`);
  });

  socket.on("updatePlayerSpell", (data) => {
    const { team, playerIndex, spell } = data;
    const teamToUpdate =
      team === "left" ? draftState.teamLeft : draftState.teamRight;
    if (teamToUpdate.players && teamToUpdate.players[playerIndex]) {
      teamToUpdate.players[playerIndex].spell = spell;
      io.emit("stateUpdate", { state: draftState, source: "playerSpell" });
    }
  });
  socket.on("updatePlayerRole", (data) => {
    const { team, playerIndex, role } = data;
    const teamToUpdate =
      team === "left" ? draftState.teamLeft : draftState.teamRight;

    if (teamToUpdate.players && teamToUpdate.players[playerIndex]) {
      teamToUpdate.players[playerIndex] = {
        ...teamToUpdate.players[playerIndex],
        role: role,
      };

      io.emit("stateUpdate", {
        state: draftState,
        source: "playerRole",
        sequence: draftSequence,
      });
    }
  });

  socket.on("updateBan", (data) => {
    const team =
      data.team === "left" ? draftState.teamLeft : draftState.teamRight;
    const oldHero = team.bans[data.banIndex];
    if (oldHero)
      draftState.usedHeroes = draftState.usedHeroes.filter(
        (h) => h.name !== oldHero.name
      );
    team.bans[data.banIndex] = data.hero;
    if (data.hero) draftState.usedHeroes.push(data.hero);
    io.emit("stateUpdate", {
      state: draftState,
      source: "ban",
      sequence: draftSequence,
    });
  });

  socket.on("updatePick", (data) => {
    const team =
      data.team === "left" ? draftState.teamLeft : draftState.teamRight;
    const oldHero = team.picks[data.playerIndex];
    if (oldHero)
      draftState.usedHeroes = draftState.usedHeroes.filter(
        (h) => h.name !== oldHero.name
      );
    team.picks[data.playerIndex] = data.hero;
    if (data.hero) draftState.usedHeroes.push(data.hero);
    io.emit("stateUpdate", {
      state: draftState,
      source: "pick",
      sequence: draftSequence,
    });
  });

  socket.on("startPrematchAnimation", () => {
    io.emit("animatePrematch"); // Kirim perintah ke semua klien
  });

  socket.on("swapHeroes", (data) => {
    const team =
      data.team === "left" ? draftState.teamLeft : draftState.teamRight;
    const hero1 = team.picks[data.playerIndex1];
    const hero2 = team.picks[data.playerIndex2];
    team.picks[data.playerIndex1] = hero2;
    team.picks[data.playerIndex2] = hero1;

    io.emit("stateUpdate", {
      state: draftState,
      source: "swap",
      sequence: draftSequence,
    });
  });

  socket.on("swapTeams", () => {
    const tempTeam = draftState.teamLeft;
    draftState.teamLeft = draftState.teamRight;
    draftState.teamRight = tempTeam;
    io.emit("stateUpdate", {
      state: draftState,
      source: "swapTeams",
      sequence: draftSequence,
    });
  });

  socket.on("startDraft", () => {
    draftState.currentTurn = 0;
    const currentStep = draftSequence[0];
    draftState.activeTeam = currentStep.team;
    draftState.currentPhase = currentStep.phase;
    io.emit("stateUpdate", {
      state: draftState,
      source: "start",
      sequence: draftSequence,
    });
    startTimer(50);
  });

  socket.on("nextTurn", () => {
    if (draftState.currentTurn < draftSequence.length - 1) {
      draftState.currentTurn++;
      const currentStep = draftSequence[draftState.currentTurn];
      draftState.activeTeam = currentStep.team;
      draftState.currentPhase = currentStep.phase;
      const duration = currentStep.type === "last_change" ? 30 : 50;
      io.emit("stateUpdate", {
        state: draftState,
        source: "next",
        sequence: draftSequence,
      });
      startTimer(duration);
    }
  });

  socket.on("resetDraft", () => {
    resetState();
    io.emit("stateUpdate", {
      state: draftState,
      source: "reset",
      sequence: draftSequence,
    });
    io.emit("stopTimer");
  });
  // File: server.js (di dalam io.on("connection", ...))

  socket.on("triggerNotification", (data) => {
    console.log(
      `SERVER: Menerima triggerNotification -> Event: ${data.event}, Tim: ${data.team}, Player: ${data.playerIndex}`
    );

    // --- LOGIKA BARU KHUSUS UNTUK MVP ---
    // Jika event adalah 'mvp', kita simpan datanya, bukan langsung menampilkan.
    if (data.event === "mvp") {
      // Simpan data MVP ke dalam state utama
      draftState.mvp = {
        team: data.team,
        playerIndex: data.playerIndex,
      };
      // Siarkan state baru agar semua klien (termasuk mvp.js) tahu siapa MVP-nya
      io.emit("stateUpdate", { state: draftState, source: "mvpSelection" });
      console.log(
        `SERVER: MVP telah dipilih -> Tim: ${data.team}, Player: ${data.playerIndex}`
      );
      return; // Hentikan eksekusi di sini, jangan kirim 'showNotification'
    }

    // --- LOGIKA LAMA UNTUK NOTIFIKASI LAIN ---

    // Untuk Notifikasi Global (Spawn Lord, Turtle, dll.)
    if (data.videoSrc) {
      io.emit("showNotification", data);
      return;
    }

    // Untuk Notifikasi per Pemain (First Blood, Triple Kill, dll.)
    if (data.team && data.playerIndex !== undefined) {
      const teamState =
        data.team === "left" ? draftState.teamLeft : draftState.teamRight;
      const playerState = teamState.players[data.playerIndex];
      const heroState = teamState.picks[data.playerIndex];

      // Pastikan data pemain dan hero ada sebelum mengirim
      if (playerState && heroState) {
        io.emit("showNotification", {
          event: data.event,
          player: playerState,
          hero: heroState,
          team: data.team,
          playerIndex: data.playerIndex,
        });
      } else {
        console.error(
          `SERVER ERROR: Gagal mengirim notifikasi, data player/hero tidak ditemukan untuk Tim: ${data.team}, Player: ${data.playerIndex}`
        );
      }
    }
  });
  socket.on("triggerAnimationIn", () => {
    io.emit("playAnimationIn");
  });
  socket.on("triggerAnimationOut", () => {
    io.emit("playAnimationOut");
  });
  socket.on("startCountdown", (data) => {
    console.log(`Memulai countdown selama ${data.duration} detik.`);
    io.emit("countdownStarted", data);
  });

  socket.on("adsPlaylist", (playlist) => {
    console.log("Menerima daftar putar iklan.");
    io.emit("playlistUpdated", playlist);
  });
  socket.on("gameTimer", (data) => {
    // TAMBAHKAN BARIS INI
    console.log(
      `SERVER: Menerima event 'gameTimer' dengan aksi: ${data.action}`
    );

    switch (data.action) {
      case "start":
        clearInterval(gameTimerInterval);
        currentGameTime = data.startTime || 0;
        io.emit("gameTimeUpdate", { time: currentGameTime });

        gameTimerInterval = setInterval(() => {
          currentGameTime++;
          io.emit("gameTimeUpdate", { time: currentGameTime });
        }, 1000);
        break;

      case "stop":
        clearInterval(gameTimerInterval);
        console.log("Game timer dihentikan.");
        break;

      case "reset":
        clearInterval(gameTimerInterval);
        currentGameTime = 0;
        io.emit("gameTimeUpdate", { time: currentGameTime }); // Kirim waktu reset
        console.log("Game timer direset.");
        break;
    }
  });
  socket.on("updateGameDuration", (data) => {
    draftState.gameDuration = data.duration;
    // Siarkan state yang sudah diperbarui ke semua klien
    io.emit("stateUpdate", { state: draftState, source: "gameDurationUpdate" });
    console.log(`SERVER: Durasi game diupdate -> ${data.duration}`);
  });
  socket.on("setVictoryStatus", (data) => {
    if (data.winner === "left") {
      draftState.teamLeft.status = "victory";
      draftState.teamRight.status = "defeat";
    } else {
      draftState.teamRight.status = "victory";
      draftState.teamLeft.status = "defeat";
    }
    io.emit("stateUpdate", { state: draftState, source: "victory" });
  });

  socket.on("updateStat", (data) => {
    const team =
      data.team === "left" ? draftState.teamLeft : draftState.teamRight;

    switch (data.type) {
      case "globalCounter":
        if (data.action === "increment") {
          team[data.stat]++;
        } else if (data.action === "decrement" && team[data.stat] > 0) {
          team[data.stat]--;
        }
        break;

      case "globalText":
        team[data.stat] = data.value;
        break;

      case "playerGold":
        if (team.players[data.index]) {
          team.players[data.index].gold = data.value;
        }
        break;

      case "playerKDA":
        // --- LOG DITAMBAHKAN DI SINI ---
        console.log(
          `SERVER: Menerima update KDA -> Tim: ${data.team}, Player: ${data.index}, Tipe: ${data.kda}, Nilai: ${data.value}`
        );

        if (team.players[data.index]) {
          team.players[data.index].kda[data.kda] = parseInt(data.value) || 0;
        }
        break;
      // File: server.js (di dalam listener updateStat)

      case "playerDamage": // <-- Nama case diubah
        if (team.players[data.index]) {
          team.players[data.index].damage = data.value; // <-- Properti yang disimpan diubah
        }
        break;
    }

    // Hitung total kills
    draftState.teamLeft.kills = draftState.teamLeft.players.reduce(
      (total, p) => total + p.kda.kill,
      0
    );
    draftState.teamRight.kills = draftState.teamRight.players.reduce(
      (total, p) => total + p.kda.kill,
      0
    );

    io.emit("stateUpdate", { state: draftState, source: "statUpdate" });
  });

  socket.on("updatePlayerPick", (data) => {
    const { team, playerIndex, heroData } = data;
    const player = (
      team === "left" ? draftState.teamLeft : draftState.teamRight
    ).players[playerIndex];

    if (player) {
      player.pick = heroData; // Simpan objek hero lengkap
      io.emit("stateUpdate", { state: draftState, source: "playerPick" });
      console.log(
        `SERVER: Hero pick diupdate: Tim ${team}, Player ${playerIndex}, Hero: ${
          heroData ? heroData.name : "None"
        }`
      );
    }
  });

  // Handler untuk update item pemain (sudah ada, pastikan seperti ini)
  socket.on("updatePlayerItemByName", (data) => {
    const { team, playerIndex, itemIndex, itemName } = data;

    // Cari objek item lengkap di server berdasarkan nama yang dikirim
    const itemData =
      itemList.find(
        (item) => item.name.toLowerCase() === itemName.toLowerCase()
      ) || null;

    const player = (
      team === "left" ? draftState.teamLeft : draftState.teamRight
    ).players[playerIndex];

    if (player && player.items && player.items[itemIndex] !== undefined) {
      player.items[itemIndex] = itemData;
      io.emit("stateUpdate", { state: draftState, source: "playerItem" });
      console.log(
        `SERVER: Item diupdate via nama -> Tim: ${team}, Player: ${playerIndex}, Item: ${itemName}`
      );
    }
  });
  socket.on("startMapShuffle", (data) => {
    console.log(`SERVER: Memulai map shuffle, map terpilih: ${data.map}`);
    // Kirim perintah & map terpilih ke semua klien display
    io.emit("playMapShuffle", { map: data.map });
  });
  socket.on("toggleEquipmentItems", (data) => {
    // Cukup teruskan perintah 'show' atau 'hide' ke semua klien
    io.emit("equipmentItemsState", { action: data.action });
    console.log(`SERVER: Mengirim perintah equipmentItems -> ${data.action}`);
  });
  // Kirim waktu saat ini jika ada klien baru yang terhubung saat timer berjalan
  if (gameTimerInterval) {
    socket.emit("gameTimeUpdate", { time: currentGameTime });
  }
  socket.on("disconnect", () => {
    console.log(`User terputus: ${clientName} (ID: ${socket.id})`);
  });
  socket.on("restoreState", (savedState) => {
    // Timpa state server dengan state yang tersimpan di browser
    draftState = savedState;
    // Siarkan state yang sudah dipulihkan ke semua klien lain
    socket.broadcast.emit("stateUpdate", {
      state: draftState,
      source: "restore",
    });
    console.log("SERVER: State berhasil dipulihkan dari localStorage klien.");
  });
  socket.on("startPostgameAnimation", () => {
    io.emit("animatePostgame");
  });
  socket.on("triggerVictoryAnimation", () => {
    let winningTeam = null;

    // Cek tim mana yang statusnya 'victory'
    if (draftState.teamLeft.status === "victory") {
      winningTeam = draftState.teamLeft;
    } else if (draftState.teamRight.status === "victory") {
      winningTeam = draftState.teamRight;
    }

    if (winningTeam) {
      // Kirim data tim pemenang DAN seluruh state (untuk data skor kedua tim)
      io.emit("showVictory", { winningTeam: winningTeam, state: draftState });
      console.log(
        `SERVER: Menampilkan layar kemenangan untuk: ${winningTeam.name}`
      );
    } else {
      console.log(
        "SERVER: Gagal menampilkan layar kemenangan, tidak ada tim yang berstatus 'victory'."
      );
    }
  });
  socket.on("toggleScoreMatch", (data) => {
    // LOG 2: Cek apakah server menerima dan menyiarkan event

    io.emit("toggleScoreMatch", data);
  });
});

const PORT = 5500;
http.listen(PORT, "0.0.0.0", () => {
  console.log(`Server berjalan dan bisa diakses di http:${PORT}`);
});
