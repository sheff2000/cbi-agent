// Путь будет зависеть от режима:
//
// dev: ~/.agent/registry.json
// prod: /etc/agent/registry.json

// storage/fileStorage.js
// deviceRegistry/storage/fileStorage.js
import fs from 'fs';

import { RegistryStorage } from './registryStorage.js';

export class FileRegistryStorage extends RegistryStorage {
  constructor(path) {
    super();
    this.path = path;
  }

  async load() {
    try {
      if (!fs.existsSync(this.path)) return null;
      return JSON.parse(fs.readFileSync(this.path, 'utf8'));
    } catch {
      return null;
    }
  }

  async save(state) {
    try {
      fs.writeFileSync(this.path, JSON.stringify(state, null, 2));
    } catch {}
  }
}
