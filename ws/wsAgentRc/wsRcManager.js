// =============================
// File: ws/wsRcManager.js
// =============================
//
// Отдельный WebSocket-канал под DEVICE_RC.
// Поднимается только когда control-канал онлайн,
// реконнект — быстрый, но без лишних дублей.
// =============================

import { createAgentWS } from '../wsClient.js';
import { log, warn } from '../../logger.js';
import { updateSource, setSourceActive } from '../../core/rcBuffer.js';

export function initWS_RC({ url, helloData, onStateChange }) {
  const client = createAgentWS({
    url,
    helloData,
    name: 'WS_RC',
    // RC должен восстанавливаться быстрее
    reconnectBaseMs: 500,
    reconnectMaxMs: 5000,

    onMsg: ({ ws, packet }) => handleRCMessage(ws, packet),

    onOpen: () => {
      agentState.wsRCConnected = true;
      //log('[WS_RC] соединение установлено');
      clearInterval(guardTimer);
      onStateChange?.('open');
    },

    onClose: () => {
      agentState.wsRCConnected = false;
      warn('[WS_RC] соединение потеряно');
      onStateChange?.('closed');
    },
  });

  client.on('error', (e) => warn(`[WS_RC] ошибка: ${e.message}`));
  
  // Ждём control-канал и стартуем RC только когда он онлайн.
  const tryConnect = () => {
    
    // если RC уже открыт или в процессе — ничего не делаем
    const st = client.getState();
    if (st === 'open' || st === 'connecting') return;

    client.connect();
  };

  // начальная попытка
  tryConnect();

  // И периодическая проверка состояния control-канала:
  // когда control "поднимается" после даунтайма, RC автоматически подтянется.
  const guardTimer = setInterval(tryConnect, 1000);

  // интерфейс с ручным стопом, если понадобится в будущем.
  return {
    client,
    stop() { try { clearInterval(guardTimer); } catch {} client.close(); }
  };
}

// обработка входящих сообщений ( RC-канал — one-way)
// DEVICE_DEBUG
function handleRCMessage(ws, packet) {
  switch (packet?.type) {
    case 'DEVICE_RC': {
      const pilotId = packet?.data?.pilotId || 'unknown';
      const ch = packet?.data?.crsfChannels || [];
      updateSource(pilotId, { channels: ch, seq: packet?.data?.seq || 0 });
      ws.send(JSON.stringify({
        type: 'DEVICE_RC_ACK',
        data: { seq: packet?.data?.seq || 0, ts: Date.now() },
      }));
      break;
    }

    case 'START_SEND_RC': {
      const pilotId = packet?.data?.pilotId;
      setSourceActive(pilotId, true);
      break;
    }

    case 'STOP_SEND_RC': {
      const pilotId = packet?.data?.pilotId;
      setSourceActive(pilotId, false);
      break;
    }
  }
}
