// /identity/hardwaredId.js

/** Только:
 * detect
 * generate
 * load/save
*/

import crypto from 'crypto';
import fs from 'fs';
import os from 'os';

import { loadIdentity, saveIdentity } from './storageRouter.js';

function sha(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function getLinuxMachineId() {
  try {
    return fs.readFileSync('/etc/machine-id', 'utf8').trim();
  } catch {
    return '';
  }
}

function getMacAddresses() {
  const nets = os.networkInterfaces();
  return Object.values(nets)
    .flat()
    .filter(n => n && !n.internal && n.mac && n.mac !== '00:00:00:00:00:00')
    .map(n => n.mac)
    .sort()
    .join(',');
}

function buildFingerprint(mode) {
  if (mode === 'sim') {
    const instance = process.env.AGENT_INSTANCE_ID;
    if (!instance) {
      throw new Error('AGENT_INSTANCE_ID required in sim mode');
    }
    return `sim:${instance}|${os.hostname()}`;

  }

  const parts = [
    getLinuxMachineId(),
    os.hostname(),
    getMacAddresses(),
    os.arch(),
  ].filter(Boolean).join('|');

  if (!parts) {
    throw new Error('Unable to build hardware fingerprint');
  }

  return parts;
}

export function getHardwareId({ mode }) {
  const stored = loadIdentity();
  if (stored?.hardware_id) {
    return stored.hardware_id;
  }

  const fingerprint = buildFingerprint(mode);
  const hardware_id = `hw:v1:${mode}:${sha(fingerprint).slice(0, 16)}`;

  saveIdentity({ hardware_id });

  return hardware_id;
}
