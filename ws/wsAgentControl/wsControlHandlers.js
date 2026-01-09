// =============================
// File: ws/wsAgentControl/wsControlHandlers.js
// =============================
import { log, warn } from '../../logger.js';
import { bus } from '../../core/bus.js';
import { emitEvent } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';

import { deviceRegistry } from '../../deviceRegistry/index.js';

export function handleControlMessage(ws, packet) {
    if (!packet || !packet.type) return;

    let resDevice;
    let controlId;
    let cameraId;
    let sessionId;

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
            log(`[CONTROL] VIDEO START .... ${JSON.stringify(packet,null,2)}`);
            controlId = packet?.data?.controlId;
            cameraId  = packet?.data?.cameraId;
            sessionId = packet?.data?.sessionId;

            if (!isValidStartPayload(packet?.data)) {
                sendControlJSON(ws, {
                    type: EVENTS.AGENT_VIDEO_START_FAILED,
                    data: { sessionId, reason: 'invalid_payload' }
                });
                return;
            }

            // провверем наличие доступа к камере
            resDevice = deviceRegistry.requestVideo({
                controlId,
                cameraId
            });

            if (!resDevice.ok) {
                // отправка ошибки - тип пакета надо другой!
                log(`[CONTROL] ERROR VIDEO START ... ${resDevice.reason}`);
                sendControlJSON(ws, {
                    type: EVENTS.AGENT_VIDEO_START_FAILED,
                    data: { sessionId, reason: resDevice.reason }
                });

                return;
            }
            // попытка запустить стрим
            emitEvent(EVENTS.AGENT_VIDEO_START, {
                device: resDevice.device,
                controlId: controlId,
                cameraId: cameraId,
                flightUrl: packet.data.flightUrl,
                flightId: packet.data.flightId,
                tokenAccess: packet.data.accessToken,
                sessionId: packet.data.sessionId,
                userId: packet.data.requestedBy.userId,
            });

            sendControlJSON(ws, {
                type: EVENTS.AGENT_VIDEO_START_ACCEPTED,
                data: { sessionId }
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
            controlId = packet.data.controlId;
            cameraId  = packet.data.cameraId;
            sessionId = packet?.data?.sessionId;
            // освобождаем камеру
            resDevice = deviceRegistry.releaseVideo({
                cameraId
            });

            if (!resDevice.ok) {
                // отправка ошибки - тип пакета надо другой!
                log(`[CONTROL] ERROR VIDEO STOP ... ${resDevice.reason}`);
                sendControlJSON(ws, {
                    type: 'error',
                    reason: resDevice.reason,
                    data: { sessionId }
                });

                return;
            }
            // попытка тормознуть стрим
            emitEvent(EVENTS.AGENT_VIDEO_STOP, {
                controlId: controlId,
                cameraId: cameraId
            });

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
            emitEvent(EVENTS.CONTROL_COMMAND_FROM_SERVER, { ws, packet });
            break;

        default:
            log(`[CONTROL_WS] нераспознанный тип сообщения: ${packet.type}`);
    }
}

function isValidStartPayload(data) {
    if (!data) return false;
    const required = [
        'flightId',
        'flightUrl',
        'accessToken',
        'cameraId',
        'controlId',
        'sessionId',
        'requestedBy'
    ];
    for (const key of required) {
        if (data[key] === undefined || data[key] === null) return false;
    }
    if (!data.requestedBy?.userId) return false;
    return true;
}

function sendControlJSON(ws, msg) {
    if (typeof ws?.sendJSON === 'function') {
        ws.sendJSON(msg);
        return;
    }
    try {
        ws.send(JSON.stringify(msg));
    } catch {}
}
