(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const load=src=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.append(script);
  });
  let fallback=false;
  function readable(){
    fallback=true;
    document.documentElement.classList.remove('loader-seen');
    document.documentElement.classList.add('motion-fallback');document.body.classList.remove('enhanced');
    const opening=document.querySelector('.opening');if(opening)opening.hidden=true;
    document.documentElement.style.overflow='';
    document.querySelector('#motion-toggle').hidden=true;
  }
  async function start(){
    if(reduced){await load('assets/js/motion.js');await load('assets/js/videos.js');return;}
    try{
      let response;
      if(typeof DecompressionStream==='function'){
        response=await fetch('assets/knight.json.gz');if(!response.ok)throw Error('Scene unavailable');
        const bytes=await response.arrayBuffer(),header=new Uint8Array(bytes,0,Math.min(2,bytes.byteLength));
        // Some hosts transparently decode .gz responses; accept either response form.
        window.KNIGHT_MESH_B64=header[0]===31&&header[1]===139
          ?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json()
          :JSON.parse(new TextDecoder().decode(bytes));
      }else{
        response=await fetch('assets/knight.json');if(!response.ok)throw Error('Scene unavailable');window.KNIGHT_MESH_B64=await response.json();
      }
      if(fallback)return;
      await load('assets/js/scene.js');if(fallback)return;await load('assets/js/motion.js');await load('assets/js/videos.js');
    }catch(error){readable();console.warn('The animated scene could not load. The readable portfolio remains available.');}
  }
  // A stalled connection must not leave an unresponsive black cover forever.
  const rescue=setTimeout(readable,12000);
  start().then(()=>clearTimeout(rescue)).catch(()=>{clearTimeout(rescue);readable();});
})();
