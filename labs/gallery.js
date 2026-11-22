'use strict';
(()=>{
  const route=new URLSearchParams(location.search).get('route');
  if(!route||!/^0[1-7]{7}$/.test(route)||new Set(route).size!==8)return;
  document.getElementById('playPatrol').click();
  document.getElementById('closePatrol').addEventListener('click',()=>{
    const address=new URL(location.href);
    address.searchParams.delete('route');
    history.replaceState(null,'',address);
  },{once:true});
})();