"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      // Cek login
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/login');
        return;
      }

      // Ambil profil admin
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!profile || profile.role !== 'branch_admin') {
        alert("Akses ditolak! Anda bukan Admin Cabang.");
        router.push('/');
        return;
      }

      setAdminData(profile);

      // Ambil pesanan yang masuk khusus ke cabang admin ini
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, customer:users!customer_id(name, email)') // Mengambil relasi nama pembeli
        .eq('branch_id', profile.branch_id)
        .order('created_at', { ascending: false });

      setOrders(orderData || []);
      setLoading(false);
    }
    loadAdminData();
  }, [router]);

  const handleVerifikasi = async (orderId: string) => {
    if (confirm("Apakah Anda yakin uang sudah masuk sesuai nominal unik dan pesanan akan diproses?")) {
      await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', orderId);
      
      // Refresh data
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'processing' } : o));
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Memuat Dashboard...</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Dashboard Admin Cabang</h1>
      <p>Selamat datang, <strong>{adminData.name}</strong>. Anda mengelola pesanan khusus untuk cabang Anda.</p>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tanggal</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Pembeli</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Metode</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Kode Pembayaran</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Total Bayar (Validasi)</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {new Date(order.created_at).toLocaleDateString('id-ID')}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {order.customer?.name} ({order.customer?.email})
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textTransform: 'uppercase' }}>
                {order.payment_method}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', color: 'red', fontWeight: 'bold' }}>
                {order.payment_unique_code}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                Rp {order.grand_total.toLocaleString('id-ID')}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem',
                  background: order.status === 'waiting_payment' ? '#fff3cd' : '#d4edda',
                  color: order.status === 'waiting_payment' ? '#856404' : '#155724'
                }}>
                  {order.status === 'waiting_payment' ? 'Menunggu Pembayaran' : 'Diproses'}
                </span>
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {order.status === 'waiting_payment' && (
                  <button 
                    onClick={() => handleVerifikasi(order.id)}
                    style={{ background: '#0070f3', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    Verifikasi Pembayaran
                  </button>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={7} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                Belum ada pesanan masuk ke cabang ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

