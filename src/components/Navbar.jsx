import React from 'react';
import { Sparkles, Hammer, BookOpen } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="h-16 border-b border-surface bg-obsidian px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
        <Sparkles className="h-6 w-6 text-lilac" />
        <span className="text-xl font-extrabold text-lilac tracking-wide">✦ Automata AI Lab</span>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
            activeTab === 'home' ? 'bg-lilac text-obsidian' : 'text-lavender hover:text-white'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab('converter')}
          className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${
            activeTab === 'converter' ? 'bg-lilac text-obsidian' : 'text-lavender hover:text-white'
          }`}
        >
          <Hammer className="h-4 w-4" /> Converter
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${
            activeTab === 'practice' ? 'bg-lilac text-obsidian' : 'text-lavender hover:text-white'
          }`}
        >
          <BookOpen className="h-4 w-4" /> Practice
        </button>
      </div>
    </nav>
  );
}