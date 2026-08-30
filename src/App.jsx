
import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb, HelpCircle, ChevronLeft, ChevronRight, X, CheckCircle2, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { generateRegexConversion, generatePracticeQuiz, serializeDfa } from './services/gemini';
import DfaCanvas from './components/DfaCanvas';

const NODE_TYPES = {
  start: { label: 'Start State', color: '#EF4444', borderColor: 'border-red-500', stroke: '#EF4444' },
  intermediate: { label: 'Intermediate State', color: '#C084FC', borderColor: 'border-purple-400', stroke: '#C084FC' },
  dead: { label: 'Dead State', color: '#991B1B', borderColor: 'border-red-900', stroke: '#991B1B' },
  final: { label: 'Final State', color: '#10B981', borderColor: 'border-emerald-500', stroke: '#10B981' },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('converter');

  // --- INTERACTIVE DFA BUILDER STATE ---
  const [nodes, setNodes] = useState([
    { id: 'q0', name: 'q0', type: 'start', x: 150, y: 200 },
    { id: 'q1', name: 'q1', type: 'final', x: 450, y: 200 },
  ]);
  const [transitions, setTransitions] = useState([
    { id: 't0', from: 'q0', to: 'q1', label: 'a', anchorFrom: 'E', anchorTo: 'W' },
    { id: 't1', from: 'q1', to: 'q1', label: 'b', anchorFrom: 'N', anchorTo: 'E' },
  ]);

  // Node Dragging State
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connection State
  const [sourceAnchor, setSourceAnchor] = useState(null); // { nodeId, anchorDir }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pendingConnection, setPendingConnection] = useState(null); // { fromNodeId, targetNodeId, anchorFrom, anchorTo }
  const [transitionLabelInput, setTransitionLabelInput] = useState('a');

  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredTransition, setHoveredTransition] = useState(null);
  const svgRef = useRef(null);

  // --- CONVERTER & VISUALIZER STATE ---
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [loadingConversion, setLoadingConversion] = useState(false);
  const [conversionData, setConversionData] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // --- QUIZ STATE ---
  const [quizLevel, setQuizLevel] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(3);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [revealedHints, setRevealedHints] = useState({});
  const [revealedSolutions, setRevealedSolutions] = useState({});
  const [showQuizSummary, setShowQuizSummary] = useState(false);

  // Global Pointer Listeners for safe dragging & robust connection targeting
  useEffect(() => {
    const handleGlobalPointerMove = (e) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      if (sourceAnchor) {
        setMousePos({ x: currentX, y: currentY });
      }

      if (draggingNode) {
        const x = Math.max(40, Math.min(rect.width - 40, currentX - dragOffset.x));
        const y = Math.max(40, Math.min(rect.height - 40, currentY - dragOffset.y));
        setNodes((prev) => prev.map((n) => (n.id === draggingNode ? { ...n, x, y } : n)));
      }
    };

    const handleGlobalPointerUp = (e) => {
      if (sourceAnchor) {
        // Precise hit testing using elementFromPoint to prevent target lost errors
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const nodeGroup = element?.closest('[data-node-id]');

        if (nodeGroup) {
          const targetNodeId = nodeGroup.getAttribute('data-node-id');
          const targetAnchorDir = element.getAttribute('data-anchor-dir') || (sourceAnchor.nodeId === targetNodeId ? 'N' : 'W');
          
          setPendingConnection({
            fromNodeId: sourceAnchor.nodeId,
            targetNodeId,
            anchorFrom: sourceAnchor.anchorDir,
            anchorTo: targetAnchorDir,
          });
        }
        setSourceAnchor(null);
      }

      if (draggingNode) {
        setDraggingNode(null);
      }
    };

    if (draggingNode || sourceAnchor) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [draggingNode, sourceAnchor, dragOffset]);

  const handleConfirmTransition = () => {
    if (!pendingConnection) return;
    const label = transitionLabelInput.trim() || 'ε';
    setTransitions((prev) => [
      ...prev,
      {
        id: `t_${Date.now()}`,
        from: pendingConnection.fromNodeId,
        to: pendingConnection.targetNodeId,
        anchorFrom: pendingConnection.anchorFrom,
        anchorTo: pendingConnection.anchorTo,
        label,
      },
    ]);
    setPendingConnection(null);
    setTransitionLabelInput('a');
  };

  const handleAddNode = (type) => {
    if (type === 'start' && nodes.some((n) => n.type === 'start')) {
      alert('A DFA can only have one Start State.');
      return;
    }
    const newId = `q${nodes.length}`;
    const newNode = {
      id: newId,
      name: newId,
      type,
      x: 100 + ((nodes.length * 60) % 500),
      y: 150 + ((nodes.length * 40) % 250),
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const handlePointerDownNode = (e, node) => {
    if (sourceAnchor) return;
    e.stopPropagation();
    setDraggingNode(node.id);
    const rect = svgRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y,
    });
  };

  const handleAnchorPointerDown = (e, nodeId, anchorDir) => {
    e.stopPropagation();
    setSourceAnchor({ nodeId, anchorDir });
    const rect = svgRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDeleteNode = (nodeId) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setTransitions((prev) => prev.filter((t) => t.from !== nodeId && t.to !== nodeId));
  };

  const handleDeleteTransition = (transId) => {
    setTransitions((prev) => prev.filter((t) => t.id !== transId));
  };

  const getAnchorCoords = (node, anchorDir) => {
    const r = 30;
    switch (anchorDir) {
      case 'N': return { x: node.x, y: node.y - r };
      case 'S': return { x: node.x, y: node.y + r };
      case 'E': return { x: node.x + r, y: node.y };
      case 'W': return { x: node.x - r, y: node.y };
      default: return { x: node.x, y: node.y };
    }
  };

  const handleSelectMethod = async (method) => {
    setShowMethodModal(false);
    setLoadingConversion(true);
    try {
      const serializedDescription = serializeDfa(nodes, transitions);
      const data = await generateRegexConversion(serializedDescription, method);
      setConversionData(data);
      setCurrentSlideIndex(0);
    } catch (err) {
      console.error(err);
      alert('Failed to generate Regular Expression.');
    } finally {
      setLoadingConversion(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setLoadingQuiz(true);
    setShowQuizSummary(false);
    setUserAnswers({});
    setRevealedHints({});
    setRevealedSolutions({});
    try {
      const questions = await generatePracticeQuiz(quizLevel, numQuestions);
      setQuizQuestions(questions);
      setCurrentQuestionIndex(0);
      setActiveTab('quiz');
    } catch (err) {
      console.error(err);
      alert('Failed to generate practice questions.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = (qId, optionId) => {
    if (userAnswers[qId]) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optionId }));
  };

  const toggleHint = (qId) => setRevealedHints((prev) => ({ ...prev, [qId]: !prev[qId] }));
  const toggleSolution = (qId) => setRevealedSolutions((prev) => ({ ...prev, [qId]: !prev[qId] }));

  const calculateQuizStats = () => {
    let correct = 0, incorrect = 0;
    quizQuestions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (ans) {
        if (ans === q.correctAnswer) correct++;
        else incorrect++;
      }
    });
    const hintsCount = Object.values(revealedHints).filter(Boolean).length;
    return { correct, incorrect, hintsCount };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-950/80 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={20} /> Automata AI Lab
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('converter')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'converter' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            DFA to RegEx Visualizer
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'quiz' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Practice Quiz
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {activeTab === 'converter' && (
          <div>
            {!conversionData ? (
              <div className="relative flex flex-col space-y-4">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between shadow-lg">
                  <div className="text-sm font-semibold text-slate-300">DFA State Creator:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAddNode('start')}
                      className="px-3 py-1.5 rounded-lg border border-red-500 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus size={14} />  Start State
                    </button>
                    <button
                      onClick={() => handleAddNode('intermediate')}
                      className="px-3 py-1.5 rounded-lg border border-purple-400 text-purple-300 hover:bg-purple-500/10 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus size={14} />  Intermediate State
                    </button>
                    <button
                      onClick={() => handleAddNode('dead')}
                      className="px-3 py-1.5 rounded-lg border border-red-900 text-red-300 hover:bg-red-900/20 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus size={14} />  Dead State
                    </button>
                    <button
                      onClick={() => handleAddNode('final')}
                      className="px-3 py-1.5 rounded-lg border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus size={14} />  Final State
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl border border-slate-800 shadow-2xl overflow-hidden bg-[#08060C] min-h-[480px]">
                  <svg
                    ref={svgRef}
                    className="w-full h-[480px] cursor-crosshair select-none"
                    onClick={() => {
                      setSourceAnchor(null);
                      setDraggingNode(null);
                    }}
                  >
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
                      </marker>
                      <marker id="start-arrowhead" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
                        <polygon points="0 0, 12 4, 0 8" fill="#EF4444" />
                      </marker>
                      <marker id="temp-arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#38BDF8" />
                      </marker>
                    </defs>

                    {/* Render Transitions */}
                    {transitions.map((t) => {
                      const fromNode = nodes.find((n) => n.id === t.from);
                      const toNode = nodes.find((n) => n.id === t.to);
                      if (!fromNode || !toNode) return null;

                      const startPt = getAnchorCoords(fromNode, t.anchorFrom);
                      const endPt = getAnchorCoords(toNode, t.anchorTo);
                      const isSelfLoop = t.from === t.to;

                      let pathD = '';
                      let midX = 0, midY = 0;

                      if (isSelfLoop) {
                        const loopRadius = 35;
                        pathD = `M ${startPt.x} ${startPt.y} C ${startPt.x - loopRadius} ${startPt.y - loopRadius * 2}, ${startPt.x + loopRadius} ${startPt.y - loopRadius * 2}, ${endPt.x} ${endPt.y}`;
                        midX = startPt.x;
                        midY = startPt.y - loopRadius * 1.5;
                      } else {
                        const dx = endPt.x - startPt.x;
                        const dy = endPt.y - startPt.y;
                        const cx = (startPt.x + endPt.x) / 2 - dy * 0.2;
                        const cy = (startPt.y + endPt.y) / 2 + dx * 0.2;
                        pathD = `M ${startPt.x} ${startPt.y} Q ${cx} ${cy} ${endPt.x} ${endPt.y}`;
                        midX = (startPt.x + endPt.x) / 2 - dy * 0.1;
                        midY = (startPt.y + endPt.y) / 2 + dx * 0.1;
                      }

                      const isHovered = hoveredTransition === t.id;

                      return (
                        <g
                          key={t.id}
                          onMouseEnter={() => setHoveredTransition(t.id)}
                          onMouseLeave={() => setHoveredTransition(null)}
                          className="group cursor-pointer"
                        >
                          <path
                            d={pathD}
                            fill="none"
                            stroke={isHovered ? '#60A5FA' : '#475569'}
                            strokeWidth={isHovered ? 3 : 2}
                            markerEnd="url(#arrowhead)"
                          />
                          <rect
                            x={midX - 12}
                            y={midY - 12}
                            width="24"
                            height="24"
                            rx="4"
                            fill="#0F172A"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <text
                            x={midX}
                            y={midY + 4}
                            fill="#F1F5F9"
                            fontSize="12"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {t.label}
                          </text>

                          {isHovered && (
                            <g onClick={(e) => { e.stopPropagation(); handleDeleteTransition(t.id); }}>
                              <circle cx={midX + 14} cy={midY - 14} r="8" fill="#EF4444" />
                              <text x={midX + 14} y={midY - 11} fill="#FFF" fontSize="10" textAnchor="middle" fontWeight="bold">✕</text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Active Drag Line for Connection Preview */}
                    {sourceAnchor && (() => {
                      const fromNode = nodes.find((n) => n.id === sourceAnchor.nodeId);
                      if (!fromNode) return null;
                      const startPt = getAnchorCoords(fromNode, sourceAnchor.anchorDir);
                      return (
                        <line
                          x1={startPt.x}
                          y1={startPt.y}
                          x2={mousePos.x}
                          y2={mousePos.y}
                          stroke="#38BDF8"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                          markerEnd="url(#temp-arrowhead)"
                        />
                      );
                    })()}

                    {/* State Nodes */}
                    {nodes.map((n) => {
                      const typeConfig = NODE_TYPES[n.type] || NODE_TYPES.intermediate;
                      const isHovered = hoveredNode === n.id;

                      return (
                        <g
                          key={n.id}
                          data-node-id={n.id}
                          onPointerDown={(e) => handlePointerDownNode(e, n)}
                          onMouseEnter={() => setHoveredNode(n.id)}
                          onMouseLeave={() => setHoveredNode(null)}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          {n.type === 'start' && (
                            <line
                              x1={n.x - 70}
                              y1={n.y}
                              x2={n.x - 34}
                              y2={n.y}
                              stroke="#EF4444"
                              strokeWidth="3"
                              markerEnd="url(#start-arrowhead)"
                              className="pointer-events-none"
                            />
                          )}

                          {n.type === 'final' && (
                            <circle
                              cx={n.x}
                              cy={n.y}
                              r={35}
                              fill="none"
                              stroke={typeConfig.stroke}
                              strokeWidth="2"
                              className="pointer-events-none"
                            />
                          )}

                          <circle
                            cx={n.x}
                            cy={n.y}
                            r={30}
                            fill="#0F172A"
                            stroke={typeConfig.stroke}
                            strokeWidth="2.5"
                          />

                          <text
                            x={n.x}
                            y={n.y + 4}
                            fill="#F8FAFC"
                            fontSize="14"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="pointer-events-none select-none"
                          >
                            {n.name}
                          </text>

                          {/* Connection Anchors (N, S, E, W) */}
                          {['N', 'S', 'E', 'W'].map((dir) => {
                            const anchorCoords = getAnchorCoords(n, dir);
                            const isSelectedAnchor =
                              sourceAnchor?.nodeId === n.id && sourceAnchor?.anchorDir === dir;
                            return (
                              <circle
                                key={dir}
                                data-anchor-dir={dir}
                                cx={anchorCoords.x}
                                cy={anchorCoords.y}
                                r={isSelectedAnchor ? 7 : 5}
                                fill={isSelectedAnchor ? '#38BDF8' : '#64748B'}
                                stroke="#0F172A"
                                strokeWidth="1.5"
                                className="hover:scale-150 transition-transform cursor-crosshair"
                                onPointerDown={(e) => handleAnchorPointerDown(e, n.id, dir)}
                              />
                            );
                          })}

                          {isHovered && (
                            <g onClick={(e) => { e.stopPropagation(); handleDeleteNode(n.id); }}>
                              <circle cx={n.x + 24} cy={n.y - 24} r="10" fill="#EF4444" className="cursor-pointer" />
                              <text x={n.x + 24} y={n.y - 20} fill="#FFF" fontSize="12" textAnchor="middle" fontWeight="bold">✕</text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="fixed bottom-8 right-8 z-40">
                  <button
                    onClick={() => setShowMethodModal(true)}
                    disabled={loadingConversion || nodes.length === 0}
                    className="bg-[#FF3333] hover:bg-[#E62E2E] text-white font-bold px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 text-base transition transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles size={20} />
                    <span>{loadingConversion ? 'Converting...' : 'Generate RegEx'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-8 min-h-[500px] flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                      Method: {conversionData.method}
                    </span>
                    <span className="text-sm text-slate-400">
                      Step {currentSlideIndex + 1} of {conversionData.steps.length + 1}
                    </span>
                  </div>

                  {currentSlideIndex < conversionData.steps.length ? (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">
                        {conversionData.steps[currentSlideIndex].title}
                      </h3>
                      <p className="text-slate-300 mb-6 leading-relaxed">
                        {conversionData.steps[currentSlideIndex].description}
                      </p>
                      {conversionData.steps[currentSlideIndex].formula && (
                        <div className="bg-slate-950 rounded-lg p-5 border border-slate-700 shadow-inner">
                          <code className="text-white font-bold font-mono text-base block whitespace-pre-wrap">
                            {conversionData.steps[currentSlideIndex].formula}
                          </code>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <h3 className="text-2xl font-bold text-emerald-400 mb-4">Conversion Complete</h3>
                      <p className="text-slate-400 mb-6">The resulting Regular Expression for the DFA is:</p>
                      <div className="inline-block bg-slate-950 border border-emerald-500/50 rounded-xl px-8 py-6 shadow-lg">
                        <span className="text-white font-bold font-mono text-3xl">
                          {conversionData.finalRegex}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-4 border-t border-slate-700 flex justify-between items-center">
                  <div className="flex space-x-3">
                    <button
                      disabled={currentSlideIndex === 0}
                      onClick={() => setCurrentSlideIndex((prev) => prev - 1)}
                      className="flex items-center space-x-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-40"
                    >
                      <ChevronLeft size={18} />
                      <span>Previous Step</span>
                    </button>
                    <button
                      disabled={currentSlideIndex > conversionData.steps.length - 1}
                      onClick={() => setCurrentSlideIndex((prev) => prev + 1)}
                      className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg disabled:opacity-40"
                    >
                      <span>Next Step</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {currentSlideIndex === conversionData.steps.length && (
                    <button
                      onClick={() => {
                        setConversionData(null);
                        setCurrentSlideIndex(0);
                      }}
                      className="bg-[#FF3333] hover:bg-[#E62E2E] text-white font-semibold px-5 py-2 rounded-lg flex items-center space-x-2 shadow-lg"
                    >
                      <X size={18} />
                      <span>Exit Visualizer</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PRACTICE QUIZ TAB --- */}
        {activeTab === 'quiz' && (
          <div>
            {quizQuestions.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md mx-auto">
                <h2 className="text-lg font-semibold mb-4 text-indigo-300">Generate Practice Quiz</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Difficulty Level:</label>
                    <select
                      value={quizLevel}
                      onChange={(e) => setQuizLevel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Number of Questions:</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                    />
                  </div>
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={loadingQuiz}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-white transition disabled:opacity-50"
                  >
                    {loadingQuiz ? 'Generating Questions...' : 'Start Practice Quiz'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 h-fit">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">Questions</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {quizQuestions.map((q, idx) => {
                      const isCompleted = !!userAnswers[q.id];
                      const isCurrent = currentQuestionIndex === idx;

                      let tileStyle = 'bg-slate-700/50 text-slate-400';
                      if (isCompleted) {
                        tileStyle = 'bg-[#10B981] text-white';
                      } else if (isCurrent) {
                        tileStyle = 'bg-indigo-300 text-slate-950 font-bold';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`h-10 rounded-lg flex items-center justify-center font-medium transition ${tileStyle}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-3 bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    {quizQuestions[currentQuestionIndex].dfaGraph && (
                      <div className="mb-4">
                        <span className="text-xs font-mono text-indigo-400 block mb-2">DYNAMIC DFA GRAPH</span>
                        <DfaCanvas elements={quizQuestions[currentQuestionIndex].dfaGraph} />
                      </div>
                    )}

                    <h3 className="text-lg font-semibold text-white mb-6">
                      {currentQuestionIndex + 1}. {quizQuestions[currentQuestionIndex].question}
                    </h3>

                    <div className="space-y-3 mb-6">
                      {quizQuestions[currentQuestionIndex].options.map((option) => {
                        const qId = quizQuestions[currentQuestionIndex].id;
                        const selectedOption = userAnswers[qId];
                        const isSelected = selectedOption === option.id;
                        const isCorrect = option.id === quizQuestions[currentQuestionIndex].correctAnswer;

                        let style = 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-200';
                        if (selectedOption) {
                          if (isSelected) {
                            style = isCorrect
                              ? 'bg-[#10B981]/20 border-[#10B981] text-white'
                              : 'bg-[#EF4444]/20 border-[#EF4444] text-white';
                          }
                        }

                        return (
                          <div key={option.id}>
                            <button
                              onClick={() => handleSelectOption(qId, option.id)}
                              className={`w-full text-left p-4 rounded-xl border flex items-center space-x-3 transition ${style}`}
                            >
                              <span className="font-bold text-slate-400">{option.id}.</span>
                              <span className="flex-1">{option.text}</span>
                            </button>

                            {selectedOption && isSelected && !isCorrect && (
                              <div className="mt-2 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg p-3 text-sm text-[#EF4444] flex items-start space-x-2">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Incorrect: </span>
                                  {quizQuestions[currentQuestionIndex].explanations[option.id]}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex space-x-3 mb-6">
                      <button
                        onClick={() => toggleHint(quizQuestions[currentQuestionIndex].id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                      >
                        <Lightbulb size={16} />
                        <span>💡 Hint</span>
                      </button>
                      <button
                        onClick={() => toggleSolution(quizQuestions[currentQuestionIndex].id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                      >
                        <HelpCircle size={16} />
                        <span>Give Answer</span>
                      </button>
                    </div>

                    {revealedHints[quizQuestions[currentQuestionIndex].id] && (
                      <div className="mb-4 p-3 bg-amber-950/40 border border-amber-800/50 rounded-lg text-amber-200 text-sm">
                        💡 <strong>Hint:</strong> {quizQuestions[currentQuestionIndex].hint}
                      </div>
                    )}

                    {revealedSolutions[quizQuestions[currentQuestionIndex].id] && (
                      <div className="mb-4 p-4 bg-slate-950 border border-indigo-500/30 rounded-lg text-slate-300 text-sm">
                        <strong className="text-indigo-400 block mb-1">Step-by-Step Solution Derivation:</strong>
                        <p className="whitespace-pre-wrap">{quizQuestions[currentQuestionIndex].fullSolution}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-700 flex justify-between">
                    {currentQuestionIndex > 0 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
                      >
                        &lt; Previous
                      </button>
                    ) : <div />}

                    {currentQuestionIndex < quizQuestions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium"
                      >
                        Next &gt;
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowQuizSummary(true)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium text-white shadow-lg"
                      >
                        Submit &amp; View Score
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- ADD TRANSITION LABEL MODAL --- */}
      {pendingConnection && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Set Transition Symbol</h3>
            <p className="text-slate-400 text-sm mb-4">
              Connecting <span className="text-indigo-400 font-bold">{pendingConnection.fromNodeId}</span> to{' '}
              <span className="text-indigo-400 font-bold">{pendingConnection.targetNodeId}</span>:
            </p>
            <input
              type="text"
              autoFocus
              value={transitionLabelInput}
              onChange={(e) => setTransitionLabelInput(e.target.value)}
              placeholder="e.g. a, b, 0,1 or ε"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 mb-6 font-mono focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setPendingConnection(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransition}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold text-sm shadow-lg"
              >
                Add Edge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- METHOD CHOICE MODAL --- */}
      {showMethodModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Select Conversion Method</h3>
            <p className="text-slate-400 text-sm mb-6">Choose how you would like the AI to generate the DFA to RegEx solution steps:</p>
            <div className="space-y-3">
              <button
                onClick={() => handleSelectMethod("USING ARDEN'S THEOREM")}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg text-white transition"
              >
                1. USING ARDEN'S THEOREM
              </button>
              <button
                onClick={() => handleSelectMethod("USING STATE ELIMINATION METHOD")}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg text-white transition"
              >
                2. USING STATE ELIMINATION METHOD
              </button>
            </div>
            <button
              onClick={() => setShowMethodModal(false)}
              className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* --- FINAL PERFORMANCE REVIEW MODAL --- */}
      {showQuizSummary && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-lg w-full shadow-2xl text-center">
            <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h3>
            <p className="text-slate-400 text-sm mb-6">Here is your performance summary:</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                <span className="text-2xl font-bold text-emerald-400 block">{calculateQuizStats().correct}</span>
                <span className="text-xs text-slate-400">Correct Answers</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                <span className="text-2xl font-bold text-red-400 block">{calculateQuizStats().incorrect}</span>
                <span className="text-xs text-slate-400">Incorrect Answers</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                <span className="text-2xl font-bold text-amber-400 block">{calculateQuizStats().hintsCount}</span>
                <span className="text-xs text-slate-400">Hints Requested</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowQuizSummary(false);
                setQuizQuestions([]);
                setActiveTab('converter');
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-white shadow-lg transition"
            >
              Return to Home Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

