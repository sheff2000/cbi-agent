// ========================================
// File: network/sendMsgService.js
// Центральный модуль отправки сообщений наружу
//
// все модули: которім нужно отправить в сеть данные 
// вызывают событик 
// bus.emit(EVENTS.[тип сообщени], {
//        ws: session.ws, - какой коннект
//        msg - само сообщение (структура определяется модулем)
// });
// Тип сообщения:
//      RTC_VIDEO_RESPONSE - данные от модуля (сервиса) камеры  
//      
// для каждого сообщения можно будет добавить логику переформатирования - если нужно
// ========================================

import { bus } from '../core/bus.js';
import { EVENTS } from '../core/events.js';
import { services } from '../core/serviceRegistry.js';
import { log, warn } from '../logger.js';
import { servicesList } from '../core/serviceName.js';

export function initSendMsgService() {

    //log('[SEND] service initialized');

    // Универсальный канал WebRTC (ответы камеры)
    bus.on(EVENTS.RESPONSE_CAMERA, ({ ws, msg }) => {
        //log(`[SEND SERVICE] VIDEO RESP .... ${JSON.stringify(msg)}`);

        //под старый формат
        const packet = {
            type: EVENTS.RTC_VIDEO_SIGNAL,
            data: msg,
        };

        safeSendJSON(ws, packet);
    });

    bus.emit(EVENTS.SEND_CONTROL_PACKET, {
        ws: services.get(servicesList.rcWS),
        msg: {
            type: 'RC_ACK',
            data: { ok: true }
        }
    });


    // это не корректная отпарвка !!!
    // Регулярная отправка метрики Агента (загрузка проца/памяти/сети)
    //bus.on(EVENTS.RESPONSE_METRICA, ({ ws, msg }) => {
        //log(`[SEND SERVICE] METRICA RESP .... `);//${JSON.stringify(msg, null, 2)}`);
    //    if (!ws)
    //        warn('[SEND SERVICE] METRICE RESP ... ws undefinde');
    //    safeSendJSON(ws, msg);
    //})

    bus.on(EVENTS.METRICS_READY, metrics => {
        //log('[SEND MSG] send metrika ... ');
        
        // вынуждены метрику гнать еще и на главный канал ws/device
        
        const wsDevice = services.get(servicesList.controlWS)?.getSocket?.();
        if (!wsDevice) return;
        //log(`[SEND METRIK] WS DEVIEC ${JSON.stringify(metrics)}`);
        safeSendJSON(wsDevice, {
            type: 'DEVICE_METRICS',
            data: metrics
        });

        const ws = services.get(servicesList.metrikaAgentWS)?.getSocket?.();
        if (!ws) return;

        safeSendJSON(ws, {
            type: 'agent::metriks',
            data: metrics
        });
        

    });


    bus.on(EVENTS.SEND_CONTROL_PACKET, ({ ws, msg }) => {
        ws.sendJSON(msg);
    });
    /**
     * bus.emit(EVENTS.SEND_CONTROL_PACKET, {
            ws: services.get('controlAgentWS'),
            msg: {
                type: 'AGENT_TELEMETRY',
                data: { cpu, ram, temp }
            }
        });
     */

    // Можно наращивать:
    // bus.on(EVENTS.RC_SIGNAL_RESPONSE, ...)
    // bus.on(EVENTS.OTA_PUSH, ...)
    // ...

    return {
        sendJSON: safeSendJSON,
        sendBinary: safeSendBinary
    };
}


function safeSendJSON(ws, msg) {
    const socket = ws?.getSocket?.() || ws;
    if (!socket || socket.readyState !== 1) {
        warn('[SEND] попытка отправить JSON в закрытый сокет');
        //warn(`[SEND] была попытка отправить Msg: ${JSON.stringify(msg)}`);
        return;
    }
    try {
        if (typeof socket.sendJSON === 'function') socket.sendJSON(msg);
        else socket.send(JSON.stringify(msg));
    } catch (err) {
        warn('[SEND] ошибка отправки JSON:', err);
    }
}

function safeSendBinary(ws, buffer) {
    if (!ws || ws.readyState !== 1) {
        warn('[SEND] попытка отправить бинарь в закрытый сокет');
        return;
    }
    try {
        ws.send(buffer);
    } catch (err) {
        warn('[SEND] ошибка отправки binary:', err);
    }
}
