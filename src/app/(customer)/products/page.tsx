"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url?: string;
  created_at?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
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

  // Filter & Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerSearch) || 
        (p.description && p.description.toLowerCase().includes(lowerSearch))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
        default:
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
      }
    });

    return result;
  }, [products, searchTerm, sortBy]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  return (
    <div style={{ paddingTop: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Eksplorasi Produk Kami</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Temukan barang favorit Anda dan kami kirim dari cabang terdekat.</p>
      </div>
      
      {/* Search & Sort Controls */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 300px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="🔍 Cari nama atau deskripsi barang..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ borderRadius: '20px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--dark)' }}>Urutkan:</span>
          <select 
            className="input-field" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: 'auto', cursor: 'pointer', borderRadius: '20px' }}
          >
            <option value="newest">✨ Terbaru</option>
            <option value="price-asc">💵 Harga: Termurah</option>
            <option value="price-desc">💎 Harga: Termahal</option>
            <option value="name-asc">🔤 Nama: A - Z</option>
            <option value="name-desc">🔠 Nama: Z - A</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary)' }}>
          <h2>Memuat Katalog...</h2>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '2rem', 
            paddingBottom: '4rem' 
          }}>
            {filteredAndSortedProducts.map((product) => (
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
                  border: '1px solid rgba(255,123,0,0.1)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <span>🛍️</span>
                  )}
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
            
          </div>
          {filteredAndSortedProducts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius)' }}>
              <h3 style={{ color: 'var(--secondary)' }}>Tidak ada barang yang sesuai dengan pencarian Anda.</h3>
            </div>
          )}
        </>
      )}
    </div>
  );
}
