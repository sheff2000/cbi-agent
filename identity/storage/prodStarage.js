// /identity/storage/prodStorage.js

import fs from 'fs';

const FILE = '/opt/js-agent/agent-identity.json';

export function loadIdentity() {
  try {
    if (!fs.existsSync(FILE)) return null;
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return null;
  }
}

export function saveIdentity(obj) {
  fs.writeFileSync(FILE, JSON.stringify(obj, null, 2));
}
