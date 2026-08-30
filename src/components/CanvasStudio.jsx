import React, { useState, useRef } from 'react';
import PracticeModal from './PracticeModal';
import Legend from './Legend';
import SlideVisualizer from './SlideVisualizer';
import { solveArden } from '../utils/ardenSolver';
import { solveStateElimination } from '../utils/stateEliminationSolver';

export default function CanvasStudio({ onExit }) {
  const [nodes, setNodes] = useState([
    { id: 'q0', label: 'q0', type: 'start', x: 150, y: 200 },
    { id: 'q1', label: 'q1', type: 'accept', x: 450, y: 200 },
  ]);
  const [transitions, setTransitions] = useState([
    { from: 'q0', to: 'q1', symbol: 'a' }
  ]);
  
  // Counter ref ensures every state gets a unique ID even after deletions
  const nodeCounterRef = useRef(2);

  const [draggedNode, setDraggedNode] = useState(null);
  const [selectedAnchor, setSelectedAnchor] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [activeSolution, setActiveSolution] = useState(null);

  const canvasRef = useRef(null);

  const addNode = (type) => {
    const nextId = `q${nodeCounterRef.current}`;
    nodeCounterRef.current += 1;
    
    setNodes((prev) => [
      ...prev,
      { id: nextId, label: nextId, type, x: 200 + (prev.length * 40) % 400, y: 200 }
    ]);
  };

  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
  };

  const handleMouseMove = (e) => {
    if (!draggedNode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodes((prev) => prev.map((n) => (n.id === draggedNode ? { ...n, x, y } : n)));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleAnchorClick = (e, nodeId) => {
    e.stopPropagation();
    if (!selectedAnchor) {
      setSelectedAnchor(nodeId);
    } else {
      const symbol = prompt("Enter transition symbol(s):", "a");
      if (symbol) {
        setTransitions((prev) => [...prev, { from: selectedAnchor, to: nodeId, symbol }]);
      }
      setSelectedAnchor(null);
    }
  };

  // State deletion handler
  const handleDeleteNode = (e, nodeId) => {
    e.stopPropagation();
    e.preventDefault();

    setHoveredNode(null);
    setDraggedNode(null);

    // Remove state
    setNodes((prevNodes) => prevNodes.filter((n) => n.id !== nodeId));
    // Remove attached edges
    setTransitions((prevTransitions) =>
      prevTransitions.filter((t) => t.from !== nodeId && t.to !== nodeId)
    );
  };

  // Edge deletion handler
  const handleDeleteEdge = (e, index) => {
    e.stopPropagation();
    e.preventDefault();

    setHoveredEdge(null);
    setTransitions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const startConversion = (method) => {
    setShowMethodModal(false);
    if (method === 'arden') {
      setActiveSolution(solveArden(nodes, transitions));
    } else {
      setActiveSolution(solveStateElimination(nodes, transitions));
    }
  };

  if (activeSolution) {
    return <SlideVisualizer solution={activeSolution} onExit={() => setActiveSolution(null)} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-obsidian relative select-none">
      {/* Top Bar Controls */}
      <div className="h-16 bg-surface border-b border-slate-800 px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <button onClick={() => addNode('start')} className="px-3 py-1.5 border-2 border-stateStart text-white text-xs font-bold rounded hover:bg-stateStart/20">
            + Start State
          </button>
          <button onClick={() => addNode('intermediate')} className="px-3 py-1.5 border-2 border-stateInter text-white text-xs font-bold rounded hover:bg-stateInter/20">
            + Intermediate State
          </button>
          <button onClick={() => addNode('accept')} className="px-3 py-1.5 border-2 border-stateAccept text-white text-xs font-bold rounded hover:bg-stateAccept/20">
            + Accept State
          </button>
          <button onClick={() => addNode('dead')} className="px-3 py-1.5 border-2 border-stateDead text-white text-xs font-bold rounded hover:bg-stateDead/20">
            + Dead State
          </button>
        </div>

        {/* Legend & AI Practice Trigger */}
        <div className="flex items-center gap-4">
          <Legend />
          <PracticeModal />
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div 
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 bg-canvasBg relative overflow-hidden"
      >
        <svg className="w-full h-full absolute inset-0">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="7" refX="32" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#9D7BFF" />
            </marker>
          </defs>

          {/* Transitions (Edges) */}
          {transitions.map((t, idx) => {
            const fromNode = nodes.find((n) => n.id === t.from);
            const toNode = nodes.find((n) => n.id === t.to);
            if (!fromNode || !toNode) return null;

            const isSelf = t.from === t.to;
            const isEdgeHovered = hoveredEdge === idx;

            let pathD = '';
            let labelX = 0;
            let labelY = 0;

            if (isSelf) {
              pathD = `M ${fromNode.x - 15} ${fromNode.y - 25} C ${fromNode.x - 30} ${fromNode.y - 70}, ${fromNode.x + 30} ${fromNode.y - 70}, ${fromNode.x + 15} ${fromNode.y - 25}`;
              labelX = fromNode.x;
              labelY = fromNode.y - 75;
            } else {
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const cx = (fromNode.x + toNode.x) / 2 + dy * 0.2;
              const cy = (fromNode.y + toNode.y) / 2 - dx * 0.2;
              pathD = `M ${fromNode.x} ${fromNode.y} Q ${cx} ${cy} ${toNode.x} ${toNode.y}`;
              labelX = cx;
              labelY = cy - 10;
            }

            return (
              <g 
                key={`edge-${t.from}-${t.to}-${idx}`}
                onMouseEnter={() => setHoveredEdge(idx)}
                onMouseLeave={() => setHoveredEdge(null)}
                className="cursor-pointer"
              >
                {/* Expand Hit Area */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" />

                {/* Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isEdgeHovered ? "#EF4444" : "#9D7BFF"}
                  strokeWidth="3"
                  markerEnd="url(#arrow)"
                />

                {/* Transition Label OR Delete Icon */}
                {!isEdgeHovered ? (
                  <text x={labelX} y={labelY} fill="#FFFFFF" fontWeight="bold" fontSize="16" textAnchor="middle">
                    {t.symbol}
                  </text>
                ) : (
                  <g
                    transform={`translate(${labelX - 12}, ${labelY - 16})`}
                    onClick={(e) => handleDeleteEdge(e, idx)}
                    onMouseDown={(e) => handleDeleteEdge(e, idx)}
                    className="cursor-pointer"
                  >
                    <rect width="24" height="24" rx="6" fill="#EF4444" />
                    <path
                      d="M 7,8 H 17 M 9,8 V 17 A 1,1 0 0,0 10,18 H 14 A 1,1 0 0,0 15,17 V 8 M 10,8 V 6 A 1,1 0 0,1 11,5 H 13 A 1,1 0 0,1 14,6 V 8"
                      stroke="#FFFFFF"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes (States) */}
          {nodes.map((node) => {
            const isNodeHovered = hoveredNode === node.id;
            
            let strokeColor = "#9D7BFF";
            if (node.type === 'start') strokeColor = "#818CF8";
            if (node.type === 'accept') strokeColor = "#22C55E";
            if (node.type === 'dead') strokeColor = "#EF4444";

            return (
              <g
                key={node.id}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-grab active:cursor-grabbing"
              >
                {/* Start Arrow */}
                {node.type === 'start' && (
                  <path
                    d={`M ${node.x - 50},${node.y} L ${node.x - 30},${node.y}`}
                    stroke="#818CF8"
                    strokeWidth="3"
                    markerEnd="url(#arrow)"
                  />
                )}

                {/* Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="28"
                  fill={isNodeHovered ? "#26131C" : "#161224"}
                  stroke={isNodeHovered ? "#EF4444" : strokeColor}
                  strokeWidth="2.5"
                  className="transition-colors duration-150"
                />

                {/* Inner Circle for Accept States */}
                {node.type === 'accept' && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="22"
                    fill="none"
                    stroke={isNodeHovered ? "#EF4444" : strokeColor}
                    strokeWidth="1.5"
                  />
                )}

                {/* State Label OR Trash Icon Inside Node */}
                {!isNodeHovered ? (
                  <text
                    x={node.x}
                    y={node.y + 5}
                    fill="#FFFFFF"
                    fontSize="15"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {node.label}
                  </text>
                ) : (
                  <g
                    transform={`translate(${node.x - 12}, ${node.y - 12})`}
                    onClick={(e) => handleDeleteNode(e, node.id)}
                    onMouseDown={(e) => handleDeleteNode(e, node.id)}
                    className="cursor-pointer"
                  >
                    <path
                      d="M 4,6 H 20 M 7,6 V 17 A 1,1 0 0,0 8,18 H 16 A 1,1 0 0,0 17,17 V 6 M 9,6 V 4 A 1,1 0 0,1 10,3 H 14 A 1,1 0 0,1 15,4 V 6"
                      stroke="#EF4444"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>
                )}

                {/* Cardinal Anchor Dots */}
                {[
                  { x: node.x, y: node.y - 28 },
                  { x: node.x, y: node.y + 28 },
                  { x: node.x + 28, y: node.y },
                  { x: node.x - 28, y: node.y }
                ].map((anchor, i) => (
                  <circle
                    key={i}
                    cx={anchor.x}
                    cy={anchor.y}
                    r="5"
                    fill="#C4B5FD"
                    opacity={isNodeHovered ? 0.4 : 0}
                    className="transition-opacity duration-150 cursor-pointer hover:!opacity-100"
                    onClick={(e) => handleAnchorClick(e, node.id)}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Action Button */}
      <button
        onClick={() => setShowMethodModal(true)}
        className="absolute bottom-8 right-8 bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl shadow-2xl text-lg tracking-wider z-20"
      >
        GENERATE REGEX
      </button>

      {/* Conversion Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border-2 border-slate-700 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-6">Select Conversion Method</h3>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => startConversion('arden')}
                className="w-full py-4 bg-lilac text-obsidian font-extrabold rounded-xl hover:bg-white transition"
              >
                USING ARDEN'S THEOREM
              </button>
              <button
                onClick={() => startConversion('elimination')}
                className="w-full py-4 bg-surface border-2 border-lilac text-lilac font-extrabold rounded-xl hover:bg-lilac hover:text-obsidian transition"
              >
                USING STATE ELIMINATION METHOD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}