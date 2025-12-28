// Хранит текущее логическое состояние, без IO
// registryState.js
export class RegistryState {
  constructor() {
    this.devices = {
      video: [],
      serial: []
    };

    this.controls = [];
  }
}
