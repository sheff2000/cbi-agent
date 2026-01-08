// deviceMonitor/deviceMonitor.js
// класс мониторинга
/**
 * умеет хранить предыдущее состояние
 * находить изменения (отвал устройства или коннект)
 * поддерживает разные источники данных (dev / sim / prod)
 * никому ничего не шлёт! это задача сервисов верхнего уровня
 */
import { log } from '../logger.js';

import { mockSource } from './dataSource/mockSource.js';
import { simSource } from './dataSource/simSource.js';
import { linuxSource } from './dataSource/linuxSource.js';

function normalize(raw) {
  const norm = { video: [], serial: [] };

  for (const type of ['video', 'serial']) {
    const list = raw[type] || [];
    norm[type] = list.map(d => ({
      path: d.path,
      status: 'online',
      ...(type === 'video' && d.labelHint ? { labelHint: d.labelHint } : {}),
      ...(type === 'video' && d.hardwareId ? { hardwareId: d.hardwareId } : {})
    }));
  }

  return norm;
}

function diff(prev, curr) {
  const changes = [];

  for (const type of ['video', 'serial']) {
    const prevSet = new Set((prev[type] || []).map(d => d.path));
    const currSet = new Set((curr[type] || []).map(d => d.path));

    for (const p of currSet) {
      if (!prevSet.has(p)) {
        changes.push({ type, path: p, event: 'added' });
      }
    }
    for (const p of prevSet) {
      if (!currSet.has(p)) {
        changes.push({ type, path: p, event: 'removed' });
      }
    }
  }

  return changes;
}

class DeviceMonitor {
  constructor() {
    this.started = false;
    this.source = null;

    this.prevSnapshot = { video: [], serial: [] };
    this.snapshot     = { video: [], serial: [] };
  }

  async start() {
    if (this.started) return;
    this.started = true;

    const mode = process.env.AGENT_MODE || 'dev';

    if (mode === 'prod') this.source = linuxSource;
    else if (mode === 'sim') this.source = simSource;
    else this.source = mockSource;

    log(`[DeviceMonitor] start (mode=${mode})`);

    await this.refresh(); // initial scan
  }

  async refresh() {
    if (!this.source) return;

    const raw = await this.source.scan();
    const next = normalize(raw);

    const changes = diff(this.snapshot, next);

    this.prevSnapshot = this.snapshot;
    this.snapshot = next;

    if (changes.length) {
      log('[DeviceMonitor] changes:', changes);
      //  в будущем:
      // bus.emit('device:changed', changes)
    }

    return changes;
  }

  getSnapshot() {
    return this.snapshot;
  }

  getCaps() {
    return {
      video: this.snapshot.video.length,
      serial: this.snapshot.serial.length
    };
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    log('[DeviceMonitor] stop');
  }
}

export const deviceMonitor = new DeviceMonitor();
