import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Selamat Datang di E-Commerce Cabang</h1>
      <p style={{ marginBottom: '2rem' }}>Pilih menu di bawah ini untuk melihat kerangka halaman:</p>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/products" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: '#333' }}>
          <strong>🛒 Katalog Barang (Customer)</strong>
        </Link>
        <Link href="/dashboard" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: '#333' }}>
          <strong>📊 Dashboard (Admin Cabang)</strong>
        </Link>
        <Link href="/login" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: '#333' }}>
          <strong>🔐 Login</strong>
        </Link>
      </div>
    </div>
  );
}
