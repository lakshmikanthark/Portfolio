/* Only controlled event labels are measured. Never send form entries or mailto URLs. */
(() => {
  const config=window.LK_SETTINGS||{},id=config.ga4MeasurementId;
  const configured=/^G-[A-Z0-9]+$/.test(id||'')&&location.protocol==='https:';
  const blocked=navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true;
  let active=false,choice=null,script=null,vitalsStarted=false,initialized=false;
  try{choice=localStorage.getItem('lk-analytics-choice');}catch{}
  const panel=document.querySelector('#analytics-choice');
  document.querySelector('#analytics-preferences').hidden=!configured;
  function track(name,parameters={}){
    if(!active)return;
    const safe={};
    for(const key of ['project_id','section','service','placement','metric_name','metric_value','metric_rating']){
      const value=parameters[key];
      if(typeof value==='number'&&Number.isFinite(value))safe[key]=value;
      else if(typeof value==='string'&&/^[a-zA-Z0-9_ -]{1,60}$/.test(value))safe[key]=value;
    }
    window.gtag('event',name,safe);
  }
  function load(){
    if(active||!configured||blocked)return;
    active=true;window['ga-disable-'+id]=false;if(initialized)return;initialized=true;window.dataLayer=window.dataLayer||[];
    window.gtag=function(){dataLayer.push(arguments);};
    gtag('js',new Date());
    gtag('config',id,{send_page_view:true,allow_google_signals:false,allow_ad_personalization_signals:false,
      page_location:location.origin+location.pathname,page_referrer:document.referrer?new URL(document.referrer).origin:''});
    script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.append(script);
    if(!vitalsStarted&&window.webVitals){
      vitalsStarted=true;
      const report=metric=>track('web_vital',{metric_name:metric.name,metric_value:metric.name==='CLS'?Math.round(metric.value*1000)/1000:Math.round(metric.value),metric_rating:metric.rating});
      webVitals.onLCP(report);webVitals.onCLS(report);webVitals.onINP(report);
    }
  }
  function select(value){
    choice=value;try{localStorage.setItem('lk-analytics-choice',value);}catch{}
    panel.hidden=true;
    if(value==='allow')load();
    else if(active){
      window['ga-disable-'+id]=true;active=false;script?.remove();
      // Remove first-party GA cookies for this host and parent domain after withdrawal.
      const domains=['',location.hostname,'.'+location.hostname];
      for(const cookie of document.cookie.split(';')){
        const name=cookie.split('=')[0].trim();if(!name.startsWith('_ga'))continue;
        for(const domain of domains)document.cookie=name+'=; Max-Age=0; path=/'+(domain?'; domain='+domain:'');
      }
    }
  }
  document.querySelectorAll('[data-analytics-choice]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.analyticsChoice)));
  document.querySelector('#analytics-preferences').addEventListener('click',()=>{
    if(!configured||blocked){window.LKUI?.toast(blocked?'Analytics is disabled by your browser privacy preference.':'Visitor analytics has not been connected yet.');return;}
    document.querySelector('#privacy-dialog').close();
    panel.hidden=false;requestAnimationFrame(()=>panel.querySelector('button').focus({preventScroll:true}));
  });
  if(configured&&!blocked){if(choice==='allow')load();else if(choice!=='decline')panel.hidden=false;}
  document.addEventListener('click',event=>{
    const target=event.target.closest('a,button');if(!target)return;
    if(target.matches('[data-event="resume_download"]'))track('resume_click',{placement:target.closest('#menu')?'menu':target.closest('.footer')?'footer':'page'});
    else if(target.id==='motion-toggle')track('motion_toggle',{placement:target.getAttribute('aria-pressed')==='true'?'paused':'playing'});
    else if(target.matches('[data-enquire]'))track('quote_click',{service:target.dataset.enquire});
    else if(target.matches('a[href^="mailto:"]'))track('contact_click',{placement:target.closest('#menu')?'menu':'page'});
    else if(target.closest('.project-actions,.detail-links,.experiment-panel')){
      const project=target.closest('[id^="project-"]')?.id.replace('project-','')||target.closest('.experiment-panel')?.id.replace('experiment-','')||target.closest('dialog')?.dataset.projectId||'details';
      track(target.matches('[data-details]')?'project_details':'project_open',{project_id:target.dataset.details||project});
    }
  });
  const seen=new Set();
  window.addEventListener('lk:chapter',event=>{const section=event.detail?.section;if(section&&!seen.has(section)){seen.add(section);track('section_view',{section});}});
  window.LKAnalytics={track,inspect:()=>({configured,active,blocked,choice})};
})();
