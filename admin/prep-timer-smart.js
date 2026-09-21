/* Alban Falahi — Smart preparation timer helpers. Intentionally standalone. */
(function(){
  'use strict';
  const NS='afSmartPrep';
  function state(){try{return JSON.parse(localStorage.getItem(NS)||'{}')}catch{return {}}}
  function save(v){try{localStorage.setItem(NS,JSON.stringify(v))}catch{}}
  function deadline(orderId, ms){const s=state();s[orderId]={deadline:Date.now()+Math.max(0,Number(ms)||0)};save(s);return s[orderId]}
  function clear(orderId){const s=state();delete s[orderId];save(s)}
  function remaining(orderId){const s=state();return Math.max(0,(s[orderId]?.deadline||0)-Date.now())}
  function overdue(orderId){return remaining(orderId)===0 && !!state()[orderId]}
  window.AlbanFalahiSmartPrep={deadline,clear,remaining,overdue};
})();
