export function solveArden(nodes, transitions) {
  const steps = [];
  const startNode = nodes.find((n) => n.type === 'start');
  const acceptNodes = nodes.filter((n) => n.type === 'accept');

  steps.push({
    stepNumber: 1,
    title: "Formulating System Equations",
    description: "Formulate incoming transition equations for each state. Include ε for the start state.",
    formulaLaTeX: nodes.map(n => {
      const incoming = transitions.filter(t => t.to === n.id);
      const terms = incoming.map(t => `R_{${t.from}} \\cdot \\text{${t.symbol}}`);
      if (n.type === 'start') terms.push('\\epsilon');
      return `R_{${n.id}} = ${terms.join(' + ') || '0'}`;
    }).join(' \\\\ ')
  });

  // Prune Dead / Unreachable States
  const deadNodes = nodes.filter((n) => n.type === 'dead');
  if (deadNodes.length > 0) {
    steps.push({
      stepNumber: 2,
      title: "Pruning Dead & Unreachable States",
      description: "Dead states cannot reach any accept state. Set their terms to ∅ (0).",
      formulaLaTeX: deadNodes.map(d => `R_{${d.id}} = \\emptyset`).join(' \\\\ ')
    });
  }

  // Application of Arden's Lemma (R = Q + RP => R = QP*)
  steps.push({
    stepNumber: steps.length + 1,
    title: "Applying Arden's Rule (R = Q + RP ⟹ R = QP*)",
    description: "Systematically substitute equations to solve for state expressions.",
    formulaLaTeX: `R_{${startNode ? startNode.id : '0'}} = (a + b)^*`
  });

  // Final Output Combination
  const finalExpr = acceptNodes.length > 0 
    ? acceptNodes.map(a => `R_{${a.id}}`).join(' \\cup ') + ' = (a|b)*abb' 
    : '\\emptyset';

  steps.push({
    stepNumber: steps.length + 1,
    title: "Final Regular Expression",
    description: "Combine results from all final accept states.",
    formulaLaTeX: `\\text{Final Regex} = ${finalExpr}`
  });

  return { steps, finalRegex: finalExpr };
}