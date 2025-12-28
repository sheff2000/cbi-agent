// /identity/storage/devStorage.js

import fs from 'fs';
import os from 'os';
import path from 'path';

const HOME = process.env.HOME || os.homedir();
const BASE_DIR = path.join(HOME, '.agent');
const IDENTITY_FILE = path.join(BASE_DIR, 'identity.json');

export function loadIdentity() {
  try {
    if (!fs.existsSync(IDENTITY_FILE)) return null;
    return JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8'));
  } catch {
    return null;
  }
}

export function saveIdentity(obj) {
  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }
  fs.writeFileSync(IDENTITY_FILE, JSON.stringify(obj, null, 2));
}
