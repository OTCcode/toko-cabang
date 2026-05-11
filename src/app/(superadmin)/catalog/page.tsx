"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SuperAdminCatalog() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Search & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    async function loadPage() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!profile || profile.role !== 'super_admin') {
        alert("Akses ditolak! Halaman ini khusus Super Admin Pusat.");
        router.push('/');
        return;
      }
      setUser(profile);

      fetchProducts();
    }
    loadPage();
  }, [router]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setDescription(product.description || '');
    setCurrentImageUrl(product.image_url || '');
    setImageFile(null);
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setDescription('');
    setCurrentImageUrl('');
    setImageFile(null);
    setMessage('');
  };

  const handleDelete = async (id: string, productName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${productName}"?`)) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    try {
      let finalImageUrl = currentImageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      } else if (!editingId) {
        throw new Error("Pilih gambar produk terlebih dahulu!");
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name,
            price: parseFloat(price),
            description,
            image_url: finalImageUrl,
          })
          .eq('id', editingId);

        if (updateError) throw updateError;
        setMessage("✅ Produk berhasil diperbarui!");
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert([
            {
              name,
              price: parseFloat(price),
              description,
              image_url: finalImageUrl,
              stock: 100
            }
          ]);

        if (insertError) throw insertError;
        setMessage("✅ Produk baru berhasil ditambahkan!");
      }

      handleCancelEdit();
      fetchProducts();
      
      const fileInput = document.getElementById('imageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerSearch) || 
        (p.description && p.description.toLowerCase().includes(lowerSearch))
      );
    }

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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memverifikasi Akses & Memuat Data...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Manajemen Katalog Pusat</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Selamat datang, {user?.name}. Anda dapat menambah, mengedit, atau menghapus produk.
      </p>

      {/* FORM AREA */}
      <div className="glass-card" style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary)', margin: 0 }}>
            {editingId ? '✏️ Edit Produk' : '➕ Tambah Barang Baru'}
          </h3>
          {editingId && (
            <button onClick={handleCancelEdit} style={{ background: '#eee', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
              Batal Edit
            </button>
          )}
        </div>
        
        {message && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: message.includes('✅') ? '#E8F5E9' : '#FFEBEB', color: message.includes('✅') ? '#2E7D32' : 'var(--secondary)' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nama Barang</label>
              <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Harga (Rp)</label>
              <input type="number" className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Deskripsi Singkat</label>
              <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ minHeight: '100px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Foto Barang</label>
            <div style={{ border: '2px dashed #ccc', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', background: 'rgba(255,255,255,0.5)', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              
              {editingId && currentImageUrl && !imageFile && (
                <div style={{ marginBottom: '1rem' }}>
                  <img src={currentImageUrl} alt="Current" style={{ height: '100px', objectFit: 'contain', borderRadius: '8px' }} />
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Foto saat ini. Upload file baru jika ingin mengganti.</p>
                </div>
              )}

              <input 
                id="imageInput"
                type="file" 
                accept="image/*" 
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} 
                required={!editingId}
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '1rem' }}>Pilih gambar JPG, PNG, atau WEBP</p>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn-primary" disabled={uploading} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              {uploading ? 'Memproses...' : (editingId ? 'Simpan Perubahan' : 'Upload Produk')}
            </button>
          </div>
        </form>
      </div>

      {/* TABLE AREA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>Daftar Katalog Saat Ini</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="🔍 Cari produk..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem 1rem', width: '200px' }}
          />
          <select 
            className="input-field" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '0.5rem 1rem', width: 'auto', cursor: 'pointer' }}
          >
            <option value="newest">Terbaru</option>
            <option value="price-asc">Termurah</option>
            <option value="price-desc">Termahal</option>
            <option value="name-asc">A - Z</option>
            <option value="name-desc">Z - A</option>
          </select>
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '1rem' }}>Foto</th>
              <th style={{ padding: '1rem' }}>Nama Produk</th>
              <th style={{ padding: '1rem' }}>Harga</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProducts.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '50px', height: '50px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                  )}
                </td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{product.name}</td>
                <td style={{ padding: '1rem', color: 'var(--primary)' }}>
                  Rp {product.price.toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button onClick={() => handleEditClick(product)} style={{ background: '#E3F2FD', color: '#1565C0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontWeight: 600 }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(product.id, product.name)} style={{ background: '#FFEBEB', color: 'var(--secondary)', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {filteredAndSortedProducts.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Tidak ada produk yang sesuai.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
