// =============================
// File: core/serviceRegistry.js
// Запуск сервисов с хранением списка со статусами
// =============================

import { log, warn } from '../logger.js';
import { servicesList } from './serviceName.js';
import { connectConfig } from '../config/modules/connect.js';
import { bus } from './bus.js';
import { EVENTS } from './events.js';

// WS connect 
import { initWS } from '../ws/wsDeviceMain/wsManager.js';
import { initWS_ControlAgent } from '../ws/wsAgentControl/wsControlManager.js';
import { initWS_RC } from '../ws/wsAgentRc/wsRcManager.js';

import { initSendMsgService } from '../network/sendMsgService.js';
import { initTelemetryService } from '../metrics/telemtryService.js';

//import { initVideoService } from '../video/videoService.js';
//import { initCameraService } from '../camera/cameraManager.js';

// Внутренний список активных сервисов
export const services = new Map();

/** TO DO:
 *  Поддержка событий на registry уровне
 *  Можно повесить общий emitter (bus.emit('SERVICE_UP', name)), 
 *  чтобы фронт мог слушать статус каждого модуля.
 *
 *  Конфигурация через XML
 *  Registry может при запуске читать connect.xml 
 *  и автоматически решать, какие сервисы запускать.
 *
 *  Health-мониторинг
 *  В будущем добавить туда getHealthReport() —
 *  он обойдёт все сервисы и отдаст JSON вроде:
 *  {
 *    "controlWS": { "state": "open" },
 *    "rcWS": { "state": "closed" }
 *  }
 */


async function startService(name, initFn, args = {}) {
  try {
    // Запускаем функцию и ждём, что она вернёт объект сервиса
    const instance = await initFn(args);

    // Сохраняем в Map под именем
    services.set(name, instance);

    log(`[SERVICE] ${name} запущен`);

    // Возвращаем сам объект
    return instance;

  } catch (e) {
    // Если модуль грохнулся при запуске — не ломаем весь агент
    warn(`[SERVICE] ошибка запуска ${name}: ${e.message}`);
    return null;
  }
}

// Централизованный запуск всех
export async function startAll({ helloData }) {
  
    //const wsRcUrl = `${connectConfig.SERVER_URLWSRC.replace(/\/$/, '')}${connectConfig.WSRC_PATH}`;

    const wsUrl = `${connectConfig.SERVER_URLWS.replace(/\/$/, '')}${connectConfig.WS_PATH}`;
    await startService(servicesList.controlWS, initWS, {
        url: wsUrl,
        helloData: helloData,
        onStateChange: st => log(`[controlWS] state=${st}`),
        onFatalError: e => warn(`[controlWS] fatal: ${e.message}`)
    });

    // Запуск сервис аотправки во внешний мир сообщений от других сервисов
    await startService(servicesList.sendMsg, initSendMsgService, {});

    // Запускаем сервис телеметрии агента
    await startService(servicesList.telemetry, initTelemetryService, {});

    //await startService('rcWS', initWS_RC, {
    //  url: wsRcUrl,
    //  helloData,
    //  onStateChange: st => log(`[rcWS] state=${st}`)
    //});

    // Сервис трансляции видео с камеры - пока не нужен
    // await startService('camera', initCameraService, {});
  
    // Запуск по событиям
    // Сервисы котрые будут запускатся после появления нужного события

    // когда выполнена атворизация в канале controlWS (WS device)
    // запускаем wsAgent/control и другие
    bus.on(EVENTS.WS_AUTH_OK, async () => {
        log('WS DEVICE - атворизован! Запускаем wsAgent/control');
        
        // событие может возникать часто  - реконнекты и тд
        if (!isServiceRunning(servicesList.controlAgentWS)) {
            const controlUrl = `${connectConfig.SERVER_URLWS.replace(/\/$/, '')}/wsAgent/control`;
            await startService(servicesList.controlAgentWS, initWS_ControlAgent, {
                url: controlUrl,
                onStateChange: st => log(`[controlAgentWS] state=${st}`),
                onFatalError: e => warn(`[controlAgentWS] fatal: ${e.message}`)
            });
        }
        // TODO: добавить другие сервисы потом
    });

    // потеря основного коннекта
    bus.on(EVENTS.WS_CLOSED, async () => {
        log('[SERVICE] controlWS потерян - останавливаем зависимые сервисы');
        const svc = getService(servicesList.controlAgentWS);
        if (svc) {
            try {
                svc.close();
                services.delete(servicesList.controlAgentWS);
                log('[SERVICE] controlAgentWS остановлен из-за потери controlWS');
            } catch (e) {
                warn('[SERVICE] ошибка остановки controlAgentWS', e.message);
            }
        }
        // TODO: не забыть добавить другие сервисы потом
    });
}

export function isServiceRunning(name) {
    return services.has(name);
}

export function getService(name) {
    return services.get(name) || null;
}

// Централизованное завершение
export async function stopAll() {
    log('[SERVICE] остановка всех сервисов...');
    for (const [name, svc] of services) {
        try {
            if (svc?.stop) await svc.stop();
            else if (svc?.client?.close) svc.client.close();
            log(`[SERVICE] ${name} остановлен`);
        } catch (e) {
            warn(`[SERVICE] ошибка остановки ${name}: ${e.message}`);
        }
    }
    services.clear();
}

// Перезапуск всех
export async function restartAll({ helloData }) {
    log('[SERVICE] перезапуск всех сервисов...');
    await stopAll();
    await new Promise(r => setTimeout(r, 500)); // дать WS закрыться
    await startAll({ helloData });
}
