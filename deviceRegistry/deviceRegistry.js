// deviceRegistry/deviceRegistry.js

import { RegistryState } from './registryState.js';
import { buildDefaultState } from './registryMapper.js';
import { log } from '../logger.js';

export class DeviceRegistry {
  constructor({ deviceMonitor, storage }) {
    this.deviceMonitor = deviceMonitor;
    this.storage = storage;

    this.state = new RegistryState();
  }

  async init() {
    // 1. пробуем загрузить сохранённую карту
    const saved = await this.storage.load();
    log(`[DEVICE REGISTERY] INIT ... saved - ${JSON.stringify(saved, null, 2)}`);
    // 2. берём физический snapshot
    const snapshot = this.deviceMonitor.getSnapshot();
    log(`[DEVICE REGISTERY] INIT .... snapshot - ${JSON.stringify(snapshot, null, 2)}`);

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

  handlePhysicalChanges(changes) {
      let dirty = false;

      for (const ch of changes) {
        const { type, path, event } = ch;

        const list = this.state.devices[type];
        if (!list) continue;

        if (event === 'added') {
          // ищем logical, который был offline и ждал этот path
          let found = list.find(d => d.path === path);

          if (found) {
            found.status = 'online';
            dirty = true;
            continue;
          }

          // новый physical → создаем новый logical
          const nextId = `${type === 'video' ? 'camera' : 'rc'}${list.length + 1}`;

          list.push({
            id: nextId,
            type,
            path,
            status: 'online',
            ...(type === 'video' ? { labelHint: 'usb' } : {}),
            inUse: false, 
          });

          // по умолчанию кладем в control1
          const ctrl = this.state.controls.find(c => c.id === 'control1');
          if (ctrl) {
            if (type === 'video') ctrl.cameras.push(nextId);
            else ctrl.rc.push(nextId);
          }

          dirty = true;
        }

        if (event === 'removed') {
          const found = list.find(d => d.path === path);
          if (found) {
            found.status = 'offline';
            found.inUse = false;
            dirty = true;
          }
        }
      }

      if (dirty) {
        this.save();
      }
    }
  requestVideo({ controlId, cameraId }) {
    log(`[CONTROL] Video packet check ... controlId: ${controlId} | camera: ${cameraId}`);
      const control = this.state.controls.find(c => c.id === controlId);
      if (!control) {
        return { ok: false, reason: 'control_not_found' };
      }

      if (!control.cameras.includes(cameraId)) {
        return { ok: false, reason: 'camera_not_in_control' };
      }

      const cam = this.state.devices.video.find(d => d.id === cameraId);
      if (!cam) {
        return { ok: false, reason: 'camera_not_found' };
      }

      if (cam.status !== 'online') {
        return { ok: false, reason: 'camera_offline' };
      }

        if (cam.inUse) {
        return { ok: false, reason: 'camera_in_use' };
      }

      cam.inUse = true;
      this.save();

      return {
        ok: true,
        device: {
          id: cam.id,
          type: cam.type,
          path: cam.path,
          labelHint: cam.labelHint,
        }
      };
    }

    // освобождение ресурса
    releaseVideo({ cameraId }) {
      const cam = this.state.devices.video.find(d => d.id === cameraId);
      if (!cam) return { ok: false, reason: 'camera_not_found' };

      if (!cam.inUse) return { ok: true, released: false };

      cam.inUse = false;
      this.save();

      return { ok: true, released: true };
    }

  requestRC({ controlId, rcId }) {
      const control = this.state.controls.find(c => c.id === controlId);
      if (!control) {
        return { ok: false, reason: 'control_not_found' };
      }

      if (!control.rc.includes(rcId)) {
        return { ok: false, reason: 'rc_not_in_control' };
      }

      const rc = this.state.devices.serial.find(d => d.id === rcId);
      if (!rc) {
        return { ok: false, reason: 'rc_not_found' };
      }

      if (rc.status !== 'online') {
        return { ok: false, reason: 'rc_offline' };
      }

        if (rc.inUse) {
        return { ok: false, reason: 'rc_in_use' };
      }

      rc.inUse = true;
      this.save();

      return {
        ok: true,
        device: {
          id: rc.id,
          type: rc.type,
          path: rc.path
        }
      };
    }

    // освобождение ресурса
    releaseRC({ rcId }) {
      const rc = this.state.devices.serial.find(d => d.id === rcId);
      if (!rc) return { ok: false, reason: 'rc_not_found' };

      if (!rc.inUse) return { ok: true, released: false };

      rc.inUse = false;
      this.save();

      return { ok: true, released: true };
    }
}
