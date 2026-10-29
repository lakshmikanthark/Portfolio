
/* Real website recordings; still images remain available as accessible fallbacks. */
(() => {
  const projects = window.LK_CONTENT?.projects || [];
  const experiments = window.LK_CONTENT?.experiments || [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const entries = [];
  let queued = false;
  let detailVideo = null;

  function showRecording(entry, playing) {
    entry.video.classList.toggle('is-playing', playing);
    entry.box.classList.toggle('is-preview-playing', playing);
  }

  const motionPaused = () => document.documentElement.classList.contains('motion-paused');
  const allowed = section => !reduced.matches && !connection?.saveData && !motionPaused() && !document.hidden &&
    !document.querySelector('dialog[open]') &&
    (!document.documentElement.dataset.chapter || document.documentElement.dataset.chapter === section);

  function source(entry) {
    if (entry.video.src) return;
    if(!entry.recording.startsWith('data:')){entry.video.preload='metadata';entry.video.src=entry.recording;return;}
    const [header, encoded] = entry.recording.split(',');
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    entry.video.preload = 'metadata';
    entry.video.src = URL.createObjectURL(new Blob([bytes], { type: header.slice(5).split(';')[0] }));
  }

  function update() {
    queued = false;
    if (detailVideo && (document.hidden || reduced.matches || motionPaused() || !detailVideo.closest('dialog[open]'))) detailVideo.pause();
    const projectWindow = document.querySelector('.project-window');
    const workVisible = !projectWindow || Number(getComputedStyle(projectWindow).opacity) > .15;
    const candidates=entries.filter(entry=>allowed(entry.section)&&(entry.section!=='work'||workVisible)&&entry.ratio>.001&&!entry.failed&&getComputedStyle(entry.box).visibility!=='hidden');
    const area=entry=>{const r=entry.box.getBoundingClientRect();return Math.min(r.width,innerWidth)*Math.min(r.height,innerHeight)*entry.ratio;};
    const playing=new Set(candidates.sort((a,b)=>area(b)-area(a)).slice(0,2));
    entries.forEach(entry => {
      const available = allowed(entry.section) && (entry.section !== 'work' || workVisible) && getComputedStyle(entry.box).visibility !== 'hidden';
      if(available && entry.near && !entry.failed) source(entry);
      entry.wanted = playing.has(entry);
      if (!entry.wanted) {
        if (!entry.video.paused) entry.video.pause();
        showRecording(entry, false);
        return;
      }
      source(entry);
      if (entry.video.paused && !entry.pending) {
        entry.pending = true;
        entry.video.play().catch(() => {}).finally(() => { entry.pending = false; });
      }
    });
  }

  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }

  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(changes => {
    changes.forEach(change => {
      const entry = entries.find(item => item.box === change.target);
      if (entry) entry.ratio = change.isIntersecting ? change.intersectionRatio : 0;
    });
    schedule();
  }, { threshold: [0, .001, .01, .15, .35, .75, 1] });

  const preloader = new IntersectionObserver(changes => {
    changes.forEach(change => { const entry=entries.find(item=>item.box===change.target);if(entry)entry.near=change.isIntersecting; });schedule();
  }, {rootMargin:'0px 30% 0px 30%',threshold:0});

  [...projects, ...experiments].forEach(project => {
    const isExperiment=experiments.includes(project);
    const box = document.querySelector(isExperiment ? `#experiment-${project.id} .preview` : `#project-${project.id} .project-image`);
    if (!box || !project.previewVideo) return;
    const video = document.createElement('video');
    video.className = 'project-preview-video';
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'none';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('tabindex', '-1');
    video.setAttribute('disablepictureinpicture', '');
    const entry = { id: project.id, name: project.name, section:isExperiment?'afterhours':'work', near:false, video, box, recording: project.previewVideo, ratio: 0, pending: false, failed: false };
    video.addEventListener('playing', () => {
      if (entry.wanted && allowed(entry.section) && entry.ratio > .001) showRecording(entry, true);
      else { video.pause(); schedule(); }
    });
    video.addEventListener('pause', () => showRecording(entry, false));
    video.addEventListener('error', () => { entry.failed = true; showRecording(entry, false); schedule(); });
    entries.push(entry);
    box.append(video);
    observer.observe(box);
    preloader.observe(box);
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-details]');
    if (!button || reduced.matches || connection?.saveData || motionPaused()) return;
    const entry = entries.find(item => item.id === button.dataset.details);
    const image = document.querySelector('#details-content .details-visual');
    if (!entry || !image || entry.failed) return;
    detailVideo?.pause();
    const video = document.createElement('video');
    video.className = 'details-visual details-preview-video';
    video.controls = true;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.poster = image.src;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', `15-second website walkthrough: ${entry.name}`);
    source(entry);
    video.src = entry.video.src;
    video.addEventListener('error', () => { video.replaceWith(image); });
    image.replaceWith(video);
    detailVideo = video;
    const note = document.querySelector('#details-content .detail-visual-note');
    if (note) note.textContent = entry.id === 'seony' ? '15-second sample-audit walkthrough · illustrative data · muted' : '15-second website walkthrough · muted';
    video.play().catch(() => {});
    schedule();
  });

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('lk:chapter', schedule);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      entries.forEach(entry => entry.video.pause());
      detailVideo?.pause();
    } else schedule();
  });
  reduced.addEventListener('change', schedule);
  connection?.addEventListener?.('change', schedule);
  let wasPaused=motionPaused();
  new MutationObserver(() => {const paused=motionPaused();if(paused!==wasPaused){wasPaused=paused;schedule();}}).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  const dialogs = new MutationObserver(schedule);
  document.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
  const projectWindow = document.querySelector('.project-window');
  if (projectWindow) {
    let opacity = projectWindow.style.opacity;
    new MutationObserver(() => {
      if (projectWindow.style.opacity !== opacity) {
        opacity = projectWindow.style.opacity;
        schedule();
      }
    }).observe(projectWindow, { attributes: true, attributeFilter: ['style'] });
  }
  schedule();
})();

