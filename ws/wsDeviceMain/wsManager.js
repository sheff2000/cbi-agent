// =============================
// File: ws/wsDeviceMain/wsManager.js
// =============================

import { createAgentWS } from '../wsClient.js';
import { handleServerMessage } from './wsHandlers.js';
import { log, warn } from '../../logger.js';
import { connectConfig } from '../../config/modules/connect.js';
//import { state as agentState, resetState, state } from '../../state.js';
import { EVENTS } from '../../core/events.js';
import { bus } from '../../core/bus.js';
//import { collectMetrics } from '../metrics/metrics.js';
//import { loadDeviceCreds, saveDeviceCreds } from '../../identity.js';
import { loadDeviceCreds, saveDeviceCreds } from '../../identity/deviceCreds.js';

const HB_INTERVAL_MS = Number(connectConfig.HB_INTERVAL_MS || 7000);
//const METRICS_INTERVAL_MS = Number(connectConfig.METRICS_INTERVAL_MS || 12000);

let hbTimer = null;
//let metTimer = null;

// запуск и остановка циклов
function startTimers(client) {
    stopTimers();
    //log('[WS] старт heartbeat');
    hbTimer = setInterval(() => {
        if (client?.isOpen()) client.sendJSON({ type: 'DEVICE_HB' });
    }, HB_INTERVAL_MS);

    /*metTimer = setInterval(() => {
        try { 
            let metrics = collectMetrics();
            log(`[WS] Client status .... ${client?.isOpen()}`);
            if (client?.isOpen()) {
                client.sendJSON({ 
                    type: 'DEVICE_METRICS', 
                    data: metrics 
                });
                bus.emit(EVENTS.DEVICE_METRICS, metrics);
                log(`[WS] interval metrics ... ${METRICS_INTERVAL_MS}`)
            }
            else{
                warn('[WS] Problem with send metrics');
            }
         } 
        catch(e) { warn('[WS] metrics failed:', e.message); }
    }, METRICS_INTERVAL_MS);*/
}

function stopTimers() {
    if (hbTimer) clearInterval(hbTimer);
   //if (metTimer) clearInterval(metTimer);
    hbTimer = null;
   //metTimer = null;
}

export function initWS({ url, helloData, onStateChange, onFatalError }) {

    const hardware_id = helloData.identity.hardware_id;

    const client = createAgentWS({
        url,
        helloData,
        onMsg: ({ ws, packet }) => handleServerMessage(ws, packet),
        onOpen: () => log('[WS] соединение установлено'),
        onClose: () => {
            warn('[WS] соединение потеряно');
            stopTimers();
        },
        name: 'WS',
        reconnectBaseMs: connectConfig.RECONNECT_BASE_MS,
        reconnectMaxMs: connectConfig.RECONNECT_MAX_MS,
    });

    client.on('state', ({ state:st, ws }) => {
        if (st === 'open') {} //agentState.wsConnected = true;
        if (st === 'closed'){
            bus.emit(EVENTS.WS_CLOSED);
           // agentState.wsConnected = false;
            stopTimers();
        }
        // соединение открыли - генерим событие с ссылкой на соккет
        if (st === 'open') {
            //log('[WS CONTROL] Перешли в состояние ОТКРЫТ и передали новый соккет ...');
            //bus.emit(EVENTS.WS_SOCKET_OPEN, { ws });
        }
            

        onStateChange?.(st);
    });
    client.on('error', (e) => onFatalError?.(e));

    // =================  Глобальные подписки  ============================

    bus.on(EVENTS.WS_AUTH_REQUIRED, () => { 
        // Запрос на авторизацию
        // готовим ключ / айди и отправляем
        const creds = loadDeviceCreds();
        if (!creds.device_id || !creds.device_key) {
            warn('[WS] AUTH_REQUIRED but no creds yet. Waiting for provision...');
            // здесь можно периодически пытаться перечитать creds;
            return;
        }

        client.sendJSON({ 
            type:'DEVICE_AUTH', 
            data: { 
                    device_id: creds.device_id, 
                    device_key: creds.device_key, 
            } 
        });
    })

    bus.on(EVENTS.WS_AUTH_OK, () => {
        // авторизация прошла успешно 
        state.wsIsAuthorized = true;
        // запуск таймеров на отправку хербертов и метрики
        startTimers(client);
    })

    bus.on(EVENTS.WS_DEVICE_PROVISION, async (packet) => {
        // админ подтвердил и привязал Агента к пилоту
        // прислал нам ключ и айди - его надо сохранить
        const device_id = packet?.data?.device_id || '';
        const device_key = packet?.data?.device_key || '';
        if (!device_id || !device_key) return;
        
        saveDeviceCreds({ hardware_id, device_id, device_key });
        // после сохранения можно сразу отправить AUTH
        client.sendJSON({ 
          type:'DEVICE_AUTH', 
          data: { device_id, device_key } 
        });
    })

    bus.on(EVENTS.WS_AUTH_FAILED, ()=> {
        ws_auth_failed({client:client});
    });
     bus.on(EVENTS.WS_AUTH_ERROR, ()=> {
        ws_auth_failed({client:client});
    });


    client.connect();
    return client;
}


function ws_auth_failed({client}){
    // ОШИБКА АВТОРИЗАЦИИ
    // resetState();
    stopTimers();
    client.cleanup();
}