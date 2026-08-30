import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function DfaCanvas({ elements }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !elements) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#0f172a',
            'border-width': 3,
            'border-color': '#a855f7',
            'label': 'data(id)',
            'color': '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '14px',
            'font-weight': 'bold',
            'width': 45,
            'height': 45
          }
        },
        {
          selector: 'node[type = "start"]',
          style: {
            'border-color': '#ef4444'
          }
        },
        {
          selector: 'node[type = "accept"]',
          style: {
            'border-color': '#22c55e'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#8b5cf6',
            'target-arrow-color': '#8b5cf6',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'color': '#ffffff',
            'font-size': '12px',
            'text-background-color': '#1e1b4b',
            'text-background-opacity': 1,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle'
          }
        }
      ],
      layout: {
        name: 'grid',
        rows: 2
      }
    });

    return () => cy.destroy();
  }, [elements]);

  return <div ref={containerRef} style={{ width: '100%', height: '240px', background: '#05070f', borderRadius: '8px' }} />;
}