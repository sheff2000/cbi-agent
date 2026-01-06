// video/videoInstance.js
import { launchChrome } from './chromeLauncher.js';

export class VideoInstance {
  constructor({ streamId, device, flightId, flightUrl, tokenAccess }) {
    this.streamId = streamId;
    this.device = device;
    this.flightId = flightId;
    this.flightUrl = flightUrl;
    this.tokenAccess = tokenAccess;

    this.proc = null;
    this.cb = null;
  }

  onStatus(cb) {
    this.cb = cb;
  }

  emit(state, reason = null) {
    if (!this.cb) return;
    this.cb({
      streamId: this.streamId,
      cameraId: this.device.id,
      state,
      reason,
      ts: Date.now()
    });
  }

  async start() {
    this.emit('starting');

    try {
      this.proc = launchChrome({
        devicePath: this.device.path,
        flightId: this.flightId,
        flightUrl: this.flightUrl,
        tokenAccess: this.tokenAccess
      });

      this.proc.on('exit', () => {
        this.emit('error', 'process_exit');
      });

      this.emit('started');
    } catch (e) {
      this.emit('error', 'spawn_failed');
      throw e;
    }
  }

  async stop() {
    this.emit('stopping');
    if (this.proc) {
      this.proc.kill('SIGTERM');
      this.proc = null;
    }
    this.emit('stopped');
  }
}
