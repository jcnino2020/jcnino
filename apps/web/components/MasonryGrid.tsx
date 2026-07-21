'use client';

import React, { useState, useEffect } from 'react';

interface Asset {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  s3Url: string;
  optimizedUrl: string;
  width: number;
  height: number;
  aiTags: string[];
}

export default function MasonryGrid({ collectionId }: { collectionId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assets?collectionId=${collectionId}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [collectionId, search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const presignRes = await fetch('/api/assets/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            collectionId,
          }),
        });
        
        if (!presignRes.ok) throw new Error('Failed to fetch pre-signed upload URL');
        const { uploadUrl, publicUrl, fileId } = await presignRes.json();
        
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        
        if (!uploadRes.ok) throw new Error('Direct file upload failed');
        
        const saveRes = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: fileId,
            filename: file.name,
            size: file.size,
            mimeType: file.type,
            collectionId,
            width: 1200,
            height: 800,
            s3Url: publicUrl,
            optimizedUrl: publicUrl,
            aiTags: ['uploaded', 'media'],
          }),
        });
        
        if (!saveRes.ok) throw new Error('Failed to save asset metadata');
      }
      
      fetchAssets();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search by filename or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-all w-full max-w-sm"
        />
        
        <label className="relative flex items-center justify-center gap-2 px-6 py-3 border border-transparent bg-white text-black font-bold text-sm rounded-full cursor-pointer hover:bg-opacity-90 transition-all shadow-lg select-none leading-none">
          {uploading ? 'Uploading...' : 'Upload Assets'}
          <input
            type="file"
            multiple
            disabled={uploading}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/2] bg-zinc-900 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center p-12 bg-zinc-950 border border-white/5 rounded-2xl">
          <p className="text-zinc-500 text-sm">No creative assets found in this collection.</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-4 gap-4 space-y-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="break-inside-avoid relative group rounded-xl overflow-hidden border border-white/5 bg-zinc-950 hover:border-white/20 transition-all duration-300"
            >
              <img
                src={asset.optimizedUrl}
                alt={asset.filename}
                className="w-full h-auto block transform group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-xs font-bold text-white truncate">{asset.filename}</p>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {(asset.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {asset.aiTags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[8px] bg-white/10 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
