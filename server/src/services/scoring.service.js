export function calculateStartupScore(project) {
  const completed = project.agentRuns.filter((run) => ['completed', 'awaiting_approval'].includes(run.status)).length;
  const progress = completed / Math.max(project.agentRuns.length, 1);
  const ideaDepth = Math.min(1, project.idea.length / 600);
  const hasBudget = project.budget ? 1 : 0.4;
  const marketDemand = Math.round(45 + progress * 35 + ideaDepth * 20);
  const competition = Math.round(65 - progress * 10);
  const revenuePotential = Math.round(40 + progress * 35 + hasBudget * 15);
  const technicalFeasibility = Math.round(55 + progress * 25);
  const executionComplexity = Math.round(70 - progress * 20);
  const overall = Math.round((marketDemand + revenuePotential + technicalFeasibility + (100 - competition) + (100 - executionComplexity)) / 5);

  return { marketDemand, competition, revenuePotential, technicalFeasibility, executionComplexity, overall };
}
