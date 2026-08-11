export const agentDefinitions = [
  { key: 'market_research', name: 'Market Research Agent', outputFile: 'market_report.md', dependencies: [] },
  { key: 'competitor_analysis', name: 'Competitor Analysis Agent', outputFile: 'competitor_report.md', dependencies: [] },
  { key: 'opportunity_discovery', name: 'Opportunity Discovery Agent', outputFile: 'opportunity_report.md', dependencies: [] },
  { key: 'product_strategy', name: 'Product Strategy Agent', outputFile: 'product_strategy.md', dependencies: ['market_research', 'competitor_analysis', 'opportunity_discovery'] },
  { key: 'prd', name: 'PRD Agent', outputFile: 'prd.md', dependencies: ['product_strategy'] },
  { key: 'technical_architect', name: 'Technical Architect Agent', outputFile: 'architecture.md', dependencies: ['product_strategy'] },
  { key: 'revenue_model', name: 'Revenue Model Agent', outputFile: 'revenue_model.md', dependencies: ['prd', 'technical_architect'] },
  { key: 'gtm', name: 'GTM Agent', outputFile: 'gtm.md', dependencies: ['prd', 'technical_architect'] },
  { key: 'financial_forecast', name: 'Financial Forecast Agent', outputFile: 'financials.md', dependencies: ['prd', 'technical_architect'] },
  { key: 'investor', name: 'Investor Agent', outputFile: 'investor_report.md', dependencies: ['revenue_model', 'gtm', 'financial_forecast'] },
  { key: 'pitch_deck', name: 'Pitch Deck Agent', outputFile: 'pitch_deck.md', dependencies: ['investor'] }
];


