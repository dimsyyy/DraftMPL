// generator.js
const fs = require("fs");

// === 1. DAFTAR NAMA HERO ===
// Cukup update daftar ini kalau ada hero baru
const heroNames = [
  "Aamon",
  "Akai",
  "Aldous",
  "Alice",
  "Alpha",
  "Alucard",
  "Angela",
  "Argus",
  "Arlott",
  "Atlas",
  "Aulus",
  "Aurora",
  "Badang",
  "Balmond",
  "Bane",
  "Barats",
  "Baxia",
  "Beatrix",
  "Belerick",
  "Benedetta",
  "Brody",
  "Bruno",
  "Carmilla",
  "Cecilion",
  "change",
  "Chip",
  "Chou",
  "Cici",
  "Claude",
  "Clint",
  "Cyclops",
  "Diggie",
  "Dyrroth",
  "Edith",
  "Esmeralda",
  "Estes",
  "Eudora",
  "Fanny",
  "Faramis",
  "Floryn",
  "Franco",
  "Fredrinn",
  "Freya",
  "Gatotkaca",
  "Gloo",
  "Gord",
  "Granger",
  "Grock",
  "Guinevere",
  "Gusion",
  "Hanabi",
  "Hanzo",
  "Harith",
  "Harley",
  "Hayabusa",
  "Helcurt",
  "Hilda",
  "Hylos",
  "Irithel",
  "Ixia",
  "Jawhead",
  "Johnson",
  "Joy",
  "Julian",
  "Kadita",
  "Kagura",
  "Kaja",
  "Kalea",
  "Karina",
  "Karrie",
  "Khaleed",
  "Khufra",
  "Kimmy",
  "Lancelot",
  "LapuLapu",
  "Layla",
  "Leomord",
  "Lesley",
  "Ling",
  "Lolita",
  "Lukas",
  "Lunox",
  "LuoYi",
  "Lylia",
  "Martis",
  "Masha",
  "Mathilda",
  "Melissa",
  "Minotaur",
  "Minsitthar",
  "Miya",
  "Moskov",
  "Nana",
  "Natalia",
  "Natan",
  "Nolan",
  "Novaria",
  "Odette",
  "Paquito",
  "Pharsa",
  "Phoveus",
  "PopolKupa",
  "Rafaela",
  "Roger",
  "Ruby",
  "Saber",
  "Selena",
  "Silvanna",
  "Sun",
  "Suyou",
  "Terizla",
  "Thamuz",
  "Tigreal",
  "Uranus",
  "Vale",
  "Valentina",
  "Valir",
  "Vexana",
  "Wanwan",
  "xborg",
  "Xavier",
  "YiSunshin",
  "Yin",
  "YuZhong",
  "Yve",
  "Zetian",
  "Zhask",
  "Zhuxin",
  "Zilong",
];

// === 2. FUNGSI UNTUK GENERATE HERO LIST ===
function generateHeroList(names) {
  return names.map((name) => {
    // Ubah nama hero ke lowercase untuk nama file
    const fileName = name.toLowerCase();

    // Generate picks & winrate random
    const picks = Math.floor(Math.random() * 30) + 1; // 1x - 30x
    const winrate = `${Math.floor(Math.random() * 50) + 50}%`; // 50% - 100%

    return {
      name,
      imageFile: `${fileName}.png`,
      videoFile: `${fileName}.mp4`,
      voiceoverFile: `${fileName}.ogg`,
      stats: { picks: `${picks}x`, winrate },
    };
  });
}

// === 3. BUAT HERO LIST ===
const heroList = generateHeroList(heroNames);

// === 4. FORMAT HASILNYA DALAM BENTUK JS ===
const output = `const heroList = ${JSON.stringify(
  heroList,
  null,
  2
)};\n\nexport default heroList;`;

// === 5. SIMPAN HASILNYA KE FILE heroList.js ===
fs.writeFileSync("heroList.js", output, "utf-8");

console.log("✅ File heroList.js berhasil digenerate!");
