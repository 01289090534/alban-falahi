/* Alban Falahi — Smart preparation timer (feature branch only)
 * Does not touch orders, Supabase, Push, login, or UI rendering.
 * Host app decides when to start/extend/stop a timer and when to play sound.
 */
(function (global) {
  'use strict';
  const STORAGE_KEY = 'alban_falahi_smart_prep_v1';
  const DEFAULT_MINUTES = 15;
  const WARNING_MINUTES = 5;

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
    const totalMs = Math.max(0, Number(minutes) || 0) * 60000;
    all[id] = {
      orderId: id,
      startedAt: now,
      deadlineAt: now + totalMs,
      totalMs,
      warningAt: now + Math.max(0, Number(minutes) - WARNING_MINUTES) * 60000,
      overdue: false,
      acknowledged: false
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
    write(all);
    return current;
  }

  function snapshot(orderId, now = Date.now()) {
    const item = get(orderId);
    if (!item) return null;
    const remainingMs = Math.max(0, Number(item.deadlineAt) - now);
    return {
      ...item,
      remainingMs,
      remainingMinutes: Math.ceil(remainingMs / 60000),
      warning: remainingMs > 0 && now >= Number(item.warningAt),
      overdue: now >= Number(item.deadlineAt),
      overdueMs: Math.max(0, now - Number(item.deadlineAt))
    };
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

  global.AlbanFalahiSmartPrep = { start, extend, snapshot, acknowledge, stop, get };
})(window);
