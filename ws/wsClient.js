// =============================
// File: ws/wsClient.js
// Подключаться.
// Держать соединение живым (ping/pong).
// Реконнектиться при обрывах.
// Сообщать наружу о своём состоянии.
// =============================

import WebSocket from 'ws';
import { log, warn } from '../logger.js';



/**
 * Создаёт WS-клиент агента.
 * Не знает о конкретных типах сообщений — только о соединении и событиях.
 * @param {Object} params
 * @param {string} params.url — адрес сервера
 * @param {Object} params.helloData — данные, отправляемые при подключении
 * @param {function} params.onMsg — обработчик входящих сообщений
 * @param {function} params.onOpen — вызывается при успешном открытии сокета
 * @param {function} params.onClose — вызывается при закрытии
 */
export function createAgentWS({
        url,        // куда подключаемся
        helloData,  // приветственный пакет с нашим хард_айди
        // API на верхний уровень
        onMsg,          // пришло сообщение
        onOpen,         // открыли подключение
        onClose,        // закрыли подключение

        name = 'WS',  // чисто информационное значение для логов
        
        reconnectBaseMs = 1000,   // <-- дефолт, если конфиг не передан
        reconnectMaxMs = 30000
    }) 
{
        let ws = null;
        let closedByUs = false;

        // текущие интервалы реконнекта
        let backoffMs = reconnectBaseMs;
        const MAX_BACKOFF = reconnectMaxMs;

        // таймер для пинга
        let pingTimer = null;
        let alive = false;

        // простая система событий
        const listeners = new Map();
        const emit = (ev, payload) => {
            const set = listeners.get(ev);
            if (set) for (const cb of set) try { cb(payload); } catch {}
        };
        const on = (ev, cb) => {
            if (!listeners.has(ev)) listeners.set(ev, new Set());
            listeners.get(ev).add(cb);
            return () => listeners.get(ev)?.delete(cb);
        };

        // ====== служебные ======
        function sendJSON(obj) {
            if (ws && ws.readyState === WebSocket.OPEN) {
            try { 
                ws.send(JSON.stringify(obj)); 
                //log(`[WS] ok SEND to DEVICE ... ${JSON.stringify(obj)}`);
            } 
            catch (e) { warn(`${name} send error`, e.message); }
            }
        }

        function isOpen() {
            return ws && ws.readyState === WebSocket.OPEN;
        }

        function getState() {
            if (!ws) return 'idle';
            return ['connecting', 'open', 'closing', 'closed'][ws.readyState] || 'unknown';
        }

        // ====== логика работы ======
        function startPing(wsInstance) {
            stopPing();
            pingTimer = setInterval(() => {
            if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
            try {
                alive = false;
                wsInstance.ping();
                // если pong не пришёл — разрываем
                setTimeout(() => { if (!alive) wsInstance.terminate(); }, 5000);
            } catch {}
            }, 10000);
        }

        function stopPing() {
            if (pingTimer) clearInterval(pingTimer);
            pingTimer = null;
        }
        function cleanup() {
            stopPing();

            // закрываем сокет, если он ещё жив
            try { ws?.removeAllListeners?.(); } catch {}
            try { ws?.terminate?.(); } catch {}

            ws = null;
            closedByUs = false;
            alive = false;

            backoffMs = reconnectBaseMs;

            // очищаем всех слушателей событий клиента
           //listeners.clear();
        }

        function connect() {
            if (ws && [WebSocket.OPEN, WebSocket.CONNECTING].includes(ws.readyState)) return;
            const endpoint = url;
            closedByUs = false;
            //log(`[${name}] подключаемся → ${endpoint}`);
            emit('state', { state: 'connecting' });

            ws = new WebSocket(endpoint);

            // мои методы
            ws.sendJSON = sendJSON;

            // -------------
            ws.on('open', () => {
                try { ws._socket?.setNoDelay?.(true); } catch {}
                backoffMs = reconnectBaseMs; // сброс бэкоффа
                setTimeout(() => { backoffMs = reconnectBaseMs; }, 30000);
                startPing(ws);
                //log(`[WS] SEND HELLO to DEVICE ... ${JSON.stringify(helloData,null,2)}`);
                
                // для wsagent/control пакет авторизации
                if (name === 'CONTROL_WS')
                    sendJSON( helloData );
                else
                    sendJSON({ type: 'DEVICE_HELLO', data: helloData });
                //log(`[${name}] соединение установлено`);
                onOpen?.(ws);
                emit('state', { state: 'open', ws });
                
            });

            ws.on('pong', () => { alive = true; emit('pong'); });

            ws.on('message', (buf) => {
            try {
                const pkt = JSON.parse(buf.toString('utf8'));

                if (!pkt || typeof pkt !== 'object') {
                warn(`[${name}] получен некорректный пакет (тип: ${typeof pkt})`);
                return;
                }

                onMsg?.({ ws, packet: pkt });
                //emit('message', pkt);

            } catch (e) {
                warn(`[${name}] ошибка парсинга сообщения: ${e.message}`);
            }
            });


            ws.on('close', () => {
                stopPing();
                emit('state', { state: 'closed' });
                onClose?.(ws);
                if (closedByUs) return;
                const retry = backoffMs + Math.floor(Math.random() * 400);
                warn(`[${name}] соединение потеряно. реконнект через ${retry} мс`);
                setTimeout(connect, retry);
                backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF);
                listeners.clear();
            });

            ws.on('error', (e) => {
                stopPing();
                warn(`[${name}] ошибка соединения:`, e?.message || e);
                emit('error', e);
            });
        }

        function close() {
            closedByUs = true;
            try { ws?.close(); } catch {}
            stopPing();
            cleanup();
        }

        function getSocket() {
            return ws;
        }

        // объект интерфейса наружу
        return {
            connect,
            close,
            sendJSON,
            isOpen,
            getState,
            on,
            cleanup,
            getSocket,
        };
}
