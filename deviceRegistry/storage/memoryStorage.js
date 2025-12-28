// заглушка 

import { RegistryStorage } from './registryStorage.js';

export class MemoryRegistryStorage extends RegistryStorage {
  async load() {
    return null;
  }

  async save(_state) {}
}
