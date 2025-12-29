
deviceRegistry/
 ├─ index.js                # экспорт singleton
 ├─ deviceRegistry.js       # основной класс
 ├─ registryState.js        # in-memory состояние
 ├─ registryMapper.js       # mapping physical → logical
 └─ storage/
    ├─ registryStorage.js   # интерфейс
    ├─ fileStorage.js       # JSON (dev/prod)
    └─ memoryStorage.js     # sim / fallback


Принимать данные от deviceMonitor
Строить логическое представление устройств
Хранить текущее состояние (in-memory)
Давать это состояние по запросу
Обновлять состояние при изменениях

# примерное API

### handlePhysicalChanges(changes)
  Принять изменения от deviceMonitor и обновить логическое состояние, 
  ничего не запуская и не останавливая.

    #### Когда вызывается
      - после deviceMonitor.refresh()
      - либо по событию (позже)

### requestVideo({ controlId, cameraId})
  Разрешение доступа, не запуск стрима!
  Возвращает
    - либо { ok: false, reason }
    - либо { ok: true, device }

### requestRC({ controlId, rcId })
  тоже но для управления, а не камеры!

### блокиврока ресурса если им уже кто-то пользуется
### пока не понятно - нужна ли эта реализация или нет 
### оставляю просто как мысль на потом
  requestRC({ controlId, rcId, ownerId, sessionId })
  requestVideo({ controlId, cameraId, ownerId, sessionId })
  releaseVideo({ cameraId, ownerId, sessionId })
  releaseRC({ rcId, ownerId, sessionId })
  releaseAllBySession({ sessionId })

getDevices()
getControls()

Control — это логическая точка управления
 - может содержать несколько камер / блоков управления
 - может менять параметры и передавать камеры/блок управления
    в другой control

JSON карта
{
  "devices": {
    "video": [
      { "id": "camera1", "type": "video", "status": "online", path:'' }
    ],
    "serial": [
      { "id": "rc1", "type": "serial", "status": "online", path:'' }
    ]
  },
  "controls": [
    {
      "id": "control1",
      "cameras": ["camera1"],
      "rc": ["rc1"]
    }
  ]
}

#######
Работа с сервисом (примерная)
######
Ининциализация 
init({ deviceMonitor, storage })

1. Получить список и состояние устройств
getState(): {
  controls: Control[],
  devices: {
    video: LogicalDevice[],
    serial: LogicalDevice[]
  }
}

# LogicalDevice
{
  id: 'camera1',
  type: 'video',
  status: 'online' | 'offline'
}

# Control (v1)
{
  id: 'control1',
  cameras: ['camera1', 'camera2'],
  rc: ['rc1', 'rc2']
}

# DEVICE_LIST с фронта
  - wsAgent/control получил команду
  - дернул deviceRegistry.getState()
  - отдал результат фронту

# metricService
  - по таймеру дернул deviceRegistry.getState()
  - отправил данные на сервер

# Камера пропала
  - deviceMonitor.refresh()
  - deviceRegistry.handlePhysicalChange()
  - статус обновился
  - событие в шину — позже, не сейчас

# DEFAULT
  один control по уолчанию хранить все устройства