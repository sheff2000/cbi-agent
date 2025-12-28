export class VideoState {
  constructor() {
    this.instances = new Map();
  }

  add(id, inst) {
    this.instances.set(id, inst);
  }

  get(id) {
    return this.instances.get(id);
  }

  has(id) {
    return this.instances.has(id);
  }

  remove(id) {
    this.instances.delete(id);
  }

  snapshot() {
    return Array.from(this.instances.keys());
  }
}
