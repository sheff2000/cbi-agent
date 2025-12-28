// identity/deviceCreds.js

/**
 * Только:
 *  load
 *  save
 *  validate
 *  
 *  - hardware_id сюда приходит уже готовый.
 */

import { loadIdentity, saveIdentity } from './storageRouter.js';

export function loadDeviceCreds() {
  const id = loadIdentity();

  if (!id?.device_id || !id?.device_key) {
    return null;
  }
  
  return {
    device_id: id?.device_id || '',
    device_key: id?.device_key || '',
  };
}

export function saveDeviceCreds({ device_id, device_key }) {
  const id = loadIdentity() || {};
  saveIdentity({ ...id, device_id, device_key });
}
