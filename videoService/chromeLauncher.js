import { spawn } from 'child_process';

export function launchChrome({ devicePath, flightUrl, accessToken, video }) {
  const url =
    `${flightUrl}?agentToken=${accessToken}&camera=${encodeURIComponent(devicePath)}`;

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
