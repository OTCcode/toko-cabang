import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'E-Commerce Cabang',
  description: 'Sistem belanja pintar cabang terdekat',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <nav style={{ 
          background: 'var(--glass-bg)', 
          backdropFilter: 'blur(10px)',
          borderBottom: 'var(--glass-border)',
          position: 'sticky', 
          top: 0, 
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
                  width: '32px', height: '32px', borderRadius: '8px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '1.2rem'
                }}>
                  E
                </div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', background: 'none', WebkitTextFillColor: 'var(--dark)' }}>
                  Cabang<span style={{ color: 'var(--primary)' }}>Ku</span>
                </h2>
              </div>
            </Link>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <Link href="/products" style={{ textDecoration: 'none', color: 'var(--dark)', fontWeight: 500 }}>
                Katalog
              </Link>
              <Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--dark)', fontWeight: 500 }}>
                Dashboard
              </Link>
              <Link href="/login" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                Login
              </Link>
            </div>
          </div>
        </nav>
        
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
