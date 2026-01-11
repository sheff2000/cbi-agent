// video/videoInstance.js
import { launchChrome } from './chromeLauncher.js';

export class VideoInstance {
  constructor({ streamId, device, flightId, flightUrl, tokenAccess, sessionId, userId }) {
    this.streamId = streamId;
    this.device = device;
    this.flightId = flightId;
    this.flightUrl = flightUrl;
    this.tokenAccess = tokenAccess;
    this.sessionId = sessionId;
    this.userId = userId;

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
      sessionId: this.sessionId,
      state,
      reason,
      ts: Date.now()
    });
  }

  async start() {
    this.emit('starting');

    try {
      this.proc = launchChrome({
        cameraId: this.device.id,
        labelHint: this.device.labelHint,
        flightId: this.flightId,
        flightUrl: this.flightUrl,
        tokenAccess: this.tokenAccess,
        sessionId: this.sessionId,
        userId: this.userId,
      });
      if (!this.proc) throw new Error('launch_failed');

      this.proc.on('exit', (code, signal) => {
        this.emit('error', 'process_exit');
        this.emit('stopped', `exit_code=${code ?? 'null'} signal=${signal ?? 'null'}`);
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
