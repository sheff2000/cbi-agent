import { bus } from '../core/bus.js';
import { EVENTS } from '../core/events.js';

export function emitVideoStatus(payload) {
  bus.emit(EVENTS.VIDEO_STREAM_STATUS, payload);
}
