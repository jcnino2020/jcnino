'use client';

import React, { useState, useEffect } from 'react';

interface Metrics {
  totalWorkspaces: number;
  totalUsers: number;
  totalAssets: number;
  storageUsedBytes: number;
  storageUsedFormatted: string;
}

interface SystemData {
  status: string;
  latency: string;
  metrics: Metrics;
  subsystems: {
    database: string;
    storage: string;
    redis: string;
  };
}

export default function SystemHealth() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-8 bg-zinc-900 rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-zinc-950 border border-white/5 rounded-2xl max-w-md mx-auto">
        <p className="text-sm text-red-400">Failed to load platform telemetry metrics. Please ensure you are logged in as a root administrator.</p>
      </div>
    );
  }

  const maxStorageBytes = 10 * 1024 * 1024 * 1024 * 1024;
  const storagePercentage = Math.min((data.metrics.storageUsedBytes / maxStorageBytes) * 100, 100);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-zinc-950 border border-white/5 rounded-2xl">
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Platform Core Status</p>
          <div className="flex items-center gap-3">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-snug">System: {data.status}</h2>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">API Latency</p>
          <p className="text-xl font-mono font-bold text-white mt-1">{data.latency}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Workspaces</p>
          <p className="text-2xl font-black text-white">{data.metrics.totalWorkspaces}</p>
        </div>
        <div className="p-5 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total Users</p>
          <p className="text-2xl font-black text-white">{data.metrics.totalUsers}</p>
        </div>
        <div className="p-5 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Uploaded Assets</p>
          <p className="text-2xl font-black text-white">{data.metrics.totalAssets}</p>
        </div>
        <div className="p-5 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Platform Volume</p>
          <p className="text-2xl font-black text-white truncate">{data.metrics.storageUsedFormatted}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Platform Storage Capacity</h3>
          <div className="relative h-3 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-zinc-500">
            <span>{storagePercentage.toFixed(3)}% Allocated</span>
            <span>Limit: 10.00 TB</span>
          </div>
        </div>

        <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Subsystems Connectivity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">PostgreSQL Core Database</span>
              <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">● {data.subsystems.database}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Cloudflare R2 Bucket Store</span>
              <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">● {data.subsystems.storage}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Upstash Redis Event Cache</span>
              <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">● {data.subsystems.redis}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
