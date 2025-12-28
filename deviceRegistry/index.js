// deviceRegistry/index.js
// экспорт функций
// запуск синглтона

/**
 * передаем наружу deviceMonitor для опроса списка оборудования
 * и отслеживания изменений
 * 
 * и передаем storage 
 * - содержит карту что куда подключено на логическойм уровне (control)
 */

import os from 'os';
import path from 'path';

import { DeviceRegistry } from './deviceRegistry.js';
import { FileRegistryStorage } from './storage/fileStorage.js';
import { MemoryRegistryStorage } from './storage/memoryStorage.js';

import { deviceMonitor } from '../deviceMonitor/deviceMonitor.js';

const mode = process.env.AGENT_MODE || 'dev';

let storage;
if (mode === 'prod') {
  storage = new FileRegistryStorage('/etc/agent/registry.json');
} else if (mode === 'dev') {
  storage = new FileRegistryStorage(
    path.join(os.homedir(), '.agent', 'registry.json')
  );
} else {
  storage = new MemoryRegistryStorage();
}

export const deviceRegistry = new DeviceRegistry({
  deviceMonitor,
  storage,
});
