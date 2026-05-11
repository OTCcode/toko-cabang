"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Tipe data untuk TypeScript
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (data) {
        setProducts(data);
      }
      setLoading(false);
    }
    
    fetchProducts();
  }, []);

  // Format angka ke mata uang Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Katalog Barang</h1>
      <p>Pilih barang dari database Supabase secara real-time.</p>
      
      {loading ? (
        <p>Memuat data barang...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {products.map((product) => (
            <div key={product.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
              <h3>{product.name}</h3>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>{product.description}</p>
              <h4 style={{ color: '#0070f3' }}>{formatRupiah(product.price)}</h4>
              <button 
                onClick={() => router.push(`/checkout/${product.id}`)}
                style={{ width: '100%', padding: '0.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}>
                Beli / Checkout
              </button>
            </div>
          ))}
          
          {products.length === 0 && (
            <p style={{ color: 'red' }}>Belum ada barang di database.</p>
          )}
        </div>
      )}
    </div>
  );
}
