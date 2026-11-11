# Kebijakan Keamanan & Perlindungan Privasi

Repositori ini memuat aset publikasi digital resmi untuk [www.hkbpperawang.org](https://www.hkbpperawang.org). Mengingat konten repositori mencakup warta jemaat, dokumentasi kegiatan, dan informasi pelayanan, kami berkomitmen menjaga keamanan data, integritas konten, serta privasi seluruh jemaat dan pelayan gereja.

---

## 1. Ruang Lingkup Kerentanan

Kami memprioritaskan penanganan pada hal-hal berikut:

- **Kebocoran Data Pribadi (Personally Identifiable Information / PII)**: Nomor telepon pribadi jemaat, alamat rumah, data keuangan keluarga, rekam medis pada permohonan doa, atau informasi privat lain yang tidak sengaja termuat pada warta/artikel.
- **Kebocoran Kredensial**: Token GitHub, API keys, kata sandi, atau webhook secret yang tidak sengaja terunggah ke dalam repositori.
- **Integritas Konten & Media**: File berbahaya, skrip tersembunyi (malware/XSS payload) di dalam file SVG/HTML/Markdown, atau tautan phising/penipuan yang disisipkan ke dalam naskah warta.

---

## 2. Saluran Pelaporan

Jika Anda menemukan celah keamanan, kesalahan data pribadi pada publikasi warta, atau kerentanan teknis lainnya, mohon **JANGAN** membuat *Public Issue* atau memublikasikannya secara terbuka di forum umum.

Segera hubungi Tim Pengelola Keamanan & Multimedia HKBP Perawang melalui saluran resmi berikut:

| Kanal | Kontak | Keterangan |
| :--- | :--- | :--- |
| **Email Pelaporan** | `kontak@hkbpperawang.org` | Subjek: `[SECURITY] Laporan Kerentanan / Data Pribadi` |
| **WhatsApp Tim** | `+62 815-2330-0181` | Pesan langsung untuk situasi mendesak |

Saat mengirimkan laporan, mohon sertakan informasi pendukung:
1. Lokasi file atau URL yang terdampak di dalam repositori.
2. Penjelasan singkat mengenai masalah keamanan/privasi yang ditemukan.
3. Rekomendasi tindakan (misalnya: penarikan dokumen, penyuntingan data sensitif, atau rotasi kredensial).

---

## 3. SLA Respon & Penanganan

- **Konfirmasi Awal**: Tim kami akan memberikan konfirmasi penerimaan laporan dalam kurun waktu **maksimal 24 jam**.
- **Tindakan Mitigasi**: Untuk laporan terkait kebocoran data pribadi (PII) atau kunci akses, tindakan penyuntingan/penghapusan komit (*scrubbing history*) akan dilakukan sesegera mungkin setelah laporan terverifikasi.
- **Kerahasiaan**: Identitas pelapor dan isi komunikasi akan dijaga kerahasiaannya selama proses penanganan berlangsung.
