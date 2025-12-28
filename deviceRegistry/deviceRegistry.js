// deviceRegistry/deviceRegistry.js

import { RegistryState } from './registryState.js';
import { buildDefaultState } from './registryMapper.js';

export class DeviceRegistry {
  constructor({ deviceMonitor, storage }) {
    this.deviceMonitor = deviceMonitor;
    this.storage = storage;

    this.state = new RegistryState();
  }

  async init() {
    // 1. пробуем загрузить сохранённую карту
    const saved = await this.storage.load();

    // 2. берём физический snapshot
    const snapshot = this.deviceMonitor.getSnapshot();

    if (saved) {
      // пока просто применяем как есть
      this.state.devices = saved.devices || this.state.devices;
      this.state.controls = saved.controls || this.state.controls;
    } else {
      // 3. строим дефолт
      const def = buildDefaultState(snapshot);
      this.state.devices = def.devices;
      this.state.controls = def.controls;
    }
  }

  getState() {
    return this.state;
  }

  save() {
    this.storage.save(this.state);
  }
}
