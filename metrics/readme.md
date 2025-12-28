# Telemetry / Metrics Service (Agent) 
Сервис телеметрии отвечает за периодический сбор и отправку системных метрик агента на сервер

- собирает локальные системные метрики
- измеряет сетевые параметры и ping до сервера
- автоматически стартует и останавливается по событиям WS
- не управляет соединением, а лишь реагирует на его состояние

├── telemetryService.js   // управление жизненным циклом телеметрии
└── metrics.js        // сбор системных метрик

# Используемые события bus
    WS_AUTH_OK	    - старт телеметрии
    WS_AUTH_FAILED	- остановка
    WS_AUTH_ERROR	- остановка
    WS_CLOSED	    - остановка

Интервал отпарвки - connectConfig.METRICS_INTERVAL_MS
Отправка данных:
    bus.emit(EVENTS.RESPONSE_METRICA, {
        ws,
        msg: {
            type: 'DEVICE_METRICS',
            data: metrics
        }
    });

# Публичный интерфейс
{
  start({ url, intervalMs }),
  stop()
}

# Пример результата
{
  "cpu": { "load1": 0.23, "cores": 4 },
  "mem": { "total_mb": 3956, "used_mb": 1021, "used_pct": 25 },
  "disk": { "total_gb": 64, "used_gb": 18, "free_gb": 46, "used_pct": 28 },
  "net": [
    {
      "iface": "eth0",
      "addr": "192.168.0.108",
      "mac": "aa:bb:cc:dd:ee:ff",
      "rx_kbps": 82.1,
      "tx_kbps": 14.3
    }
  ],
  "ping_ms": 42.5,
  "uptime_s": 23145,
  "timestamp": "2025-11-11T21:05:44.900Z"
}
