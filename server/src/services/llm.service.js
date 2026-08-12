/**
 * llm.service.js
 *
 * Provider priority (auto-detected from env vars):
 *   1. Google Gemini  — if GEMINI_API_KEY is set  (~1-3s per agent, free tier)
 *   2. Ollama         — if OLLAMA_BASE_URL is reachable (~30-90s per agent, local)
 *   3. Template       — instant hardcoded fallback (no AI, but fast)
 *
 * Per-agent model routing, generation caps, and fallback visibility logging
 * are preserved from the previous version.
 */

// ─── Agent Classification ─────────────────────────────────────────────────────
const FAST_AGENTS = new Set([
  'market_research', 'competitor_analysis', 'opportunity_discovery',
  'product_strategy', 'prd', 'revenue_model', 'gtm'
]);

const PRIMARY_AGENTS = new Set([
  'technical_architect', 'financial_forecast', 'investor', 'pitch_deck'
]);

// ─── Per-agent generation params (used for Ollama; Gemini ignores num_ctx) ───
const AGENT_PARAMS = {
  market_research:       { num_predict: 400, num_ctx: 2048, temperature: 0.3, maxOutputTokens: 600 },
  competitor_analysis:   { num_predict: 400, num_ctx: 2048, temperature: 0.3, maxOutputTokens: 600 },
  opportunity_discovery: { num_predict: 350, num_ctx: 2048, temperature: 0.4, maxOutputTokens: 500 },
  product_strategy:      { num_predict: 450, num_ctx: 2048, temperature: 0.4, maxOutputTokens: 600 },
  prd:                   { num_predict: 500, num_ctx: 2048, temperature: 0.3, maxOutputTokens: 700 },
  technical_architect:   { num_predict: 700, num_ctx: 3072, temperature: 0.3, maxOutputTokens: 900 },
  revenue_model:         { num_predict: 400, num_ctx: 2048, temperature: 0.4, maxOutputTokens: 600 },
  financial_forecast:    { num_predict: 700, num_ctx: 3072, temperature: 0.3, maxOutputTokens: 900 },
  gtm:                   { num_predict: 450, num_ctx: 2048, temperature: 0.4, maxOutputTokens: 600 },
  investor:              { num_predict: 800, num_ctx: 3072, temperature: 0.4, maxOutputTokens: 1000 },
  pitch_deck:            { num_predict: 1000, num_ctx: 4096, temperature: 0.5, maxOutputTokens: 1200 }
};
const DEFAULT_PARAMS = { num_predict: 500, num_ctx: 2048, temperature: 0.4, maxOutputTokens: 700 };

// ─── Gemini model selection ───────────────────────────────────────────────────
// Flash is free, very fast, and good enough for all agent tasks.
// Pro can be used for synthesis agents if the user wants higher quality.
const GEMINI_FAST_MODEL    = 'gemini-2.0-flash';
const GEMINI_PRIMARY_MODEL = 'gemini-2.0-flash'; // or 'gemini-1.5-pro' for higher quality

function selectGeminiModel(agentKey) {
  if (PRIMARY_AGENTS.has(agentKey)) return GEMINI_PRIMARY_MODEL;
  return GEMINI_FAST_MODEL;
}

// ─── Ollama model selection ───────────────────────────────────────────────────
function selectOllamaModel(agentKey) {
  const primary = process.env.OLLAMA_MODEL      || 'llama3';
  const fast    = process.env.OLLAMA_FAST_MODEL || 'llama3.2:3b';
  if (PRIMARY_AGENTS.has(agentKey)) return primary;
  if (FAST_AGENTS.has(agentKey))    return fast;
  return primary;
}

// ─── Provider detection ───────────────────────────────────────────────────────
function hasGeminiKey() {
  const key = process.env.GEMINI_API_KEY || '';
  return key.length > 10;
}

// ─── Main public function ─────────────────────────────────────────────────────
/**
 * Generate content using the best available provider.
 * @param {string} prompt
 * @param {object} options
 * @param {string} [options.agentKey]   - Agent type key (routing + params)
 * @param {number} [options.timeoutMs]  - Ollama-only timeout override
 */
export async function generateWithOllama(prompt, options = {}) {
  const agentKey = options.agentKey || '';
  const params   = AGENT_PARAMS[agentKey] || DEFAULT_PARAMS;

  // 1. Try Gemini first if API key is present (fastest)
  if (hasGeminiKey()) {
    const result = await generateWithGemini(prompt, agentKey, params);
    if (result) return result;
  }

  // 2. Try Ollama
  const ollamaResult = await generateWithOllamaInternal(prompt, agentKey, params, options.timeoutMs);
  if (ollamaResult) return ollamaResult;

  // 3. Hardcoded template fallback
  console.warn(`[LLM FALLBACK] agent="${agentKey}" → all providers failed, using template`);
  const content = fallbackResponse(prompt, agentKey);
  return { content, tokenUsage: estimateTokens(prompt + content), usedFallback: true, provider: 'template' };
}

// ─── Gemini Provider ──────────────────────────────────────────────────────────
async function generateWithGemini(prompt, agentKey, params) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model  = selectGeminiModel(agentKey);
  const url    = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const started = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000); // 30s timeout for Gemini

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: params.maxOutputTokens,
          temperature:     params.temperature,
          topP:            0.8
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      })
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.warn(`[GEMINI FAIL] agent="${agentKey}" HTTP ${response.status}: ${errBody.slice(0, 120)}`);
      return null;
    }

    const data    = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!content) {
      console.warn(`[GEMINI FAIL] agent="${agentKey}" empty response after ${Date.now() - started}ms`);
      return null;
    }

    console.log(`[GEMINI OK] agent="${agentKey}" model="${model}" elapsed=${Date.now() - started}ms tokens≈${estimateTokens(content)}`);
    return { content, tokenUsage: estimateTokens(prompt + content), usedFallback: false, provider: 'gemini' };

  } catch (err) {
    const elapsed = Date.now() - started;
    const reason  = err.name === 'AbortError' ? `timeout after ${elapsed}ms` : err.message;
    console.warn(`[GEMINI FAIL] agent="${agentKey}" ${reason}`);
    return null;
  }
}

// ─── Ollama Provider ──────────────────────────────────────────────────────────
async function generateWithOllamaInternal(prompt, agentKey, params, timeoutMs = 45000) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model   = selectOllamaModel(agentKey);
  const started = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        stream:  false,
        options: {
          num_predict: params.num_predict,
          num_ctx:     params.num_ctx,
          temperature: params.temperature
        }
      })
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.warn(`[OLLAMA FAIL] agent="${agentKey}" model="${model}" HTTP ${response.status} → trying template`);
      return null;
    }

    const data    = await response.json();
    const content = data.response?.trim();

    if (!content) {
      console.warn(`[OLLAMA FAIL] agent="${agentKey}" empty response after ${Date.now() - started}ms`);
      return null;
    }

    console.log(`[OLLAMA OK] agent="${agentKey}" model="${model}" elapsed=${Date.now() - started}ms tokens≈${estimateTokens(content)}`);
    return { content, tokenUsage: estimateTokens(prompt + content), usedFallback: false, provider: 'ollama' };

  } catch (err) {
    clearTimeout(timer);
    const elapsed = Date.now() - started;
    const reason  = err.name === 'AbortError' ? `timeout after ${elapsed}ms` : `connection error: ${err.message}`;
    console.warn(`[OLLAMA FAIL] agent="${agentKey}" model="${model}" ${reason} → trying template`);
    return null;
  }
}

// ─── Fallback template ────────────────────────────────────────────────────────
function fallbackResponse(prompt, agentKey = '') {
  const startup     = prompt.match(/- Name: (.*)/)?.[1]         || prompt.match(/Startup: (.*)/)?.[1] || 'the startup';
  const role        = prompt.match(/You are the (.*?) in/)?.[1] || prompt.match(/You are the (.*?) Agent/)?.[1] || 'AI Agent';
  const industry    = prompt.match(/- Industry: (.*)/)?.[1]     || 'Tech';
  const targetUsers = prompt.match(/- Target users: (.*)/)?.[1] || 'Early adopters';
  const budget      = prompt.match(/- Budget: (.*)/)?.[1]       || 'Seed budget';
  const country     = prompt.match(/- Country: (.*)/)?.[1]      || 'Global';

  return `# ${role} Report
> ⚠️ *This report was generated using a fallback template (agent: \`${agentKey}\`). For real AI analysis, add \`GEMINI_API_KEY\` to your \`.env\` file or ensure Ollama is running with the required models.*

## Executive Summary
**${startup}** is positioned in the **${industry}** sector targeting **${targetUsers}** in **${country}**. With a budget of **${budget}**, the strategy focuses on rapid validation, lean execution, and efficient capital allocation.

## Strategic Overview
- **Primary Market:** ${industry} solutions for ${targetUsers}
- **Geographic Focus:** ${country}
- **Budget Strategy:** ${budget} allocated across product development, acquisition, and operations

## Key Findings
- **Market Opportunity:** The ${industry} sector shows growing demand from ${targetUsers} segments. Initial validation is recommended to confirm product-market fit.
- **Competitive Landscape:** Differentiation through specialized features, better UX, and targeted value propositions will be critical.
- **Execution Risk:** Focused MVP scope, milestone-based budgeting, and founder-led sales will reduce early-stage burn.

## Actionable Next Steps
1. Conduct 10+ customer discovery interviews within the ${targetUsers} segment to validate core assumptions.
2. Build and deploy a lean MVP targeting the highest-priority feature set within the first 60 days.
3. Establish 3 measurable KPIs (activation rate, retention, revenue) before scaling any acquisition channel.
4. Review and adjust the ${budget} allocation based on validated cost-per-acquisition data.`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).length * 1.35);
}
