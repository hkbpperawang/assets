# Aset Digital HKBP Perawang

Repositori ini merupakan pusat penyimpanan aset data, dokumentasi warta, renungan, naskah artikel, dan media grafis resmi yang digunakan untuk mendukung situs web [www.hkbpperawang.org](https://www.hkbpperawang.org).

Seluruh materi di dalam repositori ini diproduksi dan dikurasi secara kolaboratif oleh pelayan gereja, pendeta, pengurus, serta **Tim Multimedia HKBP Perawang** di bawah naungan Gereja HKBP Perawang.

---

## Struktur Direktori

Repositori ini diorganisasi dengan hierarki folder sebagai berikut:

```text
assets/
├── artikel/
│   └── {kategori-artikel}/
│       └── {judul-artikel}.md
├── Warta Acara/
│   └── {tahun-pembuatan}/
│       └── {bulan-pembuatan}/
│           └── {tanggal-pembuatan}/
│               └── warta.md
└── Images/
    └── logo/
        ├── logo-hkbp-utama.png
        └── logo-multimedia.png
```

### Penjelasan Folder

1. **`artikel/`**
   - Berisi naskah tulisan, renungan rohani, liputan kegiatan gereja, dan pembinaan iman.
   - Dikelompokkan berdasarkan kategori (misalnya: `renungan-harian`, `pemuda`, `sekolah-minggu`, `diakonia`).
2. **`Warta Acara/`**
   - Arsip warta jemaat mingguan dan tata ibadah pesta gerejawi.
   - Disusun bertingkat menurut waktu terbit: `Tahun` > `Bulan` (misal: `01-Januari`) > `Tanggal` (misal: `14-01-2024`).
   - Setiap folder tanggal memuat berkas Markdown (`.md`) yang berisi ringkasan agenda serta tautan dokumen/e-book warta jemaat.
3. **`Images/`**
   - Media visual dan grafis resmi.
   - Subfolder `logo/` memuat aset identitas visual resmi HKBP Perawang dengan format standar web.

---

## Panduan Kontribusi Internal

Bagi pengurus dan anggota Tim Multimedia yang hendak memperbarui atau mengunggah aset:

1. **Standar Penamaan**:
   - Gunakan format huruf kecil dipisahkan tanda strip (`kebab-case`) untuk nama file artikel dan gambar. Hindari penggunaan spasi dan karakter khusus.
   - Contoh: `2024-03-31-kebaktian-paskah.md` atau `banner-pesta-gotilon.webp`.
2. **Optimasi Media**:
   - Pastikan gambar telah dikompresi sebelum diunggah (disarankan format `.webp` atau `.jpg` optimal) agar pemuatan halaman pada website tetap cepat.
3. **Penyaringan Konten Sensitif**:
   - Periksa kembali warta jemaat sebelum di-commit. Pastikan tidak ada data pribadi privat (misal: nomor rekening pribadi, alamat rumah lengkap, atau rekam medis) yang tidak diizinkan untuk dipublikasikan luas.

---

## Lisensi & Keamanan

- **Lisensi Konten**: Repositori ini dilindungi di bawah lisensi [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](LICENSE.md).
- **Pelaporan Kerentanan & Privasi**: Kebijakan dan tata cara pelaporan celah keamanan atau data privat dapat dipelajari di [SECURITY.md](SECURITY.md).

---

## Sekretariat & Kontak Resmi

**Gereja HKBP Perawang**  
Jl. Gajah Tunggal, Tualang, Kec. Tualang, Kabupaten Siak, Riau 28772

- **Website**: [www.hkbpperawang.org](https://www.hkbpperawang.org)
- **Email Informasi**: [informasi@hkbpperawang.org](mailto:informasi@hkbpperawang.org)
- **Email Pelaporan/Keamanan**: [kontak@hkbpperawang.org](mailto:kontak@hkbpperawang.org)
- **WhatsApp**: [+62 815-2330-0181](https://wa.me/6281523300181)

### Media Sosial Resmi
- **YouTube**: [@HKBPPerawang](https://www.youtube.com/@HKBPPerawang)
- **Instagram**: [@HKBPPerawang](https://www.instagram.com/HKBPPerawang)
- **Facebook**: [HKBP Perawang](https://www.facebook.com/HKBPPerawang)
