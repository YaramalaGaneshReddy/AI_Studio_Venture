import { Report } from '../models/Report.js';
import { Project } from '../models/Project.js';
import { generateWithOllama } from './llm.service.js';

export async function searchMemory(userId, query) {
  const terms = meaningfulTerms(query);
  let reports = [];
  let projects = [];

  // 1. Try DB reports first
  if (Report.db.readyState === 1) {
    try {
      reports = await Report.find(
        { user: userId, $text: { $search: terms.join(' ') || query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(8);
    } catch (_e) {
      reports = [];
    }
  }

  if (reports.length) {
    return reports.map((report) => ({
      _id: report._id,
      title: report.title,
      snippet: snippet(report.content, query)
    }));
  }

  // 2. Fetch Projects (DB or MemoryStore)
  if (Project.db.readyState === 1) {
    projects = await Project.find({ user: userId }).sort({ updatedAt: -1 }).limit(10);
  } else {
    const { getMemoryProjects } = await import('./memoryStore.js');
    projects = getMemoryProjects()
      .filter((p) => p.user === userId)
      .slice(0, 10);
  }

  if (!projects.length) return [];

  // Filter projects by matching terms
  const matchedProjects = projects.filter((project) => {
    const haystack = `${project.startupName} ${project.idea} ${project.industry} ${project.targetUsers} ${project.country}`.toLowerCase();
    return terms.length ? terms.some((term) => haystack.includes(term)) : true;
  });

  // If term filtering was too strict, fallback to returning recent projects for contextual answer
  const finalProjects = matchedProjects.length ? matchedProjects : projects;

  return finalProjects.map((project) => ({
    _id: project._id || project.id,
    title: project.startupName,
    snippet: `Idea: ${project.idea} | Industry: ${project.industry} | Target users: ${project.targetUsers} | Country: ${project.country}`,
    sourceType: 'project'
  }));
}

export async function answerMemory(userId, query) {
  const results = await searchMemory(userId, query);
  if (!results.length) {
    return {
      answer: "I could not find any project or report memory for your account. Create a project in the Studio first, then ask again.",
      results: []
    };
  }

  const context = results.map((result, index) => `[${index + 1}] ${result.title}\n${result.snippet}`).join('\n\n');
  const prompt = `You are the RAG memory assistant for AI Venture Studio.

Answer the user's question using only the memory context below. If the answer is uncertain, say what you found and what is missing.

Question: ${query}

Memory context:
${context}

Return a concise direct answer and mention the source project/report names when useful.`;

  const { content } = await generateWithOllama(prompt);
  return { answer: content, results };
}

function snippet(content, query) {
  const clean = content.replace(/\s+/g, ' ');
  const firstTerm = meaningfulTerms(query)[0] || query.toLowerCase().split(/\s+/)[0] || '';
  const index = clean.toLowerCase().indexOf(firstTerm);
  const start = Math.max(index - 120, 0);
  return clean.slice(start, start + 320);
}

function meaningfulTerms(query = '') {
  const stopwords = new Set(['what', 'was', 'were', 'is', 'are', 'my', 'the', 'a', 'an', 'of', 'for', 'to', 'in', 'on', 'previous', 'last', 'idea', 'startup', 'project', 'tell', 'me', 'about']);
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopwords.has(term));
}
