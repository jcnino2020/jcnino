import React from 'react';

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center">
      <div className="max-w-xl">
        <p className="text-sm font-bold uppercase tracking-widest text-indigo-400">Welcome to FrameForge</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Moments OS
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-400">
          Scaffolded workspace for Phase 1 of the multi-tenant creative operations platform.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/login"
            className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black hover:bg-zinc-200 transition-all"
          >
            Start Free Trial
          </a>
          <a
            href="https://github.com/jcnino2020/jcnino"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-zinc-800 px-6 py-3 text-sm font-bold text-white hover:bg-zinc-900 transition-all"
          >
            View Repository
          </a>
        </div>
      </div>
    </div>
  );
}
