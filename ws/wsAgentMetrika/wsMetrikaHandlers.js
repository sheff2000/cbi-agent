// =============================
// File: ws/wsAgentControl/wsControlHandlers.js
// =============================
import { log, warn } from '../../logger.js';
import { bus } from '../../core/bus.js';
import { EVENTS } from '../../core/events.js';

export function handleMetrikaMessage(ws, packet) {
    if (!packet || !packet.type) return;

    switch (packet.type) {
        case 'AUTH_OK':
        case 'auth::ok':
            log(`[METRIKA_WS] авторизация успешна (device_id=${packet?.device_id || packet?.data?.device_id || 'unknown'})`);
            bus.emit(EVENTS.AGENT_METRIKA_AUTH_OK);
            break;

        case 'AUTH_FAILED':
        case 'auth::fail':
        case 'auth::error':
        case 'metrika::auth::error':
            warn(`[METRIKA_WS] ошибка авторизации (type=${packet.type})`);
            bus.emit(EVENTS.AGENT_METRIKA_AUTH_FAILED);
            break;

        default:
            //log(`[METRIKA_WS] нераспознанный тип сообщения: ${packet.type}`);
            break;
    }
}
