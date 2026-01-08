// video/videoEvents.js
import { EVENTS } from '../core/events.js';
import { emitEvent } from '../core/eventBus.js';

export function emitVideoStatus(payload) {
  emitEvent(EVENTS.VIDEO_STREAM_STATUS, payload);
}
