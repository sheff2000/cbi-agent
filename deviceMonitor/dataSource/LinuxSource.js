// deviceMonitor/sources/linuxSource.js
// опрос устрйоств на проде (Ubuntu)
import fs from 'fs';
import path from 'path';

function readVideoLabel(devName) {
  try {
    const labelPath = `/sys/class/video4linux/${devName}/name`;
    const label = fs.readFileSync(labelPath, 'utf8').trim();
    return label || null;
  } catch {
    return null;
  }
}

function listByPrefix(prefixes) {
  try {
    return fs.readdirSync('/dev')
      .filter(f => prefixes.some(p => f.startsWith(p)))
      .map(f => {
        const devPath = `/dev/${f}`;
        if (!f.startsWith('video')) return { path: devPath };
        const labelHint = readVideoLabel(path.basename(devPath));
        return { path: devPath, ...(labelHint ? { labelHint } : {}) };
      });
  } catch {
    return [];
  }
}

export const linuxSource = {
  async scan() {
    return {
      video: listByPrefix(['video']),
      serial: listByPrefix(['ttyUSB', 'ttyACM'])
    };
  }
};
