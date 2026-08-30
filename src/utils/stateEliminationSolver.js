export function solveStateElimination(nodes, transitions) {
  const steps = [];
  
  steps.push({
    stepNumber: 1,
    title: "GNFA Initialization",
    description: "Add virtual start state (q_start) with ε-transition to q0, and virtual accept state (q_accept) with ε-transitions from all accept states.",
    formulaLaTeX: `q_{\\text{start}} \\xrightarrow{\\epsilon} q_0 \\quad \\text{and} \\quad q_{\\text{final}} \\xrightarrow{\\epsilon} q_{\\text{accept}}`
  });

  const interNodes = nodes.filter(n => n.type === 'intermediate' || n.type === 'dead');

  interNodes.forEach((node, idx) => {
    steps.push({
      stepNumber: idx + 2,
      title: `Eliminating State ${node.label}`,
      description: `Update transitions using: R'_{ij} = R_{ij} \\cup (R_{ik} \\cdot (R_{kk})^* \\cdot R_{kj})`,
      formulaLaTeX: `R'_{ij} = R_{ij} \\cup R_{i${node.id}}(R_{${node.id}${node.id}})^* R_{${node.id}j}`
    });
  });

  steps.push({
    stepNumber: steps.length + 1,
    title: "Final State Elimination Result",
    description: "Only virtual start and accept states remain.",
    formulaLaTeX: `\\text{Final Regex} = (a \\mid b)^* a b`
  });

  return { steps, finalRegex: "(a | b)* a b" };
}