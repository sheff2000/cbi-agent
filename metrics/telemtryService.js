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

function start({url, intervalMs}) {
  log('[METRIKA] STart TIMER ....');
  // url - для получения времени пинга на э тот адрес
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    try {
      const metrics = collectMetrics(extractHost(url));

        //log('[METRIKA] отправка данных метрики на сервер... ', metrics);
        bus.emit(EVENTS.METRICS_READY, metrics);
       
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

  bus.on(EVENTS.AGENT_METRIKA_AUTH_OK, () =>{
    //log('[TELEMETRY] ws auth ok ... start');
      stop();
      start(
      {
          url: connectConfig.SERVER_URLWS,  // для замера пинга
          intervalMs: intervalMs,
      });
      //log('[METRIKA] START... ');
  });
  // тормозим отправку метрики если что-то не так
  bus.on(EVENTS.AGENT_METRIKA_AUTH_FAILED, () => {
    stop();
  });
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

  // Вернуть интерфейс для управления вручную (если нужно)
  return {
    start,
    stop,
  };
}
