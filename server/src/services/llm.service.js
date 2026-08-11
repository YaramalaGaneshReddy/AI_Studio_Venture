export async function generateWithOllama(prompt, options = {}) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = options.model || process.env.OLLAMA_MODEL || 'llama3';
  const timeoutMs = options.timeoutMs || 4000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          num_predict: options.num_predict || 300,
          temperature: 0.7
        }
      })
    });

    clearTimeout(timer);

    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const data = await response.json();
    return {
      content: data.response?.trim() || fallbackResponse(prompt),
      tokenUsage: estimateTokens(prompt + (data.response || ''))
    };
  } catch (_error) {
    clearTimeout(timer);
    const content = fallbackResponse(prompt);
    return { content, tokenUsage: estimateTokens(prompt + content) };
  }
}

function fallbackResponse(prompt) {
  const startup = prompt.match(/Name: (.*)/)?.[1] || 'the startup';
  const role = prompt.match(/You are the (.*?) in/)?.[1] || prompt.match(/You are the (.*?) Agent/)?.[1] || 'AI Agent';
  const industry = prompt.match(/Industry: (.*)/)?.[1] || 'Tech';
  const targetUsers = prompt.match(/Target users: (.*)/)?.[1] || 'Early adopters';
  const budget = prompt.match(/Budget: (.*)/)?.[1] || 'Seed budget';

  return `# ${role} Report

## Executive Summary
${startup} is positioned in the ${industry} space serving ${targetUsers}. Operating under a budget of ${budget}, the strategy focuses on high-impact validation, precise execution, and capital efficiency.

## Strategic Framework & Metrics
- **Target Segment:** ${targetUsers}
- **Industry Dynamics:** ${industry}
- **Budget Allocation:** ${budget} allocated to core product development and initial acquisition channels.

## Key Findings
- **Market Demand & Fit:** Initial demand must be validated through direct user feedback, search query signals, and competitor benchmarking.
- **Product & Execution:** Focus development strictly on the MVP scope to reduce initial burn and speed up time-to-market.
- **Competitive Edge:** Differentiate with targeted value propositions, specialized features, and agile deployment cycles.

## Actionable Next Steps
1. Execute 10 founder-led customer discovery interviews within the target segment.
2. Deploy the MVP workflow to measure user activation and initial retention.
3. Refine pricing model based on verified customer willingness to pay.`;
}

function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).length * 1.35);
}
