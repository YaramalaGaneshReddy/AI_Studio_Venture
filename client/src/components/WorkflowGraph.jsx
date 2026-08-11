import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { statusStyles } from '../utils/status';

// DAG Level Assignment (Waves)
const agentLevels = {
  market_research: { wave: 0, col: 0 },
  competitor_analysis: { wave: 0, col: 1 },
  opportunity_discovery: { wave: 0, col: 2 },
  product_strategy: { wave: 1, col: 1 },
  prd: { wave: 2, col: 0.5 },
  technical_architect: { wave: 2, col: 1.5 },
  revenue_model: { wave: 3, col: 0 },
  gtm: { wave: 3, col: 1 },
  financial_forecast: { wave: 3, col: 2 },
  investor: { wave: 4, col: 1 },
  pitch_deck: { wave: 5, col: 1 }
};

const xSpacing = 220;
const ySpacing = 110;

export function WorkflowGraph({ agents = [] }) {
  const nodes = agents.map((agent) => {
    const layout = agentLevels[agent.key] || { wave: 0, col: 0 };
    return {
      id: agent.key,
      position: {
        x: layout.col * xSpacing + 40,
        y: layout.wave * ySpacing + 40
      },
      data: {
        label: `${agent.name}${agent.runtimeMs ? ` (${(agent.runtimeMs / 1000).toFixed(1)}s)` : ''}`
      },
      style: {
        width: 190,
        fontSize: 12,
        borderRadius: 8,
        border: agent.status === 'failed' ? '1px solid #EF4444' : '1px solid #E5E7EB',
        padding: 10,
        color: '#111827',
        background:
          agent.status === 'running'
            ? '#EFF6FF'
            : agent.status === 'completed'
            ? '#ECFDF5'
            : agent.status === 'awaiting_approval'
            ? '#FEF3C7'
            : agent.status === 'failed'
            ? '#FEF2F2'
            : '#FFFFFF',
        boxShadow: agent.status === 'running' ? '0 8px 25px rgba(37, 99, 235, 0.2)' : '0 4px 12px rgba(17, 24, 39, 0.04)'
      }
    };
  });

  // Generate dynamic DAG edges based on actual dependencies
  const edges = [];
  agents.forEach((agent) => {
    const deps = agent.dependencies || [];
    deps.forEach((depKey) => {
      const sourceAgent = agents.find((a) => a.key === depKey);
      edges.push({
        id: `${depKey}-${agent.key}`,
        source: depKey,
        target: agent.key,
        animated: agent.status === 'running' || sourceAgent?.status === 'running',
        style: { stroke: agent.status === 'running' ? '#3B82F6' : '#CBD5E1', strokeWidth: 1.5 }
      });
    });
  });

  return (
    <div className="h-[620px] overflow-hidden rounded-md border border-line bg-white">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background gap={18} color="#E5E7EB" />
        <Controls />
      </ReactFlow>
      <div className="pointer-events-none absolute hidden">
        {Object.keys(statusStyles).join(',')}
      </div>
    </div>
  );
}

