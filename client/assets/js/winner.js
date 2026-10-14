// File: assets/js/winner.js (FILE BARU)

const socket = io(`http://${window.location.hostname}:5500`);

socket.on("connect", () => {
  console.log("WINNER: Berhasil terhubung ke server!");
  socket.emit("registerClient", { name: "Winner_Display" });
});

const populateWinnerData = (winningTeam, fullState) => {
  // --- Isi Header ---
  document.querySelector(".header-winner .team.left").innerText =
    fullState.teamLeft.name;
  document.querySelector(".header-winner .score.left").innerText =
    fullState.teamLeft.score;
  document.querySelector(".header-winner .team.right").innerText =
    fullState.teamRight.name;
  document.querySelector(".header-winner .score.right").innerText =
    fullState.teamRight.score;

  // --- Isi Teks Victory ---
  document.querySelector(".victory-text").innerText = "VICTORY";
  document.querySelector(".victory-text").dataset.text = "VICTORY";

  // --- Isi Foto 5 Pemain Pemenang ---
  const playerPhotoEls = document.querySelectorAll(".player-winner");
  winningTeam.players.forEach((player, index) => {
    if (playerPhotoEls[index] && player.photo) {
      playerPhotoEls[index].style.backgroundImage = `url('${player.photo}')`;
    }
  });

  // --- Isi Gabungan Nama Pemain Pemenang ---
  const playerNames = winningTeam.players
    .map((p) => p.name.toUpperCase())
    .join(" - ");
  document.querySelector(".player-winner-name").innerText = playerNames;
};

// Listener utama dari server
socket.on("showVictory", (data) => {
  if (data.winningTeam) {
    // 1. Isi semua data ke dalam elemen HTML
    populateWinnerData(data.winningTeam, data.state);

    // 2. Reset dan picu animasi
    const body = document.body;
    body.classList.remove("animate-in");
    // Jeda singkat agar browser siap untuk animasi baru
    setTimeout(() => {
      body.classList.add("animate-in");
    }, 100);
  }
});
