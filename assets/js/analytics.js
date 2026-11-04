/* Only controlled event labels are measured. Never send form entries or mailto URLs. */
(() => {
  const config=window.LK_SETTINGS||{},id=config.ga4MeasurementId;
  const configured=/^G-[A-Z0-9]+$/.test(id||'')&&location.protocol==='https:'&&['lakshmikantha.in','www.lakshmikantha.in'].includes(location.hostname);
  const privacyReason=()=>navigator.globalPrivacyControl===true?'Global Privacy Control':navigator.doNotTrack==='1'?'Do Not Track':'';
  let active=false,choice=null,script=null,vitalsStarted=false,initialized=false,pageViewed=false,tagState='idle',focusSource=null,saved=true;
  const seen=new Set();
  try{choice=localStorage.getItem('lk-analytics-choice');}catch{}
  const panel=document.querySelector('#analytics-choice');
  const preferences=document.querySelector('#analytics-preferences');
  const allow=panel.querySelector('[data-analytics-choice="allow"]'),decline=panel.querySelector('[data-analytics-choice="decline"]');
  const status=document.querySelector('#analytics-status'),help=document.querySelector('#analytics-help');
  preferences.hidden=false;
  function render(){
    const reason=privacyReason();
    status.textContent=reason?'Analytics is off — your browser sends '+reason+'.':!configured?'Analytics is off in this preview.':choice==='decline'?'Analytics is off by your choice.':tagState==='error'?'Google Analytics could not connect.':active?(tagState==='ready'?'Analytics is enabled in this browser.':'Connecting to Google Analytics…'):'Analytics stays off until you choose.';
    help.textContent=reason?'This site honours that preference. To allow analytics, change '+reason+' in your browser privacy settings, then reload this page.':!configured?'You can review these preferences here. Google tracking runs only on lakshmikantha.in.':tagState==='error'&&choice!=='decline'?'Your browser, an extension or the network may be blocking the connection. You can try again or keep analytics off.':!saved?'Your browser could not save this choice. It applies only to this page.':'';
    help.hidden=!help.textContent;
    allow.disabled=!configured||!!reason||active;
    allow.textContent=active?(tagState==='ready'?'Analytics allowed':'Connecting…'):tagState==='error'?'Try again':'Allow analytics';
    decline.textContent=active?'Turn analytics off':'Keep analytics off';
  }
  function closePanel(){panel.hidden=true;focusSource?.focus({preventScroll:true});}
  function openPanel(){
    const privacy=document.querySelector('#privacy-dialog');
    focusSource=privacy?.open?document.querySelector('#privacy-toggle'):document.activeElement;
    privacy?.close();if(privacyReason()&&active)stop();render();panel.hidden=false;
    requestAnimationFrame(()=>document.querySelector('#analytics-close').focus({preventScroll:true}));
  }
  function track(name,parameters={}){
    if(!active||privacyReason())return false;
    const safe={};
    for(const key of ['project_id','section','service','placement','metric_name','metric_value','metric_rating']){
      const value=parameters[key];
      if(typeof value==='number'&&Number.isFinite(value))safe[key]=value;
      else if(typeof value==='string'&&/^[a-zA-Z0-9_ -]{1,60}$/.test(value))safe[key]=value;
    }
    window.gtag('event',name,safe);
    return true;
  }
  function sectionView(section=document.documentElement.dataset.chapter){
    if(tagState==='ready'&&section&&!seen.has(section)&&track('section_view',{section}))seen.add(section);
  }
  function pageView(){
    if(tagState==='ready'&&!pageViewed&&track('page_view'))pageViewed=true;
  }
  function load(){
    if(active||!configured||privacyReason()||choice!=='allow'){render();return;}
    active=true;window['ga-disable-'+id]=false;
    if(initialized)gtag('consent','update',{analytics_storage:'granted'});
    else{
    initialized=true;window.dataLayer=window.dataLayer||[];
    window.gtag=function(){dataLayer.push(arguments);};
    gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    gtag('consent','update',{analytics_storage:'granted'});
    gtag('js',new Date());
    gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,
      page_location:location.origin+location.pathname,page_referrer:document.referrer?new URL(document.referrer).origin:''});
    }
    function startVitals(){
      if(vitalsStarted||!active||privacyReason())return;
      vitalsStarted=true;
      const vitals=document.createElement('script');
      vitals.src='/assets/js/web-vitals.js';
      vitals.onload=()=>{
        const report=metric=>track('web_vital',{metric_name:metric.name,metric_value:metric.name==='CLS'?Math.round(metric.value*1000)/1000:Math.round(metric.value),metric_rating:metric.rating});
        webVitals.onLCP(report);webVitals.onCLS(report);webVitals.onINP(report);
      };
      document.head.append(vitals);
    }
    if(tagState==='idle'||tagState==='error'){
      script?.remove();tagState='loading';
      script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+id;
      script.onload=()=>{tagState='ready';pageView();sectionView();startVitals();render();};
      script.onerror=()=>{tagState='error';active=false;window['ga-disable-'+id]=true;gtag('consent','update',{analytics_storage:'denied'});render();};
      document.head.append(script);
    }else if(tagState==='ready')startVitals();
    pageView();sectionView();
    render();
  }
  function stop(){
      window['ga-disable-'+id]=true;active=false;
      if(initialized)gtag('consent','update',{analytics_storage:'denied'});
      // Remove first-party GA cookies for this host and parent domain after withdrawal.
      const domains=['',location.hostname,'.'+location.hostname,'.lakshmikantha.in'];
      for(const cookie of document.cookie.split(';')){
        const name=cookie.split('=')[0].trim();if(!name.startsWith('_ga'))continue;
        for(const domain of domains)document.cookie=name+'=; Max-Age=0; path=/'+(domain?'; domain='+domain:'');
      }
  }
  function select(value){
    if(value==='allow'&&(!configured||privacyReason())){render();return;}
    choice=value;try{localStorage.setItem('lk-analytics-choice',value);saved=true;}catch{saved=false;}
    if(value==='allow')load();else stop();
    render();
  }
  document.querySelectorAll('[data-analytics-choice]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.analyticsChoice)));
  preferences.addEventListener('click',openPanel);
  document.querySelector('#analytics-close').addEventListener('click',closePanel);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!panel.hidden&&panel.contains(document.activeElement)){event.preventDefault();closePanel();}
  });
  window.addEventListener('storage',event=>{
    if(event.key!==null&&event.key!=='lk-analytics-choice')return;
    choice=event.newValue;if(choice==='allow')load();else stop();render();
  });
  if(configured&&!privacyReason()){if(choice==='allow')load();else if(choice!=='decline')panel.hidden=false;}
  render();
  document.addEventListener('click',event=>{
    const target=event.target.closest('a,button');if(!target)return;
    if(target.matches('[data-event="resume_download"]'))track('resume_click',{placement:target.closest('#menu')?'menu':target.closest('.footer')?'footer':'page'});
    else if(target.matches('[data-enquire]'))track('quote_click',{service:target.dataset.enquire});
    else if(target.matches('a[href^="mailto:"]'))track('contact_click',{placement:target.closest('#menu')?'menu':'page'});
    else if(target.matches('[data-project-open]')||target.closest('.project-actions,.detail-links,.experiment-panel')){
      const project=target.dataset.projectOpen||target.closest('[id^="project-"]')?.id.replace('project-','')||target.closest('.experiment-panel')?.id.replace('experiment-','')||target.closest('dialog')?.dataset.projectId||'details';
      track(target.matches('[data-details]')?'project_details':'project_open',{project_id:target.dataset.details||project});
    }
  });
  window.addEventListener('lk:chapter',event=>sectionView(event.detail?.section));
  window.LKAnalytics={track,inspect:()=>({configured,active,blocked:!!privacyReason(),reason:privacyReason(),choice,tagState})};
})();
