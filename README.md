# NotaKita — Studio Dokumen & Tagihan Digital

Aplikasi pembuat invoice dan dokumen tagihan digital dengan tipografi editorial bersih, presisi, dan minimalis bergaya **Claude / Fable Editorial**.

## Fitur Utama

- **Tipografi Editorial Presisi:** Menggunakan Newsreader (Serif), Plus Jakarta Sans, dan IBM Plex Mono (`tabular-nums`) untuk angka finansial yang rapi.
- **Ekspor Dokumen:** Mendukung unduh langsung ke format PDF standar cetak A4 dan cetak browser.
- **Dukungan Pembayaran:** Rincian transfer bank dan lampiran kode QRIS opsional.
- **Penyimpanan Lokal:** Data tersimpan lokal di perangkat pengguna.
- **Kesiapan Deploy:** Konfigurasi bawaan untuk deployment instan di Netlify (`netlify.toml`) dan Vercel (`vercel.json`).

## Menjalankan Proyek Lokal

```bash
# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Build untuk produksi
npm run build
```

## Deployment ke Netlify

Proyek ini telah dikonfigurasi melalui `netlify.toml`:
- **Build command:** `npm run build`
- **Publish directory:** `dist/client`
