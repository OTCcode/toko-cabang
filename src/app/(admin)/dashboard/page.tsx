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
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*, branch:branches(name)')
        .eq('id', authData.user.id)
        .single();

      if (!profile || profile.role !== 'branch_admin') {
        alert("Akses ditolak! Anda bukan Admin Cabang.");
        router.push('/');
        return;
      }

      setAdminData(profile);

      const { data: orderData } = await supabase
        .from('orders')
        .select('*, customer:users!customer_id(name, email)')
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
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'processing' } : o));
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--primary)' }}>
      <h2>Memuat Data Cabang...</h2>
    </div>
  );

  return (
    <div style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard Admin</h1>
          <p style={{ color: '#666', fontSize: '1.1rem', margin: '0.5rem 0 0 0' }}>
            Mengelola pesanan masuk untuk <strong style={{ color: 'var(--primary)' }}>{adminData.branch?.name || 'Cabang Anda'}</strong>
          </p>
        </div>
        <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600 }}>
          👤 {adminData.name}
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,123,0,0.05)', borderBottom: '2px solid rgba(255,123,0,0.2)' }}>
                <th style={{ padding: '1rem', color: 'var(--dark)', fontWeight: 600 }}>Tanggal</th>
                <th style={{ padding: '1rem', color: 'var(--dark)', fontWeight: 600 }}>Pembeli</th>
                <th style={{ padding: '1rem', color: 'var(--dark)', fontWeight: 600 }}>Metode</th>
                <th style={{ padding: '1rem', color: 'var(--dark)', fontWeight: 600 }}>Tagihan Validasi</th>
                <th style={{ padding: '1rem', color: 'var(--dark)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--dark)', fontWeight: 600, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)', transition: 'var(--transition)' }} className="table-row-hover">
                  <td style={{ padding: '1rem', color: '#555' }}>
                    {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--dark)' }}>{order.customer?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>{order.customer?.email}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      background: '#E3F2FD', color: '#1565C0', padding: '0.3rem 0.6rem', 
                      borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' 
                    }}>
                      {order.payment_method}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--secondary)' }}>
                      {formatRupiah(order.grand_total)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      Kode Unik: <strong style={{ color: 'red' }}>{order.payment_unique_code}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {order.status === 'waiting_payment' ? (
                      <span style={{ background: '#FFF3CD', color: '#856404', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-block' }}>
                        ⏳ Menunggu Bayar
                      </span>
                    ) : (
                      <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-block' }}>
                        ✅ Diproses
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {order.status === 'waiting_payment' ? (
                      <button 
                        onClick={() => handleVerifikasi(order.id)}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '6px' }}>
                        Verifikasi
                      </button>
                    ) : (
                      <span style={{ color: '#aaa', fontSize: '0.9rem' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
                    Belum ada pesanan yang masuk ke cabang ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover:hover { background: rgba(255, 123, 0, 0.05) !important; }
      `}} />
    </div>
  );
}
