/* Alban Falahi — Smart preparation timer (feature branch only)
 * Branch-safe timer core. The host app remains responsible for order status,
 * persistence to Supabase, UI rendering, and actual audio playback.
 */
(function (global) {
  'use strict';
  const STORAGE_KEY = 'alban_falahi_smart_prep_v2';
  const DEFAULT_MINUTES = 15;
  const WARNING_MINUTES = 5;
  const REMINDER_INTERVAL_MS = 60 * 1000;

  function read() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function write(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (_) {}
  }
  function get(orderId) { return read()[String(orderId)] || null; }

  function start(orderId, minutes = DEFAULT_MINUTES, now = Date.now()) {
    const all = read();
    const id = String(orderId);
    const totalMinutes = Math.max(0, Number(minutes) || 0);
    const totalMs = totalMinutes * 60000;
    all[id] = {
      orderId: id,
      startedAt: now,
      deadlineAt: now + totalMs,
      totalMs,
      warningAt: now + Math.max(0, totalMinutes - WARNING_MINUTES) * 60000,
      overdue: false,
      acknowledged: false,
      lastAlertAt: null,
      version: 2
    };
    write(all);
    return all[id];
  }

  function extend(orderId, extraMinutes, now = Date.now()) {
    const all = read();
    const id = String(orderId);
    const current = all[id];
    if (!current) return null;
    const extraMs = Math.max(0, Number(extraMinutes) || 0) * 60000;
    const base = Math.max(now, Number(current.deadlineAt) || now);
    current.deadlineAt = base + extraMs;
    current.totalMs = Math.max(0, current.deadlineAt - Number(current.startedAt || now));
    current.warningAt = Math.max(now, current.deadlineAt - WARNING_MINUTES * 60000);
    current.overdue = false;
    current.acknowledged = false;
    current.lastAlertAt = null;
    current.version = 2;
    write(all);
    return current;
  }

  function snapshot(orderId, now = Date.now()) {
    const item = get(orderId);
    if (!item) return null;
    const deadlineAt = Number(item.deadlineAt) || now;
    const remainingMs = Math.max(0, deadlineAt - now);
    const overdue = now >= deadlineAt;
    const warning = !overdue && now >= Number(item.warningAt || deadlineAt);
    const lastAlertAt = Number(item.lastAlertAt || 0);
    const canReminder = overdue && !item.acknowledged && (now - lastAlertAt >= REMINDER_INTERVAL_MS);
    return {
      ...item,
      remainingMs,
      remainingMinutes: Math.ceil(remainingMs / 60000),
      warning,
      overdue,
      overdueMs: Math.max(0, now - deadlineAt),
      phase: overdue ? 'overdue' : warning ? 'warning' : 'running',
      canReminder
    };
  }

  function markAlert(orderId, now = Date.now()) {
    const all = read();
    const id = String(orderId);
    if (!all[id]) return false;
    all[id].lastAlertAt = now;
    write(all);
    return true;
  }

  function acknowledge(orderId) {
    const all = read();
    const id = String(orderId);
    if (!all[id]) return false;
    all[id].acknowledged = true;
    write(all);
    return true;
  }

  function stop(orderId) {
    const all = read();
    delete all[String(orderId)];
    write(all);
  }

  global.AlbanFalahiSmartPrep = {
    start, extend, snapshot, acknowledge, stop, get, markAlert
  };
})(window);
