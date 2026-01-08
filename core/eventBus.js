// =============================
// File: core/eventBus.js
// thin wrapper for bus.emit with payload checks
// =============================
import { bus } from './bus.js';
import { EVENTS } from './events.js';
import { warn } from '../logger.js';

const EVENT_SCHEMA = {
  [EVENTS.AGENT_VIDEO_START]: {
    required: [
      'device',
      'controlId',
      'cameraId',
      'flightUrl',
      'flightId',
      'tokenAccess',
      'sessionId',
      'userId',
    ],
  },
  [EVENTS.AGENT_VIDEO_STOP]: {
    required: ['controlId', 'cameraId'],
  },
  [EVENTS.SEND_CONTROL_PACKET]: {
    required: ['ws', 'msg'],
  },
  [EVENTS.RESPONSE_CAMERA]: {
    required: ['ws', 'msg'],
  },
  [EVENTS.VIDEO_STREAM_STATUS]: {
    required: ['streamId', 'cameraId', 'state', 'ts'],
  },
};

function validatePayload(event, payload) {
  const schema = EVENT_SCHEMA[event];
  if (!schema?.required?.length) return [];
  const missing = schema.required.filter(key => payload?.[key] === undefined);
  return missing;
}

export function emitEvent(event, payload, { strict = false } = {}) {
  const missing = validatePayload(event, payload);
  if (missing.length) {
    warn(`[EVENT] ${event} missing fields: ${missing.join(', ')}`);
    if (strict) return false;
  }

  bus.emit(event, payload);
  return true;
}
