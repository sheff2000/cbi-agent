// video/chromeLauncher.js
import { spawn } from 'child_process';
import { loadDeviceCreds } from '../identity/index.js';
import { log, warn } from '../logger.js';

function maskTokenInUrl(input) {
  try {
    const u = new URL(input);
    if (u.searchParams.has('token')) {
      u.searchParams.set('token', '***');
    }
    return u.toString();
  } catch {
    return input;
  }
}

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
    const chromeBin = process.env.CHROMIUM_BIN || 'chromium';
    log(`[VIDEO] chromium spawn: bin=${chromeBin} url=${maskTokenInUrl(url)}`);
    log(`[VIDEO] chromium args: ${JSON.stringify(args.slice(0, -1))}`);

    const proc = spawn(chromeBin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    proc.on('error', err => {
      warn(`[VIDEO] chromium spawn failed: ${err.message}`);
    });
    proc.stderr?.on('data', chunk => {
      const msg = chunk.toString('utf8').trim();
      if (msg) warn(`[VIDEO] chromium stderr: ${msg}`);
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
