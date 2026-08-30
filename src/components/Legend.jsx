import React from 'react';

export default function Legend() {
  return (
    <div className="bg-surface/90 border border-slate-700 backdrop-blur rounded-lg px-4 py-2 text-xs font-bold flex items-center gap-4 text-white shadow-xl">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-stateStart inline-block border border-white"></span> Start (➔ q0)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-stateInter inline-block"></span> Intermediate
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-stateAccept border-2 border-white inline-block"></span> Final/Accept
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-stateDead inline-block"></span> Dead State
      </span>
    </div>
  );
}