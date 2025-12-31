// =============================
// File: ws/wsAgentMetrika/wsMetrikaManager.js
// WS Metrika
// канал регулярной передачи метрики самого агента
// работа только от Агента к Серверу
// от сервера только
// metrika::auth::ok
// metrika::auth::failed
// =============================
import { createAgentWS } from '../wsClient.js';
import { handleMetrikaMessage } from './wsMetrikaHandlers.js';
import { log, warn } from '../../logger.js';
import { connectConfig } from '../../config/modules/connect.js';
import { bus } from '../../core/bus.js';
import { EVENTS } from '../../core/events.js';
import { loadDeviceCreds } from '../../identity/deviceCreds.js';

export function initWS_MetrikaAgent({
    url,
    onStateChange,
    onFatalError
}) {
    const creds = loadDeviceCreds();

    const helloData = {
        type: 'metrika::auth',
        data: {
                role: 'agent',
                device_id: creds.device_id,
                key: creds.device_key
            }
    };

    if (!creds?.device_id || !creds?.device_key) {
        warn('[METRIKA_WS] нет сохранённых cred (device_id/device_key)');
    }

    const client = createAgentWS({
        url,
        //helloData: helloData, // В metrika-канале нет DEVICE_HELLO

        onMsg: ({ ws, packet }) => handleMetrikaMessage(ws, packet),

        onOpen: () => {
            //log('[METRIKA_WS] соединение установлено. Отправляю AUTH');
        },

        onClose: () => {
            warn('[METRIKA_WS] соединение потеряно');
        },

        name: 'METRIKA_WS',
        reconnectBaseMs: connectConfig.RECONNECT_METRIKA_MS || 20000,
        reconnectMaxMs: connectConfig.RECONNECT_MAX_MS
    });

    // события состояния
    client.on('state', ({ state }) => {
        onStateChange?.(state);
    });

    client.on('error', (e) => {
        warn('[METRIKA_WS] ошибка:', e.message);
        onFatalError?.(e);
    });

    client.connect();
    return client;
}
