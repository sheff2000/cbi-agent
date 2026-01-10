// video/chromeLauncher.js
import { spawn } from 'child_process';
import { loadDeviceCreds } from '../identity/index.js';
import { log, warn } from '../logger.js';

export function launchChrome({
  cameraId,
  labelHint = null,
  flightId,
  flightUrl,
  tokenAccess,
  sessionId,
  userId
}) {

  try {
    const creds = loadDeviceCreds();
    const cameraHintParam = labelHint
      ? `&cameraHint=${encodeURIComponent(labelHint)}`
      : '';
    const url =
      `${flightUrl}` +
      `?token=${tokenAccess}` +
      `&devId=${creds.device_id}` +
      `&userId=${userId}` +
      `&sessionId=${sessionId}` + 
      `${cameraHintParam}` +
      `&cameraId=${encodeURIComponent(cameraId)}`;

    const args = [
      '--headless=new',
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream',
      '--disable-gpu',
      '--no-sandbox',
      '--enable-features=WebRTC-H264WithOpenH264FFmpeg',
      '--allow-file-access-from-files',
      `--user-data-dir=/tmp/chrome_${Date.now()}`,
      url
    ];
    //log(`[VIDEO] URL: ${url}`);
     const chromeBin = process.env.CHROMIUM_BIN || 'chromium';
     const proc = spawn(chromeBin, args, { stdio: 'ignore' });
     proc.on('error', err => {
       warn(`[VIDEO] chromium spawn failed: ${err.message}`);
     });
     return proc;
  }
  catch (e) {
    warn(`[VIDEO] chrome launch failed: ${e?.message || e}`);
    return null;
  }

//--disable-gpu иногда ломает H.264 на слабых N100
// если будут чёрные кадры - убрать флаг

 
}
