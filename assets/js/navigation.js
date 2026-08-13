const toggle=document.querySelector('[data-nav-toggle]');const nav=document.querySelector('[data-nav]');const close=document.querySelector('[data-nav-close]');
function setNav(open){if(!nav||!toggle)return;nav.classList.toggle('open',open);nav.setAttribute('aria-hidden',String(!open));toggle.setAttribute('aria-expanded',String(open));if(open)nav.querySelector('a,button')?.focus();}
toggle?.addEventListener('click',()=>setNav(!nav.classList.contains('open')));close?.addEventListener('click',()=>setNav(false));document.addEventListener('keydown',e=>{if(e.key==='Escape')setNav(false)});
