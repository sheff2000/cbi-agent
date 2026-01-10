// =============================
// File: ws/wsDeviceMain/wsHandlers.js
// =============================

import { err, log, warn } from '../../logger.js';
import { bus } from '../../core/bus.js';
import { EVENTS } from '../../core/events.js';
import { emitEvent } from '../../core/eventBus.js';
// глобальный буфер RC потоков и Serial портов для них
import { updateSource } from '../../core/rcBuffer.js';

// плохая идея завязывать сюда сервисы!
// соблюдаем максимальную изолированность! 
import { services } from '../../core/serviceRegistry.js';
import { servicesList } from '../../core/serviceName.js';
import { json } from 'stream/consumers';


export function handleServerMessage(ws, packet) {

  //log(`[WS] получен пакет : ${JSON.stringify(packet, null, 2)}`);
  if (!packet || !packet.type) warn('[WS] получен пустой пакет');

  const t = packet?.type;
  const msg = packet?.msgError;
  //log(`[WS] RECEIVED PACJET TYPE .... ${t} .... packet ... ${JSON.stringify(msg,null,2)}`);
  try {
    switch (t) {
      case 'msg':
        //log(`[WS] system message: ${msg}`);
        // обработка пакета с типом MSG 
        // в нем к нам приходит и ответ по АВТОРИЗАЦИИ
        // да - так не надо, но так получилось
        wsHandler_MSG(ws, packet);
        break;
      
      case 'DEVICE_PROVISION': 
        // получили новые ключи дл ядоступа
        bus.emit(EVENTS.WS_DEVICE_PROVISION, packet);
        //log(`[WS] DEVICE_PROVISION ... отдельный тип для выдачи ключа ${packet.msgError}`);
  
        break;
// ============. WORK WITH CBI_AGENT ==========================
      case 'DEVICE_SERIAL_LIST': // список портов на агенте
        log(`[WS] DEVICE_SERIAL_LIST ...  ${msg}`);
        break;

        case 'DEVICE_SERIAL_SET': // назначить порт
          log(`[WS] DEVICE_SERIAL_SET ...  ${msg}`);
          break;
// ============= END WORK WITH CBI_AGENT ====================

// =============. RC from JOYSTICK ===========
// эту часть надо переделать и вынести в отдельное подключение wsRC
      case 'DEVICE_RC_DEBUG': // DEVICE_RC
      // временное решение: один пилот → один RC поток
        const pilotId = 'pilot1'; // будем получать из пакета RC
        const ch = packet?.data?.crsfChannels || [];

        // добавляем в глобальный буфер
        updateSource(pilotId, {
          channels: ch,
          seq: packet?.data?.seq || 0
        });

        // отправляем ACK
        ws.send(JSON.stringify({
          type: 'DEVICE_RC_ACK',
          data: {
            seq: packet?.data?.seq || 0,
            flightId: packet?.data?.flightId || null, // для совместимости с текущей версией от фронта
            ts: Date.now()
          }
        }));
        break;
      // это на будущее (когда в отдельный wsRC вынесем)
      // команды от фронта на начало старта отправки пульта и его конец
      case 'START_SEND_RC': {
        const pilotId = 'pilot1';
        updateSource(pilotId, { active: true });
        break;
      }

      case 'STOP_SEND_RC': {
        const pilotId = 'pilot1';
        updateSource(pilotId, { active: false });
        break;
      }

      //видео
      case 'RTC_video_signal': {
        //log(`[WS] Пакет для потока видео с фронта ....${JSON.stringify(packet, null, 2)}`);
        emitEvent(EVENTS.RTC_VIDEO_SIGNAL, 
          {
            packet: packet,
            ws: ws, 
          }
        );  
        break;
      }

      case 'RESTART_WS':
        log('[WS] команда на перезапуск соединений (при изменении настроек или другой вариант');
        //await restartConnections();
        break;

      case 'pong':

        break;

      default:
        log(`[WS] неизвестный тип: ${t}`);
    }
  } catch (e) {
    //log(`[WS] ERROR | packet .... ${JSON.stringify(packet, null, 2)}`);
    warn(`[WS] ошибка обработки пакета: ${e.message}`);
  }
}


function wsHandler_MSG(ws, packet)
{
  /**
   * Формат пакета
   * {
   *  "type": "msg",
   *   "error": false,
   *   "msgError": "AUTH_REQUIRED" //
   * }
   */
  try {
    switch (packet?.msgError) {
      case 'AUTH_REQUIRED': 
        // запрос авторизации
        bus.emit(EVENTS.WS_AUTH_REQUIRED);
        log(`[WS] AUTH_REQUIRED from WS : ${packet.msgError}`);       
        break;

      case 'ENROLL_REQUIRED':
        // Администртор должен подтвердить и привязать устройство
        bus.emit(EVENTS.WS_ENROLL_REQUIRED);
        log(`[WS] ENROLL_REQUIRED | Admin must approve device : ${packet.msgError}`);  
        break;

      case 'AUTH_OK':
        // успешная авторизация
        log(`[WS] AUTH_OK (device_id=${packet?.data?.device_id || 'unknown'}, session_id=${packet?.data?.session_id || 'n/a'})`);
        bus.emit(EVENTS.WS_AUTH_OK, { ws });
        //`[WS] AUTH_OK ...  ${packet.msgError}`);
        break;

      case 'AUTH_FAILED':
        bus.emit(EVENTS.WS_AUTH_FAILED);
        err(`[WS] AUTH_FAILED ...  ${packet.msgError}`);
        break;

      case 'AUTH_ERROR':
        bus.emit(EVENTS.WS_AUTH_ERROR);
        err(`[WS] AUTH_ERROR ...  ${packet.msgError}`);
        break;

      default:
        warn(`[WS] Packet with type MSG is undefinde ... ${packet.msgError}`);
        break;
    }
  } catch(e) {
     warn(`[WS AUTH] ошибка в wsHandler_MSG: ${e}`);
  }
}
