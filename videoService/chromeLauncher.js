// video/chromeLauncher.js
import { spawn } from 'child_process';
import { loadDeviceCreds } from '../identity/index.js';

export function launchChrome({ devicePath, flightId, flightUrl, tokenAccess }) {

  const creds = loadDeviceCreds();
  const url =
    `${flightUrl}` +
    `?token=${tokenAccess}` +
    `&devId=${creds.device_id}` +
    `&camera=${encodeURIComponent(devicePath)}`;

  const args = [
    '--headless=new',
    '--autoplay-policy=no-user-gesture-required',
    '--use-fake-ui-for-media-stream',
    '--disable-gpu',
    '--no-sandbox',
    '--enable-features=WebRTC-H264WithOpenH264FFmpeg',
    '--use-fake-ui-for-media-stream',
    '--allow-file-access-from-files',
    `--user-data-dir=/tmp/chrome_${Date.now()}`,
    url
  ];

//--disable-gpu иногда ломает H.264 на слабых N100
// если будут чёрные кадры - убрать флаг

  return spawn('chromium', args, { stdio: 'ignore' });
}
