// =============================
// File: services/telemetryService.js
// =============================
import { log, warn } from '../logger.js';
import { bus } from '../core/bus.js';
import { EVENTS } from '../core/events.js';
import { collectMetrics } from './metrics.js';
import { connectConfig } from '../config/modules/connect.js';
import { extractHost } from '../utilits/urlUtilits.js';

import { services } from '../core/serviceRegistry.js';

let timer = null;
let intervalMs = connectConfig.METRICS_INTERVAL_MS;
let client = null; // ссылка на WS-клиент

function start({url, intervalMs}) {
  log('[METRIKA] STart TIMER ....');
  // url - для получения времени пинга на э тот адрес
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    try {
      const metrics = collectMetrics(extractHost(url));

      if (client) { //client?.isOpen()
        //log('[METRIKA] отправка данных метрики на сервер... ', metrics);
        bus.emit(EVENTS.RESPONSE_METRICA, {
          ws: client,
          msg: {
            type: 'DEVICE_METRICS', 
            data: metrics,
          }
        });
        //client.sendJSON({ type: 'DEVICE_METRICS', data: metrics });
      }
    } catch (e) {
      warn('[TELEMETRY] ошибка сбора метрик:', e.message);
    }
  }, intervalMs);
  //log(`[TELEMETRY] запущен, интервал ${intervalMs} мс`);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
  log('[TELEMETRY] остановлен');
}

export function initTelemetryService() {
  //client = wsClient;
  intervalMs = connectConfig.METRICS_INTERVAL_MS;

  bus.on(EVENTS.WS_AUTH_OK, ({ ws }) =>{
    //log('[TELEMETRY] ws auth ok ... start');
      stop();
      client = ws;
      start(
      {
          url: connectConfig.SERVER_URLWS,  // для замера пинга
          intervalMs: intervalMs,
      });
      //log('[METRIKA] START... ');
  });
  // тормозим отправку метрики если что-то не так
  bus.on(EVENTS.WS_AUTH_FAILED, () => {
    log('[METRIKA] Ошибка атворизации WS ... останавливаем метрику');
    stop()
  });
  bus.on(EVENTS.WS_AUTH_ERROR, () => {
    log('[METRIKA] Ошибка атворизации WS ... останавливаем метрику');
    stop()
  });
  //bus.on(EVENTS.WS_ENROLL_REQUIRED, () => stop());
  //bus.on(EVENTS.WS_DEVICE_PROVISION, () => stop());
  //bus.on(EVENTS.WS_AUTH_REQUIRED, () => stop());

  bus.on(EVENTS.WS_CLOSED, () => {
    log('[METRIKA] Обрыв коннекта WS ... останавливаем метрику');
    stop()
  }); // обрыв соединения

  // Вернуть интерфейс для управления вручную (если нужно)
  return {
    start,
    stop,
  };
}
