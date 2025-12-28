# identity
    - генерация и хранение hardware_id
    - хранение device_id / device_key, выданных сервером
    - абстракцию способа хранения (dev / prod / sim)
    - изоляцию логики идентификации от остального кода агента

# hardware_id  Формат - hw:v1:<mode>:<hash>
  Стабильный идентификатор конкретного устройства
    - генерируется один раз
    - сохраняется локально
    - одинаковый при каждом запуске
    - не зависит от server-side состояния

# device_id / device_key
    Креденшелы, которые:
        - выдаёт сервер
        - используются для аутентификации агента
        - могут быть отозваны или перевыпущены
        - Хранятся вместе с hardware_id.

# Общая архитектура
identity/
├── index.js                // публичный API
├── hardwareId.js           // генерация hardware_id
├── deviceCreds.js          // load/save device_id & device_key
├── storageRouter.js        // выбор backend хранилища
└── storage/
    ├── devStorage.js       // ~/.agent/identity.json
    └── prodStorage.js      // /opt/js-agent/agent-identity.json


# Получение hardware_id
    Проверяется локальное хранилище (identity.json)
    Если hardware_id найден → возвращается
    Если нет:
        - собирается fingerprint устройства
        - считается SHA-256
        - формируется hardware_id
        - сохраняется
        - возвращается
# Fingerprint устройства - Зависит от режима
    sim (AGENT_INSTANCE_ID=sim1)
        Используется для симуляций и тестов.
        sim:<AGENT_INSTANCE_ID>|<hostname>
    dev / prod
        Используются:
            - /etc/machine-id (если доступен)
            - hostname
            - MAC-адреса сетевых интерфейсов
            - архитектура CPU
        Хранилище выбирается через storageRouter
        {
            "hardware_id": "hw:v1:dev:8f3a9c4e21b7d9aa",
            "device_id": "dev_xxx",
            "device_key": "yyy"
        }
# getHardwareId({ mode: 'dev' });
    hw:v1:dev:8f3a9c4e21b7d9aa

# loadDeviceCreds(); 
    {
        device_id,
        device_key
    }
# saveDeviceCreds({
        device_id,
        device_key
    });
