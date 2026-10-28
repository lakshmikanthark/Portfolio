/* Native scrolling owns the composition; elapsed time owns the living detail. */
(() => {
  'use strict';
  const root=typeof window==='undefined'?globalThis:window;
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
  const range=(p,a,b)=>clamp((p-a)/(b-a));
  const ease=p=>{p=clamp(p);return p*p*(3-2*p);};
  const fade=(p,a,b)=>ease(range(p,a,b)),mix=(a,b,p)=>a+(b-a)*p;
  const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const damp=(current,target,dt,tau=95)=>Math.abs(target-current)<.08?target:mix(current,target,1-Math.exp(-Math.max(0,dt)/tau));
  const emptyScene=()=>({shape:'knight',form:0,surface:0,alpha:0,x:.5,y:.5,scale:1,rotation:-.45,solid:true,redEye:false,shimmer:1,brandMorph:0,shine:0});
  function locate(y,layout){let at=0;for(let i=0;i<layout.length;i++){if(y+.25>=layout[i].top)at=i;else break;}return at;}
  // Chosen chapter distances live in the stylesheet; only animated chapter
  // travel is shortened on phones. Incoming fire travel is scaled the same way.
  const mobileScrollScale=(width,height=Infinity,coarse=false)=>width<768||(coarse&&width<1024&&height<600)?.55:1;
  // Red cover and chapter travel use the same mobile scale as the pinned panels.
  const redCoverScreens=.36,redChapterScreens=.95/.85-redCoverScreens;
  // Full red and moving fire each receive half of the entire cover/hold/reveal.
  const redHold=(redCoverScreens+redChapterScreens)/2/redChapterScreens;
  function heldIndex(p,count,holdShare=.6){
    p=clamp(p);const hold=holdShare/count,travel=(1-holdShare)/(count-1);
    for(let i=0;i<count-1;i++){
      const start=i*(hold+travel)+hold,end=start+travel;
      if(p<=start)return i;if(p<end)return i+fade(p,start,end);
    }return count-1;
  }
  function holdStop(index,count,start,end){
    const hold=.6/count,travel=.4/(count-1);
    return mix(start,end,clamp(index,0,count-1)*(hold+travel)+hold/2);
  }
  // Project each card into one flat layer. Its z coordinates stay zero, so
  // mobile compositors cannot BSP-split the surface against the 3D room.
  // These are the same camera, card rotations and perspective as the room.
  function projectCard(camera,placement,width,height,unit,perspective){
    const [x,z,yaw]=placement,angle=camera.yaw*Math.PI/180;
    const co=Math.cos(angle),si=Math.sin(angle),turn=(camera.yaw+yaw)*Math.PI/180;
    const pw=unit*.44,ph=unit*.59,ax=Math.cos(turn),az=-Math.sin(turn);
    const xc=(co*(x-camera.x)+si*z)*unit;
    const depth=(-si*(x-camera.x)+co*z+camera.z-.15)*unit;
    const da=-az/perspective,dc=1-(depth-az*pw/2)/perspective;
    const matrix=[width*.5*da+ax,height*.48*da,0,da,
      0,1,0,0,0,0,1,0,
      width*.5*dc+xc-ax*pw/2,height*.48*dc+height*.01-ph/2,0,dc];
    return {matrix,depth,visible:Math.min(dc,dc+da*pw)>.001};
  }
  // Both boundaries share exactly the same full incoming wipe and retreat.
  function coverFlame(p){
    const retreat=fade(p,.96,1);
    return {coverage:fade(p,.90,.96),edge:retreat>=1?'hold':'rise',retreat};
  }
  function entryFlame(y,top,coverLength){
    return coverFlame(mix(.90,1,range(y,top-coverLength,top)));
  }
  function sample(section,progress,options={}){
    const raw=Number.isFinite(progress)?progress:0,p=clamp(raw),w=options.width||1440,h=options.height||900;
    const mobile=w<768,clock=options.clock||0,age=options.age??10000,idle=Math.sin(clock*.00017)*.022;
    const scene=emptyScene(),out={section,p,scene,phase:'black',flame:{coverage:0,edge:'rise'}};
    if(section==='home'){
      // The original viewing distances are retained; the extra .78 screen is
      // split between conversion to particles and the scattering departure.
      const travel=p*3.38,formed=fade(age,0,2600),surface=fade(age,2800,3300)*(1-fade(travel,1.092,1.768));
      scene.form=formed*(1-fade(travel,2.002,3.094));scene.surface=surface;scene.alpha=1;
      scene.scale=mobile?.91:1.06;scene.rotation=mix(-1.65,-.45,fade(age,900,2800))+idle;
      out.heading={alpha:fade(age,3850,5000)*(1-fade(travel,.702,.988)),y:mobile?-fade(travel,.702,.988)*20:0,scale:1};
      out.phase=travel>3.094?'black':travel>2.002?'dispersing':travel>1.768?'particle-hold':travel>1.092?'mesh-to-particles':age<2600?'forming':age<2800?'particle-hold':age<3300?'settling':'settled';
    }else if(section==='introduction'){
      const enter=fade(p,.015,.22),exit=fade(p,.79,.97);
      out.heading={alpha:enter*(1-exit),y:(1-enter)*14-exit*9,scale:1,lit:range(p,.10,.66)};
      out.phase=p<.22?'entering':p<.79?'reading':'leaving';
    }else if(section==='eye'){
      scene.shape='eye';scene.form=fade(p,.02,.32)*(1-fade(p,.64,.97));scene.alpha=1;
      scene.solid=false;scene.surface=0;scene.scale=mobile?1.06:1.18;scene.redEye=true;scene.shimmer=1.65;
      scene.rotation=mix(-.12,.6,fade(p,.64,.97))+idle;
      out.phase=p<.32?'forming':p<.64?'particle-hold':p<.97?'dispersing':'black';
    }else if(section==='services'){
      const move=fade(p,.15,.23),center=fade(p,.77,.83),left=mobile?.18:.245;
      scene.form=fade(p,.005,.10)*(1-fade(p,.90,.985));scene.surface=fade(p,.11,.15)*(1-fade(p,.83,.88));scene.alpha=1;
      scene.x=mix(mix(.5,left,move),.5,center);scene.y=mix(.5,mobile?.53:.52,move*(1-center));
      scene.scale=mix(mix(mobile?.90:1.06,mobile?.75:1,move),mobile?.90:1.06,center);
      scene.rotation=mix(1.2,-.45,fade(p,.025,.15))+Math.sin(clock*.00024)*.045*(1-center);
      out.cards={alpha:fade(p,.23,.26)*(1-fade(p,.74,.77)),q:heldIndex(range(p,.26,.74),3),enter:1-fade(p,.23,.26)};
      out.phase=p<.10?'forming':p<.15?'settling':p<.23?'positioning':p<.74?'services':p<.77?'text-leaving':p<.83?'centering':p<.88?'mesh-to-particles':p<.90?'particle-hold':p<.985?'dispersing':'black';
    }else if(section==='work'){
      const enter=fade(p,.025,.14),shrink=fade(p,.19,.29),exit=fade(p,.94,.995);
      out.heading={alpha:enter*(1-exit),y:mix((1-enter)*12,-33,shrink),scale:mix(1,mobile?.60:.52,shrink),lit:range(p,.055,.20)};
      out.cards={alpha:fade(p,.315,.40)*(1-exit),y:(1-fade(p,.315,.40))*22-exit*7,q:heldIndex(range(p,.40,.94),4)};
      out.phase=p<.14?'heading-enter':p<.29?'heading-settle':p<.40?'projects-enter':p<.94?'projects':'leaving';
    }else if(section==='archive-entry'||section==='archive-exit'){
      if(p<=redHold){out.flame={coverage:1,edge:'hold'};out.phase='red-hold';}
      else{
        const reveal=range(p,redHold,1);
        out.flame={coverage:1-fade(reveal,.15,1),edge:'leave',approach:fade(reveal,0,.18)};
        out.phase='flame-reveal';
      }
    }else if(section==='archive'){
      const enter=fade(p,.015,.145),shrink=fade(p,.235,.315),exit=fade(p,.91,.995);
      out.heading={alpha:enter*(1-exit),y:-31*shrink,scale:mix(1,mobile?.49:.26,shrink),lit:range(p,.055,.20)};
      out.ring={alpha:fade(p,.325,.38)*(1-exit),q:range(p,.39,.87)*7};
      // Incoming covers for both red chapters are applied at their boundaries.
      out.phase=p<.145?'heading-enter':p<.325?'heading-settle':'ring';
    }else if(section==='afterhours'){
      const opening=range(p,.20,.45),closing=range(p,.90,.99),index=heldIndex(range(p,.50,.90),4);
      out.gallery={alpha:1,q:index,aperture:opening*(1-closing)};
      out.heading={alpha:1,x:0,y:0,scale:1};
      const stops=[{x:0,z:-.65,yaw:0},{x:-.65,z:.26,yaw:-30},{x:.65,z:.26,yaw:30},{x:-.30,z:1.05,yaw:0},{x:.30,z:1.05,yaw:0},{x:0,z:-1.15,yaw:0}];
      let from,to,q;
      if(p<.50){from=stops[0];to=stops[1];q=fade(p,.40,.50);}
      else if(p<=.90){const i=Math.min(2,Math.floor(index));from=stops[i+1];to=stops[i+2];q=index-i;}
      else{from=stops[4];to=stops[5];q=fade(p,.90,1);}
      out.camera={x:mix(from.x,to.x,q),z:mix(from.z,to.z,q),yaw:mix(from.yaw,to.yaw,q)};
      out.phase=p<.20?'title-hold':p<.45?'split-open':p<.90?'spatial-gallery':p<.99?'split-close':'title-return';
    }else if(section==='finale'){
      // Gaze, LK and Knight each receive .32 of the chapter; .04 is black.
      if(p<=.64){
        const morph=fade(p,.32,.43);
        scene.shape='gaze';scene.form=1;scene.alpha=fade(p,.01,.08)*(1-fade(p,.60,.64));scene.solid=false;
        scene.surface=0;scene.scale=mix(1,1.118,fade(p,.08,.31));scene.rotation=0;scene.redEye=true;
        scene.shine=fade(p,.22,.29)*(1-fade(p,.31,.40));scene.shimmer=1.1+scene.shine*.7;scene.brandMorph=morph;
        out.backdrop=fade(p,0,.04)*(1-fade(p,.60,.64));
        out.phase=p<.08?'gaze-enter':p<.22?'gaze-hold':p<.32?'gold-shine':p<.43?'brand-morph':p<.60?'brand-hold':'brand-fade';
      }else if(p<.68){out.phase='black';}
      else{
        const place=fade(p,.90,.95);
        scene.form=fade(p,.68,.83);scene.surface=fade(p,.85,.90);scene.alpha=1;scene.redEye=false;scene.shimmer=1.5;
        scene.x=mix(.5,mobile?.5:.245,place);scene.y=mix(.5,mobile?.22:.5,place);
        scene.scale=mix(mobile?.88:1.06,mobile?.52:1.02,place);
        scene.rotation=mix(1.35,-.45,fade(p,.70,.90))+idle;
        out.phase=p<.83?'knight-forming':p<.85?'particle-hold':p<.90?'settling':p<.95?'positioning':'contact-pose';
      }
    }else if(section==='contact'){
      scene.form=1;scene.surface=1;scene.alpha=clamp((options.contactBottom??h)/Math.max(1,h*.6));
      scene.x=mobile?.5:.245;scene.y=mobile?.22:.5;scene.scale=mobile?.52:1.02;scene.rotation=-.45+idle;scene.redEye=false;scene.shimmer=1.5;
      out.phase='contact-pose';
    }
    // Keep the original model at a more restrained size in every Knight pose.
    if(scene.shape==='knight'){
      scene.scale*=.78;
      if(mobile)scene.scale*=Math.min(1,w/h*(section==='services'?1.2:1.65));
    }
    // The mesh never replaces an incomplete or departing particle cloud.
    if(scene.form<.9999)scene.surface=0;
    if(scene.form<.00001){scene.form=0;scene.alpha=0;scene.surface=0;}
    return out;
  }
  const timeline={sample,locate,damp,coverFlame,entryFlame,clamp,range,ease,heldIndex,holdStop,projectCard,mobileScrollScale,redCoverScreens,redChapterScreens,redHold};
  root.LKTimeline=timeline;
  if(typeof document==='undefined')return;

  const doc=document.documentElement,$=id=>document.getElementById(id)||document.querySelector(id),$$=s=>[...document.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const ids=['home','introduction','eye','services','work','journey','archive-entry','archive','archive-exit','afterhours','black-pause','finale','contact','footer'];
  const sections=ids.map($).filter(Boolean),byId=new Map(sections.map(el=>[el.id,el]));
  const opening=$('opening'),number=$('load-count'),embers=$('embers'),ec=embers?.getContext('2d'),flames=$('flames'),flamePanel=$('.flame-red-panel'),flameTopFrame=$('.flame-edge-frame-top'),flameBottomFrame=$('.flame-edge-frame-bottom');
  const hero=$('hero-title'),heroHeader=$('.header'),heroUtilities=$('.utilities'),intro=$('intro-heading'),workHeading=$('.work-heading'),workTitle=$('work-heading'),projectWindow=$('.project-window');
  const serviceWindow=$('.services-window'),serviceTrack=$('services-track'),serviceCards=$$('.service-card'),projectTrack=$('project-track'),projectCards=$$('.project-card');
  const archiveHeading=$('archive-heading'),ring=$('.ring-stage'),artCards=$$('.art-piece'),archiveBottom=$('.archive-bottom');
  const contactCopy=$('.contact-copy'),contactComposition=$('.contact-composition');
  const afterCurtains=$$('.after-curtain'),aperture=$('.play-aperture'),playWorld=$('.play-world'),room=$('.experiment-room'),panels=$$('.experiment-panel');
  let w=innerWidth,h=innerHeight,layout=[],measureNeeded=true,smoothedY=scrollY,clock=0,lastTime=0,frame=0,paused=false,current='',artIndex=0,debug={},reducedApplied=false;
  // Show the 000–100 loader once per browser tab. Refreshes skip just the
  // number counter; the Knight's formation sequence is still animated.
  // Using sessionStorage instead of localStorage means a fresh tab sees the
  // introduction again, without forcing repeat visitors to wait on refresh.
  const immerse=$('immerse-hint');
  let lastScrollActivity=performance.now(),lastHintSection='';
  function hideImmerse(){immerse?.classList.remove('is-visible');}
  function markScrollActivity(){lastScrollActivity=performance.now();hideImmerse();}
  root.addEventListener('scroll',markScrollActivity,{passive:true});
  root.addEventListener('wheel',markScrollActivity,{passive:true});
  root.addEventListener('touchstart',markScrollActivity,{passive:true});
  root.addEventListener('touchmove',markScrollActivity,{passive:true});
  document.addEventListener('keydown',event=>{
    if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))markScrollActivity();
  });
  function updateImmerse(time,section,state){
    if(!immerse)return;
    if(section!==lastHintSection){lastHintSection=section;lastScrollActivity=time;immerse.dataset.section=section;}
    const dialogOpen=!!document.querySelector('dialog[open]');
    if(dialogOpen)lastScrollActivity=time;
    const animated=['home','introduction','eye','services','work','archive','afterhours','finale'].includes(section);
    const noScene=state.phase==='black'||state.phase==='contact-pose'||state.flame.coverage>.001;
    immerse.classList.toggle('is-suppressed',!animated||noScene||dialogOpen);
    const openingReady=section!=='home'||clock-completedClock>=5000;
    const visible=animated&&openingReady&&!noScene&&!dialogOpen&&openingDone&&!openingRevealPending&&!reduce.matches
      &&!root.LKSmoothScroll?.scrolling&&time-lastScrollActivity>=2000;
    immerse.classList.toggle('is-visible',visible);
  }

  const loaderKey='lk-number-loader-seen-v1';
  let loaderSeen=false;
  // Each new load starts animated; a stale saved pause must not freeze the hero.
  try{loaderSeen=sessionStorage.getItem(loaderKey)==='true';}catch{
    // Some file:// preview browsers block storage. Fall back to reload type.
    loaderSeen=performance.getEntriesByType?.('navigation')?.[0]?.type==='reload';
  }
  const openingStart=performance.now();let openingDone=!opening||reduce.matches||!!location.hash||loaderSeen,openingRevealPending=openingDone&&!!opening,completedClock=paused?-10000:0;
  // Skipping the counter still needs the black first-frame guard. In an
  // offline export the large inline bundle may take time to parse on phones.
  if(opening)doc.style.overflow='hidden';
  function endOpening(){
    if(openingDone)return;
    openingDone=true;completedClock=clock-(paused?10000:0);
    try{sessionStorage.setItem(loaderKey,'true');}catch{}
    // Keep the solid-black loader above the page until the very first
    // particle-scene frame has been drawn. Hiding it here exposes the stale
    // poster/renderer before the formation state is submitted on the next RAF.
    openingRevealPending=true;
  }
  function revealOpening(){
    if(!openingRevealPending)return;
    openingRevealPending=false;
    if(opening)opening.hidden=true;
    doc.style.overflow='';
  }
  const set=(el,key,value)=>{if(el&&el.style[key]!==String(value))el.style[key]=String(value);};
  function show(el,alpha,transform){set(el,'opacity',clamp(alpha));if(transform!==undefined)set(el,'transform',transform);}
  function splitLetters(el){
    if(!el)return [];
    const existing=[...el.querySelectorAll('.intro-letter')];if(existing.length)return existing;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[],letters=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){const fragment=document.createDocumentFragment();for(const ch of node.textContent){if(/\s/.test(ch)){fragment.append(ch);continue;}const letter=document.createElement('span');letter.className='intro-letter';letter.textContent=ch;letter.setAttribute('aria-hidden','true');fragment.append(letter);letters.push(letter);}node.replaceWith(fragment);}
    return letters;
  }
  const introLetters=splitLetters(intro),workLetters=splitLetters(workTitle),archiveLetters=splitLetters(archiveHeading);
  function light(letters,p){const to=p*letters.length;for(let i=0;i<letters.length;i++)letters[i].classList.toggle('lit',i<to);}
  function measure(){
    w=innerWidth;h=innerHeight;
    if(contactCopy&&contactComposition){
      // When text or the opened form is taller than the old minimum, add its
      // 30% reading room below it without moving the form's starting position.
      const minimum=(parseFloat(getComputedStyle(contactComposition).minHeight)||0)/1.3;
      const content=contactCopy.getBoundingClientRect().height;
      contactComposition.style.setProperty('--contact-extra',(content>minimum?content*.3:0)+'px');
    }
    layout=sections.map(el=>({id:el.id,top:el.offsetTop,height:el.offsetHeight}));measureNeeded=false;
  }
  function resize(){
    measureNeeded=true;w=innerWidth;h=innerHeight;
    if(embers&&ec){const d=Math.min(devicePixelRatio||1,1.5);embers.width=Math.round(w*d);embers.height=Math.round(h*d);ec.setTransform(d,0,0,d,0,0);}
    root.LKScene?.resize();
  }
  const progress=id=>{const el=layout.find(item=>item.id===id);return el?clamp((smoothedY-el.top)/Math.max(1,el.height-h)):0;};
  function emberFrame(time,alpha){
    if(!ec)return;ec.clearRect(0,0,w,h);
    for(let i=0;i<(w<768?44:76);i++){
      const life=(time*.00011*(.4+hash(i+5))+hash(i+77))%1;
      const y=h*1.08-life*h*1.3,x=w*hash(i+17)+Math.sin(life*7+hash(i+18)*9)*25,size=.4+Math.pow(hash(i+24),6)*2.8;
      ec.globalAlpha=alpha*Math.sin(life*Math.PI)*(.3+hash(i+38)*.5);ec.fillStyle=i%7===0?'#fbd69a':'#d29543';ec.fillRect(x,y,size,size*1.7);
    }ec.globalAlpha=1;
  }
  function flameFrame(state,time){
    if(!flames||!flamePanel||!flameTopFrame||!flameBottomFrame)return;
    const coverage=clamp(state.coverage);
    if(coverage<=.00001){set(flames,'opacity','0');set(flameTopFrame,'opacity','0');set(flameBottomFrame,'opacity','0');return;}
    set(flames,'opacity','1');
    // A fully opaque, edge-free interval guarantees the two GIFs can never
    // share a viewport, including during reverse scrolling or fast scrubbing.
    if(state.edge==='hold'){
      set(flamePanel,'top','0px');set(flamePanel,'height',`${h}px`);
      set(flameTopFrame,'opacity','0');set(flameBottomFrame,'opacity','0');
      return;
    }
    const leave=state.edge==='leave';
    // The reference uses one animated fire seam at the moving red boundary:
    // inverted as the panel enters from below, upright as it exits upward.
    // The transparent GIF exposes page content outside the red panel, while the
    // panel itself is empty and opaque. Keep the active GIF fully opaque as the
    // seam moves; at zero coverage the transition and its GIF are switched off.
    const top=leave?0:h*(1-coverage),bottom=leave?h*coverage:h;
    set(flamePanel,'top',`${top}px`);set(flamePanel,'height',`${Math.max(0,bottom-top)}px`);
    const boundary=leave?bottom:top;
    const activeFrame=leave?flameBottomFrame:flameTopFrame;
    const inactiveFrame=leave?flameTopFrame:flameBottomFrame;
    // One full-width, edge-keyed GIF preserves the supplied 809:380 ratio.
    // Its flat red/black fields are transparent away from a narrow seam band,
    // so the fire moves over the actual page instead of a solid black overlay.
    const imageHeight=w*(380/809);
    const sourceSeam=204/380*imageHeight;
    const seamOnFrame=leave?sourceSeam:imageHeight-sourceSeam;
    // On completion the top edge travels all the way above the viewport;
    // on reveal the bottom edge starts fully below it. Neither is cross-faded.
    const offscreenDistance=imageHeight*1.12;
    const edgeOffset=leave?(1-clamp(state.approach??1))*offscreenDistance:-clamp(state.retreat??0)*offscreenDistance;
    set(activeFrame,'top',`${boundary-seamOnFrame+edgeOffset}px`);
    set(activeFrame,'height',`${imageHeight}px`);
    set(activeFrame,'backgroundSize','100% 100%');
    // Keep the GIF fully opaque for the entire active transition. Scrolling
    // moves the fire seam and changes panel coverage, but never dims the GIF.
    // It is hidden only when there is no transition at all (coverage === 0).
    set(activeFrame,'opacity','1');
    set(inactiveFrame,'opacity','0');
  }
  function step(id,index,count){
    const el=byId.get(id);if(!el)return;
    if(reduce.matches){el.querySelectorAll(id==='services'?'.service-card':'.project-card')[index]?.scrollIntoView({block:'center',behavior:'instant'});return;}
    measure();const item=layout.find(s=>s.id===id),p=id==='services'?holdStop(index,count,.26,.74):holdStop(index,count,.40,.94);
    const destination=item.top+p*(item.height-h);if(root.LKSmoothScroll)root.LKSmoothScroll.scrollTo({top:destination,behavior:'smooth'});else root.scrollTo({top:destination,behavior:'smooth'});
  }
  function artStep(delta){
    const index=clamp(artIndex+delta,0,artCards.length-1);if(reduce.matches){artIndex=index;artCards[index]?.scrollIntoView({block:'center',behavior:'instant'});return;}
    measure();const el=layout.find(s=>s.id==='archive');if(el){const destination=el.top+mix(.39,.87,index/Math.max(1,artCards.length-1))*(el.height-h);if(root.LKSmoothScroll)root.LKSmoothScroll.scrollTo({top:destination,behavior:'smooth'});else root.scrollTo({top:destination,behavior:'smooth'});}
  }
  function goTo(id,behavior='smooth'){
    const el=byId.get(id);if(!el)return;endOpening();
    const stops={introduction:.24,services:holdStop(0,3,.26,.74),work:holdStop(0,4,.40,.94),archive:.39,afterhours:.20},p=reduce.matches?0:(stops[id]||0);
    const destination=el.offsetTop+p*Math.max(0,el.offsetHeight-innerHeight);if(root.LKSmoothScroll)root.LKSmoothScroll.scrollTo({top:destination,behavior:reduce.matches?'instant':behavior});else root.scrollTo({top:destination,behavior:reduce.matches?'instant':behavior});
  }
  function resetReduced(){
    for(const el of [hero,intro,workHeading,projectWindow,serviceWindow,archiveHeading,ring,archiveBottom,room,aperture,contactCopy,...afterCurtains])if(el){el.style.opacity='';el.style.transform='';el.style.pointerEvents='';}
    if(contactCopy){contactCopy.style.visibility='';contactCopy.inert=false;}
    for(const id of ['work','afterhours'])set(byId.get(id),'zIndex','');
    for(const panel of panels){panel.style.visibility='';panel.style.zIndex='';}
    for(const el of [...serviceCards,...projectCards,...artCards,...panels]){el.style.opacity='';el.style.transform='';el.inert=false;el.tabIndex=el.matches('.art-piece')?0:el.tabIndex;}
    for(const el of $$('.project-image'))el.style.clipPath='';
    for(const letter of [...introLetters,...workLetters,...archiveLetters])letter.classList.add('lit');
    if(aperture)aperture.style.clipPath='';set(flames,'opacity','0');reducedApplied=true;
  }
  function update(time){
    frame=0;if(document.hidden)return;
    const elapsedFrame=lastTime?Math.max(0,time-lastTime):16,dt=Math.min(80,elapsedFrame);lastTime=time;if(!paused)clock+=elapsedFrame;
    if(measureNeeded)measure();
    if(!openingDone){
      const elapsed=time-openingStart;if(number)number.textContent=String(Math.min(100,Math.floor(elapsed/2400*100))).padStart(3,'0');
      opening?.classList.toggle('fade-text',elapsed>=2400);emberFrame(clock,1-range(elapsed,2450,2750));
      if(elapsed>=3000)endOpening();frame=requestAnimationFrame(update);return;
    }
    // Keep scene choreography close to the already-smoothed page position instead of adding a second heavy delay.
    smoothedY=damp(smoothedY,scrollY,dt,root.LKSmoothScroll?.enabled?34:(w<768?78:95));
    const item=layout[locate(smoothedY,layout)]||layout[0];if(!item){frame=requestAnimationFrame(update);return;}
    const section=item.id,p=progress(section),opts={width:w,height:h,clock,age:clock-completedClock,contactBottom:(layout.find(s=>s.id==='contact')?.top||0)+(layout.find(s=>s.id==='contact')?.height||0)-smoothedY};
    if(current!==section){current=section;doc.dataset.chapter=section;root.dispatchEvent(new CustomEvent('lk:chapter',{detail:{section}}));}
    if(reduce.matches){
      show(heroHeader,1);show(heroUtilities,1);
      hideImmerse();doc.classList.add('motion-reduced');if(!reducedApplied){resetReduced();root.LKScene?.render(emptyScene(),0);}
      revealOpening();debug={section,progress:p,paused,reduced:true,scroll:smoothedY};frame=requestAnimationFrame(update);return;
    }
    reducedApplied=false;
    // Keep a viewing hold above the following chapter until its boundary.
    for(const id of ['work','afterhours'])set(byId.get(id),'zIndex',section===id?'5':'');
    const state=sample(section,p,opts),home=sample('home',progress('home'),opts),introduction=sample('introduction',progress('introduction'),opts);
    show(hero,home.heading.alpha,`translateY(${home.heading.y}svh)`);
    // Secondary hero elements are revealed later and with a gentler fade.
    // Outside the hero, navigation is immediately accessible on deep links.
    show(heroHeader,section==='home'?fade(opts.age,3920,5000):1);
    show(heroUtilities,section==='home'?fade(opts.age,4100,5000):1);
    show(intro,introduction.heading.alpha,`translateY(${introduction.heading.y}svh)`);light(introLetters,introduction.heading.lit);
    const services=sample('services',progress('services'),opts),svc=services.cards;
    show(serviceWindow,svc.alpha,`translateX(${svc.enter*18}vw)`);set(serviceWindow,'pointerEvents',svc.alpha>.1?'auto':'none');
    const serviceWidth=serviceWindow?.clientWidth||w*.5;set(serviceTrack,'transform',`translateX(${-svc.q*serviceWidth}px)`);
    const activeService=Math.round(svc.q);serviceCards.forEach((card,i)=>{card.inert=i!==activeService||svc.alpha<.1;show(card,clamp(1-Math.abs(i-svc.q)*.55,.25,1));});
    $$('[data-service-step]').forEach((button,i)=>button.setAttribute('aria-current',String(i===activeService)));
    const work=sample('work',progress('work'),opts),wc=work.cards;
    show(workHeading,work.heading.alpha,`translateY(${work.heading.y}svh) scale(${work.heading.scale})`);light(workLetters,work.heading.lit);
    show(projectWindow,wc.alpha,`translateY(${wc.y}svh)`);set(projectWindow,'pointerEvents',wc.alpha>.1?'auto':'none');
    const firstProject=projectCards[0],secondProject=projectCards[1],projectStep=firstProject&&secondProject?secondProject.offsetLeft-firstProject.offsetLeft:w*(w<768?.92:.8);
    set(projectTrack,'transform',`translateX(${-wc.q*projectStep}px)`);
    const activeProject=Math.round(wc.q);projectCards.forEach((card,i)=>{card.inert=i!==activeProject||wc.alpha<.1;});
    $$('[data-project-step]').forEach((button,i)=>button.setAttribute('aria-current',String(i===activeProject)));
    const archive=sample('archive',progress('archive'),opts),art=archive.ring;artIndex=Math.round(art.q);
    show(archiveHeading,archive.heading.alpha,`translate(-50%,-50%) translateY(${archive.heading.y}svh) scale(${archive.heading.scale})`);light(archiveLetters,archive.heading.lit);
    show(ring,art.alpha);show(archiveBottom,art.alpha);set(ring,'pointerEvents',art.alpha>.1?'auto':'none');
    artCards.forEach((card,i)=>{const angle=(i-art.q)*Math.PI/4,xx=Math.sin(angle)*w*(w<768?.35:.37),zz=Math.cos(angle)*w*(w<768?.16:.12),yy=-Math.cos(angle)*h*.025;
      set(card,'transform',`translate3d(calc(-50% + ${xx}px),calc(-50% + ${yy}px),${zz}px) rotateY(${-angle*180/Math.PI}deg)`);show(card,.42+clamp((Math.cos(angle)+1)/2)*.58);card.setAttribute('aria-current',String(i===artIndex));card.tabIndex=i===artIndex&&art.alpha>.1?0:-1;});
    const caption=$('art-caption');if(caption&&root.LK_CONTENT?.artworks[artIndex])caption.textContent=root.LK_CONTENT.artworks[artIndex].title;
    const after=sample('afterhours',progress('afterhours'),opts),gallery=after.gallery;
    // Split the two opaque title halves; the room behind stays continuous.
    afterCurtains.forEach((half,i)=>set(half,'transform',`translateX(${(i?1:-1)*gallery.aperture*100}%)`));
    show(aperture,1);set(aperture,'clipPath','none');
    const unit=Math.min(w<768?w*1.45:w*.72,h*1.25,1100),camera=after.camera;
    playWorld?.style.setProperty('--room-unit',unit+'px');
    set(room,'transform',`translateZ(${(camera.z-.15)*unit}px) rotateY(${camera.yaw}deg) translateX(${-camera.x*unit}px)`);
    const positions=[[-.65,0,30],[.65,0,-30],[-.30,-.80,0],[.30,-.80,0]];
    const projections=positions.map(position=>projectCard(camera,position,playWorld?.clientWidth||w,playWorld?.clientHeight||h,unit,w<768?650:1000));
    const depthOrder=projections.map((p,i)=>({depth:p.depth,i})).sort((a,b)=>a.depth-b.depth);
    panels.forEach((panel,i)=>{const projected=projections[i];set(panel,'transform',`matrix3d(${projected.matrix.join(',')})`);set(panel,'visibility',projected.visible?'visible':'hidden');set(panel,'zIndex',depthOrder.findIndex(p=>p.i===i)+1);show(panel,1);});
    let flame=state.flame;
    const coverLength=Math.max(1,h*redCoverScreens*mobileScrollScale(w,h,matchMedia('(pointer:coarse)').matches));
    for(const id of ['archive-entry','archive-exit']){
      const entry=layout.find(s=>s.id===id);
      if(entry&&smoothedY>=entry.top-coverLength&&smoothedY<entry.top)flame=entryFlame(smoothedY,entry.top,coverLength);
    }
    flameFrame(flame,clock);
    updateImmerse(time,section,{...state,flame});
    try{root.LKScene?.render(state.scene,clock);if(root.LKScene)doc.classList.add('scene-ready');}catch{doc.classList.remove('scene-ready');}
    // The loader comes down only AFTER the formation frame and its heading
    // opacity have been applied, avoiding an intermediate settled Knight.
    revealOpening();
    show($('finale-backdrop'),section==='finale'?(state.backdrop||0):0);
    show($('finale-whisper'),0);
    // The Knight reaches its final contact pose at .95; text follows afterwards.
    const contactAlpha=fade(progress('finale'),.965,1);
    show(contactCopy,contactAlpha,`translateY(${(1-contactAlpha)*3}svh)`);
    set(contactCopy,'visibility',contactAlpha>.001?'visible':'hidden');if(contactCopy)contactCopy.inert=contactAlpha<.01;
    debug={section,progress:p,phase:state.phase,state:{...state.scene},afterhours:section==='afterhours'?{camera:after.camera,aperture:gallery.aperture,index:gallery.q}:undefined,contactAlpha,clock,paused,reduced:false,scroll:smoothedY,targetScroll:scrollY,flame:{...flame},artIndex,services:{...svc},work:{...wc}};
    frame=requestAnimationFrame(update);
  }
  root.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;lastTime=0;}else if(!frame)frame=requestAnimationFrame(update);});
  reduce.addEventListener('change',()=>{if(reduce.matches){endOpening();resetReduced();root.LKScene?.render(emptyScene(),0);}else{doc.classList.remove('motion-reduced');reducedApplied=false;}measureNeeded=true;smoothedY=scrollY;});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{measureNeeded=true;}).observe($('main')||document.body);
  document.fonts?.ready.then(()=>{measureNeeded=true;});
  root.LKMotion={endOpening,step,artStep,goTo,togglePause(){paused=!paused;doc.classList.toggle('motion-paused',paused);return paused;},inspect:()=>({...debug,openingDone,renderer:root.LKScene?.inspect()})};
  doc.classList.toggle('motion-paused',paused);$('motion-toggle')?.setAttribute('aria-pressed',String(paused));if($('motion-toggle'))$('motion-toggle').textContent=paused?'Resume motion':'Pause motion';
  resize();
  const initial=location.hash.slice(1);if(initial&&byId.has(initial))requestAnimationFrame(()=>{goTo(initial,'instant');smoothedY=scrollY;});
  frame=requestAnimationFrame(update);
})();
