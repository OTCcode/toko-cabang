"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('*');
      
      if (data) {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  return (
    <div style={{ paddingTop: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Eksplorasi Produk Kami</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Temukan barang favorit Anda dan kami kirim dari cabang terdekat.</p>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary)' }}>
          <h2>Memuat Katalog...</h2>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '2rem', 
          paddingBottom: '4rem' 
        }}>
          {products.map((product) => (
            <div key={product.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              <div style={{ 
                height: '180px', 
                background: 'linear-gradient(135deg, #FFF0E6 0%, #FFEBEB 100%)', 
                borderRadius: '12px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                border: '1px solid rgba(255,123,0,0.1)'
              }}>
                🛍️
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--dark)' }}>{product.name}</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', flexGrow: 1, marginBottom: '1rem', lineHeight: '1.5' }}>
                {product.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <h4 style={{ color: 'var(--primary)', fontSize: '1.3rem', margin: 0 }}>
                  {formatRupiah(product.price)}
                </h4>
                <button 
                  onClick={() => router.push(`/checkout/${product.id}`)}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
                  Beli
                </button>
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius)' }}>
              <h3 style={{ color: 'var(--secondary)' }}>Belum ada barang di database.</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
