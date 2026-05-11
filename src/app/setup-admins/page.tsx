"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SetupAdminsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const handleSetup = async () => {
    setLoading(true);
    addLog("Memulai proses generate akun admin...");

    // 1. Ambil semua cabang dari database
    const { data: branches, error: branchError } = await supabase.from('branches').select('*');
    
    if (branchError || !branches) {
      addLog(`❌ Error mengambil cabang: ${branchError?.message}`);
      setLoading(false);
      return;
    }

    addLog(`✅ Ditemukan ${branches.length} cabang. Memproses pembuatan akun...`);

    // 2. Loop dan buat akun untuk setiap cabang
    for (const branch of branches) {
      // Format email: admin.[nama_cabang_tanpa_spasi]@toko.com
      const branchSlug = branch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `admin.${branchSlug}@toko.com`;
      const password = '123456';
      
      addLog(`Mencoba membuat akun untuk ${branch.name} (${email})...`);

      // Buat akun Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        addLog(`⚠️ Gagal buat auth ${email}: ${authError.message}`);
        continue;
      }

      if (authData.user) {
        // Update role & branch_id di tabel users (profile otomatis dibuat oleh trigger/kode register sebelumnya)
        // Jika profile belum dibuat oleh auth, kita insert. Jika sudah, kita update.
        // Lebih aman pakai UPSERT
        const { error: dbError } = await supabase.from('users').upsert([
          {
            id: authData.user.id,
            email: email,
            name: `Admin ${branch.name}`,
            role: 'branch_admin',
            branch_id: branch.id
          }
        ]);

        if (dbError) {
          addLog(`❌ Gagal update profil ${email}: ${dbError.message}`);
        } else {
          addLog(`✅ Sukses: Akun ${email} berhasil diatur sebagai admin ${branch.name}`);
        }
      }
    }

    addLog("🎉 Proses selesai! Silakan hapus halaman ini jika sudah tidak digunakan.");
    setLoading(false);
  };

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Generator Akun Admin Cabang</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Halaman khusus untuk men-generate email & password secara otomatis berdasarkan cabang yang ada di database.
      </p>
      
      <button 
        onClick={handleSetup} 
        disabled={loading}
        className="btn-primary" 
        style={{ padding: '1rem 2rem', fontSize: '1.2rem', marginBottom: '2rem' }}
      >
        {loading ? 'Memproses...' : '🚀 Generate Akun Sekarang'}
      </button>

      <div className="glass-card" style={{ background: '#222', color: '#0f0', fontFamily: 'monospace', minHeight: '300px' }}>
        <h3 style={{ color: '#fff', borderBottom: '1px solid #444', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Terminal Log:</h3>
        {logs.map((log, index) => (
          <div key={index} style={{ marginBottom: '0.5rem' }}>{log}</div>
        ))}
        {logs.length === 0 && <div style={{ color: '#888' }}>Menunggu aksi...</div>}
      </div>
      
      {logs.length > 0 && !loading && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button onClick={() => router.push('/login')} className="btn-primary" style={{ background: 'var(--dark)' }}>
            Pergi ke Halaman Login
          </button>
        </div>
      )}
    </div>
  );
}
