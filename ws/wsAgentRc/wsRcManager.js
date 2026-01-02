// =============================
// File: ws/wsAgentRC/wsRCManager.js
// WS RC (Agent side)
// =============================
// RC канал управления агентом
// Двунаправленный канал
// =============================

import { createAgentWS } from '../wsClient.js';
import { handleRCMessage } from './wsRCHandlers.js';
import { log, warn } from '../../logger.js';
import { connectConfig } from '../../config/modules/connect.js';
import { loadDeviceCreds } from '../../identity/deviceCreds.js';

export function initWS_RCAgent({
    url,
    onStateChange,
    onFatalError
}) {
    const creds = loadDeviceCreds();

    if (!creds?.device_id || !creds?.device_key) {
        warn('[RC_WS] нет сохранённых cred (device_id/device_key)');
    }

    const helloData = {
        type: 'auth',
        data: {
            role: 'agent',
            device_id: creds.device_id,
            key: creds.device_key
        }
    };

    const client = createAgentWS({
        url,
        helloData,

        onMsg: ({ ws, packet }) => handleRCMessage(ws, packet),

        onOpen: () => {
            log('[RC_WS] соединение установлено');
        },

        onClose: () => {
            warn('[RC_WS] соединение потеряно');
        },

        name: 'RC_WS',
        reconnectBaseMs: connectConfig.RECONNECT_RC_MS || 500,
        reconnectMaxMs: connectConfig.RECONNECT_MAX_MS
    });

    client.on('state', ({ state }) => {
        onStateChange?.(state);
    });

    client.on('error', (e) => {
        warn('[RC_WS] ошибка:', e.message);
        onFatalError?.(e);
    });

    client.connect();
    return client;
}
