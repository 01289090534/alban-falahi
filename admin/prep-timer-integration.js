/* Alban Falahi — Smart Prep Timer integration (branch-only).
 * Safe adapter: does not mutate order state, Supabase, or existing UI.
 * Exposes a tiny API so the existing app can opt in later.
 */
(function(){
  'use strict';
  const Timer = window.AlbanFalahiSmartPrep;
  if(!Timer) return;
  const timers = new Map();
  function start(orderId, minutes=15){
    const id=String(orderId);
    Timer.start(id, minutes);
    timers.set(id,true);
    return Timer.snapshot(id);
  }
  function extend(orderId, minutes){
    const id=String(orderId);
    const result=Timer.extend(id, minutes);
    return result;
  }
  function stop(orderId){
    const id=String(orderId);
    timers.delete(id);
    return Timer.stop(id);
  }
  function get(orderId){return Timer.snapshot(String(orderId));}
  window.AlbanFalahiPrepTimerIntegration={start,extend,stop,get,active:()=>[...timers.keys()]};
})();
