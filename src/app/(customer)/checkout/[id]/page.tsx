"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { calculateDistance, generateUniqueCode } from '@/lib/utils';
import Link from 'next/link';

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        alert("Silakan login terlebih dahulu!");
        router.push('/login');
        return;
      }
      setUser(authData.user);

      const { data: productData } = await supabase.from('products').select('*').eq('id', id).single();
      setProduct(productData);

      const { data: branchData } = await supabase.from('branches').select('*');
      setBranches(branchData || []);
      
      setLoading(false);
    }
    loadData();
  }, [id, router]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        alert("Lokasi berhasil didapatkan!");
      }, () => {
        alert("Gagal mendapatkan lokasi. Pastikan GPS aktif atau izin diberikan.");
      });
    } else {
      alert("Browser Anda tidak mendukung fitur lokasi.");
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lng) {
      alert("Silakan klik 'Ambil Lokasi Saat Ini' terlebih dahulu agar kami bisa mencari cabang terdekat!");
      return;
    }

    setProcessing(true);

    let closestBranch = branches[0];
    let minDistance = calculateDistance(lat, lng, branches[0].lat, branches[0].lng);

    for (let i = 1; i < branches.length; i++) {
      const distance = calculateDistance(lat, lng, branches[i].lat, branches[i].lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestBranch = branches[i];
      }
    }

    const uniqueCode = generateUniqueCode();
    const grandTotal = product.price + uniqueCode;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: user.id,
          branch_id: closestBranch.id,
          total_price: product.price,
          payment_method: paymentMethod,
          payment_unique_code: uniqueCode,
          grand_total: grandTotal,
          status: 'waiting_payment'
        }
      ])
      .select()
      .single();

    if (orderError) {
      alert("Terjadi kesalahan: " + orderError.message);
      setProcessing(false);
      return;
    }

    await supabase.from('user_locations').insert([
      {
        user_id: user.id,
        address_text: address,
        lat: lat,
        lng: lng,
        is_primary: true
      }
    ]);

    setSuccessData({
      orderId: orderData.id,
      branchName: closestBranch.name,
      distance: minDistance.toFixed(2),
      grandTotal: grandTotal
    });
    
    setProcessing(false);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--primary)' }}>
      <h2>Menyiapkan Halaman Checkout...</h2>
    </div>
  );
  
  if (!product) return <div style={{ padding: '2rem', textAlign: 'center' }}>Barang tidak ditemukan.</div>;

  if (successData) {
    return (
      <div style={{ paddingTop: '2rem', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Checkout Berhasil!</h1>
          
          <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', textAlign: 'left', marginBottom: '2rem' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              Pesanan Anda akan dikirim dari cabang terdekat: <br/>
              <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{successData.branchName}</strong> 
              <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: '0.5rem' }}>(Jarak: {successData.distance} km)</span>
            </p>
            <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '1.5rem 0' }}/>
            
            <h3 style={{ textAlign: 'center', color: '#555' }}>Total Tagihan:</h3>
            <h2 style={{ textAlign: 'center', color: 'var(--secondary)', fontSize: '2.5rem', margin: '0.5rem 0' }}>
              {formatRupiah(successData.grandTotal)}
            </h2>
            
            <div style={{ background: '#FFF3CD', color: '#856404', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', marginTop: '1.5rem', borderLeft: '4px solid #FFEBA8' }}>
              <strong>PENTING:</strong> Harap transfer TEPAT sesuai nominal di atas. Tiga digit terakhir (<strong>{successData.grandTotal.toString().slice(-3)}</strong>) adalah kode unik untuk mempercepat verifikasi otomatis.
            </div>
          </div>
          
          <Link href="/products" className="btn-primary" style={{ display: 'block', width: '100%' }}>
            Lanjut Belanja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '800px', width: '100%' }}>
        <h1 style={{ textAlign: 'center' }}>Selesaikan Pembelian</h1>
        
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,240,230,0.9) 100%)' }}>
          <div style={{ fontSize: '3rem', background: 'var(--light)', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            📦
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--dark)' }}>{product.name}</h3>
            <h2 style={{ margin: 0, color: 'var(--primary)' }}>{formatRupiah(product.price)}</h2>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem', color: 'var(--dark)' }}>Informasi Pengiriman</h3>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Alamat Lengkap (Beserta Patokan)</label>
            <textarea 
              required 
              className="input-field"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ minHeight: '100px', resize: 'vertical' }} 
              placeholder="Contoh: Jl. Sudirman No. 123, Pagar hitam sebelah warung..."
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lokasi Akurat (GPS)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={getLocation} 
                style={{ 
                  padding: '0.75rem 1.5rem', background: lat ? '#2E7D32' : 'var(--primary)', 
                  color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'var(--transition)'
                }}
              >
                {lat ? '✅ Lokasi Tersimpan' : '📍 Ambil Titik Lokasi'}
              </button>
              <span style={{ fontSize: '0.9rem', color: lat ? '#2E7D32' : '#666', background: lat ? '#E8F5E9' : '#eee', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                {lat ? `${lat.toFixed(5)}, ${lng?.toFixed(5)}` : 'Wajib diisi agar kami bisa mencari cabang terdekat'}
              </span>
            </div>
          </div>

          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginTop: '1rem', color: 'var(--dark)' }}>Metode Pembayaran</h3>
          
          <div>
            <select 
              className="input-field"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ fontWeight: 500, fontSize: '1.1rem', cursor: 'pointer' }}
            >
              <option value="transfer">🏦 Transfer Bank Otomatis</option>
              <option value="qris">📱 QRIS (Semua E-Wallet & Bank)</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={processing || !lat} 
            className="btn-primary"
            style={{ 
              width: '100%', padding: '1.2rem', marginTop: '1rem', fontSize: '1.2rem',
              background: (!lat) ? '#ccc' : 'linear-gradient(90deg, var(--secondary) 0%, #B71C1C 100%)',
              boxShadow: (!lat) ? 'none' : '0 4px 15px rgba(229, 57, 53, 0.4)'
            }}
          >
            {processing ? 'Sedang Mencari Cabang Terdekat...' : 'Bayar Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}
