// File: assets/js/lineup.js

const socket = io(`http://${window.location.hostname}:5500`);

// Elemen-elemen utama yang akan diisi dan dianimasikan
const lineupWrapper = document.querySelector(".lineup-wrapper");
const teamNameEl = document.querySelector(".lineup-teamname");
const playerImageEls = document.querySelectorAll(
  ".lineup-player .images .player"
);
const playerRoleEls = document.querySelectorAll(
  ".lineup-player .roles .role img"
);
const playerNameEls = document.querySelectorAll(".lineup-playername .name");

// Fungsi untuk mengisi data ke dalam HTML
const populateLineupData = (teamData) => {
  if (!teamData) return;

  // Isi nama tim
  teamNameEl.innerText = teamData.name;

  // Isi data untuk 5 pemain
  teamData.players.forEach((player, index) => {
    if (player) {
      // Isi nama pemain
      if (playerNameEls[index]) {
        playerNameEls[index].innerText = player.name;
      }
      // Isi gambar/foto pemain (pastikan data foto ada)
      if (playerImageEls[index] && player.photo) {
        playerImageEls[index].src = player.photo;
      }
      // Isi icon role (pastikan data role ada)
      if (playerRoleEls[index] && player.role) {
        playerRoleEls[index].src = `assets/images/roles/${player.role}.png`;
      }
    }
  });
};

// Listener utama dari server
socket.on("showLineup", (data) => {
  if (!lineupWrapper) return;

  if (data.action === "show" && data.team) {
    // 1. Isi data tim yang benar
    populateLineupData(data.team);
    // 2. Hapus kelas 'out' jika ada, lalu picu animasi 'in'
    lineupWrapper.classList.remove("animate-out");
    // Delay sesaat agar browser siap untuk animasi baru
    setTimeout(() => {
      lineupWrapper.classList.add("animate-in");
    }, 100);
  } else if (data.action === "hide") {
    // 1. Picu animasi 'out'
    lineupWrapper.classList.add("animate-out");
    // 2. Hapus kelas 'in' agar bisa dianimasikan lagi nanti
    lineupWrapper.classList.remove("animate-in");
  }
});
