// deviceMonitor/sources/simSource.js
// для sim режима
// мульти агентское тестирование на локалхосте
export const simSource = {
  async scan() {
    const cams = (process.env.SIM_VIDEO || '/dev/video0').split(',');
    const rc   = (process.env.SIM_SERIAL || '/dev/ttyUSB0').split(',');

    return {
      video: cams.map(p => ({ path: p })),
      serial: rc.map(p => ({ path: p }))
    };
  }
};
