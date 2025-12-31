// =============================
// File: core/runtime/deviceLoop.js
// централоный служебный цыкл 
// обновляем перечень подключенных устройств 
// сверяем с сохраненной картой
// =============================

import { log, warn } from '../../logger.js';

export class DeviceLoop {
  constructor({
    deviceMonitor,
    deviceRegistry,
    intervalMs = 2000,
  }) {
    this.deviceMonitor = deviceMonitor;
    this.deviceRegistry = deviceRegistry;
    this.intervalMs = intervalMs;

    this.timer = null;
    this.running = false;
  }

  async tick() {
    try {
      const changes = await this.deviceMonitor.refresh();

      if (changes && changes.length) {
        this.deviceRegistry.handlePhysicalChanges(changes);
      }
    } catch (err) {
      warn('[DeviceLoop] tick error', err);
    }
  }

  start() {
    if (this.running) return;
    this.running = true;

    log(`[DeviceLoop] start (interval=${this.intervalMs}ms)`);

    // первый тик сразу
    this.tick();

    this.timer = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  stop() {
    if (!this.running) return;

    clearInterval(this.timer);
    this.timer = null;
    this.running = false;

    log('[DeviceLoop] stop');
  }
}
