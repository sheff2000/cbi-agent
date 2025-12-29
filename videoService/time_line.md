# процес запроса видео

wsAgent/control
   ↓
deviceRegistry.requestVideo()
   ↓
bus.emit(AGENT_VIDEO_START)
   ↓
videoService (listener)
   ↓
VideoInstance.start()
   ↓
emit status → bus
   ↓
sendMsgService → server → frontend


video/
 ├─ videoService.js        ← сервис, подписка на bus
 ├─ videoState.js          ← Map активных стримов
 ├─ videoInstance.js       ← один браузер = один стрим
 ├─ videoEvents.js         ← emit в bus
 └─ chromeLauncher.js
