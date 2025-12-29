// =============================
// File: ws/wsAgentControl/wsControlHandlers.js
// =============================
import { log, warn } from '../../logger.js';
import { bus } from '../../core/bus.js';
import { EVENTS } from '../../core/events.js';

import { deviceRegistry } from '../../deviceRegistry/index.js';

export function handleControlMessage(ws, packet) {
    if (!packet || !packet.type) return;

    switch (packet.type) {

        case 'auth::ok':
            log('[CONTROL_WS] авторизация успешна');
            bus.emit(EVENTS.AGENT_CONTROL_AUTH_OK, packet);
            break;

        case 'auth::failed':
        case 'auth::error':
            warn('[CONTROL_WS] ошибка авторизации');
            bus.emit(EVENTS.AGENT_CONTROL_AUTH_FAILED, packet);
            break;

        case 'pong':
            break; // просто игнорируем

        case EVENTS.AGENT_VIDEO_START:
            const controlId = packet.data.controlId;
            const cameraId  = packet.data.cameraId;
            // провверем наличие доступа к камере
            const res = deviceRegistry.requestVideo({
                controlId,
                cameraId
            });

            if (!res.ok) {
                // отправка ошибки - тип пакета надо другой!
                ws.send({ type: 'error', reason: res.reason });
                return;
            }
            // попытка запустить стрим
            bus.emit(EVENTS.AGENT_VIDEO_START, {
                device: res.device,
                flightId: packet.data.flightId,
                tokenAccess: packet.data.tokenAccess,
            });

            // может лучше событием / может прямым запуском
            //videoService.startStream({
            //    device: res.device,
            //    flightId: packet.data.flightId,
            //    tokenAccess: packet.data.tokenAccess,
            //});

            // старый подход - пока решаем как дальше
            // bus.emit(EVENTS.AGENT_VIDEO_START, {packet});
            log(`[WS CONTROL] Запрос на видео. Пакет:${JSON.stringify(packet, null,2)}`);
            break;
        case EVENTS.AGENT_VIDEO_STOP:
            bus.emit(EVENTS.AGENT_VIDEO_STOP, {packet});
            log(`[WS CONTROL] Запрос остановки видео. Пакет:${JSON.stringify(packet, null,2)}`);
            break;

        // Команды управления от пилотов
        case 'CONTROL_CHANNELS':
        case 'START_MOTORS':
        case 'STOP_MOTORS':
        case 'SET_MODE':
        case 'ENGINE_CMD':
        case 'ARM':
        case 'DISARM':
        case 'VIDEO_RESTART':
            bus.emit(EVENTS.CONTROL_COMMAND_FROM_SERVER, { ws, packet });
            break;

        default:
            log(`[CONTROL_WS] нераспознанный тип сообщения: ${packet.type}`);
    }
}
