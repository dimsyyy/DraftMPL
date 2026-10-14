// Ganti dengan IP Address server Anda jika perlu
const socket = io(`http://${window.location.hostname}:5500`);
socket.on("connect", () => {
  console.log("CONTROL: Berhasil terhubung ke server!");
  // Memperkenalkan diri sebagai ControlPanel
  socket.emit("registerClient", { name: "Scoreboard" });
});
// === AMBIL SEMUA ELEMEN DARI HTML ===
const teamNameLeft = document.getElementById("team-name-left");
const teamNameRight = document.getElementById("team-name-right");

// Skor (Kill)
const scoreLeftValue = document.getElementById("score-left-value");
const scoreRightValue = document.getElementById("score-right-value");
const scoreBarsLeft = document.querySelectorAll(".score-bar.left");
const scoreBarsRight = document.querySelectorAll(".score-bar.right");

// Gold
const goldLeft = document.getElementById("gold-left");
const goldRight = document.getElementById("gold-right");
const goldAdvantageLeft = document.getElementById("gold-advantage-left");
const goldAdvantageRight = document.getElementById("gold-advantage-right");

// Objectives
const turretLeft = document.getElementById("turret-left");
const turretRight = document.getElementById("turret-right");
const lordLeft = document.getElementById("lord-left");
const lordRight = document.getElementById("lord-right");
// const turtleLeft = document.getElementById("turtle-left"); // Aktifkan jika Anda menambahkannya
// const turtleRight = document.getElementById("turtle-right");

// Timer
const gameTimeDisplay = document.getElementById("game-time");

// === FUNGSI HELPER ===
const updateScoreDisplay = (scoreBars, score) => {
  scoreBars.forEach((bar, index) => {
    bar.classList.toggle("active", index < score);
  });
};

// === LISTENER UTAMA UNTUK SEMUA DATA ===
socket.on("stateUpdate", (payload) => {
  if (!payload || !payload.state) return;
  const state = payload.state;
  console.log("Menerima stateUpdate dari server:", state); // Untuk debugging di konsol browser (F12)

  // --- UPDATE DATA TIM ---
  teamNameLeft.innerText = state.teamLeft.name || "TEAM NAME";
  teamNameRight.innerText = state.teamRight.name || "TEAM NAME";

  // --- UPDATE DATA OCR ---
  // Skor/Kill
  updateScoreDisplay(scoreBarsLeft, state.teamLeft.score);
  updateScoreDisplay(
    Array.from(scoreBarsRight).reverse(),
    state.teamRight.score
  );
  if (scoreLeftValue) scoreLeftValue.innerText = state.teamLeft.kills || 0;
  if (scoreRightValue) scoreRightValue.innerText = state.teamRight.kills || 0;

  // Gold
  if (goldLeft) goldLeft.innerText = state.teamLeft.gold || "0k";
  if (goldRight) goldRight.innerText = state.teamRight.gold || "0k";

  // Objectives
  if (goldAdvantageLeft)
    goldAdvantageLeft.innerText = state.teamLeft.goldAdvantage || "";
  if (goldAdvantageRight)
    goldAdvantageRight.innerText = state.teamRight.goldAdvantage || "";
  if (turretLeft) turretLeft.innerText = state.teamLeft.turret || 0;
  if (turretRight) turretRight.innerText = state.teamRight.turret || 0;
  if (lordLeft) lordLeft.innerText = state.teamLeft.lord || 0;
  if (lordRight) lordRight.innerText = state.teamRight.lord || 0;

  // if (turtleLeft) turtleLeft.innerText = state.teamLeft.turtle || 0;
  // if (turtleRight) turtleRight.innerText = state.teamRight.turtle || 0;

  // Timer (data dari OCR, bukan dari event 'gameTimeUpdate' lagi)
  if (gameTimeDisplay && state.gameTimeMinutes && state.gameTimeSeconds) {
    gameTimeDisplay.innerText = `${state.gameTimeMinutes}:${state.gameTimeSeconds}`;
  }
});

// Listener 'gameTimeUpdate' ini sekarang hanya untuk timer manual dari controller,
// bukan untuk timer OCR. Anda bisa membiarkannya atau menghapusnya jika tidak perlu.
socket.on("gameTimeUpdate", (data) => {
  const formatGameTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  if (gameTimeDisplay && data.time !== undefined) {
    gameTimeDisplay.innerText = formatGameTime(data.time);
  }
});
