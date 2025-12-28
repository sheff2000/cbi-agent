// =============================
// File: metrics/metrics.js
// =============================

import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';
import { log, warn } from '../logger.js';

// внутренний кэш для расчёта скорости
const prevNet = new Map();

/**
 * Сбор базовых и сетевых метрик агента.
 * Возвращает объект с показателями системы, включая сетевую скорость.
 */
export function collectMetrics(serverHost = null) {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  // -------------------------------
  // 1️⃣ CPU и память
  // -------------------------------
  const cpuLoad = os.loadavg()[0];
  const cpuCount = os.cpus()?.length || 1;
  const mem = {
    total_mb: Math.round(total / 1024 / 1024),
    used_mb: Math.round(used / 1024 / 1024),
    used_pct: Math.round((used / total) * 100)
  };

  // -------------------------------
  // 2️⃣ Диск (по /)
  // -------------------------------
  let disk = null;
  try {
    const df = execSync('df -k /', { encoding: 'utf8' }).split('\n')[1]?.split(/\s+/);
    if (df && df.length >= 5) {
      const total_kb = Number(df[1]) || 0;
      const used_kb = Number(df[2]) || 0;
      const free_kb = Number(df[3]) || 0;
      disk = {
        total_gb: +(total_kb / 1024 / 1024).toFixed(1),
        used_gb: +(used_kb / 1024 / 1024).toFixed(1),
        free_gb: +(free_kb / 1024 / 1024).toFixed(1),
        used_pct: Math.round((used_kb / total_kb) * 100)
      };
    }
  } catch {}

  // -------------------------------
  // 3️⃣ Сетевые интерфейсы
  // -------------------------------
  const ifaces = os.networkInterfaces();
  const netStats = [];
  const now = Date.now();

  for (const [name, entries] of Object.entries(ifaces)) {
    const ipv4 = entries.find(e => e.family === 'IPv4' && !e.internal);
    if (!ipv4) continue;

    const stat = { iface: name, addr: ipv4.address, mac: ipv4.mac };
    try {
      // читаем системные счётчики (Linux only)
      const rxPath = `/sys/class/net/${name}/statistics/rx_bytes`;
      const txPath = `/sys/class/net/${name}/statistics/tx_bytes`;

      if (fs.existsSync(rxPath) && fs.existsSync(txPath)) {
        const rxBytes = Number(fs.readFileSync(rxPath, 'utf8'));
        const txBytes = Number(fs.readFileSync(txPath, 'utf8'));

        const prev = prevNet.get(name);
        if (prev) {
          const dt = (now - prev.ts) / 1000; // сек
          const rxRate = ((rxBytes - prev.rx) * 8) / 1024 / dt; // kbps
          const txRate = ((txBytes - prev.tx) * 8) / 1024 / dt; // kbps
          stat.rx_kbps = Math.max(0, +rxRate.toFixed(1));
          stat.tx_kbps = Math.max(0, +txRate.toFixed(1));
        }

        prevNet.set(name, { rx: rxBytes, tx: txBytes, ts: now });
      }
    } catch (e) {
      // обычно safe to ignore
    }

    netStats.push(stat);
  }

  // -------------------------------
  // 4️⃣ Ping до сервера (опционально)
  // -------------------------------
  let pingMs = null;
  if (serverHost) {
    try {
      const cmd = process.platform === 'win32'
        ? `ping -n 1 ${serverHost}`
        : `ping -c 1 -W 1 ${serverHost}`;
      const out = execSync(cmd, { encoding: 'utf8', timeout: 2000 });
      const match = out.match(/time[=<]\s*([\d.]+)/);
      pingMs = match ? Number(match[1]) : null;
    } catch {
      pingMs = null;
    }
  }

  // -------------------------------
  // 5️⃣ Финальный объект
  // -------------------------------
  return {
    cpu: { load1: cpuLoad, cores: cpuCount },
    mem,
    disk,
    net: netStats,
    ping_ms: pingMs,
    uptime_s: Math.round(os.uptime()),
    timestamp: new Date().toISOString()
  };
}


/**
 {
  "cpu": { "load1": 0.23, "cores": 4 },
  "mem": { "total_mb": 3956, "used_mb": 1021, "used_pct": 25 },
  "disk": { "total_gb": 64, "used_gb": 18, "free_gb": 46, "used_pct": 28 },
  "net": [
    {
      "iface": "eth0",
      "addr": "192.168.0.108",
      "mac": "aa:bb:cc:dd:ee:ff",
      "rx_kbps": 82.1,
      "tx_kbps": 14.3
    }
  ],
  "ping_ms": 42.5,
  "uptime_s": 23145,
  "timestamp": "2025-11-11T21:05:44.900Z"
}


 */