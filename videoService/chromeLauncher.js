// video/chromeLauncher.js
import { spawn } from 'child_process';

export function launchChrome({ devicePath, flightId, tokenAccess }) {
  const url =
    `${process.env.FLIGHT_URL}/${flightId}` +
    `?agentToken=${tokenAccess}` +
    `&camera=${encodeURIComponent(devicePath)}`;

  const args = [
    '--headless=new',
    '--autoplay-policy=no-user-gesture-required',
    '--use-fake-ui-for-media-stream',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=/tmp/chrome_${Date.now()}`,
    url
  ];

  return spawn('chromium', args, { stdio: 'ignore' });
}
