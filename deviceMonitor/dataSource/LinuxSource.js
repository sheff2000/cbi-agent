// deviceMonitor/sources/linuxSource.js
// опрос устрйоств на проде (Ubuntu)
import fs from 'fs';
import path from 'path';

function readSysfsValue(dir, file) {
  try {
    return fs.readFileSync(path.join(dir, file), 'utf8').trim() || null;
  } catch {
    return null;
  }
}

function readVideoLabel(devName) {
  return readSysfsValue(`/sys/class/video4linux/${devName}`, 'name');
}

function readVideoHardwareId(devName) {
  let sysPath;
  try {
    sysPath = fs.realpathSync(`/sys/class/video4linux/${devName}/device`);
  } catch {
    return null;
  }

  let dir = sysPath;
  let vendor = null;
  let product = null;
  let serial = null;
  let portPath = null;

  while (dir && dir !== '/') {
    vendor = vendor || readSysfsValue(dir, 'idVendor');
    product = product || readSysfsValue(dir, 'idProduct');
    serial = serial || readSysfsValue(dir, 'serial');
    if (vendor && product && !portPath) portPath = path.basename(dir);

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  if (vendor && product && serial) {
    return `usb:${vendor}:${product}:${serial}`;
  }
  if (vendor && product && portPath) {
    return `usb:${vendor}:${product}:${portPath}`;
  }
  return `path:${sysPath}`;
}

function listByPrefix(prefixes) {
  try {
    return fs.readdirSync('/dev')
      .filter(f => prefixes.some(p => f.startsWith(p)))
      .map(f => {
        const devPath = `/dev/${f}`;
        if (!f.startsWith('video')) return { path: devPath };
        const devName = path.basename(devPath);
        const labelHint = readVideoLabel(devName);
        const hardwareId = readVideoHardwareId(devName);
        return {
          path: devPath,
          ...(labelHint ? { labelHint } : {}),
          ...(hardwareId ? { hardwareId } : {}),
        };
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
