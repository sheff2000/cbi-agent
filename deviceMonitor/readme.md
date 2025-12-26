Мониторинг - что подключено к Агенту в данный момент
на текущий момент мониторит USB подключения

выдает список ПОДКЛЮЧЕННЫХ устройств

services/
 └─ deviceMonitor/
    ├─ index.js
    ├─ deviceMonitor.js
    └─dataSource
        └─ mockData.js
        └─ linuxDataSource.js


deviceMonitor (singleton)
   ├─ start()        ← один раз при старте агента
   ├─ refresh()      ← внутренний механизм
   ├─ getCaps()      ← читать состояние
   └─ getSnapshot()  ← читать состояние
