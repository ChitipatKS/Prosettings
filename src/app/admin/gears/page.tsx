'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Product = {
  id: number;
  name: string;
  category: string;
  product_type: 'gear' | 'hardware';
  image_url: string | null;
  shopee_url: string | null;
  lazada_url: string | null;
  amazon_url: string | null;
  estimated_price_thb: number | null;
};

const CATEGORIES = [
  { name: 'Mouse', value: 'mouse', type: 'gear' },
  { name: 'Keyboard', value: 'keyboard', type: 'gear' },
  { name: 'Mousepad', value: 'mousepad', type: 'gear' },
  { name: 'Headset', value: 'headset', type: 'gear' },
  { name: 'Monitor', value: 'monitor', type: 'hardware' },
  { name: 'GPU (Graphics Card)', value: 'gpu', type: 'hardware' },
  { name: 'CPU (Processor)', value: 'cpu', type: 'hardware' },
  { name: 'RAM', value: 'ram', type: 'hardware' },
  { name: 'Motherboard', value: 'motherboard', type: 'hardware' },
  { name: 'SSD / Storage', value: 'ssd', type: 'hardware' },
  { name: 'PSU (Power Supply)', value: 'psu', type: 'hardware' },
  { name: 'Case', value: 'case', type: 'hardware' }
];

export default function AdminGearsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form / Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Inputs
  const [name, setName] = useState('');
  const [category, setCategory] = useState('mouse');
  const [productType, setProductType] = useState<'gear' | 'hardware'>('gear');
  const [imageUrl, setImageUrl] = useState('');
  const [shopeeUrl, setShopeeUrl] = useState('');
  const [lazadaUrl, setLazadaUrl] = useState('');
  const [amazonUrl, setAmazonUrl] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');

  // Image Upload State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadProducts() {
    try {
      setLoading(true);
      let query = supabase.from('products').select('*');

      if (search.trim()) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      if (data) setProducts(data as Product[]);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('add') === 'true') {
        setTimeout(() => {
          openModal(null);
        }, 150);
      }
    }
  }, []);

  // Handle Category Change (adjust product_type automatically)
  const handleCategoryChange = (val: string) => {
    setCategory(val);
    const catObj = CATEGORIES.find(c => c.value === val);
    if (catObj) {
      setProductType(catObj.type as 'gear' | 'hardware');
    }
  };

  const openModal = (product: Product | null = null) => {
    setErrorMsg(null);
    if (product) {
      setEditProduct(product);
      setName(product.name);
      setCategory(product.category);
      setProductType(product.product_type);
      setImageUrl(product.image_url || '');
      setShopeeUrl(product.shopee_url || '');
      setLazadaUrl(product.lazada_url || '');
      setAmazonUrl(product.amazon_url || '');
      setEstimatedPrice(product.estimated_price_thb?.toString() || '');
    } else {
      setEditProduct(null);
      setName('');
      setCategory('mouse');
      setProductType('gear');
      setImageUrl('');
      setShopeeUrl('');
      setLazadaUrl('');
      setAmazonUrl('');
      setEstimatedPrice('');
    }
    setIsOpen(true);
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Upload Gear Image to Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `gear-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('player-profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('player-profiles')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const productPayload = {
      name: name.trim(),
      category,
      product_type: productType,
      image_url: imageUrl.trim() || null,
      shopee_url: shopeeUrl.trim() || null,
      lazada_url: lazadaUrl.trim() || null,
      amazon_url: amazonUrl.trim() || null,
      estimated_price_thb: parseFloat(estimatedPrice) || null
    };

    try {
      if (editProduct) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editProduct.id);

        if (error) throw error;
      } else {
        // Insert new product
        const { error } = await supabase
          .from('products')
          .insert(productPayload);

        if (error) throw error;
      }

      setIsOpen(false);
      loadProducts();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number, productName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete product "${productName}"? This will remove references in player profiles!`);
    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      // Delete references in player_products
      await supabase.from('player_products').delete().eq('product_id', id);

      // Delete from products table
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      loadProducts();
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Manage <span className="text-accent">Gears & Hardware</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create, update, and edit gaming peripherals and specs for player configuration selections.
          </p>
        </div>
        <button
          onClick={() => openModal(null)}
          className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-accent-fg font-bold text-xs font-sans rounded-xl tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-98 cursor-pointer"
        >
          + Add New Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#12121A]/70 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by brand, model..."
            className="w-full h-10 bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent transition-all font-mono"
          />
        </div>
      </div>

      {/* Product List Table */}
      {loading && products.length === 0 ? (
        <div className="flex-1 w-full min-h-[30vh] flex flex-col justify-center items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
          <span className="text-zinc-500 text-xs font-mono">Loading product list...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-[#12121A]/40 border border-dashed border-zinc-800/80 p-12 text-center rounded-2xl">
          <p className="text-sm text-zinc-500 font-mono italic">No gear products found matching your query.</p>
        </div>
      ) : (
        <div className="bg-[#12121A]/40 border border-zinc-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/30 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                  <th className="px-6 py-4">Product details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Price (THB)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain" />
                          ) : (
                            <span className="text-sm">🖱️</span>
                          )}
                        </div>
                        <span className="font-bold text-white text-xs">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono uppercase text-[10px] text-zinc-400">
                      {product.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono ${
                        product.product_type === 'gear'
                          ? 'bg-accent/10 text-accent border border-accent/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {product.product_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-400">
                      {product.estimated_price_thb ? `฿${product.estimated_price_thb.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openModal(product)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-300 transition-colors uppercase font-sans cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          disabled={deletingId === product.id}
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/50 rounded-lg text-[10px] font-bold text-red-400 transition-colors uppercase font-sans cursor-pointer disabled:opacity-50"
                        >
                          {deletingId === product.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal dialog overlay for Add/Edit product */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#12121A] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white font-display">
                {editProduct ? 'Edit Product details' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors text-lg font-mono p-1 leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-mono p-3 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Razer Viper V4 Pro White"
                  className="w-full h-10 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Category</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full h-10 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-accent transition-all font-mono cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Estimated Price (THB)</label>
                  <input
                    type="number"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    placeholder="e.g. 4990"
                    className="w-full h-10 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
                  />
                </div>
              </div>

              {/* Upload or URL for Gear Image */}
              <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-zinc-800/40">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block">Product Image Thumbnail</label>
                
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex items-center justify-center overflow-hidden shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Thumbnail Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs">📦</span>
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 h-8 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-[9px] font-bold uppercase tracking-wider font-mono rounded-lg border border-zinc-700 transition-all text-white cursor-pointer"
                    >
                      {uploading ? 'Uploading...' : 'Upload Image File'}
                    </button>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="px-3 h-8 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/50 rounded-lg text-[9px] font-bold text-red-400 uppercase tracking-wider font-mono cursor-pointer transition-all"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste direct image URL link"
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-[11px] text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Shopee Buy Link (Optional)</label>
                <input
                  type="text"
                  value={shopeeUrl}
                  onChange={(e) => setShopeeUrl(e.target.value)}
                  placeholder="https://shopee.co.th/..."
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-[11px] text-white placeholder-zinc-750 focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Lazada Buy Link (Optional)</label>
                <input
                  type="text"
                  value={lazadaUrl}
                  onChange={(e) => setLazadaUrl(e.target.value)}
                  placeholder="https://lazada.co.th/..."
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-[11px] text-white placeholder-zinc-750 focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Amazon Buy Link (Optional)</label>
                <input
                  type="text"
                  value={amazonUrl}
                  onChange={(e) => setAmazonUrl(e.target.value)}
                  placeholder="https://amazon.com/..."
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-[11px] text-white placeholder-zinc-750 focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-bold font-sans uppercase tracking-wider border border-zinc-800 bg-black/20 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-accent text-accent-fg hover:bg-accent/90 disabled:opacity-50 text-xs font-bold rounded-lg tracking-wider font-sans uppercase transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
