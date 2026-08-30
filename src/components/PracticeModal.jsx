import React, { useState } from 'react';
import { generatePracticeQuestion } from '../utils/geminiApi';

export default function PracticeModal() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const result = await generatePracticeQuestion();
      setData(result);
    } catch (err) {
      alert("Failed to load question from Gemini.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-surface rounded-xl">
      <button 
        onClick={handleFetch} 
        disabled={loading}
        className="px-4 py-2 bg-lilac text-obsidian font-bold rounded-lg"
      >
        {loading ? "Generating..." : "Generate Practice Question"}
      </button>

      {data && (
        <div className="mt-4 text-white">
          <p className="font-bold">{data.question}</p>
          <p className="text-xs text-slate-400">Answer: {data.regexAnswer}</p>
        </div>
      )}
    </div>
  );
}