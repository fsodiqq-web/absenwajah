ABSENSI WAJAH — VERSI NETLIFY GRATIS
====================================

Tujuan:
Menjalankan prototipe absensi wajah dengan hosting Netlify dan Netlify Database pada paket Free ($0), selama penggunaan masih di dalam batas kredit bulanan.

FILE PROYEK
- index.html, style.css, app.js: aplikasi web responsif.
- netlify/functions/api.mts: API server-side.
- netlify/database/migrations/0001_create_attendance_tables.sql: struktur tabel siswa dan absensi.
- netlify.toml, package.json: konfigurasi deploy.

BIAYA DAN BATAS PAKET GRATIS
- Netlify Free berharga $0 dan menyediakan 300 kredit per bulan pada paket berbasis kredit.
- Netlify Database memakai kredit untuk compute dan bandwidth; penggunaan tetap harus dipantau.
- Pada paket Free, database memiliki batas 3 database per akun, 1 compute unit, retensi backup terbatas, serta batas penggunaan data sesuai dokumentasi Netlify.
- Jika kredit atau batas layanan tercapai, proyek dapat dijeda sampai siklus berikutnya. Jangan aktifkan paket berbayar atau auto-recharge jika tujuan Anda tetap gratis.
- Periksa halaman Usage & billing di akun Netlify untuk memastikan pemakaian dan paket yang aktif.

CARA DEPLOY DARI HP ANDROID
1. Ekstrak ZIP.
2. Buat repository GitHub baru dan unggah SEMUA file/folder proyek dengan struktur tetap sama.
3. Masuk Netlify: https://app.netlify.com/
4. Pilih Add new project / Import from Git, lalu hubungkan repository GitHub.
5. Pastikan build command: npm run build; publish directory: . (titik); folder Functions: netlify/functions.
6. Aktifkan Netlify Database untuk proyek. Karena package @netlify/database dan folder migrasi sudah disertakan, Netlify dapat menyediakan database dan menjalankan migrasi pada proses deploy sesuai dokumentasi.
7. Di pengaturan Environment variables proyek, buat:
   ABSENSI_ADMIN_KEY = kunci rahasia panjang dan acak yang Anda buat sendiri.
8. Deploy ulang setelah database dan environment variable siap.
9. Buka URL HTTPS Netlify di Chrome HP.
10. Masukkan kunci admin, tekan Hubungkan, lalu nyalakan kamera, daftarkan siswa percobaan, dan uji absensi.

TAUTAN RESMI
- Harga/paket Netlify: https://www.netlify.com/pricing/
- Netlify Database: https://docs.netlify.com/build/data-and-storage/netlify-database/
- Panduan memulai database: https://docs.netlify.com/build/data-and-storage/netlify-database/getting-started/

CATATAN PENTING
- Ini adalah paket kode yang disiapkan untuk dideploy; belum dideploy atau diuji di akun Netlify Anda.
- Data wajah disimpan sebagai descriptor biometrik, bukan foto mentah. Descriptor tetap merupakan data biometrik sensitif.
- Pengenalan dilakukan di browser HP dan membutuhkan internet untuk memuat pustaka/model. Belum ada liveness detection/anti-foto.
- Kunci admin adalah pengamanan dasar prototipe, bukan autentikasi produksi. Untuk penggunaan sekolah resmi, tambahkan login yang layak, hak akses, pencatatan audit, backup, dan prosedur penghapusan data.
- NodeMCU ESP8266 belum terhubung langsung dengan aplikasi versi ini. Ia bisa ditambahkan kemudian sebagai indikator LED/buzzer atau perangkat terminal.
- Pastikan ada persetujuan yang sesuai, batasi akses data wajah, dan sediakan metode absensi alternatif.
