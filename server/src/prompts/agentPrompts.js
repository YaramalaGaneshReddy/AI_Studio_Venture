const responsibilities = {
  market_research: ['TAM', 'SAM', 'SOM', 'Market trends', 'Industry analysis'],
  competitor_analysis: ['Competitor discovery', 'Feature comparison', 'Pricing comparison', 'SWOT analysis'],
  opportunity_discovery: ['Market gaps', 'Underserved segments', 'Niche discovery'],
  product_strategy: ['User personas', 'User stories', 'MVP definition', 'Feature prioritization'],
  prd: ['Product Requirement Document', 'Functional requirements', 'Non-functional requirements', 'Acceptance criteria'],
  technical_architect: ['System design', 'Folder structure', 'Database schema', 'API contracts'],
  revenue_model: ['Pricing models', 'Revenue streams', 'Subscription plans'],
  financial_forecast: ['Cost forecast', 'Revenue forecast', 'Break-even analysis'],
  gtm: ['Launch plan', 'Marketing channels', 'Acquisition strategy'],
  investor: ['Startup score', 'Investment readiness', 'Risks'],
  pitch_deck: ['10-15 pitch deck slides', 'Narrative flow', 'Investor-ready slide bullets']
};

export function buildAgentPrompt(project, agent) {
  const deps = agent.dependencies || [];
  
  // Only include outputs from explicitly declared upstream dependencies
  const relevantRuns = project.agentRuns.filter(
    (run) => deps.includes(run.key) && run.output && ['completed', 'awaiting_approval'].includes(run.status)
  );

  const priorReports = relevantRuns
    .map((run) => {
      // Summarize report if lengthy to keep prompt compact and fast
      const text = run.output.length > 1500 ? run.output.slice(0, 1500) + '\n...[summary truncated for speed]...' : run.output;
      return `### ${run.name}\n${text}`;
    })
    .join('\n\n');

  return `
You are the ${agent.name} in an AI Venture Studio. Create a concise, investor-grade markdown report.

Startup Baseline:
- Name: ${project.startupName}
- Idea: ${project.idea}
- Industry: ${project.industry}
- Target users: ${project.targetUsers}
- Country: ${project.country}
- Budget: ${project.budget}
- Timeline: ${project.timeline}

Core Focus Areas:
${(responsibilities[agent.key] || []).map((item) => `- ${item}`).join('\n')}

Required Input Context:
${priorReports || 'No prior dependency inputs needed.'}

Instructions:
Generate a crisp, high-value Markdown report with clear headers, key metrics, structured findings, and actionable recommendations. Do not repeat the input prompt context verbatim.
`;
}

export function buildBoardroomPrompt(project, question, role) {
  return `
You are the ${role} Agent in a startup boardroom. Answer the founder's question from your role's perspective.

Startup: ${project.startupName}
Idea: ${project.idea}
Industry: ${project.industry}
Target users: ${project.targetUsers}
Country: ${project.country}
Budget: ${project.budget}
Timeline: ${project.timeline}

Question: ${question}

Give 3-5 crisp paragraphs with tradeoffs and a recommendation.
`;
}
