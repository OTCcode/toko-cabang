"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Cek role user dari tabel public.users
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('email', email)
      .single();

    setLoading(false);
    
    if (userData?.role === 'branch_admin') {
      router.push('/dashboard');
    } else {
      router.push('/products');
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Login</h1>
      <p>Masuk ke akun Anda.</p>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: 'auto' }}>
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
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '0.5rem' }} 
        />
        <button type="submit" disabled={loading} style={{ padding: '0.5rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Belum punya akun? <Link href="/register">Daftar di sini</Link>
      </p>
    </div>
  );
}
