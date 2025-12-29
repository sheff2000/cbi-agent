// video/videoService.js
import { bus } from '../core/bus.js';
import { EVENTS } from '../core/events.js';
import { VideoState } from './videoState.js';
import { VideoInstance } from './videoInstance.js';
import { emitVideoStatus } from './videoEvents.js';
import { log, warn } from '../logger.js';

export async function initVideoService() {
  const state = new VideoState();

  bus.on(EVENTS.AGENT_VIDEO_START, async payload => {
    const { device, flightId, tokenAccess } = payload;

    const streamId = `${flightId}:${device.id}`;

    if (state.has(streamId)) {
      warn('[VIDEO] stream already running', streamId);
      return;
    }

    const inst = new VideoInstance({
      streamId,
      device,
      flightId,
      tokenAccess
    });

    inst.onStatus(s => emitVideoStatus(s));
    state.add(streamId, inst);

    try {
      await inst.start();
    } catch (e) {
      warn('[VIDEO] start failed', e.message);
      state.remove(streamId);
    }
  });

  bus.on(EVENTS.AGENT_VIDEO_STOP, async payload => {
    const { streamId } = payload;
    const inst = state.get(streamId);
    if (!inst) return;

    await inst.stop();
    state.remove(streamId);
  });

  log('[VIDEO] service initialized');

  return {
    getState: () => state.snapshot(),
    stop: async () => {
      for (const inst of state.instances.values()) {
        await inst.stop();
      }
      state.clear();
    }
  };
}
