/* Real startup progress with a smooth, deliberately trailing presentation. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opening=document.querySelector('.opening'),number=document.querySelector('#load-count');
  const canvas=document.querySelector('#embers'),ec=reduced?null:canvas?.getContext('2d');
  const parts=Object.fromEntries((reduced?['fonts','motion','previews']:['mesh','renderer','textures','fonts','motion','previews']).map(key=>[key,0]));
  const state=window.LKLoading={ready:false,progress:0,displayed:0,presented:false,state:'loading'};
  const controller=new AbortController();
  const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  let fallback=false,rescue,animation=0,lastTime=null,shown=0,painted=-1;

  function syncProgress(){
    state.progress=state.ready?100:Math.min(99,Math.floor(Object.values(parts).reduce((sum,n)=>sum+n,0)/Object.keys(parts).length*100));
  }
  function embers(time){
    if(!ec)return;
    const w=innerWidth,h=innerHeight,d=Math.min(devicePixelRatio||1,1.5);
    if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){
      canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ec.setTransform(d,0,0,d,0,0);
    }
    ec.clearRect(0,0,w,h);
    for(let i=0;i<(w<768?44:76);i++){
      const life=(time*.00011*(.4+hash(i+5))+hash(i+77))%1;
      const y=h*1.08-life*h*1.3,x=w*hash(i+17)+Math.sin(life*7+hash(i+18)*9)*25,size=.4+Math.pow(hash(i+24),6)*2.8;
      ec.globalAlpha=Math.sin(life*Math.PI)*(.3+hash(i+38)*.5);ec.fillStyle=i%7===0?'#fbd69a':'#d29543';ec.fillRect(x,y,size,size*1.7);
    }
    ec.globalAlpha=1;
  }
  function frame(time){
    animation=0;if(fallback)return;
    if(document.hidden){lastTime=null;animation=requestAnimationFrame(frame);return;}
    const dt=lastTime===null?16:Math.min(50,Math.max(0,time-lastTime));lastTime=time;
    const gap=state.progress-shown;
    shown=reduced?state.progress:Math.min(state.progress,shown+Math.min(gap*(1-Math.exp(-dt/100)),dt*.10));
    if(state.progress-shown<.12)shown=state.progress;
    state.displayed=Math.floor(shown);
    if(state.displayed!==painted){
      painted=state.displayed;
      if(number)number.textContent=String(painted).padStart(3,'0');
      opening?.setAttribute('aria-valuenow',String(painted));
    }
    embers(time);
    if(state.ready&&state.displayed===100){
      state.presented=true;opening?.setAttribute('aria-busy','false');
      animation=requestAnimationFrame(()=>window.LKMotion?.endOpening());return;
    }
    animation=requestAnimationFrame(frame);
  }
  function watch(){clearTimeout(rescue);rescue=setTimeout(readable,12000);}
  function advance(key,fraction=1){
    if(fallback)return;
    parts[key]=Math.max(parts[key],Math.min(1,fraction));syncProgress();watch();
  }
  function readable(){
    if(fallback||state.ready)return;
    fallback=true;state.state='failed';controller.abort();clearTimeout(rescue);cancelAnimationFrame(animation);
    document.documentElement.classList.add('motion-fallback');document.body.classList.remove('enhanced');
    if(opening)opening.hidden=true;
    document.documentElement.style.overflow='';
  }
  const load=src=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.append(script);
  });
  async function bytes(response){
    if(!response.body?.getReader)return new Uint8Array(await response.arrayBuffer());
    const total=!response.headers.get('content-encoding')?Number(response.headers.get('content-length')):0;
    const reader=response.body.getReader(),chunks=[];
    let size=0;
    for(;;){
      const {done,value}=await reader.read();if(done)break;
      chunks.push(value);size+=value.byteLength;
      if(total>0)advance('mesh',Math.min(.99,size/total));else watch();
    }
    const result=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength;}
    return result;
  }
  async function prepareScene(){
    const compressed=typeof DecompressionStream==='function';
    const response=await fetch(compressed?'assets/knight.json.gz':'assets/knight.json',{signal:controller.signal});
    if(!response.ok)throw Error('Scene unavailable');
    const data=await bytes(response);if(fallback)return;
    // Hosts may transparently decode gzip. Accept either response form.
    window.KNIGHT_MESH_B64=compressed&&data[0]===31&&data[1]===139
      ?await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'))).json()
      :JSON.parse(new TextDecoder().decode(data));
    advance('mesh');
    await load('assets/js/scene.js?v=20261031-scroll-restored');if(fallback)return;
    advance('renderer');
    if(!window.LKScene?.whenReady)throw Error('Scene initialization unavailable');
    await window.LKScene.whenReady;advance('textures');
  }
  async function start(){
    const fonts=document.fonts?.load?Promise.all(['400 16px "DM Sans"','500 80px Teko','400 40px Ruthie'].map(font=>document.fonts.load(font))):Promise.resolve();
    await Promise.all([fonts.then(()=>advance('fonts')),reduced?Promise.resolve():prepareScene()]);
    if(fallback)return;
    await load('assets/js/motion.js?v=preview-repair-20261104');if(fallback)return;advance('motion');
    await load('assets/js/videos.js');if(fallback)return;advance('previews');
    state.ready=true;state.state='ready';clearTimeout(rescue);syncProgress();
  }
  syncProgress();watch();animation=requestAnimationFrame(frame);
  start().catch(()=>{readable();console.warn('The animated scene could not load. The readable portfolio remains available.');});
})();
