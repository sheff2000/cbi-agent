// deviceMonitor/sources/simSource.js
// для sim режима
// мульти агентское тестирование на локалхосте
export const simSource = {
  async scan() {
    const cams = (process.env.SIM_VIDEO || '/dev/video0').split(',');
    const ids = (process.env.SIM_VIDEO_IDS || '').split(',');
    const rc   = (process.env.SIM_SERIAL || '/dev/ttyUSB0').split(',');

    return {
      video: cams.map((p, idx) => ({
        path: p,
        ...(ids[idx] ? { hardwareId: ids[idx] } : { hardwareId: `sim:${p}` })
      })),
      serial: rc.map(p => ({ path: p }))
    };
  }
};
