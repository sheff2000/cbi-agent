import { VideoState } from './videoState.js';
import { VideoInstance } from './videoInstance.js';
import { emitVideoStatus } from './videoEvents.js';

export class VideoService {
  constructor() {
    this.state = new VideoState();
  }

  async start({ streamId, flight, source, video }) {
    if (this.state.has(streamId)) {
      throw new Error('stream_exists');
    }

    const inst = new VideoInstance({
      streamId,
      flight,
      source,
      video
    });

    this.state.add(streamId, inst);

    inst.onStatus(status => emitVideoStatus(status));

    await inst.start();
  }

  async stop(streamId) {
    const inst = this.state.get(streamId);
    if (!inst) return;

    await inst.stop();
    this.state.remove(streamId);
  }

  getState() {
    return this.state.snapshot();
  }
}
