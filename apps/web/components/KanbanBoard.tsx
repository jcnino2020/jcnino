'use client';

import React, { useState, useEffect } from 'react';

type ProjectStatus = 'INTAKE' | 'SCHEDULED' | 'SHOOTING' | 'POST_PROCESSING' | 'CLIENT_REVIEW' | 'COMPLETED';

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  dueDate: string | null;
  budget: string;
}

const COLUMNS: { key: ProjectStatus; label: string }[] = [
  { key: 'INTAKE', label: 'Intake' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'SHOOTING', label: 'On Set (Shooting)' },
  { key: 'POST_PROCESSING', label: 'Post-Processing' },
  { key: 'CLIENT_REVIEW', label: 'Client Review' },
  { key: 'COMPLETED', label: 'Completed' },
];

export default function KanbanBoard({ workspaceId }: { workspaceId: string }) {
  const [boards, setBoards] = useState<Record<ProjectStatus, Project[]>>({
    INTAKE: [],
    SCHEDULED: [],
    SHOOTING: [],
    POST_PROCESSING: [],
    CLIENT_REVIEW: [],
    COMPLETED: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/kanban?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (res.ok) {
        setBoards(data.boards);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [workspaceId]);

  const moveProject = async (projectId: string, targetStatus: ProjectStatus) => {
    try {
      let movedProject: Project | null = null;
      const updatedBoards = { ...boards };
      
      Object.keys(updatedBoards).forEach((statusKey) => {
        const key = statusKey as ProjectStatus;
        const index = updatedBoards[key].findIndex((p) => p.id === projectId);
        if (index !== -1) {
          [movedProject] = updatedBoards[key].splice(index, 1);
        }
      });

      if (!movedProject) return;
      
      movedProject.status = targetStatus;
      updatedBoards[targetStatus].push(movedProject);
      setBoards(updatedBoards);

      const res = await fetch('/api/projects/kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, status: targetStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update project status');
      }
    } catch (err) {
      alert('Error updating status, resetting board');
      fetchProjects();
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="space-y-4">
            <div className="h-6 bg-zinc-900 rounded animate-pulse" />
            <div className="h-32 bg-zinc-900 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-6 select-none">
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const projectId = e.dataTransfer.getData('text/plain');
            if (projectId) moveProject(projectId, col.key);
          }}
          className="flex-1 min-w-[250px] bg-zinc-950/40 border border-white/5 rounded-2xl p-4 flex flex-col space-y-4"
        >
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{col.label}</h3>
            <span className="text-[10px] bg-white/10 text-white font-bold px-2 py-0.5 rounded-full">
              {boards[col.key]?.length || 0}
            </span>
          </div>

          <div className="flex-1 space-y-3 min-h-[300px]">
            {boards[col.key]?.length === 0 ? (
              <div className="h-full min-h-[150px] flex items-center justify-center border border-dashed border-white/5 rounded-xl p-4 text-center">
                <p className="text-[10px] text-zinc-600">Drag items here</p>
              </div>
            ) : (
              boards[col.key]?.map((project) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', project.id)}
                  className="p-4 bg-zinc-900 border border-white/5 rounded-xl hover:border-white/15 cursor-grab active:cursor-grabbing transition-all space-y-3 shadow-md"
                >
                  <p className="text-sm font-bold text-white leading-snug">{project.name}</p>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500">
                    <span>Budget: ${Number(project.budget).toLocaleString()}</span>
                    {project.dueDate && (
                      <span className="font-semibold text-zinc-400">
                        {new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-1 md:hidden mt-2 pt-2 border-t border-white/5 overflow-x-auto">
                    {COLUMNS.filter(c => c.key !== col.key).map(c => (
                      <button
                        key={c.key}
                        onClick={() => moveProject(project.id, c.key)}
                        className="text-[8px] bg-white/5 hover:bg-white/10 text-zinc-400 px-2 py-1 rounded-md leading-none shrink-0"
                      >
                        To {c.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
