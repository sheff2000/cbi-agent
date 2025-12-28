import { launchChrome } from './chromeLauncher.js';

export class VideoInstance {
  constructor({ streamId, flight, source, video }) {
    this.streamId = streamId;
    this.flight = flight;
    this.source = source;
    this.video = video;

    this.proc = null;
    this.statusCb = null;
  }

  onStatus(cb) {
    this.statusCb = cb;
  }

  emit(state, reason = null) {
    if (!this.statusCb) return;

    this.statusCb({
      streamId: this.streamId,
      logicalCameraId: this.source.logicalId,
      state,
      reason,
      ts: Date.now()
    });
  }

  async start() {
    this.emit('starting');

    try {
      this.proc = launchChrome({
        devicePath: this.source.physical.devicePath,
        flightUrl: this.flight.url,
        accessToken: this.flight.accessToken,
        video: this.video
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
