// =============================
// File: core/events.js
// список событий (константы + комментарии)
// =============================
export const EVENTS = {

  WS_CLOSED: 'WS_CLOSED', // при закрытии соединения центрольного WS
  WSRC_CLOSED: 'WSRC_CLOSED', // при закрытии соединения  WS RC

  WS_DEVICE_PROVISION: 'WS_DEVICE_PROVISION', // получены новые ключи устройства для авторизации
  WS_AUTH_OK: 'WS_AUTH_OK',                // успешная авторизация на центральном WS/DEVICE
  WS_ENROLL_REQUIRED: 'WS_ENROLL_REQUIRED',      // администратор еще не подтвердил и не привязал устройство
  WS_AUTH_REQUIRED: 'WS_AUTH_REQUIRED',          // запрос на атворизацию - ждет отправку ключа и айди           
  WS_AUTH_FAILED: 'WS_AUTH_FAILED',     // авторизация проввалена
  WS_AUTH_ERROR: 'WS_AUTH_ERROR',          // ошибка при авторизации
  WS_SOCKET_OPEN: 'WS_SOCKET_OPEN', // открыли соккет и передаем его в аргументах
  
  AGENT_CONTROL_AUTH_OK: "AGENT_CONTROL_AUTH_OK",
  AGENT_CONTROL_AUTH_FAILED: "AGENT_CONTROL_AUTH_FAILED",
  CONTROL_COMMAND_FROM_SERVER: "CONTROL_COMMAND_FROM_SERVER",

  AGENT_METRIKA_AUTH_OK: "AGENT_METRIKA_AUTH_OK",
  AGENT_METRIKA_AUTH_FAILED: "AGENT_METRIKA_AUTH_FAILED",

  RTC_VIDEO_SIGNAL: 'RTC_video_signal', // пакет RTC видео {ice/offer ...}

  // События - ОТВЕТЫ на фронт/сервер
  RESPONSE_CAMERA: 'RESPONSE_CAMERA', // исходящие от видео сервиса (ice/stats)
  RESPONSE_METRICA: 'RESPONSE_METRIKA', // отправка метрики самого Агента (CPU/Memory/Network...)
  METRICS_READY: 'METRICS_READY', // метрика готова к отправке

  VIDEO_START: 'VIDEO_START',
  VIDEO_STOP: 'VIDEO_STOP',
  //DEVICE_METRICS: 'DEVICE_METRICS', // регулярная отправка новой метрики устройства (проц, память, время работы)
  

  // WS CONTROL command list
  AGENT_VIDEO_START: 'agent::video::start', // запрос на старт видео трансояции от фронта
  AGENT_VIDEO_STOP: 'agent::video::stop',   // запрос на остановку видео трансляции от фронта

};


