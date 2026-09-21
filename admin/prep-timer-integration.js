/* Alban Falahi — Smart Prep Timer integration (branch-only).
 * Safe adapter: does not mutate order state, Supabase, or existing UI.
 * The timer core/localStorage is the source of truth; no in-memory Map is used.
 */
(function () {
  'use strict';

  const Timer = window.AlbanFalahiSmartPrep;
  if (!Timer) return;

  function idOf(orderId) {
    return String(orderId);
  }

  function start(orderId, minutes = 15) {
    const id = idOf(orderId);
    Timer.start(id, minutes);
    return Timer.snapshot(id);
  }

  function extend(orderId, minutes = 5) {
    return Timer.extend(idOf(orderId), minutes);
  }

  function stop(orderId) {
    return Timer.stop(idOf(orderId));
  }

  function get(orderId) {
    return Timer.snapshot(idOf(orderId));
  }

  function acknowledge(orderId) {
    return Timer.acknowledge(idOf(orderId));
  }

  function markAlert(orderId) {
    return Timer.markAlert(idOf(orderId));
  }

  function active() {
    // Rebuild the active list from persistent timer state so a page refresh
    // does not lose the timers that are still running/overdue.
    try {
      const raw = localStorage.getItem('alban_falahi_smart_prep_v2');
      const all = JSON.parse(raw || '{}');
      return Object.keys(all).filter((id) => Timer.snapshot(id));
    } catch (_) {
      return [];
    }
  }

  window.AlbanFalahiPrepTimerIntegration = {
    start,
    extend,
    stop,
    get,
    acknowledge,
    markAlert,
    active
  };
})();
