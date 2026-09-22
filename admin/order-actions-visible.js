(()=>{if(window.__AF_ORDER_ACTIONS_VISIBLE_V3)return;window.__AF_ORDER_ACTIONS_VISIBLE_V3=true;
const move=()=>{
 document.querySelectorAll('.moreWrap').forEach(w=>{
   const summary=w.querySelector(':scope > summary');
   const menu=w.querySelector(':scope > .moreMenu');
   if(summary)summary.style.display='none';
   if(menu){
     const actions=w.previousElementSibling?.classList.contains('actions')?w.previousElementSibling:w.parentElement?.querySelector('.actions');
     if(actions){
       [...menu.querySelectorAll('.btn')].forEach(btn=>{if(!btn.dataset.afMoved){btn.dataset.afMoved='1';actions.appendChild(btn)}});
       if(!menu.querySelector('.btn'))w.remove();
     }
   }
 });
};
const start=()=>{move();new MutationObserver(move).observe(document.body,{childList:true,subtree:true});};
if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
})();