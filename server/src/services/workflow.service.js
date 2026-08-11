import { buildAgentPrompt } from '../prompts/agentPrompts.js';
import { generateWithOllama } from './llm.service.js';
import { calculateStartupScore } from './scoring.service.js';
import { upsertReport } from './report.service.js';
import { fetchSearchSignal } from './search.service.js';

// Agents that benefit from real-time web search context
const SEARCH_AGENTS = new Set(['market_research', 'competitor_analysis']);

const saveProject = async (p) => {
  if (typeof p.save === 'function') await p.save();
};

/**
 * Checks if an agent's dependencies are satisfied.
 */
function areDependenciesMet(agentRun, allRuns) {
  const deps = agentRun.dependencies || [];
  if (deps.length === 0) return true;
  return deps.every((depKey) => {
    const parent = allRuns.find((r) => r.key === depKey);
    return parent && ['completed', 'awaiting_approval'].includes(parent.status);
  });
}

/**
 * Helper to run a single agent with retry logic, execution timer, and detailed logging.
 */
async function executeAgent(project, agentRun, mode) {
  const startedAt = Date.now();
  agentRun.status = 'running';
  agentRun.error = undefined;
  agentRun.startedAt = new Date();
  await saveProject(project);

  console.log(`[AGENT START] ${agentRun.name} (${agentRun.key}) | Dependencies: [${(agentRun.dependencies || []).join(', ')}]`);

  const maxRetries = 1;
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      attempt++;
      // Fetch live search signal for market/competitor agents
      let searchSignal = '';
      if (SEARCH_AGENTS.has(agentRun.key)) {
        const searchQuery = `${project.startupName} ${project.industry} ${project.country} market analysis 2024`;
        console.log(`[SEARCH] Fetching market signals for ${agentRun.key}...`);
        searchSignal = await fetchSearchSignal(searchQuery, 5);
        if (searchSignal) console.log(`[SEARCH] Got ${searchSignal.split('\n').length} signal lines for ${agentRun.key}`);
      }
      const prompt = buildAgentPrompt(project, agentRun, searchSignal);
      const result = await generateWithOllama(prompt, { timeoutMs: 90000, num_predict: 1500 });

      agentRun.output = result.content;
      agentRun.tokenUsage = result.tokenUsage;
      agentRun.runtimeMs = Date.now() - startedAt;
      agentRun.completedAt = new Date();
      agentRun.status = mode === 'auto' ? 'completed' : 'awaiting_approval';
      if (mode === 'auto') agentRun.approvedAt = new Date();

      await upsertReport({ user: project.user, project, agentRun });
      await saveProject(project);

      console.log(`[AGENT COMPLETE] ${agentRun.name} | Runtime: ${agentRun.runtimeMs}ms | Tokens: ${agentRun.tokenUsage}`);
      return { success: true, agentKey: agentRun.key };
    } catch (err) {
      lastError = err;
      agentRun.retryCount = (agentRun.retryCount || 0) + 1;
      console.warn(`[AGENT RETRY] ${agentRun.name} attempt ${attempt} failed: ${err.message}`);
    }
  }

  // If retries failed, fail only this agent
  agentRun.status = 'failed';
  agentRun.error = lastError?.message || 'Execution failed';
  agentRun.runtimeMs = Date.now() - startedAt;
  await saveProject(project);
  console.error(`[AGENT FAILED] ${agentRun.name} after ${attempt} attempts: ${agentRun.error}`);
  return { success: false, agentKey: agentRun.key, error: agentRun.error };
}

/**
 * Main DAG Workflow Runner
 * Executes ready agents in parallel (waves) without blocking unrelated nodes.
 */
export async function runWorkflow(project, { mode = 'manual', autoMode = false } = {}) {
  mode = autoMode ? 'auto' : mode;
  project.status = 'running';
  await saveProject(project);

  let keepGoing = true;

  while (keepGoing) {
    // 1. Identify all agents currently pending/failed that have their dependencies met
    const readyAgents = project.agentRuns.filter(
      (run) => ['pending', 'failed'].includes(run.status) && areDependenciesMet(run, project.agentRuns)
    );

    // If no agents are ready to run, check overall status
    if (readyAgents.length === 0) {
      const anyRunning = project.agentRuns.some((r) => r.status === 'running');
      const anyAwaiting = project.agentRuns.some((r) => r.status === 'awaiting_approval');
      const anyFailed = project.agentRuns.some((r) => r.status === 'failed');
      const allDone = project.agentRuns.every((r) => ['completed'].includes(r.status));

      if (allDone) {
        project.status = 'completed';
      } else if (anyAwaiting) {
        project.status = 'awaiting_approval';
      } else if (anyFailed && !anyRunning) {
        project.status = 'failed';
      }

      project.startupScore = calculateStartupScore(project);
      await saveProject(project);
      return project;
    }

    console.log(`[DAG DISPATCH] Launching ${readyAgents.length} ready agents in parallel: ${readyAgents.map((a) => a.key).join(', ')}`);

    // 2. Dispatch all ready agents in parallel!
    await Promise.allSettled(readyAgents.map((agentRun) => executeAgent(project, agentRun, mode)));

    project.startupScore = calculateStartupScore(project);
    await saveProject(project);

    // In manual mode, pause after running current parallel wave to allow user inspection/approval if awaiting approval
    if (mode !== 'auto') {
      const awaiting = project.agentRuns.some((r) => r.status === 'awaiting_approval');
      if (awaiting) {
        project.status = 'awaiting_approval';
        await saveProject(project);
        return project;
      }
    }
  }

  return project;
}

export async function decideAgent(project, agentKey, { decision, editedContent }) {
  const agentRun = project.agentRuns.find((run) => run.key === agentKey);
  if (!agentRun) throw new Error('Agent run not found');

  if (decision === 'approve') {
    agentRun.status = 'completed';
    agentRun.approvedAt = new Date();
  }

  if (decision === 'edit') {
    agentRun.output = editedContent || agentRun.output;
    agentRun.status = 'completed';
    agentRun.approvedAt = new Date();
  }

  if (decision === 'regenerate') {
    agentRun.status = 'pending';
    agentRun.output = '';
    agentRun.error = undefined;
  }

  project.status = 'running';
  project.startupScore = calculateStartupScore(project);
  await upsertReport({ user: project.user, project, agentRun });
  await saveProject(project);

  return runWorkflow(project, { mode: 'manual' });
}
