import React, { useState } from 'react';
import InlineMath from 'react-katex';
import QuizReview from './QuizReview';
import { fetchAIPracticeQuestions } from '../utils/aiPracticeGenerator';
import { Lightbulb, CheckCircle, XCircle } from 'lucide-react';

export default function PracticeHub({ onExit }) {
  const [config, setConfig] = useState({ difficulty: 'EASY', method: 'ARDEN', count: 5 });
  const [questions, setQuestions] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [hintsUsed, setHintsUsed] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleGenerate = async () => {
    const q = await fetchAIPracticeQuestions(config);
    setQuestions(q);
  };

  if (isFinished) {
    return (
      <QuizReview
        questions={questions}
        userAnswers={userAnswers}
        hintsUsed={hintsUsed}
        onRetry={() => { setQuestions(null); setIsFinished(false); }}
        onExit={onExit}
      />
    );
  }

  if (!questions) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-surface border border-slate-800 rounded-2xl">
        <h2 className="text-3xl font-black text-white mb-6 text-center">Practice Setup</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-lavender uppercase mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {['EASY', 'MEDIUM', 'HARD'].map(d => (
                <button
                  key={d}
                  onClick={() => setConfig({ ...config, difficulty: d })}
                  className={`py-2 rounded-lg font-bold text-sm ${config.difficulty === d ? 'bg-lilac text-obsidian' : 'bg-obsidian border border-slate-700 text-white'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-lavender uppercase mb-2">Method</label>
            <div className="grid grid-cols-2 gap-2">
              {['ARDEN', 'STATE_ELIMINATION'].map(m => (
                <button
                  key={m}
                  onClick={() => setConfig({ ...config, method: m })}
                  className={`py-2 rounded-lg font-bold text-sm ${config.method === m ? 'bg-lilac text-obsidian' : 'bg-obsidian border border-slate-700 text-white'}`}
                >
                  {m === 'ARDEN' ? "Arden's" : "State Elim."}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-lavender uppercase mb-2">Questions Count</label>
            <select
              value={config.count}
              onChange={(e) => setConfig({ ...config, count: Number(e.target.value) })}
              className="w-full bg-obsidian border border-slate-700 rounded-lg p-3 text-white font-bold"
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} Questions</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-lilac text-obsidian font-extrabold rounded-xl text-lg hover:bg-white transition"
          >
            GENERATE PRACTICE QUESTIONS
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const selectedOption = userAnswers[q.id];

  const handleSelectOption = (optId) => {
    if (userAnswers[q.id]) return; // locked
    setUserAnswers({ ...userAnswers, [q.id]: optId });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-obsidian">
      {/* Left Sidebar Navigator */}
      <div className="w-64 border-r border-slate-800 bg-surface p-6 flex flex-col gap-2 overflow-y-auto">
        <h3 className="text-xs font-extrabold text-lavender uppercase mb-4">Questions</h3>
        <div className="grid grid-cols-4 gap-2">
          {questions.map((qItem, idx) => {
            const isCompleted = userAnswers[qItem.id] !== undefined;
            return (
              <button
                key={qItem.id}
                onClick={() => { setCurrentIndex(idx); setShowHint(false); setShowSolution(false); }}
                className={`h-10 rounded-lg font-bold text-sm ${
                  isCompleted ? 'bg-emerald-500 text-white' :
                  currentIndex === idx ? 'bg-lilac text-obsidian' : 'bg-obsidian text-slate-400 border border-slate-800'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main MCQ Content */}
      <div className="flex-1 p-8 overflow-y-auto relative flex flex-col justify-between">
        <div>
          {/* Top Diagram Placeholder */}
          <div className="bg-canvasBg border border-slate-800 rounded-xl p-6 mb-8 flex justify-center items-center h-48">
            <span className="text-lavender font-mono text-sm">[ Targeted DFA Canvas Diagram Render: {q.dfa.nodes.length} Nodes ]</span>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {q.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              let btnStyle = "bg-surface border-slate-800 text-white";

              if (selectedOption) {
                if (opt.isCorrect) btnStyle = "bg-emerald-600 border-emerald-500 text-white";
                else if (isSelected && !opt.isCorrect) btnStyle = "bg-red-600 border-red-500 text-white";
              }

              return (
                <div key={opt.id} className="flex flex-col">
                  <button
                    onClick={() => handleSelectOption(opt.id)}
                    className={`p-5 rounded-xl border-2 font-mono text-lg font-bold text-left transition ${btnStyle}`}
                  >
                    {opt.id}. {opt.regex}
                  </button>
                  {isSelected && !opt.isCorrect && (
                    <div className="mt-2 text-xs font-bold text-red-400 bg-red-950/40 p-3 rounded-lg border border-red-800">
                      {opt.explanationIfChosen}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Solution Drawer */}
          {showSolution && (
            <div className="bg-surface border border-slate-800 p-6 rounded-xl my-4">
              <h4 className="font-bold text-lilac mb-2">Step-by-Step Derivation</h4>
              {q.stepByStepSolution.map(s => (
                <div key={s.stepNumber} className="mb-2 text-sm font-mono">
                  <InlineMath math={s.formulaLaTeX} />
                </div>
              ))}
            </div>
          )}

          {/* Hint Card */}
          {showHint && (
            <div className="bg-lilac/10 border border-lilac p-4 rounded-xl text-sm font-semibold text-white my-4">
              💡 Hint: {q.hint}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <div className="flex gap-3">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(c => c - 1)}
              className="px-4 py-2 bg-surface border border-slate-700 rounded-lg text-sm font-bold disabled:opacity-30"
            >
              &lt; Previous
            </button>
            {currentIndex === questions.length - 1 ? (
              <button
                onClick={() => setIsFinished(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(c => c + 1)}
                className="px-4 py-2 bg-lilac text-obsidian rounded-lg text-sm font-bold"
              >
                Next &gt;
              </button>
            )}
          </div>

          {/* Helpers */}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowHint(true); setHintsUsed({ ...hintsUsed, [q.id]: true }); }}
              className="p-3 bg-surface border border-slate-700 rounded-xl text-yellow-400 hover:bg-slate-800"
            >
              <Lightbulb className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowSolution(s => !s)}
              className="px-4 py-2 bg-surface border border-slate-700 text-white rounded-xl text-xs font-bold"
            >
              GIVE ANSWER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}