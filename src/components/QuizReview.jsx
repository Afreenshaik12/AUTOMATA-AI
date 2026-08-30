import React from 'react';

export default function QuizReview({ questions, userAnswers, hintsUsed, onRetry, onExit }) {
  const total = questions.length;
  let correctCount = 0;

  questions.forEach(q => {
    const chosen = userAnswers[q.id];
    const match = q.options.find(o => o.id === chosen);
    if (match && match.isCorrect) correctCount++;
  });

  const totalHints = Object.keys(hintsUsed).length;

  return (
    <div className="max-w-2xl mx-auto my-16 p-10 bg-surface border border-slate-800 rounded-2xl text-center shadow-2xl">
      <h2 className="text-4xl font-black text-white mb-2">Performance Review</h2>
      <p className="text-lavender text-sm font-bold uppercase tracking-wider mb-8">Quiz Results</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-obsidian border border-slate-800 p-6 rounded-xl">
          <span className="block text-3xl font-black text-emerald-400">{correctCount}/{total}</span>
          <span className="text-xs font-bold text-lavender uppercase">Score</span>
        </div>
        <div className="bg-obsidian border border-slate-800 p-6 rounded-xl">
          <span className="block text-3xl font-black text-lilac">{Math.round((correctCount / total) * 100)}%</span>
          <span className="text-xs font-bold text-lavender uppercase">Accuracy</span>
        </div>
        <div className="bg-obsidian border border-slate-800 p-6 rounded-xl">
          <span className="block text-3xl font-black text-yellow-400">{totalHints}</span>
          <span className="text-xs font-bold text-lavender uppercase">Hints Used</span>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={onRetry} className="flex-1 py-4 bg-surface border-2 border-lilac text-lilac font-extrabold rounded-xl">
          RETRY QUIZ
        </button>
        <button onClick={onExit} className="flex-1 py-4 bg-lilac text-obsidian font-extrabold rounded-xl">
          RETURN TO HOME
        </button>
      </div>
    </div>
  );
}