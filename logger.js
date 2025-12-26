// =============================
// File: logger.js
// ==========================

export function ts() {
  const d = new Date();
  const pad = (n)=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} `+
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
export const log = (...a)=> console.log(`[${ts()}]`, ...a);
export const warn = (...a)=> console.warn(`[${ts()}]`, ...a);
export const err  = (...a)=> console.error(`[${ts()}]`, ...a);
