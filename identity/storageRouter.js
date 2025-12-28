// /identity/storageRouter.js
import { loadIdentity as loadDev, saveIdentity as saveDev } from './storage/devStorage.js';
import { loadIdentity as loadProd, saveIdentity as saveProd } from './storage/prodStorage.js';

export function loadIdentity() {
  const mode = process.env.AGENT_MODE || 'dev';
  return mode === 'prod' ? loadProd() : loadDev();
}

export function saveIdentity(obj) {
  const current = loadIdentity() || {};
  const merged = { ...current, ...obj };

  const mode = process.env.AGENT_MODE || 'dev';
  return mode === 'prod'
    ? saveProd(merged)
    : saveDev(merged);
}

