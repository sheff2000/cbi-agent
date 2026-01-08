// фейковая реальность :)
// простая заглушка вместо реального опроса устройств
// как временное явление и для dev режима
// deviceMonitor/sources/mockSource.js
export const mockSource = {
  async scan() {
    return {
      video: [
        { path: '/dev/video0', labelHint: 'Mock Camera 0', hardwareId: 'mock:video0' },
        { path: '/dev/video2', labelHint: 'Mock Camera 2', hardwareId: 'mock:video2' }
      ],
      serial: [
        { path: '/dev/ttyUSB0' }
      ]
    };
  }
};
