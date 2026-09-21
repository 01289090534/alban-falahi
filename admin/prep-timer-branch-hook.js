/* Alban Falahi — branch-only Smart Prep Timer hook.
 * Passive adapter for the existing shop UI. It does not replace order logic,
 * Supabase state, or the production timer until the host page opts in.
 */
(function (global) {
  'use strict';
  const Timer = global.AlbanFalahiSmartPrep;
  if (!Timer) return;

  const API = {
    start(orderId, minutes = 15) { return Timer.start(String(orderId), minutes); },
    extend(orderId, minutes = 5) { return Timer.extend(String(orderId), minutes); },
    stop(orderId) { return Timer.stop(String(orderId)); },
    snapshot(orderId) { return Timer.snapshot(String(orderId)); },
    acknowledge(orderId) { return Timer.acknowledge(String(orderId)); },
    markAlert(orderId) { return Timer.markAlert(String(orderId)); }
  };

  global.AlbanFalahiSmartPrepBranch = API;
})(window);
