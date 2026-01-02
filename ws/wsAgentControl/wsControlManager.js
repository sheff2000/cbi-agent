// =============================
// File: ws/wsAgentControl/wsControlManager.js
// WS CONTROL
// Управлеющий канал от комнаты полета/владельца к агенту
// идут команды различного рода
// работает только после авторизации ws/device
// назад получает HB с минимальной метрикой
// =============================
import { createAgentWS } from '../wsClient.js';
import { handleControlMessage } from './wsControlHandlers.js';
import { log, warn } from '../../logger.js';
import { connectConfig } from '../../config/modules/connect.js';
import { bus } from '../../core/bus.js';
import { EVENTS } from '../../core/events.js';
import { loadDeviceCreds } from '../../identity/deviceCreds.js';

export function initWS_ControlAgent({
    url,
    onStateChange,
    onFatalError
}) {
    const creds = loadDeviceCreds();

    const helloData = {
        type: 'auth',
        data: {
                role: 'agent',
                device_id: creds.device_id,
                key: creds.device_key
            }
    };

    if (!creds?.device_id || !creds?.device_key) {
        warn('[CONTROL_WS] нет сохранённых cred (device_id/device_key)');
    }

    const client = createAgentWS({
        url,
        helloData: helloData, // В control-канале нет DEVICE_HELLO

        onMsg: ({ ws, packet }) => handleControlMessage(ws, packet),

        onOpen: () => {
            log('[CONTROL_WS] соединение установлено');
            //log(`device_id - ${JSON.stringify(creds, null, 2)}`);
            /*client.sendJSON({
                type: 'auth',
                data: {
                    role: 'agent',
                    device_id: creds.device_id,
                    key: creds.device_key
                }
            });*/
        },

        onClose: () => {
            warn('[CONTROL_WS] соединение потеряно');
        },

        name: 'CONTROL_WS',
        reconnectBaseMs: connectConfig.RECONNECT_BASE_MS,
        reconnectMaxMs: connectConfig.RECONNECT_MAX_MS
    });

    // события состояния
    client.on('state', ({ state }) => {
        onStateChange?.(state);
    });

    client.on('error', (e) => {
        warn('[CONTROL_WS] ошибка:', e.message);
        onFatalError?.(e);
    });

    client.connect();
    return client;
}
