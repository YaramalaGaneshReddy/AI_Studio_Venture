/**
 * agentPrompts.js
 *
 * Improvements over original:
 *  - Upstream agent outputs are summarized to a bullet-point digest (max 5 bullets,
 *    first 120 chars each) instead of raw full text — keeps prompt tokens lean.
 *  - Search signals are pre-truncated here as well (200 chars per result).
 *  - Total injected context is capped at CONTEXT_CHAR_LIMIT to prevent token blowout
 *    in synthesis agents that have multiple upstream deps.
 */

const CONTEXT_CHAR_LIMIT = 1800; // max chars of upstream context to inject per prompt

const responsibilities = {
  market_research:       ['TAM', 'SAM', 'SOM', 'Market trends', 'Industry analysis'],
  competitor_analysis:   ['Competitor discovery', 'Feature comparison', 'Pricing comparison', 'SWOT analysis'],
  opportunity_discovery: ['Market gaps', 'Underserved segments', 'Niche discovery'],
  product_strategy:      ['User personas', 'User stories', 'MVP definition', 'Feature prioritization'],
  prd:                   ['Product Requirement Document', 'Functional requirements', 'Non-functional requirements', 'Acceptance criteria'],
  technical_architect:   ['System design', 'Folder structure', 'Database schema', 'API contracts'],
  revenue_model:         ['Pricing models', 'Revenue streams', 'Subscription plans'],
  financial_forecast:    ['Cost forecast', 'Revenue forecast', 'Break-even analysis'],
  gtm:                   ['Launch plan', 'Marketing channels', 'Acquisition strategy'],
  investor:              ['Startup score', 'Investment readiness', 'Risks'],
  pitch_deck:            ['10-15 pitch deck slides', 'Narrative flow', 'Investor-ready slide bullets']
};

/**
 * Summarize a prior agent report to a compact bullet digest.
 * Extracts up to maxBullets lines that look like meaningful content
 * (headers, bullet points, short sentences) and caps each at maxCharsPer.
 */
function summarizeReport(text, maxBullets = 5, maxCharsPer = 120) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 20 && !l.startsWith('```'));

  const bullets = lines.slice(0, maxBullets).map((l) => {
    // Strip markdown heading hashes and bullet chars for cleaner reading
    const clean = l.replace(/^#+\s*/, '').replace(/^[-*•]\s*/, '').trim();
    return `• ${clean.slice(0, maxCharsPer)}${clean.length > maxCharsPer ? '…' : ''}`;
  });

  return bullets.join('\n');
}

export function buildAgentPrompt(project, agent, searchSignal = '') {
  const deps = agent.dependencies || [];

  // Collect outputs from upstream dependencies that are completed/awaiting approval
  const relevantRuns = project.agentRuns.filter(
    (run) => deps.includes(run.key) && run.output && ['completed', 'awaiting_approval'].includes(run.status)
  );

  // Build a compact digest of prior reports — never dump raw full text
  let priorContext = '';
  if (relevantRuns.length > 0) {
    const sections = relevantRuns.map((run) => {
      const digest = summarizeReport(run.output);
      return `### ${run.name} (digest)\n${digest}`;
    });
    const rawContext = sections.join('\n\n');
    // Hard-cap the total injected context
    priorContext = rawContext.length > CONTEXT_CHAR_LIMIT
      ? rawContext.slice(0, CONTEXT_CHAR_LIMIT) + '\n…[context capped for speed]'
      : rawContext;
  } else {
    priorContext = 'No prior dependency inputs needed.';
  }

  // Search signal is already truncated by search.service.js (200 chars/result),
  // but add a hard cap here as a safety net
  const trimmedSignal = searchSignal.length > 800
    ? searchSignal.slice(0, 800) + '\n…[signal truncated]'
    : searchSignal;

  const searchSection = trimmedSignal
    ? `\nReal-Time Market Intelligence (use as supporting evidence only):\n${trimmedSignal}\n`
    : '';

  return `You are the ${agent.name} in an AI Venture Studio. Create a concise, investor-grade markdown report.

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
${searchSection}
Prior Agent Context (digested summaries):
${priorContext}

Instructions:
Generate a crisp, high-value Markdown report with clear headers, key metrics, structured findings, and actionable recommendations. Do not repeat the input prompt context verbatim. Be concise — quality over length.
`;
}

export function buildBoardroomPrompt(project, question, role) {
  return `You are the ${role} Agent in a startup boardroom. Answer the founder's question from your role's perspective.

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
