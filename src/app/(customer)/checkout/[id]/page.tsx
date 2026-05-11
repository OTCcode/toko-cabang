"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { calculateDistance, generateUniqueCode } from '@/lib/utils';

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
      // 1. Dapatkan user yang login
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        alert("Silakan login terlebih dahulu!");
        router.push('/login');
        return;
      }
      setUser(authData.user);

      // 2. Dapatkan detail barang
      const { data: productData } = await supabase.from('products').select('*').eq('id', id).single();
      setProduct(productData);

      // 3. Dapatkan daftar cabang
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

    // Cari cabang terdekat menggunakan fungsi Haversine
    let closestBranch = branches[0];
    let minDistance = calculateDistance(lat, lng, branches[0].lat, branches[0].lng);

    for (let i = 1; i < branches.length; i++) {
      const distance = calculateDistance(lat, lng, branches[i].lat, branches[i].lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestBranch = branches[i];
      }
    }

    // Buat kode unik dan hitung total
    const uniqueCode = generateUniqueCode();
    const grandTotal = product.price + uniqueCode;

    // Simpan ke tabel orders
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

    // Simpan lokasi ke user_locations
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

  if (loading) return <div style={{ padding: '2rem' }}>Memuat data checkout...</div>;
  if (!product) return <div style={{ padding: '2rem' }}>Barang tidak ditemukan.</div>;

  if (successData) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto', textAlign: 'center' }}>
        <h1 style={{ color: 'green' }}>✅ Checkout Berhasil!</h1>
        <div style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem', textAlign: 'left' }}>
          <p><strong>Pesanan Anda ditugaskan ke:</strong> {successData.branchName} (Jarak: {successData.distance} km)</p>
          <hr style={{ margin: '1rem 0' }}/>
          <h3 style={{ textAlign: 'center' }}>Total yang harus dibayar:</h3>
          <h2 style={{ textAlign: 'center', color: '#0070f3' }}>
            Rp {successData.grandTotal.toLocaleString('id-ID')}
          </h2>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
            *Harap transfer tepat sesuai nominal di atas (termasuk 3 digit terakhir) agar pembayaran terverifikasi otomatis.
          </p>
          <button onClick={() => router.push('/products')} style={{ width: '100%', padding: '0.8rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}>
            Kembali ke Katalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h1>Checkout</h1>
      
      <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <h3>Ringkasan Pesanan</h3>
        <p><strong>Barang:</strong> {product.name}</p>
        <p><strong>Harga:</strong> Rp {product.price.toLocaleString('id-ID')}</p>
      </div>

      <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Alamat Lengkap Pengiriman:</label>
          <textarea 
            required 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', minHeight: '80px', marginTop: '0.5rem' }} 
            placeholder="Ketik alamat lengkap Anda di sini..."
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold' }}>Titik Lokasi (Untuk Hitung Jarak):</label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
            <button type="button" onClick={getLocation} style={{ padding: '0.5rem 1rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              📍 Ambil Lokasi Saat Ini (GPS)
            </button>
            <span style={{ fontSize: '0.9rem', color: lat ? 'green' : 'red' }}>
              {lat ? `Tersimpan: ${lat.toFixed(4)}, ${lng?.toFixed(4)}` : 'Belum ada lokasi'}
            </span>
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 'bold' }}>Metode Pembayaran:</label>
          <select 
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          >
            <option value="transfer">Transfer Bank</option>
            <option value="qris">QRIS (Scan)</option>
          </select>
        </div>

        <button type="submit" disabled={processing} style={{ width: '100%', padding: '1rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
          {processing ? 'Memproses Pesanan...' : 'Proses Pembayaran'}
        </button>
      </form>
    </div>
  );
}
