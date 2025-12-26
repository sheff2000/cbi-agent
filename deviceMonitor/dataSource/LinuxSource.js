// deviceMonitor/sources/linuxSource.js
// опрос устрйоств на проде (Ubuntu)
import fs from 'fs';

function listByPrefix(prefixes) {
  try {
    return fs.readdirSync('/dev')
      .filter(f => prefixes.some(p => f.startsWith(p)))
      .map(f => ({ path: `/dev/${f}` }));
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
