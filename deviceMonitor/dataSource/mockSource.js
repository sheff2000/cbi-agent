// фейковая реальность :)
// простая заглушка вместо реального опроса устройств
// как временное явление и для dev режима
// deviceMonitor/sources/mockSource.js
export const mockSource = {
  async scan() {
    return {
      video: [
        { path: '/dev/video0' }
      ],
      serial: [
        { path: '/dev/ttyUSB0' }
      ]
    };
  }
};

