/* Alban Falahi — branch-only Smart Prep Timer hook.
 * This file is intentionally passive until the host page explicitly enables it.
 * It does not replace existing timer functions or alter order/Supabase state.
 */
(function (global) {
  'use strict';
  const Timer = global.AlbanFalahiSmartPrep;
  if (!Timer) return;

  const API = {
    start(orderId, minutes = 15) {
      return Timer.start(String(orderId), minutes);
    },
    extend(orderId, minutes = 5) {
      return Timer.extend(String(orderId), minutes);
    },
    stop(orderId) {
      return Timer.stop(String(orderId));
    },
    snapshot(orderId) {
      return Timer.snapshot(String(orderId));
    },
    acknowledge(orderId) {
      return Timer.acknowledge(String(orderId));
    }
  };

  global.AlbanFalahiSmartPrepBranch = API;
})(window);
