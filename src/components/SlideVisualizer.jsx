import React, { useState } from 'react';
import InlineMath from 'react-katex';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function SlideVisualizer({ solution, onExit }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slide = solution.steps[currentSlide];
  const isLast = currentSlide === solution.steps.length - 1;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-obsidian text-white p-8 justify-between relative">
      <div className="max-w-4xl mx-auto w-full bg-surface border border-slate-800 rounded-2xl p-10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-extrabold text-lilac uppercase tracking-wider">
            Step {slide.stepNumber} of {solution.steps.length}
          </span>
          <h2 className="text-2xl font-black">{slide.title}</h2>
        </div>

        <p className="text-lavender text-lg mb-8 leading-relaxed font-medium">
          {slide.description}
        </p>

        <div className="bg-canvasBg border border-slate-800 rounded-xl p-8 font-mono text-xl flex justify-center text-white font-bold my-4">
          <InlineMath math={slide.formulaLaTeX} />
        </div>
      </div>

      {/* Slide Navigation Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between mt-6">
        <button
          disabled={currentSlide === 0}
          onClick={() => setCurrentSlide(c => c - 1)}
          className="px-6 py-3 bg-surface border border-slate-700 rounded-xl font-bold flex items-center gap-2 disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" /> Previous Step
        </button>

        <button
          disabled={isLast}
          onClick={() => setCurrentSlide(c => c + 1)}
          className="px-6 py-3 bg-lilac text-obsidian rounded-xl font-bold flex items-center gap-2 disabled:opacity-40"
        >
          Next Step <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Red Exit Button */}
      <button
        onClick={onExit}
        className="absolute bottom-8 right-8 bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 shadow-2xl"
      >
        <X className="h-5 w-5" /> EXIT
      </button>
    </div>
  );
}