# Sementara: Cara 1 (bangun index secara manual)

Folder ini hanya dipakai **selama GitHub Actions organisasi `hkbpperawang` terkunci** karena masalah billing
("The job was not started because your account is locked due to a billing issue"). Akibatnya workflow
`.github/workflows/build-index.yml` tidak berjalan dan `dist/` tidak dibangun ulang otomatis.

## Kapan perlu dijalankan

| Cara menambah/mengubah konten | Perlu menjalankan skrip? |
|---|---|
| Lewat dashboard website (`/dashboard` → Postingan / Warta Acara) | **Tidak.** CMS menulis `dist/content-index.json` sendiri. |
| Upload/edit file langsung di GitHub atau push dari IDE (`artikel/`, `warta-acara/`, `pages/`) | **Ya**, sesudah commit/push. |
| Ubah kategori, tag, folder warta, atau preset penulis di dashboard (`pages/taxonomy.json`) | **Ya.** |

## Cara menjalankan

```powershell
pwsh -File E:\Projects\hkbpperawang\assets\_sementara-cara1\build-index-manual.cara1.ps1
```

Skrip ini menjalankan `git pull`, `node scripts/build-index.mjs`, lalu commit dan push **hanya `dist/`**
dengan pesan `[skip ci]`.

## Isi folder

| File | Jenis | Keterangan |
|---|---|---|
| `build-index-manual.cara1.ps1` | Sementara | Skrip pengganti workflow. Hapus setelah Actions pulih. |
| `README.md` | Sementara | Panduan ini. Hapus setelah Actions pulih. |
| `content-index.json.cara1.old` | Cadangan | Salinan `dist/content-index.json` sebelum build manual pertama (13 Nov 2026). |
| `people-pages.json.cara1.old` | Cadangan | Salinan `dist/people-pages.json` sebelum build manual pertama (13 Nov 2026). |

Tidak ada file sumber yang diubah oleh cara sementara ini; workflow `build-index.yml` dan
`scripts/build-index.mjs` tetap seperti semula.

## Setelah GitHub Actions pulih

1. Buka **Actions → Build Content Index → Run workflow** (branch `main`) dan pastikan statusnya hijau.
2. Hapus seluruh folder ini: `git rm -r _sementara-cara1` lalu commit dan push.

Cadangan `.cara1.old` hanya diperlukan jika build manual ternyata merusak index. Untuk memulihkannya:
salin `content-index.json.cara1.old` → `dist/content-index.json` dan `people-pages.json.cara1.old` →
`dist/people-pages.json`, lalu commit. Dalam kondisi normal cukup biarkan workflow membangun ulang `dist/`.
