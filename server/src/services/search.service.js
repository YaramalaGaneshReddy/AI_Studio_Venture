/**
 * Search service — provides market context signals for agent prompts.
 * Priority: Tavily (when TAVILY_API_KEY configured) → DuckDuckGo → empty string.
 * Search failure NEVER crashes the workflow; it returns '' and logs a warning.
 */

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

/**
 * Fetch a concise market signal string for injection into an agent prompt.
 * @param {string} query - Search query
 * @param {number} maxResults - Max results to include
 * @returns {Promise<string>} Compact multi-line signal text, or '' on failure
 */
export async function fetchSearchSignal(query, maxResults = 5) {
  const tavilyKey = process.env.TAVILY_API_KEY;

  if (tavilyKey && tavilyKey.trim().length > 10) {
    try {
      return await searchWithTavily(query, tavilyKey, maxResults);
    } catch (err) {
      console.warn(`[SEARCH] Tavily failed (${err.message}), trying DuckDuckGo fallback`);
    }
  }

  try {
    return await searchWithDuckDuckGo(query, maxResults);
  } catch (err) {
    console.warn(`[SEARCH] DuckDuckGo also failed (${err.message}), skipping search signal`);
  }

  return '';
}

async function searchWithTavily(query, apiKey, maxResults) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(TAVILY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: maxResults,
        include_answer: false
      })
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);
    const data = await res.json();
    const results = (data.results || []).slice(0, maxResults);
    if (!results.length) return '';
    return results
      .map((r, i) => `[${i + 1}] ${r.title}: ${(r.content || r.snippet || '').slice(0, 200)}`)
      .join('\n');
  } finally {
    clearTimeout(timer);
  }
}

async function searchWithDuckDuckGo(query, maxResults) {
  // duck-duck-scrape may not be available in all envs; dynamic import guards against missing module
  const { search } = await import('duck-duck-scrape');
  const results = await search(query, { safeSearch: 0 });
  const hits = (results.results || []).slice(0, maxResults);
  if (!hits.length) return '';
  return hits
    .map((r, i) => `[${i + 1}] ${r.title}: ${(r.description || '').slice(0, 200)}`)
    .join('\n');
}
