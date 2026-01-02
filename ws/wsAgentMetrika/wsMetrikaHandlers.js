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
            log('[METRIKA_WS] авторизация успешна');
            bus.emit(EVENTS.AGENT_METRIKA_AUTH_OK);
            break;

        case 'AUTH_FAILED':
        case 'metrika::auth::error':
            warn('[METRIKA_WS] ошибка авторизации');
            bus.emit(EVENTS.AGENT_METRIKA_AUTH_FAILED);
            break;

        default:
            //log(`[METRIKA_WS] нераспознанный тип сообщения: ${packet.type}`);
            break;
    }
}
