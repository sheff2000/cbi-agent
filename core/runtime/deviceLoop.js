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

    // health state
    this.health = {
      running: false,
      intervalMs,
      ticks: 0,
      errors: 0,
      lastTickAt: null,
      lastDurationMs: null,
      lastError: null,
    };
  }

  async tick() {
    const startedAt = Date.now();

    try {
      const changes = await this.deviceMonitor.refresh();

      if (changes && changes.length) {
        this.deviceRegistry.handlePhysicalChanges(changes);
      }

      this.health.ticks++;
      this.health.lastTickAt = new Date().toISOString();
      this.health.lastDurationMs = Date.now() - startedAt;
    } catch (err) {
      this.health.errors++;
      this.health.lastError = {
        message: err?.message || String(err),
        at: new Date().toISOString(),
      };

      warn('[DeviceLoop] tick error', err);
    }
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.health.running = true;

    log(`[DeviceLoop] start (interval=${this.intervalMs}ms)`);

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
    this.health.running = false;

    log('[DeviceLoop] stop');
  }

  // состояние агента 
  getHealth() {
    const now = Date.now();
    const lastTickTs = this.health.lastTickAt
      ? new Date(this.health.lastTickAt).getTime()
      : null;

    const lagMs = lastTickTs
      ? now - lastTickTs - this.intervalMs
      : null;

    return {
      ...this.health,
      lagMs,
    };
  }
}

/**
 * {
  "deviceLoop": {
    "running": true,
    "intervalMs": 2000,
    "ticks": 418,
    "errors": 0,
    "lastTickAt": "2025-01-02T11:14:33.912Z",
    "lastDurationMs": 7,
    "lagMs": -1985,
    "lastError": null
  }
}
  lagMs стабильно  > 500–1000 мс —
    IO тормозит
    fs подвис
    или агент уже умирает
 */