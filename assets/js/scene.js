

;
(function(root){
'use strict';
const M=root.KnightMath;

function b64bytes(s){const raw=atob(s),u=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)u[i]=raw.charCodeAt(i);return u;}
function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=new Error(gl.getShaderInfoLog(s));gl.deleteShader(s);throw error;}return s;}
function program(gl,vs,fs){
  const p=gl.createProgram(),shaders=[];
  try{
    for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const item=shader(gl,type,source);shaders.push(item);gl.attachShader(p,item);}
    gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;
  }catch(error){gl.deleteProgram(p);throw error;}
  finally{for(const item of shaders)gl.deleteShader(item);}
}

const VS=`#version 300 es
layout(location=0) in vec3 a_position;layout(location=1) in vec3 a_normal;layout(location=2) in vec4 a_vis;
uniform mat4 u_model;uniform mat4 u_viewProj;
out vec3 v_world;out vec3 v_normal;out vec3 v_local;out vec3 v_nobj;out vec4 v_vis;out mat3 v_rot;
void main(){v_rot=mat3(normalize(u_model[0].xyz),normalize(u_model[1].xyz),normalize(u_model[2].xyz));v_vis=a_vis;vec4 w=u_model*vec4(a_position,1.0);v_world=w.xyz;v_normal=normalize(mat3(u_model)*a_normal);v_nobj=a_normal;v_local=a_position;gl_Position=u_viewProj*w;}`;

// The reference sheet supplies surface detail (gold linework, eye, nostrils, mane, glowing pedestal).
// It is projected onto the true 3D mesh from the side (+/-X), front (-Z) and rear (+Z) and blended by
// surface orientation, so every angle is shaded from real geometry plus the matching reference views.
const FS=`#version 300 es
precision highp float;
in vec3 v_world;in vec3 v_normal;in vec3 v_local;in vec3 v_nobj;in vec4 v_vis;in mat3 v_rot;out vec4 outColor;
uniform sampler2D u_side;uniform sampler2D u_front;uniform sampler2D u_rear;
uniform float u_form;uniform float u_dbg;uniform float u_time;uniform float u_refl;uniform float u_floor;uniform vec3 u_camera;uniform float u_alpha;uniform float u_intensity;
float sat(float x){return clamp(x,0.0,1.0);}
void main(){
 vec3 N=normalize(v_normal);vec3 V=normalize(u_camera-v_world);
 if(dot(N,V)<0.0){N=-N;}
 vec3 no=normalize(v_nobj);
 float y=v_local.y;
 vec2 uvS=vec2((v_local.z+1.25)/2.5,1.0-y/3.0);
 vec2 uvF=vec2((-v_local.x+1.25)/2.5,1.0-y/3.0);
 vec2 uvR=vec2(( v_local.x+1.25)/2.5,1.0-y/3.0);
 float wS=pow(max(-no.x,0.0),4.0)*v_vis.x+pow(max(no.x,0.0),4.0)*v_vis.y,wF=pow(max(-no.z,0.0),4.0)*v_vis.z,wR=pow(max(no.z,0.0),4.0)*v_vis.w;
 float ws=wS+wF+wR+1e-4;
 vec3 tex=(texture(u_side,uvS).rgb*wS+texture(u_front,uvF).rgb*wF+texture(u_rear,uvR).rgb*wR)/ws;
 float cover=smoothstep(.04,.45,ws);
 // micro-relief: height gradient from a lightly smoothed texture, taken with explicit taps in each planar
 // projection (no screen-space derivatives -> no 2x2 quad stair-stepping or shimmer), applied in object space.
 const vec3 LW=vec3(.30,.59,.11);
 float tx=1.4/2048.0,ty=1.4/2457.0;
 float sS=1.0/(2.5*tx*2.0),sY=1.0/(3.0*ty*2.0);
 float hS1=dot(texture(u_side,uvS+vec2(tx,0.0),1.0).rgb,LW),hS0=dot(texture(u_side,uvS-vec2(tx,0.0),1.0).rgb,LW);
 float hS3=dot(texture(u_side,uvS+vec2(0.0,ty),1.0).rgb,LW),hS2=dot(texture(u_side,uvS-vec2(0.0,ty),1.0).rgb,LW);
 float hF1=dot(texture(u_front,uvF+vec2(tx,0.0),1.0).rgb,LW),hF0=dot(texture(u_front,uvF-vec2(tx,0.0),1.0).rgb,LW);
 float hF3=dot(texture(u_front,uvF+vec2(0.0,ty),1.0).rgb,LW),hF2=dot(texture(u_front,uvF-vec2(0.0,ty),1.0).rgb,LW);
 float hR1=dot(texture(u_rear,uvR+vec2(tx,0.0),1.0).rgb,LW),hR0=dot(texture(u_rear,uvR-vec2(tx,0.0),1.0).rgb,LW);
 float hR3=dot(texture(u_rear,uvR+vec2(0.0,ty),1.0).rgb,LW),hR2=dot(texture(u_rear,uvR-vec2(0.0,ty),1.0).rgb,LW);
 // object-space tangent gradients: side -> (0,dy,dz), front -> (dx,dy,0) with x mirrored, rear -> (dx,dy,0)
 vec3 gS=vec3(0.0,-(hS3-hS2)*sY,(hS1-hS0)*sS);
 vec3 gF=vec3(-(hF1-hF0)*sS,-(hF3-hF2)*sY,0.0);
 vec3 gR=vec3((hR1-hR0)*sS,-(hR3-hR2)*sY,0.0);
 vec3 gObj=(gS*wS+gF*wF+gR*wR)/ws;
 float graze=smoothstep(.05,.35,abs(dot(N,V)));
 N=normalize(N-v_rot*gObj*0.0042*cover*graze);
 float a=u_time*.22;
 vec3 L1=normalize(vec3(-.35+.5*sin(a),.72,-.58+.4*cos(a)));vec3 L2=normalize(vec3(.55,.30,.77));vec3 L3=normalize(vec3(.1,-.4,-.9));
 float d1=max(dot(N,L1),0.0),d2=max(dot(N,L2),0.0);
 vec3 R=reflect(-V,N);
 float s1=pow(max(dot(R,L1),0.0),110.0);float s2=pow(max(dot(R,L2),0.0),60.0);float s3=pow(max(dot(R,L3),0.0),30.0);
 float fres=pow(1.0-sat(dot(N,V)),2.4);
 vec3 gold=vec3(1.0,.52,.06);vec3 goldHot=vec3(1.0,.80,.32);
 // studio softbox reflections on the black glass
 float box1=smoothstep(.55,.9,sin(R.y*4.2+R.x*2.0+1.0))*smoothstep(-.2,.6,R.y);
 float box2=smoothstep(.72,.97,sin(R.x*6.0-R.z*3.0+u_time*.15));
 vec3 env=goldHot*(.050*box1+.030*box2)*(.35+fres*1.6);
 vec3 black=vec3(.004,.004,.006);
 vec3 color=black*(1.0+4.0*d1+2.0*d2)+goldHot*(.75*s1+.35*s2+.18*s3)+env;
 color+=tex*cover*1.12;
 color+=gold*fres*.62*(1.0-.45*cover)+goldHot*fres*fres*.5;
 float grain=fract(sin(dot(floor(v_local*87.0),vec3(12.9898,78.233,39.425)))*43758.5453);
 float formed=smoothstep(.64,1.0,u_form);
 if(formed<=0.0||grain>formed)discard;
 float fade=1.0;
 if(u_refl>.5){ if(v_world.y>u_floor)discard; fade=.42*exp(-(u_floor-v_world.y)*1.1); }
 if(u_dbg>.5){float l=.25+.75*max(dot(N,normalize(vec3(-.3,.5,-.8))),0.);outColor=vec4(vec3(l)*(u_dbg>1.5?v_vis.xyz:vec3(1.)),1.);return;}
 color*=u_intensity*fade;outColor=vec4(color,u_alpha);
}`;

function loadTex(gl,url,unit){
  const texture=gl.createTexture();
  gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  let img=new Image();
  let settled=false,timer,rejectReady;
  const ready=new Promise((resolve,reject)=>{
    rejectReady=reject;
    const finish=(error)=>{
      if(settled)return;
      settled=true;root.clearTimeout(timer);img.onload=img.onerror=null;img=null;
      if(error)reject(error);else resolve(texture);
    };
    img.onload=()=>{
      try{
        if(gl.isContextLost()||!img.naturalWidth)throw new Error('Knight texture unavailable');
        gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        const ext=gl.getExtension('EXT_texture_filter_anisotropic');
        if(ext)gl.texParameterf(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        if(gl.getError()!==gl.NO_ERROR)throw new Error('Knight texture upload failed');
        finish();
      }catch(error){finish(error);}
    };
    img.onerror=()=>finish(new Error('Knight texture decode failed'));
    timer=root.setTimeout(()=>finish(new Error('Knight texture timed out')),12000);
    img.decoding='async';img.src=url;
  });
  function dispose(){
    root.clearTimeout(timer);
    if(img){img.onload=img.onerror=null;img=null;}
    if(!settled){settled=true;rejectReady(new Error('Knight texture cancelled'));}
    gl.deleteTexture(texture);
  }
  return {texture,ready,dispose};
}

// Render at the display pixel density, bounded only for very large GPU surfaces.
function renderSize(cssWidth,cssHeight,deviceRatio,mobile,maxSize=8192){
  const dpr=Math.min(3,Math.max(1,deviceRatio||1));
  const w=Math.max(1,cssWidth*dpr),h=Math.max(1,cssHeight*dpr);
  const budget=mobile?3000000:9000000;
  const scale=Math.min(1,Math.sqrt(budget/(w*h)),maxSize/Math.max(w,h));
  return {width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale)),dpr};
}

function createScene(canvas){
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'default'});
  if(!gl)throw new Error('WebGL2 unavailable');
  const prog=program(gl,VS,FS);const src=root.KNIGHT_MESH_B64;if(!src)throw new Error('mesh data missing');
  const pos=new Float32Array(b64bytes(src.positions).buffer),nrm=new Int16Array(b64bytes(src.normals).buffer),idx=new Uint32Array(b64bytes(src.indices).buffer);
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,pos,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  const nb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,nrm,gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.SHORT,true,0,0);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);gl.bindVertexArray(vao);
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,b64bytes(src.vis),gl.STATIC_DRAW);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.UNSIGNED_BYTE,true,0,0);gl.bindVertexArray(null);
  const U=n=>gl.getUniformLocation(prog,n);
  const loc={model:U('u_model'),viewProj:U('u_viewProj'),camera:U('u_camera'),alpha:U('u_alpha'),intensity:U('u_intensity'),dbg:U('u_dbg'),time:U('u_time'),refl:U('u_refl'),floor:U('u_floor'),form:U('u_form')};
  gl.useProgram(prog);gl.uniform1i(U('u_side'),0);gl.uniform1i(U('u_front'),1);gl.uniform1i(U('u_rear'),2);gl.uniform1f(loc.dbg,0);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

  const textures=[loadTex(gl,src.tex.side,0),loadTex(gl,src.tex.front,1),loadTex(gl,src.tex.rear,2)];
  const texs=textures.map(item=>item.texture);
  let texturesReady=false,disposed=false;
  const ready=Promise.all(textures.map(item=>item.ready)).then(()=>{if(disposed)throw new Error('Knight scene disposed');texturesReady=true;});
  let width=0,height=0;
  function resize(){
    if(disposed||gl.isContextLost())throw new Error('Knight context unavailable');
    const size=renderSize(canvas.clientWidth,canvas.clientHeight,root.devicePixelRatio,root.innerWidth<768,Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),gl.getParameter(gl.MAX_TEXTURE_SIZE)));
    if(size.width!==width||size.height!==height){width=size.width;height=size.height;canvas.width=width;canvas.height=height;}
  }
  function drawOne(model,viewProj,camera,alpha,intensity,time,refl,floorY){
    gl.useProgram(prog);gl.uniformMatrix4fv(loc.model,false,model);gl.uniformMatrix4fv(loc.viewProj,false,viewProj);gl.uniform3fv(loc.camera,camera);gl.uniform1f(loc.alpha,alpha);gl.uniform1f(loc.intensity,intensity);gl.uniform1f(loc.time,time);gl.uniform1f(loc.refl,refl);gl.uniform1f(loc.floor,floorY);
    gl.bindVertexArray(vao);gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_INT,0);
  }
  function render(state,time){
    if(disposed||gl.isContextLost())throw new Error('Knight context unavailable');
    if(!texturesReady)return false;
    resize();gl.useProgram(prog);gl.uniform1f(loc.form,state.form??1);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,width,height);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    for(let k=0;k<3;k++){gl.activeTexture(gl.TEXTURE0+k);gl.bindTexture(gl.TEXTURE_2D,texs[k]);}
    const aspect=width/height;const proj=M.perspective(state.fov*Math.PI/180,aspect,.05,80);const roll=state.cameraRoll||0;const up=[Math.sin(roll),Math.cos(roll),0];const view=M.lookAt(state.eye,state.target,up);const vp=M.multiply(proj,view);
    for(const inst of state.instances){if(inst.scale<.025||inst.alpha<.015)continue;
      const model=M.composePivot(inst.pos,inst.rot,inst.scale,[0,1.45,0]);
      const upright=Math.abs(inst.rot[2])<.12&&Math.abs(inst.rot[0])<.25;
      if(upright){const fy=inst.pos[1]+1.45*(1-inst.scale);const mir=M.multiply(M.translation(0,2*fy,0),M.multiply(M.scaling(1,-1,1),model));drawOne(mir,vp,state.eye,inst.alpha,inst.intensity,time,1,fy);}
      drawOne(model,vp,state.eye,inst.alpha,inst.intensity,time,0,0);}
    gl.bindVertexArray(null);
    if(gl.getError()!==gl.NO_ERROR)throw new Error('Knight draw failed');
    return true;
  }
  function dispose(){
    if(disposed)return;
    disposed=true;
    for(const item of textures)item.dispose();
    for(const buffer of [pb,nb,ib,vb])gl.deleteBuffer(buffer);
    for(const vertexArray of [vao])gl.deleteVertexArray(vertexArray);
    for(const item of [prog])gl.deleteProgram(item);
  }
  return {gl,ready,render,resize,dispose,vertexCount:src.vertexCount,triangleCount:src.triangleCount};
}

// Keep every section upright and at the same safe camera distance. Only yaw,
// lighting and a bounded screen offset change; there are no pointer inputs.
function choreography(section,mobile,time=0){
  const poses={hero:[0,-.16,1],work:[.92,.34,.88],approach:[.84,-.24,.92],experience:[.9,.28,.88],about:[.82,-.10,.94],contact:[0,0,1.03]};
  const pose=poses[section]||poses.hero;
  return {
    eye:[0,1.5,-7.8],target:[0,1.5,0],fov:mobile?36:34,cameraRoll:0,
    screenOffset:mobile?0:pose[0],
    instances:[{pos:[0,0,0],rot:[0,pose[1]+.075*Math.sin(time*.105),0],scale:1,alpha:1,intensity:pose[2]}]
  };
}

root.Knight3D={createScene,choreography,renderSize};
})(window);

;
/* Authentic Knight geometry. Assembly (form), material (surface), and time are
   independent: a complete cloud always exists before the solid mesh returns. */
(() => {
  'use strict';
  const root=window, meshCanvas=document.getElementById('world-canvas'), particleCanvas=document.getElementById('particle-canvas');
  const ctx=particleCanvas?.getContext('2d',{alpha:true}), source=root.KNIGHT_MESH_B64;
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)), smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
  const finite=(n,f)=>Number.isFinite(n)?n:f, hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x);};
  const decode=(text,Type)=>new Type(Uint8Array.from(atob(text),c=>c.charCodeAt(0)).buffer), empty=()=>{};
  if(!meshCanvas||!ctx||!source){
    document.documentElement.dataset.lkRenderer='unavailable';
    document.documentElement.dataset.lkRendererError='Required original scene assets or canvases unavailable';
    root.LKScene={ready:true,whenReady:Promise.resolve(),render:empty,resize:empty,inspect:()=>({renderer:'unavailable',originalMesh:false,errors:['Required scene assets unavailable']})};return;
  }
  const mobile=innerWidth<760, cpuBudget=mobile?36000:60000, gpuBudget=mobile?72000:128000;
  let width=innerWidth,height=innerHeight,dpr=1,scene=null,renderer='original-poster',contextLost=false;
  let lastGPU=-Infinity,lastDraw=-Infinity,lastNav=-Infinity,draws=0,last={},errorList=[],posterMatte=null,textureTargets=false,textureMaps={};
  let gpuPoints=null,activeCount=cpuBudget,lastVisible=0,lastRed=0,lastShimmer=0,lastFlow=0,gazeEyeCount=0;
  // Match the two tilted irises in the original front-texture eye band.
  const gazeIris=(x,y)=>Math.hypot((Math.abs(x)-.29-(y+.115)*.20)/.028,(y+.115)/.075)<1;
  let navScene=null,navContext=null,navRenderer='unavailable',navAngle=0,navDraws=0;
  const navCanvas=document.getElementById('nav-knight');
  const positions=decode(source.positions,Float32Array),normals=decode(source.normals,Int16Array),indices=decode(source.indices,Uint32Array);
  // One surface population is reused by every pose and the miniature Knight.
  const surface=new Float32Array(gpuBudget*8),movement=new Float32Array(gpuBudget*2),eyePoints=new Float32Array(gpuBudget*3),facePoints=new Float32Array(gpuBudget*3),gazePoints=new Float32Array(gpuBudget*3),brandPoints=new Float32Array(gpuBudget*2);
  let brandAspect=1,eyeSource=null,eyeView='eye',eyeIrisCount=0;
  const areas=new Float64Array(indices.length/3);let totalArea=0;
  for(let f=0;f<indices.length;f+=3){
    const a=indices[f]*3,b=indices[f+1]*3,c=indices[f+2]*3;
    const ux=positions[b]-positions[a],uy=positions[b+1]-positions[a+1],uz=positions[b+2]-positions[a+2];
    const vx=positions[c]-positions[a],vy=positions[c+1]-positions[a+1],vz=positions[c+2]-positions[a+2];
    totalArea+=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)*.5;areas[f/3]=totalArea;
  }
  for(let i=0;i<gpuBudget;i++){
    const pick=hash(i+1)*totalArea;let lo=0,hi=areas.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(areas[mid]<pick)lo=mid+1;else hi=mid;}
    const a=indices[lo*3]*3,b=indices[lo*3+1]*3,c=indices[lo*3+2]*3,r=Math.sqrt(hash(i+79)),u=hash(i+193),wa=1-r,wb=r*(1-u),wc=r*u,o=i*8;
    for(let k=0;k<3;k++){surface[o+k]=positions[a+k]*wa+positions[b+k]*wb+positions[c+k]*wc;surface[o+3+k]=(normals[a+k]*wa+normals[b+k]*wb+normals[c+k]*wc)/32767;}
    surface[o+6]=hash(i+557);surface[o+7]=.6;movement[i*2]=.22+hash(surface[o+6]*791+9)*.48;movement[i*2+1]=26+hash(surface[o+6]*83+13)*22;
    const angle=hash(i+291)*Math.PI*2,radius=.25+hash(i+601)*.68;
    eyePoints.set([Math.cos(angle)*radius*1.35,Math.sin(angle)*radius*.67,.65],i*3);
    if(i%32===0)eyePoints.set([Math.cos(angle)*.15,.12+Math.sin(angle)*.07,-.8],i*3);
    let vertex=Math.floor(hash(i+785)*source.vertexCount)*3;
    for(let trial=0;trial<30&&positions[vertex+1]<1.55;trial++)vertex=Math.floor(hash(i+785+trial*149)*source.vertexCount)*3;
    facePoints.set([positions[vertex],(positions[vertex+1]>1.55?positions[vertex+1]:2.4)-2.2,.65],i*3);
  }
  // A geometric LK remains available if the font raster cannot be prepared.
  for(let i=0;i<gpuBudget;i++){
    const u=hash(i+812),v=hash(i+917),stroke=i%5;
    const x=stroke===0?-.43+u*.12:stroke===1?-.43+u*.36:stroke===2?.06+u*.12:.15+v*.30+(u-.5)*.10;
    const y=stroke===1?-.44+v*.12:stroke===3?v*.45:stroke===4?-v*.45:v-.5;
    brandPoints.set([x,y],i*2);
    gazePoints.set([(hash(i+12)-.5), (hash(i+19)-.5),.4],i*3);
  }
  async function prepareBrand(){
    if(document.fonts?.load)await document.fonts.load('500 430px Teko');
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
    const context=canvas.getContext('2d',{willReadFrequently:true});if(!context?.fillText)return;
    context.font='500 430px Teko';context.textAlign='center';context.textBaseline='middle';context.fillStyle='#fff';context.fillText('LK',256,256);
    const data=context.getImageData(0,0,512,512).data,pixels=[];let left=512,right=0,top=512,bottom=0;
    for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(data[(y*512+x)*4+3]>128){pixels.push([x,y]);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(!pixels.length)return;brandAspect=(right-left)/(bottom-top);
    for(let i=0;i<gpuBudget;i++){const[x,y]=pixels[Math.floor(hash(i+633)*pixels.length)];brandPoints.set([(x-left)/(right-left)-.5,.5-(y-top)/(bottom-top)],i*2);}
    gpuPoints?.upload();
  }
  function remember(error){const message=error?.message||String(error);if(!errorList.includes(message))errorList.push(message);errorList=errorList.slice(-6);document.documentElement.dataset.lkRendererError=message.replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,480);}
  function usePoster(error){if(error)remember(error);const old=scene;scene=null;renderer='original-poster';meshCanvas.style.opacity='0';document.documentElement.dataset.lkRenderer=renderer;try{old?.dispose();}catch{}}
  async function boot(){
    if(contextLost)return;
    if(!root.Knight3D?.createScene){usePoster(new Error('Original Knight3D renderer script unavailable'));return;}
    document.documentElement.dataset.lkRenderer='loading-original-webgl2';
    try{const current=root.Knight3D.createScene(meshCanvas);scene=current;await current.ready;if(scene===current&&!contextLost){renderer='original-webgl2';lastGPU=-Infinity;document.documentElement.dataset.lkRenderer=renderer;delete document.documentElement.dataset.lkRendererError;}}
    catch(error){usePoster(error);}
  }
  async function bootNav(){
    if(!navCanvas)return;
    try{if(!root.Knight3D?.createScene)throw new Error('No miniature GPU renderer');const candidate=root.Knight3D.createScene(navCanvas);await candidate.ready;navScene=candidate;navRenderer='original-webgl2';}
    catch{try{navContext=navCanvas.getContext('2d',{alpha:true});}catch{}navRenderer=navContext?'original-mesh-points':'unavailable';}
    navCanvas.dataset&&(navCanvas.dataset.renderer=navRenderer);
  }
  function imageMap(url,size=480){return new Promise(resolve=>{
    const image=new Image();image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=size;canvas.height=Math.round(size*image.naturalHeight/image.naturalWidth);const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,canvas.width,canvas.height);resolve({width:canvas.width,height:canvas.height,data:context.getImageData(0,0,canvas.width,canvas.height).data,canvas});}catch(error){remember(error);resolve(null);}};image.onerror=()=>resolve(null);image.src=url;
  });}
  function luminance(map,u,v){if(!map)return .6;const x=Math.floor(clamp(u,0,.999)*map.width),y=Math.floor(clamp(v,0,.999)*map.height),o=(y*map.width+x)*4;return(map.data[o]*.30+map.data[o+1]*.59+map.data[o+2]*.11)/255;}
  function rasterTargets(map,rect,out,fx,fy,cx,cy,salt){
    if(!map)return;
    // Weighted cumulative sampling places every point on real, visible source
    // detail. Rejection sampling previously left many black, invisible points.
    const pixels=[],cdf=[];let total=0;
    for(let y=Math.floor(rect[1]*map.height);y<Math.ceil(rect[3]*map.height);y++)for(let x=Math.floor(rect[0]*map.width);x<Math.ceil(rect[2]*map.width);x++){
      const o=(y*map.width+x)*4,light=(map.data[o]*.30+map.data[o+1]*.59+map.data[o+2]*.11)/255;
      if(light<.028)continue;total+=Math.pow(light,.65)+.025;pixels.push([x,y,light]);cdf.push(total);
    }
    if(!pixels.length)return;
    for(let i=0;i<gpuBudget;i++){
      const pick=hash(i+salt)*total;let lo=0,hi=cdf.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(cdf[mid]<pick)lo=mid+1;else hi=mid;}
      const [x,y,light]=pixels[lo],u=(x+hash(i+salt+71))/map.width,v=(y+hash(i+salt+91))/map.height;
      out.set([(u-cx)*fx,(cy-v)*fy,Math.max(.12,light)],i*3);
    }
  }
  // Both views use the original ornate Knight, with enough brow/bridge to
  // retain its horse identity. Signed luminance marks the actual eye recess.
  function setEyeView(view){
    eyeView=view==='eye'?'eye':'detailed';
    if(!eyeSource)return eyeView;
    const map=eyeSource,rect=eyeView==='eye'?[.20,.14,.51,.32]:[.08,0,.88,.55];
    const [left,top,right,bottom]=rect,cx=(left+right)/2,cy=(top+bottom)/2,fx=2/(right-left),fy=fx*map.height/map.width;
    rasterTargets(map,rect,eyePoints,fx,fy,cx,cy,432);
    eyeIrisCount=0;
    for(let i=0;i<gpuBudget;i++){
      const q=i*3,u=eyePoints[q]/fx+cx,v=cy-eyePoints[q+1]/fy;
      let edge=Math.min(smooth((u-left)/(right-left)*7),smooth((right-u)/(right-left)*7),smooth((v-top)/(bottom-top)*7),smooth((bottom-v)/(bottom-top)*7));
      if(eyeView==='eye')edge*=1-smooth((Math.hypot((u-cx)/((right-left)*.53),(v-cy)/((bottom-top)*.62))-.70)/.30);
      const du=u-.343,dv=(v-.226)*map.height/map.width,along=du*.866-dv*.5,across=du*.5+dv*.866;
      const iris=Math.hypot(along/.027,across/.010)<1;
      const pupil=Math.abs(along)<.014&&Math.abs(across)<.002;
      eyePoints[q+2]=Math.max(.00001,eyePoints[q+2]*edge)*(iris?-1:1);
      if(pupil)eyePoints[q+2]=.025;
      if(iris&&!pupil)eyeIrisCount++;
    }
    // Fill the ruby eye recess with fine grains while preserving a dark pupil.
    for(let i=0;i<gpuBudget;i+=32){
      const a=hash(i+58)*Math.PI*2,r=Math.sqrt(hash(i+71)),along=Math.cos(a)*r*.025,across=Math.sin(a)*r*.009;
      if(Math.abs(along)<.014&&Math.abs(across)<.002)continue;
      const u=.343+along*.866+across*.5,v=.226+(-along*.5+across*.866)*map.width/map.height;
      eyePoints.set([(u-cx)*fx,(cy-v)*fy,-(.45+hash(i+95)*.5)],i*3);eyeIrisCount++;
    }
    eyeIrisCount=0;for(let i=0;i<gpuBudget;i++)if(eyePoints[i*3+2]<0)eyeIrisCount++;
    gpuPoints?.upload();lastDraw=-Infinity;
    return eyeView;
  }
  async function prepareTextures(){
    const[side,front,rear,poster,detail]=await Promise.all([imageMap(source.tex.side),imageMap(source.tex.front,1024),imageMap(source.tex.rear),imageMap("assets/media/1958d7d5f6856dfb.webp",1536),imageMap(source.tex.side,1536)]);textureMaps={side,front,rear};
    for(let i=0;i<gpuBudget;i++){const o=i*8,x=surface[o],y=surface[o+1],z=surface[o+2],nx=Math.abs(surface[o+3]),nz=surface[o+5];surface[o+7]=nx>Math.abs(nz)?luminance(side,(z+1.25)/2.5,1-y/3):luminance(nz<0?front:rear,((nz<0?-x:x)+1.25)/2.5,1-y/3);}
    eyeSource=detail||side;setEyeView(eyeView);
    rasterTargets(front,[.28,.01,.72,.55],facePoints,2.6,2.4,.5,.28,875);
    rasterTargets(front,[.30,.135,.70,.29],gazePoints,2.5,1/.155,.5,.2125,1971);
    gazeEyeCount=0;for(let i=0;i<gpuBudget;i++)if(gazeIris(gazePoints[i*3],gazePoints[i*3+1]))gazeEyeCount++;
    for(let i=0;i<gpuBudget;i+=20){
      const angle=hash(i+87)*Math.PI*2,r=Math.sqrt(hash(i+18)),eye=i%40===0?-1:1;

      if(front)facePoints.set([eye*.29+Math.cos(angle)*r*.041,.16+Math.sin(angle)*r*.025,.95],i*3);
    }
    textureTargets=!!side&&!!front;
    if(poster){
      const canvas=poster.canvas,context=canvas.getContext('2d'),data=poster.data;
      for(let y=0;y<canvas.height;y++){
        let first=canvas.width,last=-1;for(let x=0;x<canvas.width;x++){const o=(y*canvas.width+x)*4;if(Math.max(data[o],data[o+1],data[o+2])>32){first=Math.min(first,x);last=x;}}
        for(let x=0;x<canvas.width;x++){const o=(y*canvas.width+x)*4;data[o+3]=x>=first&&x<=last?255:0;if(y<canvas.height*.13&&Math.max(data[o],data[o+1],data[o+2])<20)data[o+3]=0;}
      }
      context.putImageData(new ImageData(data,canvas.width,canvas.height),0,0);posterMatte=canvas;
    }
    gpuPoints?.upload();
  }

  // GPU points use the same source targets and equations as the 2D fallback.
  // The 2D canvas remains available for the authentic poster and local glints.
  function createPointRenderer(){
    if(!particleCanvas.parentNode?.insertBefore)return null;
    const canvas=document.createElement('canvas');canvas.id='particle-gpu-canvas';canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    const gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'high-performance'});if(!gl)return null;
    let program,vao,buffer,available=true;const ownedShaders=[];
    const vs=`#version 300 es
precision highp float;
layout(location=0)in vec3 a_position;layout(location=1)in vec3 a_normal;layout(location=2)in vec2 a_meta;layout(location=3)in vec3 a_eye;layout(location=4)in vec3 a_face;layout(location=5)in vec3 a_gaze;layout(location=6)in vec2 a_brand;
uniform vec2 u_viewport,u_center;uniform float u_form,u_surface,u_alpha,u_scale,u_rotation,u_time,u_dpr,u_shape,u_shimmer,u_redEye,u_brandMorph,u_shine,u_brandAspect;
out vec3 v_color;out float v_alpha;
float sat(float v){return clamp(v,0.,1.);}float ss(float v){v=sat(v);return v*v*(3.-2.*v);}float h(float v){return fract(sin(v*127.1+311.7)*43758.5453);}
void main(){
 float seed=a_meta.x,t=u_time,co=cos(u_rotation),si=sin(u_rotation),light=a_meta.y;vec2 target;float nz=-1.,iris=0.;
 if(u_shape>2.5){float breath=1.+sin(t*.85)*.008;float gw=min(u_viewport.x*1.18,u_viewport.y*2.2)*u_scale;float gh=gw*.465;float bw=min(u_viewport.x*.70,u_viewport.y*.65);vec2 gaze=u_center*u_viewport+vec2(a_gaze.x*gw,-a_gaze.y*gh)*breath;vec2 brand=u_center*u_viewport+vec2(a_brand.x*bw,-a_brand.y*bw/u_brandAspect);target=mix(gaze,brand,u_brandMorph);light=a_gaze.z;iris=1.-step(1.,length(vec2((abs(a_gaze.x)-.29-(a_gaze.y+.115)*.20)/.028,(a_gaze.y+.115)/.075)));}
 else if(u_shape<.5){vec3 p=a_position-vec3(0.,1.45,0.);float xx=p.x*co+p.z*si,zz=-p.x*si+p.z*co;float k=u_viewport.y/(2.*tan(radians(17.)))*u_scale*1.1/(7.8+zz*u_scale*1.1);target=u_center*u_viewport+vec2(-xx,-p.y+.05/(u_scale*1.1))*k;nz=-a_normal.x*si+a_normal.z*co;iris=step(length(vec2((abs(p.x)-.35)/.09,(p.y-.87)/.065)),1.3)*step(p.z,-.05);}
 else{vec3 p=u_shape<1.5?a_eye:a_face;float k=u_shape<1.5?min(u_viewport.x*.42,u_viewport.y*.50):min(u_viewport.x*.72,u_viewport.y*.72);k*=u_scale;target=u_center*u_viewport+vec2(p.x*max(.4,cos(u_rotation*.32)),-p.y+p.x*sin(u_rotation*.32)*.12)*k;light=abs(p.z);iris=u_shape<1.5?1.-step(0.,p.z):1.-step(1.3,length(vec2((abs(p.x)-.29)/.055,(p.y-.16)/.038)));}
 float direction=u_shape<.5?sat((a_position.z+1.1)/2.2):sat(.5+target.x/u_viewport.x*.3+seed*.2);float formed=u_shape>2.5?1.:ss((u_form-direction*.17-seed*.075)/.755),flight=1.-formed;
 float a=seed*6.283185+t*(.10+seed*.045)+flight*3.5,r=.22+h(seed*791.+9.)*.48;
 vec2 origin=u_center*u_viewport+vec2(cos(a)*u_viewport.x*r,sin(a*.83)*u_viewport.y*r*1.15);
 float phase=target.x*.006+target.y*.004-t*.65+seed*1.9;
 vec2 curl=vec2(-sin(phase)+.35*cos(phase*.73+t*.45),cos(phase)+.35*sin(phase*.81-t*.37));
 float drift=.45+flight*(26.+h(seed*83.+13.)*22.)+sin(u_brandMorph*3.14159265)*(22.+seed*14.);vec2 micro=vec2(sin(t*.91+seed*93.),cos(t*.77+seed*71.));
 vec2 position=mix(origin,target,formed)+curl*drift+micro*(.3+flight*2.5);
 float wave=.82+.18*sin(t*1.4+target.x*.007+target.y*.005+seed*51.);float glint=pow(max(0.,sin(t*(1.5+seed*.6)+seed*733.)),14.)*u_shimmer;
 float red=(u_shape>2.5||(u_shape>.5&&u_shape<1.5))?0.:(mod(float(gl_VertexID),20.)<.5?1.:0.);if(u_redEye>.5)red=max(red,iris*(u_shape>2.5?1.-step(1.-ss(u_brandMorph/.6),seed):1.));
 vec3 gold=mix(vec3(.76,.46,.13),vec3(1.,.85,.45),sqrt(sat(light)));v_color=mix(gold,vec3(1.,.12,.19),red);v_color=mix(v_color,vec3(1.,.96,.76),glint*.45*(1.-red));
 if(u_shape>2.5){v_color=mix(vec3(.66,.32,.065),vec3(1.,.83,.42),pow(sat(light),.65))*(1.3+u_shine*.3);v_color+=vec3(1.,.79,.36)*glint*(.2+u_shine*.7);v_color=mix(v_color,vec3(1.,.012,.024)*(1.15+glint*.25),red);}
 if(u_shape>.5&&u_shape<1.5){v_color=mix(vec3(.35,.18,.04),vec3(1.,.84,.44),pow(sat(light),.8));v_color=mix(v_color,vec3(1.,.015,.035),red);}
 float material=u_shape<.5?.75+sqrt(sat(light))*.25:.82+sqrt(sat(light))*.18;float facing=u_shape<.5?mix(1.,.65,ss((nz+.1)/.8)):1.;
 v_alpha=u_alpha*ss(u_form/.80)*(.65+.35*wave)*material*facing*sqrt(max(0.,1.-u_surface))*(1.+glint*.75);if(u_redEye>.5&&iris>.5)v_alpha*=1.4;
 if(u_shape>.5&&u_shape<1.5)v_alpha*=(.14+.60*pow(sat(light),.65))*smoothstep(0.,.10,sat(light));
 if(u_shape>2.5){float limit=min(.5,u_viewport.y*.19/(min(u_viewport.x*1.18,u_viewport.y*2.2)*u_scale*.465));v_alpha*=.8*(1.+u_shine*.4)*(1.-smoothstep(limit*.70,limit,abs(a_gaze.y))*(1.-u_brandMorph));}
 float size=seed<.7?.82+seed*.45:1.15+(seed-.7)*1.1;size+=glint*.62+iris*.20;if(u_shape>2.5)size=(size+.4+u_shine*.2)*clamp(u_viewport.x/700.,1.,1.8);gl_PointSize=(u_shape>.5&&u_shape<1.5)?max(.7,size*.70*u_dpr):max(1.2,size*u_dpr);gl_Position=vec4(position/u_viewport*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
}`;
    const fs=`#version 300 es
precision highp float;in vec3 v_color;in float v_alpha;out vec4 outColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float edge=1.-smoothstep(.40,1.,d);float alpha=min(1.,v_alpha)*edge;outColor=vec4(v_color*alpha,alpha);}`;
    const compile=(type,text)=>{const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(message||'Particle shader compilation failed');}return s;};
    try{
      program=gl.createProgram();const v=compile(gl.VERTEX_SHADER,vs);ownedShaders.push(v);const f=compile(gl.FRAGMENT_SHADER,fs);ownedShaders.push(f);gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Particle link failed');
      vao=gl.createVertexArray();buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      for(const[location,size,offset]of[[0,3,0],[1,3,3],[2,2,6],[3,3,8],[4,3,11],[5,3,14],[6,2,17]]){gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,76,offset*4);}
      gl.bindVertexArray(null);particleCanvas.parentNode.insertBefore(canvas,particleCanvas);
    }catch(error){remember(new Error('GPU particles unavailable: '+error.message));try{gl.deleteProgram(program);gl.deleteBuffer(buffer);gl.deleteVertexArray(vao);}catch{}return null;}finally{for(const shader of ownedShaders)gl.deleteShader(shader);}
    const u=Object.fromEntries(['viewport','center','form','surface','alpha','scale','rotation','time','dpr','shape','shimmer','redEye','brandMorph','shine','brandAspect'].map(name=>[name,gl.getUniformLocation(program,'u_'+name)]));
    function upload(){if(!available)return;const data=new Float32Array(gpuBudget*19);for(let i=0;i<gpuBudget;i++){data.set(surface.subarray(i*8,i*8+8),i*19);data.set(eyePoints.subarray(i*3,i*3+3),i*19+8);data.set(facePoints.subarray(i*3,i*3+3),i*19+11);data.set(gazePoints.subarray(i*3,i*3+3),i*19+14);data.set(brandPoints.subarray(i*2,i*2+2),i*19+17);}gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);}
    function clear(){if(!available)return;gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);}
    function draw(state,t){
      if(!available)return false;
      clear();if(state.alpha<=.001||state.form<=.0001||state.surface>=1)return true;
      gl.useProgram(program);gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.uniform2f(u.viewport,width,height);gl.uniform2f(u.center,state.x,state.y);
      for(const name of ['form','surface','alpha','scale','rotation','shimmer','brandMorph','shine'])gl.uniform1f(u[name],state[name]);
      gl.uniform1f(u.time,t);gl.uniform1f(u.dpr,dpr);gl.uniform1f(u.shape,state.shape==='knight'?0:state.shape==='eye'?1:state.shape==='gaze'?3:2);gl.uniform1f(u.redEye,state.redEye?1:0);gl.uniform1f(u.brandAspect,brandAspect);
      gl.bindVertexArray(vao);gl.drawArrays(gl.POINTS,0,gpuBudget);gl.bindVertexArray(null);return true;
    }
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();available=false;activeCount=cpuBudget;canvas.style.visibility='hidden';document.documentElement.dataset.lkParticles='canvas-2d';});
    canvas.addEventListener('webglcontextrestored',()=>{available=false;activeCount=cpuBudget;canvas.style.visibility='hidden';remember(new Error('Particle GPU context restored; stable 2D fallback retained until reload'));});
    upload();return{canvas,upload,clear,draw,available:()=>available};
  }
  try{gpuPoints=createPointRenderer();if(gpuPoints)activeCount=gpuBudget;}catch(error){remember(new Error('GPU particles unavailable: '+error.message));}
  document.documentElement.dataset.lkParticles=gpuPoints?'webgl2-points':'canvas-2d';
  const whenReady=Promise.allSettled([boot(),bootNav(),prepareTextures(),prepareBrand()]).then(()=>{lastDraw=-Infinity;lastNav=-Infinity;lastGPU=-Infinity;});

  function resize(){
    width=Math.max(1,innerWidth);height=Math.max(1,innerHeight);dpr=Math.min(devicePixelRatio||1,2);
    particleCanvas.width=Math.round(width*dpr);particleCanvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    if(gpuPoints){gpuPoints.canvas.width=particleCanvas.width;gpuPoints.canvas.height=particleCanvas.height;}
    if(navCanvas&&navContext){navCanvas.width=Math.round(48*dpr);navCanvas.height=Math.round(58*dpr);navContext.setTransform(dpr,0,0,dpr,0,0);}
    try{scene?.resize();}catch(error){usePoster(error);}try{navScene?.resize();}catch{}
    lastGPU=-Infinity;lastDraw=-Infinity;lastNav=-Infinity;
  }
  function drawNav(t){
    if(!navCanvas||t-lastNav<1/24&&t>=lastNav)return;lastNav=t;navAngle=-t*.32;navDraws++;
    if(navScene){try{navScene.render({eye:[0,1.5,-7.8],target:[0,1.5,0],fov:34,cameraRoll:0,form:1,instances:[{pos:[0,0,0],rot:[0,navAngle,0],scale:1.12,alpha:1,intensity:1.1}]},t);return;}catch{try{navScene.dispose();}catch{}navScene=null;navRenderer='unavailable';}}
    if(!navContext)return;
    navContext.clearRect(0,0,48,58);const co=Math.cos(navAngle),si=Math.sin(navAngle);
    // Dense projection of actual mesh samples, not a rotating flat image.
    for(let i=0;i<6000;i++){
      const o=i*8,px=surface[o],py=surface[o+1]-1.5,pz=surface[o+2],xx=px*co+pz*si,zz=-px*si+pz*co,k=75/(7.8+zz);
      const nz=-surface[o+3]*si+surface[o+5]*co;if(nz>.25)continue;
      navContext.globalAlpha=.38+Math.sqrt(surface[o+7])*.60;navContext.fillStyle=surface[o+7]>.55?'#ffe4a0':'#b98b38';navContext.fillRect(24-xx*k,29-py*k,.62,.62);
    }navContext.globalAlpha=1;
  }
  const rectangles=new Float32Array(gpuBudget*4),next=new Int32Array(gpuBudget),heads=new Int32Array(20);
  const colors=['#c28a36','#f5c961','#ffe5a0','#ed1238','#fff4c8'];
  function drawCPU(state,t){
    const{shape,form,alpha,x,y,rotation}=state,co=Math.cos(rotation),si=Math.sin(rotation),modelScale=state.scale*1.1,focal=height/(2*Math.tan(17*Math.PI/180));
    const rasterScale=(shape==='eye'?Math.min(width*.42,height*.50):Math.min(width*.72,height*.72))*state.scale;
    colors[3]=shape==='gaze'?'#ff0306':'#ed1238';
    heads.fill(-1);lastVisible=0;lastRed=0;lastShimmer=0;lastFlow=0;
    const count=shape==='gaze'?Math.min(gpuBudget,Math.round(cpuBudget*1.2)):cpuBudget;activeCount=count;
    for(let i=0;i<count;i++){
      const o=i*8,q=i*3,seed=surface[o+6];let tx,ty,light,normalZ=-1,iris=false;
      if(shape==='gaze'){
        const gw=Math.min(width*1.18,height*2.2)*state.scale,gh=gw*.465,bw=Math.min(width*.70,height*.65),breath=1+Math.sin(t*.85)*.008,b=state.brandMorph;
        tx=width*x+gazePoints[q]*gw*breath*(1-b)+brandPoints[i*2]*bw*b;
        ty=height*y-gazePoints[q+1]*gh*breath*(1-b)-brandPoints[i*2+1]*bw/brandAspect*b;light=gazePoints[q+2];iris=gazeIris(gazePoints[q],gazePoints[q+1]);
      }else if(shape==='knight'){
        const px=surface[o],py=surface[o+1]-1.45,pz=surface[o+2],xx=px*co+pz*si,zz=-px*si+pz*co,k=focal*modelScale/(7.8+zz*modelScale);
        normalZ=-surface[o+3]*si+surface[o+5]*co;tx=width*x-xx*k;ty=height*y+(-py+.05/modelScale)*k;light=surface[o+7];iris=Math.hypot((Math.abs(px)-.35)/.09,(py-.87)/.065)<1.3&&pz<-.05;
      }else{
        const points=shape==='eye'?eyePoints:facePoints,px=points[q],py=points[q+1];tx=width*x+px*rasterScale*Math.max(.4,Math.cos(rotation*.32));ty=height*y+(-py+px*Math.sin(rotation*.32)*.12)*rasterScale;light=Math.abs(points[q+2]);
        iris=shape==='eye'?points[q+2]<0:Math.hypot((Math.abs(px)-.29)/.055,(py-.16)/.038)<1.3;
      }
      const direction=shape==='knight'?clamp((surface[o+2]+1.1)/2.2):clamp(.5+tx/width*.3+seed*.2);
      const formed=shape==='gaze'?1:smooth((form-direction*.17-seed*.075)/.755),flight=1-formed,angle=seed*Math.PI*2+t*(.10+seed*.045)+flight*3.5,radius=movement[i*2];
      const sx=width*x+Math.cos(angle)*width*radius,sy=height*y+Math.sin(angle*.83)*height*radius*1.15;
      const phase=tx*.006+ty*.004-t*.65+seed*1.9,drift=.45+flight*movement[i*2+1]+Math.sin(state.brandMorph*Math.PI)*(22+seed*14);
      const dx=(-Math.sin(phase)+.35*Math.cos(phase*.73+t*.45))*drift,dy=(Math.cos(phase)+.35*Math.sin(phase*.81-t*.37))*drift;
      const px=sx*flight+tx*formed+dx+Math.sin(t*.91+seed*93)*(.3+flight*2.5),py=sy*flight+ty*formed+dy+Math.cos(t*.77+seed*71)*(.3+flight*2.5);
      const wave=.82+.18*Math.sin(t*1.4+tx*.007+ty*.005+seed*51),glint=Math.pow(Math.max(0,Math.sin(t*(1.5+seed*.6)+seed*733)),14)*state.shimmer;
      const material=shape==='knight'?.75+Math.sqrt(light)*.25:.82+Math.sqrt(light)*.18,facing=shape==='knight'?1-smooth((normalZ+.1)/.8)*.35:1;
      let a=alpha*smooth(form/.80)*(.65+.35*wave)*material*facing*Math.sqrt(1-state.surface)*(1+glint*.75);if(state.redEye&&iris)a*=1.4;
      if(shape==='eye')a*=(.14+.60*Math.pow(light,.65))*smooth(light/.10);
      if(shape==='gaze'){const limit=Math.min(.5,height*.19/(Math.min(width*1.18,height*2.2)*state.scale*.465));a*=.8*(1+state.shine*.4)*(1-smooth((Math.abs(gazePoints[q+1])-limit*.70)/(limit*.30))*(1-state.brandMorph));}
      const red=shape==='gaze'?state.redEye&&iris&&seed<1-smooth(state.brandMorph/.6):((shape!=='eye'&&i%20===0)||state.redEye&&iris),size=(seed<.7?.82+seed*.45:1.15+(seed-.7)*1.1)+glint*.62+(iris?.20:0)+(shape==='gaze'?.4+state.shine*.2:0);
      const grainScale=shape==='gaze'?clamp(width/700,1,1.8):shape==='eye'?.70:1;
      if(px<-4||px>width+4||py<-4||py>height+4||a<.025)continue;
      const color=red?3:glint>.65?4:light>.55?2:light>.18?1:0,bucket=color*4+Math.min(3,Math.floor(clamp(a)*4));
      const j=i*4;rectangles[j]=px;rectangles[j+1]=py;rectangles[j+2]=size*grainScale;rectangles[j+3]=size*grainScale;next[i]=heads[bucket];heads[bucket]=i;
      lastVisible++;if(red)lastRed++;if(glint>.65)lastShimmer++;lastFlow+=Math.hypot(dx,dy);
    }
    // Batch by material and four intensity bands instead of issuing tens of
    // thousands of style/alpha changes and fill operations every frame.
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let bucket=0;bucket<20;bucket++){
      if(heads[bucket]<0)continue;ctx.fillStyle=colors[Math.floor(bucket/4)];ctx.globalAlpha=(bucket%4+1)/4;ctx.beginPath();
      for(let i=heads[bucket];i>=0;i=next[i]){const j=i*4;ctx.rect(rectangles[j],rectangles[j+1],rectangles[j+2],rectangles[j+3]);}ctx.fill();
    }ctx.restore();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';if(lastVisible)lastFlow/=lastVisible;
  }
  function drawRedEye(state,focal,scale,opacity,co,si,t){
    for(const side of[-1,1]){
      const px=side*.35,py=.82,pz=-.34,xx=px*co+pz*si,zz=-px*si+pz*co,nz=-side*si-.45*co;if(nz>.05)continue;
      const k=focal*scale/(7.8+zz*scale),ph=height*.70*state.scale,pw=posterMatte?ph*posterMatte.width/posterMatte.height:ph*.833;
      const x=scene?width*state.x-xx*k:width*state.x+side*pw*.115,y=scene?height*state.y-py*k:height*state.y-ph*.269,radius=Math.max(1.5,height*.004*state.scale),pulse=.75+.25*Math.sin(t*2.1+side)*Math.sin(t*2.1+side);
      const gradient=ctx.createRadialGradient(x,y,0,x,y,radius*5);gradient.addColorStop(0,`rgba(255,105,65,${opacity*pulse})`);gradient.addColorStop(.18,`rgba(226,0,32,${opacity*.82})`);gradient.addColorStop(1,'rgba(213,0,28,0)');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,radius*5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=`rgba(255,65,40,${opacity})`;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.4,-.22,0,Math.PI*2);ctx.fill();
      for(let j=0;j<8;j++){const angle=t*.7+j*2.4,r=radius*(1+hash(j+side*9)*2);ctx.globalAlpha=opacity*(.35+.65*Math.sin(t*1.8+j)**2);ctx.fillStyle=j%3?'#ed1238':'#fff3cd';ctx.fillRect(x+Math.cos(angle)*r,y+Math.sin(angle)*r*.42,.65+hash(j+9),.65+hash(j+9));}ctx.globalAlpha=1;
    }
  }
  function render(input={},milliseconds=0){
    const form=clamp(finite(input.form,0)),solid=input.solid!==false;
    const state={shape:['knight','eye','face','gaze'].includes(input.shape)?input.shape:'knight',form,surface:solid?clamp(finite(input.surface,smooth((form-.94)/.06)))*smooth((form-.92)/.08):0,alpha:clamp(finite(input.alpha,0)),x:finite(input.x,.5),y:finite(input.y,.5),scale:clamp(finite(input.scale,1),.05,4),rotation:finite(input.rotation,-.38),solid,redEye:!!input.redEye,shimmer:clamp(finite(input.shimmer,1),0,2),brandMorph:clamp(finite(input.brandMorph,0)),shine:clamp(finite(input.shine,0))};
    if(state.shape!=='knight')state.surface=0;
    const changed=Object.keys(state).some(key=>state[key]!==last[key]),time=finite(milliseconds,0),t=time*.001;
    drawNav(t);if(!changed&&time-lastDraw<15&&time>=lastDraw)return;
    last=state;lastDraw=time;draws++;ctx.clearRect(0,0,width,height);
    const halo=state.shape==='gaze'?'drop-shadow(0 0 2px #e3aa3db3) drop-shadow(0 0 7px #dba4414a)':'none';particleCanvas.style.filter=halo;if(gpuPoints)gpuPoints.canvas.style.filter=halo;
    particleCanvas.style.opacity=state.alpha>.001&&form>0?'1':'0';
    const meshAlpha=state.shape==='knight'?state.alpha*Math.sqrt(state.surface):0;
    meshCanvas.style.transform=`translate(${(state.x-.5)*100}vw,${(state.y-.5)*100}vh)`;meshCanvas.style.opacity=scene&&renderer==='original-webgl2'?String(meshAlpha):'0';
    if(meshAlpha>.001&&scene&&(changed||time-lastGPU>=30||time<lastGPU)){
      try{scene.render({eye:[0,1.5,-7.8],target:[0,1.5,0],fov:34,cameraRoll:0,form:1,instances:[{pos:[0,0,0],rot:[0,state.rotation,0],scale:state.scale*1.1,alpha:1,intensity:1}]},t);lastGPU=time;}catch(error){usePoster(error);}
    }
    if(!scene&&meshAlpha>.001&&posterMatte){const ph=height*.70*state.scale,pw=ph*posterMatte.width/posterMatte.height;ctx.globalAlpha=meshAlpha;ctx.drawImage(posterMatte,width*state.x-pw/2,height*state.y-ph/2,pw,ph);ctx.globalAlpha=1;}
    let drawn=false;
    try{if(gpuPoints?.available())drawn=gpuPoints.draw(state,t);}catch(error){remember(new Error('Particle GPU draw failed: '+error.message));gpuPoints.canvas.style.visibility='hidden';gpuPoints=null;activeCount=cpuBudget;document.documentElement.dataset.lkParticles='canvas-2d';}
    if(!drawn&&state.alpha>.001&&form>.0001&&state.surface<1){activeCount=cpuBudget;drawCPU(state,t);}else if(!drawn){lastVisible=0;lastRed=0;lastShimmer=0;lastFlow=0;}
    if(state.redEye&&state.shape==='knight'&&form>.8){const focal=height/(2*Math.tan(17*Math.PI/180));drawRedEye(state,focal,state.scale*1.1,state.alpha*smooth((form-.8)/.2),Math.cos(state.rotation),Math.sin(state.rotation),t);}
    document.documentElement.dataset.renderer=renderer;
  }
  meshCanvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;usePoster(new Error('WebGL context lost; original poster fallback active'));});
  meshCanvas.addEventListener('webglcontextrestored',()=>{contextLost=false;void boot();});
  resize();
  root.LKScene={ready:true,whenReady,render,resize,setEyeView,inspect:()=>({renderer,particleRenderer:gpuPoints?.available()?'webgl2-points':'canvas-2d',originalMesh:true,eyeView,eyeIrisCount,eyeSourceResolution:eyeSource?.width||0,vertices:source.vertexCount,triangles:source.triangleCount,particles:activeCount,particleCapacity:gpuBudget,goldParticles:last.shape==='gaze'?activeCount-(last.redEye?gazeEyeCount*activeCount/gpuBudget*(1-smooth(last.brandMorph/.6)):0):activeCount*.95,redParticles:last.shape==='gaze'?(last.redEye?gazeEyeCount*activeCount/gpuBudget*(1-smooth(last.brandMorph/.6)):0):activeCount*.05,textureTargets,targetSources:{knight:'original-surface',eye:'original-side-high-resolution-detail',face:'original-front-texture-crop',gaze:'original-front-eye-band',brand:'LK-letterforms'},navRenderer,navAngle,navDraws,visibleParticles:gpuPoints?.available()?null:lastVisible,visibleRedParticles:gpuPoints?.available()?null:lastRed,shimmerGlints:gpuPoints?.available()?null:lastShimmer,meanFlowPixels:gpuPoints?.available()?null:lastFlow,draws,state:{...last},errors:[...errorList]})};
})();

;
