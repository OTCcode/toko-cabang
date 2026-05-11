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

    // 1. Daftar ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Simpan profil ke tabel public.users
    if (authData.user) {
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          { 
            id: authData.user.id, // Samakan ID agar sinkron
            email: email, 
            name: name,
            role: 'customer' // Default role
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
    
    // Redirect otomatis setelah 2 detik
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Mendaftar Akun</h1>
      <p>Buat akun pembeli Anda.</p>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Pendaftaran berhasil! Mengalihkan ke halaman login...</p>}
      
      {!success && (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: 'auto' }}>
          <input 
            type="text" 
            placeholder="Nama Lengkap" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ padding: '0.5rem' }} 
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '0.5rem' }} 
          />
          <input 
            type="password" 
            placeholder="Password (min 6 karakter)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ padding: '0.5rem' }} 
          />
          <button type="submit" disabled={loading} style={{ padding: '0.5rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>
      )}
      <p style={{ marginTop: '1rem' }}>
        Sudah punya akun? <Link href="/login">Login di sini</Link>
      </p>
    </div>
  );
}
