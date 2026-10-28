/* Animated favicon - made with ConvertICO.com
   Plays favicon-frames.png (100 frames of 32 x 32 px, one under the other) in the browser tab.
   Works in Chrome, Edge, Firefox and Safari. Upload favicon-frames.png and this file to the root of your site. */
(function () {
    var delays = [70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70];
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var link = document.querySelector('link[rel="icon"][data-animated]');
    if (!link) { link = document.createElement("link"); link.rel = "icon"; link.type = "image/png"; document.head.appendChild(link); }
    var img = new Image();
    img.onload = function () {
        var c = document.createElement("canvas"), x = c.getContext("2d"), urls = [], i = 0;
        c.width = c.height = 32;
        for (var k = 0; k < delays.length; k++) { x.clearRect(0, 0, 32, 32); x.drawImage(img, 0, -32 * k); urls.push(c.toDataURL("image/png")); }
        (function next() { link.href = urls[i]; var d = delays[i]; i = (i + 1) % urls.length; setTimeout(next, Math.max(60, d)); })();
    };
    img.src = "assets/media/1ffbb57ca140698c.png";
})();

;
/* Site-wide input inertia. The real document scrolls; dialogs, controls,
   pinch zoom, the native scrollbar and reduced motion keep native behavior. */
(() => {
  'use strict';
  const root = window;
  const doc = document;
  const html = doc.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const compactMobile = matchMedia('(max-width:767px), (max-width:1023px) and (max-height:599px) and (pointer:coarse)');
  const SETTLE_MS = 180;
  const EPSILON = 0.8;
  let roundingRemainder = 0;
  let enabled = !reducedMotion.matches;
  let targetY = root.scrollY;
  let rafId = 0;
  let lastFrame = 0;
  let writingScroll = false;
  let inputDriven = false;
  let touch = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const maxScroll = () => Math.max(0, (doc.scrollingElement || html).scrollHeight - root.innerHeight);
  const cap = value => clamp(value, 0, maxScroll());
  const writeY = value => {
    writingScroll = true;
    root.scrollTo({ left: root.scrollX, top: cap(value), behavior: 'instant' });
    writingScroll = false;
  };

  function cancel(sync = true) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    lastFrame = 0;
    roundingRemainder = 0;
    if (sync) targetY = root.scrollY;
  }

  function tick(now) {
    rafId = 0;
    if (!enabled || doc.hidden) {
      cancel(true);
      return;
    }
    const currentY = root.scrollY;
    const dt = lastFrame ? clamp(now - lastFrame, 1, 48) : 16.67;
    lastFrame = now;
    targetY = cap(targetY);
    const difference = targetY - currentY;
    if (Math.abs(difference) <= EPSILON) {
      writeY(targetY);
      targetY = root.scrollY;
      roundingRemainder = 0;
      lastFrame = 0;
      return;
    }
    // Time-based exponential easing gives a consistent, restrained glide at different frame rates.
    const amount = 1 - Math.exp(-dt / SETTLE_MS);
    // Browser scroll positions can quantize to whole CSS pixels. Carry sub-pixel
    // progress forward so the easing does not stall a few pixels before its target.
    const phase = root.LKMotion?.inspect().phase;
    const dispersing = phase === 'dispersing' || phase === 'brand-fade';
    const speed = root.innerHeight * (compactMobile.matches ? (dispersing ? 1.20 : 2.10) : dispersing ? .90 : matchMedia('(pointer:coarse)').matches ? 1.80 : 2.20);
    const step = inputDriven ? clamp(difference * amount, -speed * dt / 1000, speed * dt / 1000) : difference * amount;
    const rawY = currentY + step + roundingRemainder;
    const nextY = Math.round(rawY);
    roundingRemainder = rawY - nextY;
    writeY(nextY);
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (!rafId && enabled && !doc.hidden) rafId = requestAnimationFrame(tick);
  }

  function hasNativeScrollTarget(target, deltaY) {
    if (!(target instanceof Element)) return false;
    if (target.closest('dialog[open], [data-smooth-scroll-native], textarea, select, [contenteditable="true"]')) return true;
    for (let node = target; node && node !== doc.body && node !== html; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (!/(auto|scroll|overlay)/.test(style.overflowY)) continue;
      if (node.scrollHeight <= node.clientHeight + 1) continue;
      const canScrollUp = node.scrollTop > 1;
      const canScrollDown = node.scrollTop + node.clientHeight < node.scrollHeight - 1;
      if ((deltaY < 0 && canScrollUp) || (deltaY > 0 && canScrollDown)) return true;
    }
    return false;
  }

  function onWheel(event) {
    if (!enabled || !event.cancelable || event.defaultPrevented || event.ctrlKey) return;
    if (Math.abs(event.deltaY) < 0.1 || Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.25) return;
    // Do not capture input while the intro locks the page or a native dialog is open.
    if (html.style.overflow === 'hidden' || doc.querySelector('dialog[open]')) return;
    if (hasNativeScrollTarget(event.target, event.deltaY)) return;

    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? root.innerHeight : 1;
    const delta = event.deltaY * unit * .85;
    const base = rafId && inputDriven ? targetY : root.scrollY;
    const next = cap(base + delta);
    if (Math.abs(next - base) < 0.1 && !rafId) return;

    event.preventDefault();
    queueInput(delta);
  }

  function queueInput(delta) {
    const current = root.scrollY;
    // Reversals respond immediately; repeated flings cannot build a long queue.
    const base = inputDriven && rafId && Math.sign(targetY-current) === Math.sign(delta) ? targetY : current;
    inputDriven = true;
    targetY = cap(clamp(base + delta, current-root.innerHeight*1.6, current+root.innerHeight*1.6));
    start();
  }

  function onTouchStart(event) {
    if (event.touches.length !== 1) { touch=null;cancel(true);return; }
    if (!enabled || event.touches.length !== 1 || html.style.overflow === 'hidden' || doc.querySelector('dialog[open]')) { touch=null; return; }
    cancel(true);
    const point=event.touches[0];
    touch={x:point.clientX,y:point.clientY,lastY:point.clientY,time:event.timeStamp,velocity:0,active:false,target:event.target};
  }
  function onTouchMove(event) {
    if (event.touches.length !== 1) { touch=null;cancel(true);return; }
    if (!touch || !enabled || event.touches.length !== 1 || !event.cancelable) { touch=null; return; }
    const point=event.touches[0],dx=point.clientX-touch.x,dy=point.clientY-touch.y;
    if (!touch.active && Math.abs(dy)<6) return;
    if (!touch.active && Math.abs(dx)>Math.abs(dy)) { touch=null; return; }
    const delta=touch.lastY-point.clientY;
    if (hasNativeScrollTarget(touch.target,delta) || html.style.overflow==='hidden' || doc.querySelector('dialog[open]')) { touch=null; return; }
    event.preventDefault();touch.active=true;
    const dt=Math.max(8,event.timeStamp-touch.time);
    touch.velocity=.65*touch.velocity+.35*delta/dt;
    touch.lastY=point.clientY;touch.time=event.timeStamp;
    queueInput(delta*(compactMobile.matches?1.12:.95));
  }
  function onTouchEnd(event) {
    if (touch?.active && event.timeStamp-touch.time<100) queueInput(clamp(touch.velocity*160,-root.innerHeight*.35,root.innerHeight*.35));
    touch=null;
  }

  function scrollTo(options = {}) {
    const settings = typeof options === 'number' ? { top: options } : (options || {});
    const top = Number.isFinite(Number(settings.top)) ? Number(settings.top) : root.scrollY;
    const behavior = settings.behavior || 'smooth';
    const left = Number.isFinite(Number(settings.left)) ? Number(settings.left) : root.scrollX;
    inputDriven = false;
    if (!enabled || behavior === 'instant') {
      cancel(false);
      targetY = cap(top);
      root.scrollTo({ left, top: targetY, behavior: 'instant' });
      roundingRemainder = 0;
      lastFrame = 0;
      return;
    }
    // A requested route/anchor interrupts the previous wheel target cleanly.
    cancel(false);
    targetY = cap(top);
    start();
  }

  root.addEventListener('wheel', onWheel, { passive: false });
  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchmove', onTouchMove, { passive: false });
  root.addEventListener('touchend', onTouchEnd, { passive: true });
  root.addEventListener('touchcancel', () => { touch=null;cancel(true); }, { passive: true });
  root.addEventListener('scroll', () => {
    if (!rafId && !writingScroll) targetY = root.scrollY;
  }, { passive: true });
  root.addEventListener('resize', () => { targetY = cap(targetY); }, { passive: true });
  root.addEventListener('pointerdown', event => {
    // Scrolling by dragging the browser's native scrollbar should remain immediate.
    if (event.clientX >= root.innerWidth - 18) cancel(true);
  }, { passive: true });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) cancel(true);
  });
  reducedMotion.addEventListener?.('change', event => {
    enabled = !event.matches;
    touch = null;
    cancel(true);
  });

  root.LKSmoothScroll = {
    scrollTo,
    cancel: () => cancel(true),
    get enabled() { return enabled; },
    get scrolling() { return rafId !== 0; },
    get targetY() { return targetY; },
  };
  html.classList.add('smooth-scroll-ready');
})();

;
/* Content is embedded at build time from content.mjs. All interaction stays local to this page. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const root = document.documentElement;
  const data = JSON.parse(document.getElementById('portfolio-data').textContent);
  window.LK_CONTENT = data;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('js');
  if (!reduced.matches) document.body.classList.add('enhanced');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const localDemo=uri=>{
    if(!uri?.startsWith('data:text/html;base64,'))return uri;
    const bytes=Uint8Array.from(atob(uri.split(',')[1]),c=>c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes],{type:'text/html'}));
  };
  data.projects.forEach(project=>{if(project.demo)project.demo=localDemo(project.demo);});
  $$('a[href^="data:text/html;base64,"]').forEach(link=>link.href=localDemo(link.getAttribute('href')));
  let toastTimer, activeArtwork = 0;

  function toast(message) {
    const target = $('#toast'); target.textContent = message; target.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => target.classList.remove('visible'), 4000);
  }
  const focusSources = new WeakMap();
  let menuClosing=null;
  function animateMenu(dialog){
    if(reduced.matches)return;
    dialog.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
    dialog.animate([{opacity:0},{opacity:1}],{duration:360,easing:'ease-out'});
    dialog.querySelectorAll('.menu-links a').forEach((link,index)=>link.animate(
      [{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],
      {duration:420,delay:45+index*35,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}
    ));
  }
  async function closeDialog(dialog){
    if(!dialog.open)return;
    if(dialog.id!=='menu'||reduced.matches){dialog.close();return;}
    if(menuClosing)return menuClosing;
    dialog.dataset.closing='true';
    const opacity=getComputedStyle(dialog).opacity;
    dialog.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
    menuClosing=dialog.animate([{opacity},{opacity:0}],{duration:260,easing:'ease-in-out'}).finished
      .catch(()=>{}).then(()=>{
        if(dialog.open)dialog.close();
        delete dialog.dataset.closing;menuClosing=null;
      });
    return menuClosing;
  }

  function openDialog(dialog, source) {
    focusSources.set(dialog, source || document.activeElement);
    $$('dialog[open]').forEach(other => other.close());
    dialog.showModal(); root.classList.add('dialog-open');
    if(dialog.id==='menu')animateMenu(dialog);
    $('#menu-toggle').setAttribute('aria-expanded', String($('#menu').open));
    requestAnimationFrame(() => dialog.querySelector('button,a,input,select,textarea')?.focus({preventScroll:true}));
  }
  $$('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]')?.addEventListener('click', () => closeDialog(dialog));
    if(dialog.id==='menu')dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog(dialog);});
    dialog.addEventListener('click', e => {
      if (e.target !== dialog) return;
      const r=dialog.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) closeDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      root.classList.toggle('dialog-open', !!$('dialog[open]'));
      $('#menu-toggle').setAttribute('aria-expanded', String($('#menu').open));
      if (!$('dialog[open]')) focusSources.get(dialog)?.focus({preventScroll:true});
    });
  });
  $('#menu-toggle').addEventListener('click', e => openDialog($('#menu'),e.currentTarget));
  $('#privacy-toggle').addEventListener('click',e=>openDialog($('#privacy-dialog'),e.currentTarget));
  document.addEventListener('click',async e=>{
    const anchor=e.target.closest('a[href^="#"]');
    if(!anchor)return;
    const id=anchor.getAttribute('href').slice(1),target=document.getElementById(id);
    if(!target)return;
    e.preventDefault();
    for(const dialog of $$('dialog[open]'))await closeDialog(dialog);
    if(window.LKMotion?.goTo)window.LKMotion.goTo(id);
    else if(window.LKSmoothScroll)window.LKSmoothScroll.scrollTo({top:target.offsetTop,behavior:reduced.matches?'instant':'smooth'});else window.scrollTo({top:target.offsetTop,behavior:reduced.matches?'instant':'smooth'});
    history.replaceState(null,'','#'+id);
    if(anchor.classList.contains('skip-link')){target.tabIndex=-1;target.focus({preventScroll:true});}
  });
  $$('[data-details]').forEach(button=>button.addEventListener('click',()=>{
    const project=data.projects.find(p=>p.id===button.dataset.details);if(!project)return;$('#details-dialog').dataset.projectId=project.id;
    const blocks=[['Problem',project.problem],['Audience',project.audience],['My role',project.role],['Decisions',project.decisions],['Implementation',project.implementation],['Result',project.result]];
    $('#details-content').innerHTML=`<p class="detail-status">${esc(project.status)}</p><h2 id="details-title">${esc(project.name)}</h2><p class="detail-lede">${esc(project.tagline)}</p><img class="details-visual" src="${esc(project.image)}" alt="${esc(project.imageAlt)}"><p class="detail-visual-note quiet">${esc(project.visualLabel)}</p><div class="detail-grid">${blocks.map(([title,text])=>`<section class="detail-block"><h3>${title}</h3><p>${esc(text)}</p></section>`).join('')}</div><section class="detail-block"><h3>Screenshots</h3><p>${project.screenshots?.length?'Explore the project in the preview above.':'This is an editorial project cover. Current application screenshots are pending.'}</p></section><div class="detail-links">${project.live?`<a href="${esc(project.live)}" target="_blank" rel="noopener noreferrer">Live website</a>`:'<span class="quiet">Live link: not published here.</span>'}${project.github?`<a href="${esc(project.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>`:'<span class="quiet">GitHub: source availability not confirmed.</span>'}${project.demo?`<a href="${esc(project.demo)}" target="_blank" rel="noopener noreferrer">Explore demo</a>`:''}</div>`;
    prepareGlow($('#details-content'));openDialog($('#details-dialog'),button);
  }));
  function fillArtwork(index){
    activeArtwork=(index+data.artworks.length)%data.artworks.length;
    const art=data.artworks[activeArtwork];$('#art-full').src=art.image;$('#art-full').alt=art.description;
    $('#art-title').textContent=art.title;$('#art-description').textContent=art.description;
  }
  $$('[data-art]').forEach(button=>button.addEventListener('click',()=>{
    fillArtwork(Number(button.dataset.art));openDialog($('#art-dialog'),button);
  }));
  $('#viewer-prev').addEventListener('click',()=>fillArtwork(activeArtwork-1));
  $('#viewer-next').addEventListener('click',()=>fillArtwork(activeArtwork+1));
  $('#art-dialog').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();fillArtwork(activeArtwork-1);}if(e.key==='ArrowRight'){e.preventDefault();fillArtwork(activeArtwork+1);}});
  $('#art-prev').addEventListener('click',()=>window.LKMotion?.artStep(-1));
  $('#art-next').addEventListener('click',()=>window.LKMotion?.artStep(1));
  $$('[data-service-step]').forEach(b=>b.addEventListener('click',()=>window.LKMotion?.step('services',Number(b.dataset.serviceStep),3)));
  $$('[data-project-step]').forEach(b=>b.addEventListener('click',()=>window.LKMotion?.step('work',Number(b.dataset.projectStep),4)));

  // All resume links use the same replaceable file in the publishing package.
  $$('[data-event="resume_download"]').forEach(link=>{
    link.href=data.profile.resume;
    link.download='Lakshmikantha-R-K-Resume.pdf';
  });
  $('#enquiry-toggle').addEventListener('click',()=>{
    const panel=$('#enquiry-panel'),button=$('#enquiry-toggle');
    panel.hidden=!panel.hidden;
    button.setAttribute('aria-expanded',String(!panel.hidden));
    if(!panel.hidden)$('#enquiry-form').elements.name.focus({preventScroll:true});
  });
  function enquiryDraft(){
    const form=$('#enquiry-form'),fields=Object.fromEntries(new FormData(form));
    const reason=form.elements.reason.selectedOptions[0].textContent;
    const service=form.elements.service.selectedOptions[0].textContent;
    const subject=reason+(fields.service?' — '+service:'')+' | '+fields.name.trim();
    const body=['Hi Lakshmikantha,','','Name: '+fields.name.trim(),'Email: '+fields.email.trim(),
      'Enquiry: '+reason,'Service: '+service,...(fields.organization.trim()?['Organization / website: '+fields.organization.trim()]:[]),
      '',fields.message.trim()].join('\r\n');
    return {body,url:'mailto:'+data.profile.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)};
  }
  $('#enquiry-form').addEventListener('submit',e=>{
    e.preventDefault();
    if(!e.currentTarget.reportValidity())return;
    const status=$('#form-status');
    status.dataset.state='draft';
    status.textContent='Review and send the draft in your email app. If nothing opens, copy your enquiry and email '+data.profile.email+'.';
    window.LKAnalytics?.track('enquiry_draft',{placement:'form'});
    window.location.href=enquiryDraft().url;
  });
  $('#copy-enquiry').addEventListener('click',async()=>{
    const form=$('#enquiry-form'),status=$('#form-status');
    if(!form.reportValidity())return;
    try{
      await navigator.clipboard.writeText(enquiryDraft().body);
      status.dataset.state='copied';
      status.textContent='Enquiry copied. Paste it into an email to '+data.profile.email+'.';
    }catch{
      status.dataset.state='error';
      status.textContent='Copy is unavailable here. Your details remain in the form. Copy them into an email to '+data.profile.email+'.';
    }
  });

  const pointer=matchMedia('(hover:hover) and (pointer:fine)');
  function prepareGlow(scope=document){
    scope.querySelectorAll('.glow-button,.text-link,.project-actions a,.project-actions button,.detail-links a,.email-link,.submit-button,.circle-button').forEach(button=>{
      button.classList.add('glow-button');
      if(button.dataset.glowBound)return;
      button.dataset.glowBound='true';
      const sparks=document.createElement('span');sparks.className='button-sparks';sparks.setAttribute('aria-hidden','true');
      for(let i=0;i<4;i++){
        const spark=document.createElement('i');
        spark.style.setProperty('--dx',`${[-18,14,-9,20][i]}px`);
        spark.style.setProperty('--dy',`${[-26,-31,27,22][i]}px`);
        spark.style.setProperty('--delay',`${i*.38}s`);sparks.append(spark);
      }
      button.append(sparks);
      button.addEventListener('pointermove',e=>{
        if(!pointer.matches||reduced.matches)return;
        const bounds=button.getBoundingClientRect();
        button.style.setProperty('--glow-x',`${e.clientX-bounds.left}px`);
        button.style.setProperty('--glow-y',`${e.clientY-bounds.top}px`);
      },{passive:true});
      button.addEventListener('pointerleave',()=>{button.style.removeProperty('--glow-x');button.style.removeProperty('--glow-y');});
    });
  }
  prepareGlow();
  document.addEventListener('pointermove',e=>{
    if(!pointer.matches)return;
    const overInteractive=!!e.target.closest('a,button,input,select,textarea');
    // Native modal dialogs sit in the browser top layer, above the page cursor.
    // Mirror the gold crosshair inside the menu so it remains visible while open.
    ['#crosshair','#menu-crosshair'].forEach(selector=>{
      const cursor=$(selector);if(!cursor)return;
      cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';cursor.style.opacity='1';
      cursor.classList.toggle('hover',overInteractive);
    });
  },{passive:true});
  document.addEventListener('pointerleave',()=>['#crosshair','#menu-crosshair'].forEach(selector=>{const cursor=$(selector);if(cursor)cursor.style.opacity='0';}));
  $$('.magnetic').forEach(el=>{
    el.addEventListener('pointermove',e=>{if(!pointer.matches||reduced.matches||el.classList.contains('glow-button'))return;const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.08}px,${(e.clientY-r.top-r.height/2)*.12}px)`;});
    el.addEventListener('pointerleave',()=>el.style.transform='');
  });
  $('#motion-toggle').addEventListener('click',()=>{
    const paused=window.LKMotion?.togglePause()??false;
    $('#motion-toggle').setAttribute('aria-pressed',String(paused));$('#motion-toggle').textContent=paused?'Resume motion':'Pause motion';
  });
  reduced.addEventListener('change',()=>{document.body.classList.toggle('enhanced',!reduced.matches);root.classList.toggle('motion-reduced',reduced.matches);});
  window.LKUI={toast,prepareGlow};
})();

;
(function(root){
  'use strict';
  const M={};
  M.clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  M.mix=(a,b,t)=>a+(b-a)*t;
  M.smooth=t=>t*t*(3-2*t);
  M.seg=(p,a,b)=>M.smooth(M.clamp((p-a)/(b-a)));
  M.v3=(x=0,y=0,z=0)=>[x,y,z];
  M.v3sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  M.v3cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  M.v3norm=(a)=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
  M.identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  M.multiply=(a,b)=>{
    const o=new Float32Array(16);
    for(let c=0;c<4;c++) for(let r=0;r<4;r++) o[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];
    return o;
  };
  M.translation=(x,y,z)=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1]);
  M.scaling=(x,y,z)=>new Float32Array([x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1]);
  M.rotX=a=>{const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);};
  M.rotY=a=>{const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);};
  M.rotZ=a=>{const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);};
  M.perspective=(fov,aspect,near,far)=>{const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);};
  M.lookAt=(eye,target,up=[0,1,0])=>{
    const z=M.v3norm(M.v3sub(eye,target)); const x=M.v3norm(M.v3cross(up,z)); const y=M.v3cross(z,x);
    return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]),1]);
  };
  M.composePivot=(pos,rot,scale,pivot=[0,1.45,0])=>{
    let m=M.translation(pos[0],pos[1],pos[2]);
    m=M.multiply(m,M.translation(pivot[0],pivot[1],pivot[2]));
    m=M.multiply(m,M.rotZ(rot[2])); m=M.multiply(m,M.rotY(rot[1])); m=M.multiply(m,M.rotX(rot[0]));
    m=M.multiply(m,M.scaling(scale,scale,scale));
    m=M.multiply(m,M.translation(-pivot[0],-pivot[1],-pivot[2]));
    return m;
  };
  root.KnightMath=M;
})(window);

;
