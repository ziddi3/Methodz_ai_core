'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl text-center">
        <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Methodz AI Core
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Persistent multi-provider intelligence workspace
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 border border-gray-800 rounded-2xl">
            <h3 className="font-bold text-xl mb-2">AI Router</h3>
            <p className="text-gray-400">Multi-provider orchestration</p>
          </div>
          <div className="p-6 border border-gray-800 rounded-2xl">
            <h3 className="font-bold text-xl mb-2">Projects</h3>
            <p className="text-gray-400">Persistent workspaces</p>
          </div>
          <div className="p-6 border border-gray-800 rounded-2xl">
            <h3 className="font-bold text-xl mb-2">Agents</h3>
            <p className="text-gray-400">Autonomous execution</p>
          </div>
        </div>

        <Link 
          href="/ziddy-secret" 
          className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all"
        >
          Enter Secret Section (Ziddy Only)
        </Link>
        
        <p className="mt-8 text-xs text-gray-500">
          Built from the manifesto • Provider independent
        </p>
      </div>
    </div>
  );
}