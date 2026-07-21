'use client';

import React, { useRef, useState, useEffect } from 'react';

interface Comment {
  id: string;
  authorName: string;
  content: string;
  timestamp: number | null;
  drawingJson: string | null;
  createdAt: string;
}

export default function ReviewPlayer({
  videoUrl,
  invoiceId,
}: {
  videoUrl: string;
  invoiceId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('Client Reviewer');
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<{ x: number; y: number }[][]>([]);
  const [currentLine, setCurrentLine] = useState<{ x: number; y: number }[]>([]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/review/comment?invoiceId=${invoiceId}`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [invoiceId]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentLine([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentLine((prev) => [...prev, { x, y }]);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    const lastPoint = currentLine[currentLine.length - 1];
    if (lastPoint) {
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (currentLine.length > 0) {
      setLines((prev) => [...prev, currentLine]);
    }
    setIsDrawing(false);
  };

  const clearDrawings = () => {
    setLines([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const payload = {
        invoiceId,
        authorName,
        content: newComment,
        timestamp: currentTime,
        drawingJson: lines.length > 0 ? JSON.stringify(lines) : undefined,
      };

      const res = await fetch('/api/review/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNewComment('');
        clearDrawings();
        fetchComments();
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8 space-y-4">
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-white/5 shadow-2xl">
          <video
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full object-contain"
            onClick={togglePlay}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="absolute inset-0 w-full h-full cursor-draw pointer-events-auto"
          />
        </div>

        <div className="flex items-center gap-4 bg-zinc-900/60 p-4 rounded-xl border border-white/5">
          <button
            onClick={togglePlay}
            className="px-4 py-2 bg-white text-black font-bold text-xs rounded-full hover:bg-zinc-200 transition-all"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <div className="flex-1 relative h-2 bg-zinc-800 rounded-full cursor-pointer">
            <div
              className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
            {comments.filter(c => c.timestamp !== null).map((c) => (
              <span
                key={c.id}
                className="absolute top-0 w-1 h-full bg-red-500 hover:scale-150 transition-transform"
                style={{ left: `${(c.timestamp! / (duration || 1)) * 100}%` }}
                title={`${c.authorName}: ${c.content}`}
              />
            ))}
          </div>

          <span className="text-xs text-zinc-400 font-mono select-none">
            {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
          </span>
        </div>

        {lines.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-red-950/20 border border-red-500/10 rounded-xl">
            <span className="text-xs text-red-400">Drawing Markup Active ({lines.length} strokes)</span>
            <button
              onClick={clearDrawings}
              className="text-[10px] uppercase font-bold text-zinc-400 hover:text-white"
            >
              Clear Canvas
            </button>
          </div>
        )}
      </div>

      <div className="lg:col-span-4 space-y-4">
        <div className="bg-zinc-950 border border-white/5 rounded-2xl p-6 flex flex-col h-[400px]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-white/5">Comments Thread</h3>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            {comments.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-12">No client review comments recorded.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-white">{comment.authorName}</span>
                    {comment.timestamp !== null && (
                      <span className="text-indigo-400 font-mono">@{comment.timestamp.toFixed(1)}s</span>
                    )}
                  </div>
                  <p className="text-zinc-300 bg-zinc-900 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                    {comment.content}
                    {comment.drawingJson && <span className="block text-[8px] text-red-400 mt-1">🎨 Includes canvas markup</span>}
                  </p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="pt-3 border-t border-white/5 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Your Name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-1/3 px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Review revision note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-2/3 px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-lg transition-all"
            >
              Add Timestamp Revision
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
