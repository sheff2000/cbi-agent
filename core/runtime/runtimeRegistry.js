// =============================
// File: core/runtime/runtimeRegistry.js
// для регистрации рантайм сервисов и дальше импортировать их нормально
// 
// registerRuntime() - добавить сервис(ссылку) 
// getRuntime() - ипортировать в нужном сервисе/модуле
//
// =============================


const runtimes = new Map();

export function registerRuntime(name, instance) {
  if (runtimes.has(name)) {
    throw new Error(`[runtimeRegistry] runtime "${name}" already registered`);
  }
  runtimes.set(name, instance);
}

export function getRuntime(name) {
  return runtimes.get(name) || null;
}
