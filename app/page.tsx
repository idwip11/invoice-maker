'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Minus,
  Plus,
  Printer,
  Trash2,
  Upload,
} from 'lucide-react';

type Item = { id: number; name: string; qty: number; price: number };
declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => unknown;
        },
        options?: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}
const initialItems: Item[] = [
  { id: 1, name: 'Paket konten Instagram — 12 desain', qty: 1, price: 750000 },
  { id: 2, name: 'Revisi & finalisasi desain', qty: 1, price: 150000 },
];
const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});
const thousands = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const money = (value: number) => rupiah.format(value).replace('Rp', 'Rp ');
const formatAmount = (value: number) =>
  value > 0 ? thousands.format(value) : '';

const formatDateId = (dateStr: string) => {
  if (!dateStr) return '—';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
};

export default function Home() {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [discount, setDiscount] = useState(0);
  const [invoiceNo, setInvoiceNo] = useState('INV-2409-018');
  const [dueDate, setDueDate] = useState('2026-09-16');
  const [copied, setCopied] = useState(false);
  const [seller, setSeller] = useState('Nusa Creative Studio');
  const [sellerAddress, setSellerAddress] = useState(
    'Jl. Cendana No. 17, Denpasar',
  );
  const [sellerEmail, setSellerEmail] = useState('hello@nusacreative.id');
  const [sellerPhone, setSellerPhone] = useState('+62 812 3456 7890');
  const [customer, setCustomer] = useState('PT Alam Sejahtera');
  const [customerContact, setCustomerContact] = useState('u.p. Nadia Pratama');
  const [customerAddress, setCustomerAddress] = useState('Bandung, Jawa Barat');
  const [customerEmail, setCustomerEmail] = useState(
    'nadia@alamsejahtera.co.id',
  );
  const [bankName, setBankName] = useState('Transfer Bank BCA');
  const [accountHolder, setAccountHolder] = useState('Nusa Creative Studio');
  const [accountNumber, setAccountNumber] = useState('123 456 7890');
  const [qrisImage, setQrisImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [note, setNote] = useState(
    'Terima kasih sudah mempercayai kami. Mohon lakukan pembayaran sebelum tanggal jatuh tempo.',
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.price, 0),
    [items],
  );
  const discountValue = (subtotal * discount) / 100;
  const total = subtotal - discountValue;
  const stateRef = useRef({
    invoiceNo,
    dueDate,
    discount,
    total,
    itemCount: items.length,
  });
  const invoiceRef = useRef<HTMLElement | null>(null);
  stateRef.current = {
    invoiceNo,
    dueDate,
    discount,
    total,
    itemCount: items.length,
  };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'read_invoice_summary',
            title: 'Read invoice summary',
            description:
              'Read the current invoice number, due date, total, discount, and item count without changing the invoice.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute: () => stateRef.current,
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
      void Promise.resolve(
        context.registerTool(
          {
            name: 'configure_invoice',
            title: 'Configure invoice',
            description:
              'Update the visible invoice number, due date, and discount percentage.',
            inputSchema: {
              type: 'object',
              properties: {
                invoiceNo: { type: 'string' },
                dueDate: { type: 'string', format: 'date' },
                discount: { type: 'number', minimum: 0, maximum: 100 },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: (input) => {
              if (!input || typeof input !== 'object' || Array.isArray(input))
                throw new Error('Input tidak valid.');
              const config = input as {
                invoiceNo?: unknown;
                dueDate?: unknown;
                discount?: unknown;
              };
              if (config.invoiceNo !== undefined) {
                if (typeof config.invoiceNo !== 'string')
                  throw new Error('Nomor invoice harus berupa teks.');
                setInvoiceNo(config.invoiceNo);
              }
              if (config.dueDate !== undefined) {
                if (
                  typeof config.dueDate !== 'string' ||
                  !/^\d{4}-\d{2}-\d{2}$/.test(config.dueDate)
                )
                  throw new Error('Tanggal jatuh tempo harus YYYY-MM-DD.');
                setDueDate(config.dueDate);
              }
              if (config.discount !== undefined) {
                if (
                  typeof config.discount !== 'number' ||
                  config.discount < 0 ||
                  config.discount > 100
                )
                  throw new Error('Diskon harus 0–100.');
                setDiscount(config.discount);
              }
              return { updated: true };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
    } catch {
      /* Browser biasa tidak mendukung WebMCP. */
    }
    return () => lifecycle.abort();
  }, []);

  const updateItem = (id: number, field: keyof Item, value: string | number) =>
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  const addItem = () =>
    setItems((current) => [
      ...current,
      { id: Date.now(), name: 'Produk atau jasa baru', qty: 1, price: 0 },
    ]);
  const removeItem = (id: number) => {
    if (items.length > 1)
      setItems((current) => current.filter((item) => item.id !== id));
  };
  const copyInvoiceNumber = async () => {
    try {
      await navigator.clipboard.writeText(invoiceNo);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  const handleQrisUpload = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () =>
      setQrisImage(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };
  const downloadPdf = async () => {
    if (!invoiceRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: 0,
          filename: `${invoiceNo || 'invoice'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(invoiceRef.current)
        .save();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f2eb] text-[#191816]">
      <header className="no-print sticky top-0 z-20 border-b border-[#e2ddd2] bg-[#f5f2eb]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3.5 md:px-9">
          <a
            href="#top"
            className="flex items-center gap-3"
            aria-label="NotaKita"
          >
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-md border border-[#d8d1c3] bg-[#fcfbf8] text-[#c96442]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 1.5V14.5M1.5 8H14.5M3.4 3.4L12.6 12.6M12.6 3.4L3.4 12.6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="font-serif-editorial text-xl font-medium tracking-[-0.02em] text-[#191816]">
                NotaKita
              </span>
              <span className="hidden text-[#c8c0b0] sm:inline">/</span>
              <span className="font-mono-tabular hidden text-[11px] uppercase tracking-[0.08em] text-[#7d786d] sm:inline">
                Lembar Tagihan
              </span>
            </div>
          </a>

          <div className="flex items-center gap-2.5">
            <div className="font-mono-tabular mr-2 hidden items-center gap-2 text-xs text-[#6e6a61] md:flex">
              <span className="size-1.5 rounded-full bg-[#c96442]" />
              <span>Tersimpan lokal</span>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#d5cfc2] bg-[#fcfbf8] px-3.5 py-2 text-xs font-medium text-[#191816] transition hover:border-[#bfb7a6] hover:bg-[#ede8dd]"
            >
              <Printer size={14} strokeWidth={1.6} />
              <span>Cetak</span>
            </button>
            <button
              onClick={downloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#c96442] px-4 py-2 text-xs font-medium text-[#fcfbf8] shadow-[0_1px_2px_rgba(25,24,22,0.12)] transition hover:bg-[#b55333] disabled:cursor-wait disabled:opacity-60"
            >
              <Download size={14} strokeWidth={1.6} />
              <span>{isExporting ? 'Menyiapkan PDF…' : 'Unduh PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="top"
        className="mx-auto max-w-[1440px] px-5 py-7 md:px-9 md:py-10"
      >
        <div className="no-print mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#e2ddd2] pb-6">
          <div>
            <p className="font-mono-tabular mb-1.5 text-[11px] uppercase tracking-[0.14em] text-[#c96442]">
              § Penyusun Dokumen Komersial
            </p>
            <h1 className="font-serif-editorial text-3xl font-normal tracking-[-0.02em] text-[#191816] md:text-[36px]">
              Rapi, tenang, siap dikirimkan.
            </h1>
          </div>
          <p className="max-w-sm text-xs leading-5 text-[#6e6a61] sm:text-sm">
            Sunting rincian di kolom kiri. Lembar tagihan di sisi kanan akan
            menyesuaikan secara langsung dalam format cetak A4.
          </p>
        </div>

        <section className="grid items-start gap-8 xl:grid-cols-[minmax(430px,.82fr)_minmax(590px,1.18fr)]">
          {/* LEFT EDITOR */}
          <aside className="no-print space-y-5">
            {/* 01: Identitas */}
            <section className="rounded-xl border border-[#e2ddd2] bg-[#fcfbf8] p-5 shadow-[0_1px_2px_rgba(25,24,22,0.03)] md:p-6">
              <div className="mb-4 flex items-baseline justify-between border-b border-[#ebe6dc] pb-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono-tabular text-xs font-medium text-[#c96442]">
                    01
                  </span>
                  <h2 className="font-serif-editorial text-lg font-medium text-[#191816]">
                    Identitas Tagihan
                  </h2>
                </div>
                <span className="text-xs text-[#8c877b]">
                  Nomor &amp; jatuh tempo
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label">
                  Nomor referensi
                  <div className="relative mt-1.5">
                    <input
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="field-input font-mono-tabular pr-9 text-[13px]"
                    />
                    <button
                      onClick={copyInvoiceNumber}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[#7d786d] transition hover:bg-[#efeae0] hover:text-[#191816]"
                      aria-label="Salin nomor invoice"
                    >
                      {copied ? (
                        <Check
                          size={14}
                          strokeWidth={1.8}
                          className="text-[#c96442]"
                        />
                      ) : (
                        <Copy size={14} strokeWidth={1.6} />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <span className="font-mono-tabular mt-1 block text-[11px] text-[#c96442]">
                      Tersalin ke papan klip
                    </span>
                  )}
                </label>

                <label className="field-label">
                  Tanggal jatuh tempo
                  <div className="relative mt-1.5">
                    <input
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      type="date"
                      className="field-input font-mono-tabular text-[13px]"
                    />
                  </div>
                </label>
              </div>
            </section>

            {/* 02: Pihak Terlibat */}
            <section className="rounded-xl border border-[#e2ddd2] bg-[#fcfbf8] p-5 shadow-[0_1px_2px_rgba(25,24,22,0.03)] md:p-6">
              <div className="mb-4 flex items-baseline justify-between border-b border-[#ebe6dc] pb-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono-tabular text-xs font-medium text-[#c96442]">
                    02
                  </span>
                  <h2 className="font-serif-editorial text-lg font-medium text-[#191816]">
                    Pihak yang Terlibat
                  </h2>
                </div>
                <span className="text-xs text-[#8c877b]">
                  Pengirim &amp; penerima
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="invoice-label text-[#c96442]">
                    Penerbit (Dari)
                  </p>
                  <label className="field-label">
                    Nama usaha / individu
                    <input
                      value={seller}
                      onChange={(e) => setSeller(e.target.value)}
                      className="field-input mt-1"
                    />
                  </label>
                  <label className="field-label">
                    Alamat
                    <input
                      value={sellerAddress}
                      onChange={(e) => setSellerAddress(e.target.value)}
                      className="field-input mt-1"
                    />
                  </label>
                  <div className="grid gap-3 min-[520px]:grid-cols-2 sm:grid-cols-1 lg:grid-cols-2">
                    <label className="field-label">
                      Surel
                      <input
                        type="email"
                        value={sellerEmail}
                        onChange={(e) => setSellerEmail(e.target.value)}
                        className="field-input mt-1"
                      />
                    </label>
                    <label className="field-label">
                      Telepon
                      <input
                        type="tel"
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value)}
                        className="field-input mt-1"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="invoice-label text-[#c96442]">
                    Tertuju (Kepada)
                  </p>
                  <label className="field-label">
                    Nama klien / perusahaan
                    <input
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="field-input mt-1"
                    />
                  </label>
                  <label className="field-label">
                    Alamat
                    <input
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="field-input mt-1"
                    />
                  </label>
                  <label className="field-label">
                    Kontak / u.p.
                    <input
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      className="field-input mt-1"
                    />
                  </label>
                  <label className="field-label">
                    Surel
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="field-input mt-1"
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* 03: Rincian Layanan */}
            <section className="rounded-xl border border-[#e2ddd2] bg-[#fcfbf8] p-5 shadow-[0_1px_2px_rgba(25,24,22,0.03)] md:p-6">
              <div className="mb-4 flex items-baseline justify-between border-b border-[#ebe6dc] pb-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono-tabular text-xs font-medium text-[#c96442]">
                    03
                  </span>
                  <h2 className="font-serif-editorial text-lg font-medium text-[#191816]">
                    Rincian Pekerjaan &amp; Layanan
                  </h2>
                </div>
                <span className="font-mono-tabular text-xs text-[#8c877b]">
                  {items.length} baris
                </span>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[#e6e1d6] bg-[#f7f5ef] p-3.5 transition hover:border-[#d5cfc2]"
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular text-[11px] font-medium text-[#7d786d]">
                          № {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[#d5cfc2]">·</span>
                        <span className="font-mono-tabular text-xs text-[#5c584f]">
                          {money(item.qty * item.price)}
                        </span>
                      </div>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded p-1 text-[#8c877b] transition hover:bg-[#ebe5d8] hover:text-[#b54434]"
                          aria-label="Hapus item"
                        >
                          <Trash2 size={14} strokeWidth={1.6} />
                        </button>
                      )}
                    </div>

                    <input
                      value={item.name}
                      onChange={(e) =>
                        updateItem(item.id, 'name', e.target.value)
                      }
                      placeholder="Deskripsi produk atau layanan…"
                      className="field-input mb-3"
                      aria-label="Nama produk atau jasa"
                    />

                    <div className="grid grid-cols-[.65fr_1.35fr] gap-3">
                      <label className="field-label">
                        Kuantitas
                        <input
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(item.id, 'qty', Number(e.target.value))
                          }
                          type="number"
                          className="field-input font-mono-tabular mt-1 text-[13px]"
                        />
                      </label>
                      <label className="field-label">
                        Harga satuan (Rp)
                        <input
                          min="0"
                          inputMode="numeric"
                          value={formatAmount(item.price)}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'price',
                              Number(e.target.value.replace(/\D/g, '') || 0),
                            )
                          }
                          type="text"
                          placeholder="0"
                          className="field-input font-mono-tabular mt-1 text-[13px]"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addItem}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#cfc8b8] bg-[#f8f6f0] py-2.5 text-xs font-medium text-[#5c584f] transition hover:border-[#c96442] hover:bg-[#f3efe6] hover:text-[#191816]"
              >
                <Plus size={14} strokeWidth={1.8} />
                <span>Tambah baris rincian</span>
              </button>
            </section>

            {/* 04: Pembayaran */}
            <section className="rounded-xl border border-[#e2ddd2] bg-[#fcfbf8] p-5 shadow-[0_1px_2px_rgba(25,24,22,0.03)] md:p-6">
              <div className="mb-4 flex items-baseline justify-between border-b border-[#ebe6dc] pb-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono-tabular text-xs font-medium text-[#c96442]">
                    04
                  </span>
                  <h2 className="font-serif-editorial text-lg font-medium text-[#191816]">
                    Instruksi Pembayaran
                  </h2>
                </div>
                <span className="text-xs text-[#8c877b]">
                  Rekening &amp; QRIS
                </span>
              </div>

              <div className="space-y-3">
                <label className="field-label">
                  Bank / metode pembayaran
                  <input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="field-input mt-1"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="field-label">
                    Atas nama pemilik
                    <input
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="field-input mt-1"
                    />
                  </label>
                  <label className="field-label">
                    Nomor rekening
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="field-input font-mono-tabular mt-1 text-[13px]"
                    />
                  </label>
                </div>

                <div className="mt-2 rounded-lg border border-dashed border-[#d5cfc2] bg-[#f7f5ef] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#191816]">
                        Kode QRIS (Opsional)
                      </p>
                      <p className="mt-0.5 text-xs text-[#7d786d]">
                        Sertakan gambar kode QRIS pada lembar tagihan.
                      </p>
                    </div>
                    <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-[#d5cfc2] bg-[#fcfbf8] px-3 py-1.5 text-xs font-medium text-[#191816] transition hover:bg-[#ede8dd]">
                      <Upload size={13} strokeWidth={1.6} />
                      <span>{qrisImage ? 'Ganti' : 'Unggah'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(e) => handleQrisUpload(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  {qrisImage && (
                    <div className="mt-3 flex items-center gap-3 border-t border-[#e6e1d6] pt-3">
                      <img
                        src={qrisImage}
                        alt="QRIS yang diunggah"
                        className="size-14 rounded border border-[#dcd6c8] bg-white object-contain p-1"
                      />
                      <button
                        type="button"
                        onClick={() => setQrisImage(null)}
                        className="text-xs font-medium text-[#b54434] hover:underline"
                      >
                        Hapus lampiran QRIS
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 05: Potongan & Catatan */}
            <section className="rounded-xl border border-[#e2ddd2] bg-[#fcfbf8] p-5 shadow-[0_1px_2px_rgba(25,24,22,0.03)] md:p-6">
              <div className="mb-4 flex items-baseline justify-between border-b border-[#ebe6dc] pb-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono-tabular text-xs font-medium text-[#c96442]">
                    05
                  </span>
                  <h2 className="font-serif-editorial text-lg font-medium text-[#191816]">
                    Potongan &amp; Catatan
                  </h2>
                </div>
                <div className="flex items-center overflow-hidden rounded-md border border-[#d5cfc2] bg-white">
                  <button
                    onClick={() => setDiscount((d) => Math.max(0, d - 5))}
                    className="px-2 py-1 text-[#5c584f] transition hover:bg-[#efeae0]"
                    aria-label="Kurangi diskon"
                  >
                    <Minus size={13} strokeWidth={1.8} />
                  </button>
                  <span className="font-mono-tabular min-w-11 border-x border-[#e6e1d6] px-2 py-1 text-center text-xs font-medium text-[#191816]">
                    {discount}%
                  </span>
                  <button
                    onClick={() => setDiscount((d) => Math.min(100, d + 5))}
                    className="px-2 py-1 text-[#5c584f] transition hover:bg-[#efeae0]"
                    aria-label="Tambah diskon"
                  >
                    <Plus size={13} strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              <label className="field-label">
                Catatan kaki untuk klien
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="field-input mt-1.5 min-h-20 resize-y leading-relaxed"
                />
              </label>
            </section>
          </aside>

          {/* RIGHT INVOICE PAPER PREVIEW */}
          <section
            ref={invoiceRef}
            className="invoice-paper overflow-hidden rounded-lg border border-[#ded9ce] bg-white text-[#191816] shadow-[0_12px_40px_-15px_rgba(25,24,22,0.10)]"
          >
            {/* Top Editorial Accent Bar */}
            <div className="h-1.5 w-full bg-[#c96442]" />

            <div className="p-7 md:p-12">
              {/* Document Header */}
              <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[#191816] pb-8">
                <div>
                  <p className="invoice-label text-[#c96442]">
                    Dokumen Tagihan
                  </p>
                  <h2 className="font-serif-editorial mt-1.5 text-2xl font-medium tracking-[-0.02em] text-[#191816] md:text-3xl">
                    {seller || 'Nama Usaha Anda'}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[#6e6a61]">
                    {sellerAddress || 'Alamat usaha'} ·{' '}
                    {sellerEmail || 'email@usaha.id'}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="font-serif-editorial text-3xl italic font-normal tracking-[-0.02em] text-[#191816] md:text-4xl">
                    Invoice
                  </span>
                  <p className="font-mono-tabular mt-1 text-sm font-medium text-[#5c584f]">
                    № {invoiceNo || '—'}
                  </p>
                </div>
              </div>

              {/* Metadata Strip */}
              <div className="grid grid-cols-2 gap-4 border-b border-[#e6e1d6] py-4 sm:grid-cols-4">
                <div>
                  <p className="invoice-label">No. Referensi</p>
                  <p className="font-mono-tabular mt-1 text-xs font-medium text-[#191816]">
                    {invoiceNo || '—'}
                  </p>
                </div>
                <div>
                  <p className="invoice-label">Diterbitkan</p>
                  <p className="font-mono-tabular mt-1 text-xs text-[#3d3a34]">
                    9 September 2026
                  </p>
                </div>
                <div>
                  <p className="invoice-label">Jatuh Tempo</p>
                  <p className="font-mono-tabular mt-1 text-xs font-medium text-[#191816]">
                    {formatDateId(dueDate)}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="invoice-label">Status</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#c96442]">
                    <span className="size-1.5 rounded-full bg-[#c96442]" />
                    Menunggu Pembayaran
                  </p>
                </div>
              </div>

              {/* Parties */}
              <div className="grid gap-8 py-8 sm:grid-cols-2">
                <div>
                  <p className="invoice-label">Diterbitkan Oleh</p>
                  <h3 className="font-serif-editorial mt-2 text-lg font-medium text-[#191816]">
                    {seller || 'Nama usaha Anda'}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#5c584f]">
                    {sellerAddress || 'Alamat usaha'}
                    <br />
                    {sellerEmail || 'email@usaha.id'}
                    <br />
                    {sellerPhone || '+62 8xx xxxx xxxx'}
                  </p>
                </div>
                <div>
                  <p className="invoice-label">Ditagihkan Kepada</p>
                  <h3 className="font-serif-editorial mt-2 text-lg font-medium text-[#191816]">
                    {customer || 'Nama pelanggan'}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#5c584f]">
                    {customerContact || 'Nama PIC'}
                    <br />
                    {customerAddress || 'Alamat pelanggan'}
                    <br />
                    {customerEmail || 'email@pelanggan.id'}
                  </p>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="mt-2">
                <div className="grid grid-cols-[28px_minmax(0,1fr)_48px_110px_120px] gap-3 border-y border-[#191816] py-2.5">
                  <span className="invoice-label">No</span>
                  <span className="invoice-label">Deskripsi</span>
                  <span className="invoice-label text-center">Qty</span>
                  <span className="invoice-label text-right">Harga Satuan</span>
                  <span className="invoice-label text-right">Jumlah</span>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[28px_minmax(0,1fr)_48px_110px_120px] items-baseline gap-3 border-b border-[#ebe6dc] py-4 text-sm"
                  >
                    <span className="font-mono-tabular text-xs text-[#8c877b]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-medium leading-snug text-[#191816]">
                      {item.name || 'Produk atau jasa'}
                    </span>
                    <span className="font-mono-tabular text-center text-xs text-[#5c584f]">
                      {item.qty}
                    </span>
                    <span className="font-mono-tabular text-right text-xs text-[#5c584f]">
                      {money(item.price)}
                    </span>
                    <span className="font-mono-tabular text-right text-xs font-semibold text-[#191816]">
                      {money(item.qty * item.price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="ml-auto mt-6 max-w-xs space-y-2.5 text-sm">
                <div className="flex justify-between text-xs text-[#5c584f]">
                  <span>Subtotal</span>
                  <span className="font-mono-tabular">{money(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-[#c96442]">
                    <span>Potongan diskon ({discount}%)</span>
                    <span className="font-mono-tabular">
                      -{money(discountValue)}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-b-2 border-[#191816] py-3">
                  <span className="font-serif-editorial text-base font-medium text-[#191816]">
                    Total Tagihan
                  </span>
                  <strong className="font-mono-tabular text-xl font-semibold tracking-tight text-[#191816]">
                    {money(total)}
                  </strong>
                </div>
              </div>

              {/* Payment & QRIS Box */}
              <div className="mt-10 grid gap-5 rounded-lg border border-[#e6e1d6] bg-[#faf8f3] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="invoice-label text-[#c96442]">
                    Instruksi Pembayaran
                  </p>
                  <h3 className="font-serif-editorial mt-1.5 text-base font-medium text-[#191816]">
                    {bankName || 'Metode pembayaran'}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#5c584f]">
                    a.n. {accountHolder || 'Nama pemilik rekening'}
                  </p>
                  <div className="mt-2.5 inline-block rounded border border-[#ded8ca] bg-white px-3 py-1.5">
                    <span className="font-mono-tabular text-sm font-semibold tracking-wider text-[#191816]">
                      {accountNumber || 'Nomor rekening'}
                    </span>
                  </div>
                </div>

                {qrisImage && (
                  <div className="flex flex-col items-center">
                    <img
                      src={qrisImage}
                      alt="QRIS pembayaran"
                      className="size-[116px] rounded border border-[#ded8ca] bg-white object-contain p-1.5"
                    />
                    <span className="font-mono-tabular mt-1.5 text-[10px] uppercase tracking-widest text-[#7d786d]">
                      Pindai QRIS
                    </span>
                  </div>
                )}
              </div>

              {/* Editorial Footnote */}
              <div className="mt-8 flex flex-col justify-between gap-3 border-t border-[#ebe6dc] pt-5 sm:flex-row sm:items-center">
                <p className="font-serif-editorial text-sm italic leading-relaxed text-[#4a4740]">
                  “{note}”
                </p>
                <p className="font-mono-tabular shrink-0 text-[10px] uppercase tracking-[0.08em] text-[#8c877b]">
                  Sah tanpa tanda tangan basah
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
