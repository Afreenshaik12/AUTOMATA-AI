import React from 'react';
import { Play, BrainCircuit } from 'lucide-react';

export default function Home({ onSelectMode }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col items-center text-center">
      <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
        Master Automata. <span className="text-lilac">Don't Just Memorize It.</span>
      </h1>
      <p className="text-xl text-lavender max-w-3xl font-medium mb-12">
        Construct, simulate, and derive deterministic finite automata to regular expressions via step-by-step mathematical engines.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Card 1 */}
        <div 
          onClick={() => onSelectMode('converter')}
          className="bg-surface border-2 border-slate-800 hover:border-lilac rounded-2xl p-8 flex flex-col items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-2xl group"
        >
          <div className="bg-lilac/10 p-4 rounded-full mb-6 group-hover:bg-lilac/20">
            <Play className="h-10 w-10 text-lilac" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-3">Interactive Builder</h3>
            <p className="text-lavender text-sm font-medium leading-relaxed mb-8">
              Construct DFAs manually with full anchor drag routing and generate step-by-step mathematical reductions.
            </p>
          </div>
          <button className="w-full py-4 bg-lilac text-obsidian font-extrabold rounded-xl text-base group-hover:bg-white transition">
            START CONVERTING
          </button>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => onSelectMode('practice')}
          className="bg-surface border-2 border-slate-800 hover:border-lilac rounded-2xl p-8 flex flex-col items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-2xl group"
        >
          <div className="bg-lilac/10 p-4 rounded-full mb-6 group-hover:bg-lilac/20">
            <BrainCircuit className="h-10 w-10 text-lilac" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-3">AI Practice Hub</h3>
            <p className="text-lavender text-sm font-medium leading-relaxed mb-8">
              Generate verified MCQ practice problems powered by dynamic solver engines across difficulty levels.
            </p>
          </div>
          <button className="w-full py-4 bg-surface border-2 border-lilac text-lilac font-extrabold rounded-xl text-base group-hover:bg-lilac group-hover:text-obsidian transition">
            PRACTICE WITH AI
          </button>
        </div>
      </div>
    </div>
  );
}