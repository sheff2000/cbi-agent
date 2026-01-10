// =============================
// File: ws/wsAgentRC/wsRCHandlers.js
// =============================
// Обработчики RC пакетов от сервера
// Пока заглушки
// =============================

import { log, warn } from '../../logger.js';
import { bus } from '../../core/bus.js';
import { EVENTS } from '../../core/events.js';

export function handleRCMessage(ws, packet) {
    if (!packet || !packet.type) return;

    switch (packet.type) {

        case 'AUTH_OK':
        case 'auth::ok':
            log(`[RC_WS] авторизация успешна (device_id=${packet?.device_id || packet?.data?.device_id || 'unknown'})`);
            bus.emit(EVENTS.AGENT_RC_AUTH_OK);
            break;
        case 'AUTH_FAILED':
        case 'auth::fail':
        case 'auth::error':
            warn(`[RC_WS] ошибка авторизации (type=${packet.type})`);
            break;

        case 'RC_CHANNELS':
            // TODO: сюда прилетят значения каналов
            // packet.data = { ch: [..] }
            // bus.emit(EVENTS.RC_CHANNELS_RX, packet.data);
            log('[RC_WS] RC_CHANNELS (stub)', packet.data);
            break;

        case 'RC_ARM':
            log('[RC_WS] RC_ARM (stub)');
            break;

        case 'RC_DISARM':
            log('[RC_WS] RC_DISARM (stub)');
            break;

        default:
            // RC канал шумный, логать всё не надо
            break;
    }
}
