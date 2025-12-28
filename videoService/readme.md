videoService - сервис для запуска стрима с выбранной камеры (через запуск браузера)

- управляет стрим-сессиями, не устройствами!
- deviceRegistry остаётся источником правды
- video service получает уже разрешённый physical source
- никаких /dev/videoX из WS напрямую!
- готово к multi-control и multi-cam

video/
├─ README.md
├─ index.js
├─ videoService.js // публичный API сервиса
├─ videoInstance.js // одна видео-сессия
├─ videoState.js // in-memory состояние
├─ chromeLauncher.js // запуск headless chromium
└─ videoEvents.js // события в bus

### Stream
Одна активная видео-сессия.

### Stream ID
Уникальный идентификатор стрима.
Используется для управления жизненным циклом.


## API

### start()

```js
start({
  streamId,
  flight: {
    id,
    url,
    accessToken
  },
  source: {
    logicalId: 'camera1',
    physical: {
      devicePath: '/dev/video0'
    }
  },
  video: {
    width,
    height,
    fps,
    codec
  }
})

stop(streamId)

getState() - Возвращает список активных стримов.

# События
VIDEO_STREAM_STATUS
{
  streamId,
  logicalCameraId,
  state,
  reason,
  ts
}

## Задача сервиса
    - запускает браузер
    - следит за процессом
    - управляет жизненным циклом
    - сообщает статус