import { Report } from '../models/Report.js';

export async function upsertReport({ user, project, agentRun }) {
  if (Report.db.readyState !== 1) return null;
  return Report.findOneAndUpdate(
    { user, project: project._id || project.id, agentKey: agentRun.key },
    {
      user,
      project: project._id || project.id,
      agentKey: agentRun.key,
      outputFile: agentRun.outputFile,
      content: agentRun.output,
      embeddingRef: `doc_${project._id || project.id}_${agentRun.key}`
    },
    { upsert: true, new: true }
  );
}

export function compileMarkdown(project) {
  const reports = project.agentRuns
    .map((run) => `## ${run.name}\n\n${run.output || '_Pending_'}\n`)
    .join('\n---\n');

  return `# ${project.startupName} Venture Blueprint

## Executive Summary
${project.idea}

## Startup Context
- Industry: ${project.industry}
- Target users: ${project.targetUsers}
- Country: ${project.country}
- Budget: ${project.budget}
- Timeline: ${project.timeline}
- Startup Score: ${project.startupScore?.overall || 0}/100

---

${reports}
`;
}
