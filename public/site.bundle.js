/*! site.bundle.js — cohesive enhancements & motion pack
   Includes:
   - Smooth anchors / sticky header / scroll progress
   - Reveal on scroll + stagger
   - Commands page live filter (#q -> #list .cmd)
   - Copy buttons for inline <code>
   - Current year fill (#y)
   - Scrollspy for in-page nav
   - Parallax (data-parallax), Tilt (data-tilt), Magnetic buttons (.btn-magnetic)
   - Page fade transitions
   - Theme auto/apply (uses <html data-theme="..."> when #theme button exists)
   - Service worker registration (no-op if not supported)
   - Reduced motion aware
*/
(function(){
  'use strict';
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const on = (el,ev,fn,opt)=> el && el.addEventListener(ev,fn,opt);
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ========== 0) Base a11y styles (skip link, focus ring) ========== */
  (function baseStyles(){
    const css = document.createElement('style');
    css.textContent = `
      .skip{position:absolute;left:-9999px;top:0;background:#fff;color:#111;padding:.5rem .75rem;border-radius:.5rem;
            box-shadow:0 10px 30px rgba(0,0,0,.15);z-index:10000}
      .skip:focus{left:16px;top:12px;outline:2px solid #111}
      :focus-visible{outline:2px solid rgba(124,107,255,.9);outline-offset:2px}
      nav a.active{ text-underline-offset: .35em; text-decoration: underline; }
      .reveal{opacity:0;transform:translateY(12px);transition:opacity .6s ease, transform .6s ease}
      .reveal.on{opacity:1;transform:none}
    `;
    document.head.appendChild(css);
  })();

  /* ========== 1) Smooth in-page anchors ========== */
  $$('a[href^="#"]').forEach(a => {
    on(a, 'click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const id = decodeURIComponent(href.slice(1));
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { history.pushState(null, '', '#' + id); } catch (_) {}
      }
    });
  });

  /* ========== 2) Sticky header shadow ========== */
  const header = $('header.sticky') || $('header');
  const elevateHeader = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (!header) return;
    if (y > 4) {
      header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.28)';
      header.style.borderBottomColor = 'rgba(255,255,255,.18)';
    } else {
      header.style.boxShadow = 'none';
      header.style.borderBottomColor = 'rgba(255,255,255,.10)';
    }
  };
  elevateHeader();
  on(window, 'scroll', elevateHeader, { passive: true });

  /* ========== 3) Top progress bar ========== */
  (function setupProgressBar() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    Object.assign(bar.style, {
      position:'fixed', left:'0', top:'0', height:'3px', width:'0%', zIndex:'9999',
      background:'linear-gradient(90deg, rgba(124,107,255,1), rgba(41,182,246,1))',
      transition:'width .1s linear'
    });
    document.body.appendChild(bar);
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const ratio = max > 0 ? (h.scrollTop / max) : 0;
      bar.style.width = (ratio * 100).toFixed(2) + '%';
    };
    update();
    on(window, 'scroll', update, { passive: true });
    on(window, 'resize', update);
  })();

  /* ========== 4) Reveal-on-scroll (base) ========== */
  (function setupReveal(){
    const candidates = [
      ...$$('.glass'),
      ...$$('section[id]'),
      ...$$('h2'),
      ...$$('table.table')
    ];
    candidates.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) {
          ent.target.classList.add('on');
          io.unobserve(ent.target);
        }
      }
    }, { threshold: 0.12 });
    candidates.forEach(el => io.observe(el));
  })();

  /* ========== 5) Current year (#y) ========== */
  $$('#y').forEach(el => el.textContent = new Date().getFullYear());

  /* ========== 6) Commands page live filter (#q -> #list .cmd) ========== */
  (function commandsFilter(){
    const q = $('#q'); const list = $('#list');
    if (!q || !list) return;
    const items = $$('.cmd', list).map(el => ({ el, text: el.textContent.toLowerCase() }));
    const badge = document.createElement('div');
    badge.style.fontSize = '.85rem'; badge.style.color = 'var(--muted, #a8b0d4)'; badge.style.marginTop = '8px';
    (q.parentElement||list).appendChild(badge);
    const doFilter = () => {
      const v = q.value.toLowerCase().trim();
      let visible = 0;
      items.forEach(({ el, text }) => {
        const show = !v || text.includes(v);
        el.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      badge.textContent = v ? `${visible} 件ヒット` : '';
    };
    on(q, 'input', doFilter); doFilter();
  })();

  /* ========== 7) Copy buttons for inline <code> ========== */
  (function codeCopy(){
    const codeBlocks = $$('code').filter(c => (c.textContent || '').length > 0 && (c.textContent || '').length <= 120);
    codeBlocks.forEach(code => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = 'コピー';
      btn.setAttribute('aria-label', 'このコードをコピー');
      Object.assign(btn.style, {
        marginLeft:'8px', fontSize:'.75rem', padding:'.15rem .5rem', borderRadius:'.5rem',
        border:'1px solid rgba(255,255,255,.18)', background:'rgba(255,255,255,.08)', cursor:'pointer'
      });
      on(btn,'click', async ()=>{
        try{ await navigator.clipboard.writeText(code.textContent); }catch(e){
          const ta=document.createElement('textarea'); ta.value=code.textContent; document.body.appendChild(ta);
          ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        }
        const t = btn.textContent; btn.textContent = '✓ コピーしました'; setTimeout(()=> btn.textContent = t, 1200);
      });
      code.insertAdjacentElement('afterend', btn);
    });
  })();

  /* ========== 8) Page transition (fade) ========== */
  (function pageTransition(){
    const style = document.createElement('style');
    style.textContent = `.fade-container{opacity:0;transition:opacity .5s ease}.fade-in{opacity:1}`;
    document.head.appendChild(style);
    const root = document.body; root.classList.add('fade-container');
    requestAnimationFrame(()=> root.classList.add('fade-in'));
    $$('a[href]').forEach(a=>{
      const url = new URL(a.getAttribute('href'), location.href);
      if (url.origin !== location.origin) return;
      if (a.hasAttribute('target')) return;
      on(a,'click',(e)=>{
        if (url.pathname === location.pathname && url.hash) return;
        e.preventDefault();
        if (prefersReduced){ location.href = a.href; return; }
        root.classList.remove('fade-in');
        setTimeout(()=> location.href = a.href, 220);
      });
    });
  })();

  /* ========== 9) Scrollspy (in-page sections) ========== */
  (function scrollSpy(){
    const nav = $('nav'); if (!nav) return;
    const links = $$('a[href^="#"]', nav)
      .map(a => ({ a, id: decodeURIComponent(a.getAttribute('href').slice(1)) }))
      .filter(x => x.id && document.getElementById(x.id));
    if (!links.length) return;
    const io = new IntersectionObserver((ents)=>{
      ents.forEach(ent=>{
        const id = ent.target.id; const hit = links.find(x=>x.id===id); if (!hit) return;
        if (ent.isIntersecting){ links.forEach(x=> x.a.classList.remove('active')); hit.a.classList.add('active'); }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    links.forEach(x=> io.observe(document.getElementById(x.id)));
  })();

  /* ========== 10) Parallax (data-parallax) ========== */
  (function parallax(){
    const items = $$('[data-parallax]'); if (!items.length || prefersReduced) return;
    const update = ()=>{
      const wh = innerHeight;
      for (const el of items){
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
        const rect = el.getBoundingClientRect();
        const prog = (rect.top + rect.height*0.5 - wh*0.5) / (wh*0.5); // -1..1 near center
        const translate = Math.max(-1, Math.min(1, prog)) * speed * 40; // px
        el.style.transform = `translateY(${translate.toFixed(2)}px)`;
        el.style.willChange = 'transform';
      }
    };
    const onScroll = ()=> requestAnimationFrame(update);
    update(); on(window,'scroll', onScroll, {passive:true}); on(window,'resize', update);
  })();

  /* ========== 11) Staggered reveal (data-stagger) ========== */
  (function stagger(){
    const groups = $$('[data-stagger]'); if (!groups.length) return;
    const baseCSS = document.createElement('style');
    baseCSS.textContent = `[data-stagger] > * { opacity:0; transform: translateY(14px); transition: opacity .6s ease, transform .6s ease; }
                           [data-stagger].on > * { opacity:1; transform:none; }`;
    document.head.appendChild(baseCSS);
    const io = new IntersectionObserver((ents)=>{
      ents.forEach(ent=>{
        if (!ent.isIntersecting) return;
        const host = ent.target; host.classList.add('on');
        const children = Array.from(host.children);
        const step = parseInt(host.getAttribute('data-stagger'),10) || 70;
        children.forEach((c,i)=> c.style.transitionDelay = prefersReduced ? '0ms' : `${i*step}ms`);
        io.unobserve(host);
      });
    }, { threshold: 0.12 });
    groups.forEach(g=> io.observe(g));
  })();

  /* ========== 12) Tilt (data-tilt) ========== */
  (function tilt(){
    const cards = $$('[data-tilt]'); if (!cards.length || prefersReduced) return;
    cards.forEach(card=>{
      const max = parseFloat(card.getAttribute('data-tilt')) || 8;
      card.style.transformStyle = 'preserve-3d'; card.style.transition = 'transform .15s ease'; card.style.willChange = 'transform';
      const glare = document.createElement('div');
      Object.assign(glare.style, {position:'absolute', inset:'-2px', pointerEvents:'none', borderRadius:'inherit',
        background:'radial-gradient(100px 60px at 50% 50%, rgba(255,255,255,.25), transparent 60%)',
        opacity:'0', transition:'opacity .2s ease'});
      card.style.position = card.style.position || 'relative'; card.appendChild(glare);
      const move = (x,y)=>{
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        const dx = (x - cx) / (r.width/2), dy = (y - cy) / (r.height/2);
        const rx = (dy * -max).toFixed(2), ry = (dx *  max).toFixed(2);
        card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        glare.style.opacity='1';
        glare.style.background = `radial-gradient(140px 90px at ${((dx+1)/2)*100}% ${((dy+1)/2)*100}%, rgba(255,255,255,.28), transparent 60%)`;
      };
      on(card,'mousemove', (e)=> move(e.clientX, e.clientY));
      on(card,'mouseleave', ()=>{ card.style.transform=''; glare.style.opacity='0'; });
      on(card,'touchmove', (e)=>{ const t=e.touches[0]; if(t) move(t.clientX, t.clientY); }, {passive:true});
      on(card,'touchend', ()=>{ card.style.transform=''; glare.style.opacity='0'; });
    });
  })();

  /* ========== 13) Magnetic buttons (.btn-magnetic) ========== */
  (function magnetic(){
    const btns = $$('.btn-magnetic'); if (!btns.length || prefersReduced) return;
    btns.forEach(b=>{
      b.style.transform = 'translate3d(0,0,0)'; b.style.transition = 'transform .12s ease';
      const strength = parseFloat(b.dataset.magnet) || 18;
      const area = parseFloat(b.dataset.magnetArea) || 100;
      const move = (x,y)=>{
        const r = b.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        const dx = x - cx, dy = y - cy; const dist = Math.hypot(dx,dy);
        if (dist > area){ b.style.transform='translate3d(0,0,0)'; return; }
        const ratio = 1 - dist/area;
        b.style.transform = `translate3d(${(dx/ r.width)*strength*ratio}px, ${(dy/ r.height)*strength*ratio}px, 0)`;
      };
      on(document,'mousemove',(e)=> move(e.clientX, e.clientY), {passive:true});
      on(b,'mouseleave', ()=> b.style.transform='translate3d(0,0,0)');
    });
  })();

  /* ========== 14) Theme toggle (optional #theme) ========== */
  (function theme(){
    const key='theme';
    const apply=()=>{ document.documentElement.dataset.theme = localStorage.getItem(key) || 'auto'; };
    apply();
    const btn = $('#theme');
    if (btn){
      btn.addEventListener('click', ()=>{
        const cur = localStorage.getItem(key) || 'auto';
        const next = cur==='dark'?'light':cur==='light'?'auto':'dark';
        localStorage.setItem(key,next); apply();
      });
    }
  })();

  /* ========== 15) SW registration (if sw.js exists) ========== */
  (function sw(){
    if ('serviceWorker' in navigator){
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    }
  })();

})();
