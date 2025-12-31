// =============================
// File: boot.js
// =============================
import os from 'os';
import { log } from './logger.js';

import { DeviceLoop } from './core/runtime/deviceLoop.js';
import { registerRuntime } from './core/runtime/runtimeRegistry.js';

// config services
import { initConnectConfig,connectConfig } from './config/modules/connect.js';
import { initVideoConfig, videoConfig } from './config/modules/videoConfig.js';

// auth service
import { getHardwareId } from './identity/index.js';

import { startAll, restartAll } from './core/serviceRegistry.js';
import { deviceMonitor } from './deviceMonitor/deviceMonitor.js';
import { deviceRegistry } from './deviceRegistry/index.js';

const AGENT_MODE = process.env.AGENT_MODE || 'dev';
const AGENT_VERSION = '0.2'; // версия софта агента
const HW_ID_VERSION = 'v1';  // версия генерации основного ключа

// =============================
// Инициализация системы
// =============================
log('[BOOT] запуск агента...');
// старт мониторинга устройств
await deviceMonitor.start();
await deviceRegistry.init();

// запуск device loop
const deviceLoop = new DeviceLoop({
  deviceMonitor,
  deviceRegistry,
  intervalMs: 2000, // наверное надо вынести в конфиг
});

deviceLoop.start();
registerRuntime('deviceLoop', deviceLoop);

const registryState = deviceRegistry.getState();

log(`[CAPS] ${JSON.stringify(registryState, null, 2)}`);

const caps = deviceMonitor.getCaps();
const hardware_id =  getHardwareId({ mode: AGENT_MODE });
//{ Для запуска на локалке пример ключей
//    hardware_id = '613140106ade4d659f4124f1fadf8381'
//    "device_id": "dev_wZcXeQ0P5xr9",
//    "device_key": "DwPcAzCgQDPPT-9-6VaWZYZcQwkttSusDvI68K-s3b4"
//}
const systemInfo = `${os.type()}-${os.release()}`;

/* Старый формат
const helloData = {
  hardware_id: hardware_id,
  hw_id_version: HW_ID_VERSION,
  agent: `js-agent/${AGENT_VERSION}`,
  os: systemInfo,
  caps: { video: 0, serial: 0 }
}; */

// Обновленный формат
const helloData = {
  identity: {  
    hardware_id,
    hw_id_version: 'v1',
    mode: 'dev' | 'sim' | 'prod'
  },
  agent: {
    name: 'js-agent',
    version: AGENT_VERSION,
    build: 'refactored'
  },
  system: {
    os: systemInfo,
    arch: process.arch,
    hostname: os.hostname()
  },
  caps,
};

log(`[HELLO] data - ${JSON.stringify(helloData, null,2)}`);


// =============================
// Загрузка конфигурации
// =============================
await initConnectConfig();
await initVideoConfig();

log(`[BOOT] WS = ${connectConfig.SERVER_URLWS}`);

// запуск всех сервисов / модулей
await startAll({ helloData: helloData });

process.on('SIGUSR2', async () => {
  // рестарта по сигналу
  await restartAll({ helloData: helloData });
});

process.on('SIGINT', () => {
  deviceLoop.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  deviceLoop.stop();
  process.exit(0);
});
