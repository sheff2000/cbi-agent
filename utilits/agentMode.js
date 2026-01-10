// utilits/agentMode.js

export function normalizeAgentMode(mode, fallback = 'dev') {
  if (!mode) return fallback;
  const cleaned = String(mode).split('#')[0].trim();
  return cleaned || fallback;
}

export function getAgentMode(fallback = 'prod') {
  return normalizeAgentMode(process.env.AGENT_MODE, fallback);
}
