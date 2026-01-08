/**
 * Отвечает за:
 *  - применение сохранённой карты
 *  - создание дефолтов
 *  - сопоставление physical → logical
 * Пример ответственности:
 *  - если карты нет → создать control1
 *  - если карта есть → применить
 *  - если logical device ожидается, но physical нет → status = offline
 */

// deviceRegistry/registryMapper.js

export function buildDefaultState(physicalSnapshot) {
  const state = {
    devices: {
      video: [],
      serial: [],
    },
    controls: [],
  };

  let camIndex = 1;
  let rcIndex = 1;

  for (const cam of physicalSnapshot.video || []) {
    state.devices.video.push({
      id: `camera${camIndex++}`,
      type: 'video',
      path: cam.path,
      status: cam.status || 'online',
      labelHint: cam.labelHint,
      hardwareId: cam.hardwareId,
      inUse: false, // ресурс используется?
    });
  }

  for (const rc of physicalSnapshot.serial || []) {
    state.devices.serial.push({
      id: `rc${rcIndex++}`,
      type: 'serial',
      path: rc.path,
      status: rc.status || 'online',
      inUse: false, // ресурс используется?
    });
  }

  // дефолтный control
  state.controls.push({
    id: 'control1',
    cameras: state.devices.video.map(d => d.id),
    rc: state.devices.serial.map(d => d.id),
  });

  return state;
}
