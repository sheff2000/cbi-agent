
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

примерное API
getDevices()
getControls()
requestVideo()
requestRC()

Control — это логическая точка управления
 - может содержать несколько камер / блоков управления
 - может менять параметры и передавать камеры/блок управления
    в другой control

JSON карта
{
  "devices": {
    "video": [
      { "id": "camera1", "type": "video", "status": "online" }
    ],
    "serial": [
      { "id": "rc1", "type": "serial", "status": "online" }
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
init({ deviceMonitor })

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
  rc: ['rc1']
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