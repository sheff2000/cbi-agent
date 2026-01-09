# Протокол wsAgent/control (текущая версия)

Документ описывает текущее поведение агента на канале wsAgent/control.
Предназначен для разработчиков серверной и фронтенд части.
Цель — описать, что ожидает агент и что он отправляет в ответ.

## Обзор
- Назначение: команды управления агентом (старт/стоп видео, control-команды).
- Транспорт: WebSocket, двунаправленный.
- Авторизация: агент отправляет auth-пакет при подключении, сервер отвечает статусом.
- RTC-сигналинг НЕ идёт по этому каналу (см. wsAgent/rtc).

## Формат сообщений
Все сообщения — JSON-объекты вида:
```
{
  "type": "<string>",
  "data": <object>
}
```

Некоторые сообщения (auth/ping) могут содержать только `type`, без `data`.

## Подключение и авторизация
Агент → Сервер (при подключении):
```
{
  "type": "auth",
  "data": {
    "role": "agent",
    "device_id": "<device_id>",
    "key": "<device_key>"
  }
}
```

Сервер → Агент (результат авторизации):
```
{ "type": "auth::ok" }
{ "type": "auth::failed" }
{ "type": "auth::error" }
```

Сервер → Агент (keepalive):
```
{ "type": "pong" }
```

## Управление видео
### Запрос на старт (сервер → агент)
```
{
  "type": "agent::video::start",
  "data": {
    "flightId": "<string>",
    "flightUrl": "<string>",
    "accessToken": "<string>",
    "cameraId": "camera1",
    "controlId": "control1",
    "sessionId": "<uuid>",
    "requestedBy": { "userId": "<string>", "role": "<string>" }
  }
}
```

Валидация на агенте:
- Все поля выше должны быть заполнены.
- Камера должна существовать, быть online и не быть занята.

### Ответ на старт (агент → сервер)
Принято:
```
{
  "type": "AGENT_VIDEO_START_ACCEPTED",
  "data": { "sessionId": "<uuid>" }
}
```

Ошибка (невалидный payload или конфликт камеры):
```
{
  "type": "AGENT_VIDEO_START_FAILED",
  "data": { "sessionId": "<uuid>", "reason": "<string>" }
}
```

Частые причины:
- `invalid_payload`
- `control_not_found`
- `camera_not_in_control`
- `camera_not_found`
- `camera_offline`
- `camera_in_use`

### Статус старта (агент → сервер)
Если Chromium запущен успешно:
```
{
  "type": "AGENT_VIDEO_STARTED",
  "data": {
    "sessionId": "<uuid>",
    "cameraId": "camera1",
    "streamId": "control1:camera1"
  }
}
```

Если Chromium не запустился или завершился:
```
{
  "type": "AGENT_VIDEO_FAILED",
  "data": {
    "sessionId": "<uuid>",
    "cameraId": "camera1",
    "streamId": "control1:camera1",
    "reason": "spawn_failed|process_exit|launch_failed|..."
  }
}
```

### Запрос на остановку (сервер → агент)
```
{
  "type": "agent::video::stop",
  "data": {
    "controlId": "control1",
    "cameraId": "camera1",
    "sessionId": "<uuid>"
  }
}
```

### Статус остановки (агент → сервер)
```
{
  "type": "AGENT_VIDEO_STOPPED",
  "data": {
    "sessionId": "<uuid>",
    "cameraId": "camera1",
    "streamId": "control1:camera1"
  }
}
```

## Control-команды (pilot/RC)
Сервер → Агент (примеры; передаются дальше во внутреннюю шину):
```
CONTROL_CHANNELS
START_MOTORS
STOP_MOTORS
SET_MODE
ENGINE_CMD
ARM
DISARM
VIDEO_RESTART
```

Формат payload для этих команд передаётся как есть. Агент не валидирует их
здесь, детализацию обрабатывают нижележащие сервисы.

## Примечания по поведению
- В URL для headless Chromium используется логическое `cameraId` (например "camera1"),
  а не `/dev/videoX`.
- `AGENT_VIDEO_START_ACCEPTED` означает, что агент принял команду и начал запуск,
  но это не гарантия, что видео уже пошло.
- Реальный старт/ошибка сигналятся `AGENT_VIDEO_STARTED` / `AGENT_VIDEO_FAILED`.
- RTC-сигналинг идёт по отдельному каналу и здесь не описан.
