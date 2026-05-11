"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          { 
            id: authData.user.id,
            email: email, 
            name: name,
            role: 'customer'
          }
        ]);

      if (dbError) {
        setError("Gagal menyimpan profil: " + dbError.message);
        setLoading(false);
        return;
      }
    }

    setSuccess(true);
    setLoading(false);
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 150px)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary)' }}>Daftar Akun Baru</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>Bergabunglah dengan CabangKu</p>
        
        {error && (
          <div style={{ background: '#FFEBEB', color: 'var(--secondary)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            Pendaftaran berhasil! Mengalihkan...
          </div>
        )}
        
        {!success && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Nama Lengkap</label>
              <input 
                type="text" 
                className="input-field"
                placeholder="Budi Santoso" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Email</label>
              <input 
                type="email" 
                className="input-field"
                placeholder="nama@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Password</label>
              <input 
                type="password" 
                className="input-field"
                placeholder="Minimal 6 karakter" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </button>
          </form>
        )}
        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.95rem' }}>
          Sudah punya akun? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Login di sini</Link>
        </p>
      </div>
    </div>
  );
}
