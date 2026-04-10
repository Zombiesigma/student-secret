# 🎓 Student Secret

Student Secret adalah aplikasi web anonim yang memungkinkan siswa berbagi cerita, rahasia, keluh kesah, atau pesan dukungan tanpa mengungkapkan identitas. Platform ini dirancang untuk menciptakan ruang aman bagi siswa untuk mengekspresikan diri, berbagi pengalaman, dan mendapatkan dukungan dari teman sebaya.

## ✨ Fitur Utama

- 📝 **Posting anonim** – Tidak perlu login untuk mengirimkan rahasia.
- 💬 **Komentar** – Pengguna dapat berkomentar secara anonim pada setiap postingan.
- ❤️ **Reaksi & Vote** – Beri suka atau tidak suka pada postingan/komentar.
- 🏷️ **Kategori** – Pilih kategori seperti Akademik, Sosial, Percintaan, Curhat, Motivasi.
- 🔍 **Pencarian & Filter** – Temukan rahasia berdasarkan kata kunci atau kategori.
- 🚩 **Pelaporan** – Laporkan konten yang tidak pantas untuk moderasi.
- 🛡️ **Dashboard Moderator** – Admin dapat melihat laporan dan menghapus konten melanggar.
- 🌙 **Mode gelap/terang** – Kenyamanan membaca.

## 🛠️ Teknologi yang Digunakan (Contoh)

- **Frontend:** React.js + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (atau PostgreSQL)
- **Autentikasi:** Opsional untuk admin (JWT)
- **Deployment:** Vercel / Netlify (frontend) & Railway / Heroku (backend)

## 📦 Instalasi dan Menjalankan Proyek

### Prasyarat

- Node.js (v18 atau lebih baru)
- npm atau yarn
- MongoDB (lokal atau Atlas)

### Langkah-langkah

1. **Clone repository**
   ```bash
   git clone https://github.com/username/student-secret.git
   cd student-secret
Instal dependensi backend

bash
cd backend
npm install
Instal dependensi frontend

bash
cd ../frontend
npm install
Konfigurasi environment
Buat file .env di folder backend dengan isi:

env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student-secret
JWT_SECRET=rahasia_admin_anda
Jalankan server development

Backend:

bash
cd backend
npm run dev
Frontend:

bash
cd frontend
npm start
Akses aplikasi
Buka http://localhost:3000 di browser.

📁 Struktur Proyek (Sederhana)
text
student-secret/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
│   └── public/
└── README.md
🚀 Penggunaan
Mengirim rahasia – Klik tombol "Tulis Rahasia", isi pesan, pilih kategori, lalu kirim.

Membaca rahasia lain – Beranda menampilkan daftar rahasia terbaru dengan reaksi.

Berinteraksi – Beri like atau komentar (tetap anonim).

Melaporkan – Klik tanda seru/flag pada postingan yang tidak pantas.

🧪 Menjalankan Tes (jika ada)
bash
cd backend
npm test
🤝 Kontribusi
Kontribusi sangat diterima! Silakan ikuti langkah berikut:

Fork repositori ini.

Buat branch fitur baru (git checkout -b fitur-keren).

Commit perubahan Anda (git commit -m 'Tambah fitur XYZ').

Push ke branch (git push origin fitur-keren).

Buka Pull Request.

📄 Lisensi
Proyek ini dilisensikan di bawah MIT License.

🙏 Ucapan Terima Kasih
Terinspirasi dari platform anonim seperti Spill dan Confession yang sering digunakan di kalangan pelajar/mahasiswa.

Dibuat dengan 💚 untuk membantu siswa berbagi tanpa beban.

text

Silakan ganti bagian yang sesuai dengan implementasi nyata Anda (misalnya nama package, link repo, teknologi yang benar-benar dipakai). Jika ada fitur spesifik yang sudah Anda buat, tambahkan atau sesuaikan daftar fitur di atas.