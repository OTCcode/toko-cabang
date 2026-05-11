import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Selamat Datang di CabangKu</h1>
        <p style={{ fontSize: '1.2rem', color: '#555', marginBottom: '3rem', lineHeight: '1.6' }}>
          Platform e-commerce pintar yang menghubungkan Anda dengan kantor cabang terdekat secara otomatis untuk pengiriman tercepat.
        </p>
        
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/products" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            🛍️ Mulai Belanja
          </Link>
          <Link href="/dashboard" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: '#333', color: 'white' }}>
            📊 Dashboard Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
