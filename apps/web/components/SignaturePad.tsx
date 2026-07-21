'use client';

import React, { useRef, useState } from 'react';

export default function SignaturePad({
  contractId,
  onSigned,
}: {
  contractId: string;
  onSigned: (signedAt: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);

    try {
      const dataUrl = canvas.toDataURL('image/png');

      const res = await fetch('/api/contract/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          signatureSvg: dataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record signature');

      onSigned(data.signedAt);
    } catch (err: any) {
      alert(`Signature submission failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-6 bg-zinc-950 border border-white/5 rounded-2xl max-w-md mx-auto">
      <div>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Digital Signature Auth</h4>
        <p className="text-xs text-zinc-500 mt-1">Draw your signature below. This binds your IP address for auditing compliance.</p>
      </div>

      <canvas
        ref={canvasRef}
        width={350}
        height={150}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full bg-zinc-900 border border-white/10 rounded-xl cursor-crosshair touch-none"
      />

      <div className="flex justify-between items-center gap-3">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 border border-white/10 text-white hover:bg-white/5 rounded-full text-xs font-bold transition-all"
        >
          Clear
        </button>
        <button
          onClick={saveSignature}
          disabled={saving}
          className="px-6 py-2 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-full text-xs font-bold transition-all"
        >
          {saving ? 'Signing...' : 'Sign Agreement'}
        </button>
      </div>
    </div>
  );
}
