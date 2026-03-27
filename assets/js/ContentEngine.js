/**
 * ContentEngine.js — AI Coding Academy v4.0.0
 * library.myrqai.com
 *
 * Loads MasterLibrary.json once, caches all 50 lessons.
 * Single router: ?id=<lessonId>&type=lesson|project
 * Sidebar sticky, ⌘K search, AdSense slot injection,
 * 4-tier TrackIndex for tutorials/index.html.
 */
'use strict';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CE_CONFIG={
  masterLibraryUrl:'/assets/data/MasterLibrary.json',
  projectsUrl:'/assets/data/projects.json',
  storageKey:'ace_progress_v4',
  version:'4.0.0'
};

// ─── ROUTER ───────────────────────────────────────────────────────────────────
const Router={
  params:null,
  init(){this.params=new URLSearchParams(window.location.search);return this;},
  get(k){return this.params?this.params.get(k):null;},
  async dispatch(){
    const id=this.get('id'), type=this.get('type')||'lesson';
    if(!id){Renderer.showError('No content ID supplied.');return;}
    Renderer.showSkeleton();
    try{
      const data=type==='project'?await Library.findProject(id):await Library.findLesson(id);
      if(!data){Renderer.showError(`Content "${id}" not found.`);return;}
      if(type==='project'){Renderer.renderProject(data);}
      else{Renderer.renderLesson(data);Sidebar.init(data);}
      Progress.markVisited(id);
    }catch(err){console.error('[CE]',err);Renderer.showError('Failed to load content.');}
  }
};

// ─── LIBRARY LOADER ───────────────────────────────────────────────────────────
const Library={
  _ml:null,_projects:null,_loading:null,

  async load(){
    if(this._ml)return this._ml;
    if(this._loading)return this._loading;
    this._loading=fetch(CE_CONFIG.masterLibraryUrl)
      .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();})
      .then(d=>{this._ml=d;this._loading=null;
        console.log(`[CE] MasterLibrary loaded — ${this.countLessons()} lessons`);
        return d;});
    return this._loading;
  },

  async loadProjects(){
    if(this._projects)return this._projects;
    try{const r=await fetch(CE_CONFIG.projectsUrl);if(!r.ok)throw 0;
      this._projects=await r.json();}catch{this._projects=[];}
    return this._projects;
  },

  async findLesson(id){
    const ml=await this.load();
    for(const t of ml.tracks){
      const l=t.lessons.find(x=>x.id===id);
      if(l)return{...l,trackId:t.id,trackTitle:t.title,trackTier:t.tier,trackColor:t.color,trackIcon:t.icon};
    }
    return null;
  },

  async findProject(id){
    const p=await this.loadProjects();return p.find(x=>x.id===id)||null;
  },

  async getAllLessons(){
    const ml=await this.load();
    return ml.tracks.flatMap(t=>t.lessons.map(l=>({...l,trackId:t.id,trackTitle:t.title,trackTier:t.tier})));
  },

  countLessons(){return this._ml?this._ml.tracks.reduce((s,t)=>s+t.lessons.length,0):0;},

  async search(query){
    const q=query.toLowerCase(),lessons=await this.getAllLessons();
    return lessons.filter(l=>
      l.title.toLowerCase().includes(q)||l.desc.toLowerCase().includes(q)||
      l.sections.some(s=>s.h2.toLowerCase().includes(q)||(s.body||'').toLowerCase().includes(q)));
  }
};

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
const Progress={
  _data:null,
  load(){if(this._data)return this._data;
    try{this._data=JSON.parse(localStorage.getItem(CE_CONFIG.storageKey)||'{}');}
    catch{this._data={};}return this._data;},
  save(){try{localStorage.setItem(CE_CONFIG.storageKey,JSON.stringify(this._data));}
    catch{console.warn('[Progress] localStorage write failed');}},
  markVisited(id){const d=this.load();if(!d[id]){d[id]={visited:true,visitedAt:Date.now()};this.save();}this._updateUI();},
  markComplete(id){const d=this.load();d[id]={...d[id],complete:true,completedAt:Date.now()};
    this.save();this._updateUI();this._celebrate();},
  isComplete(id){return!!this.load()[id]?.complete;},
  getCompletedIds(){return Object.entries(this.load()).filter(([,v])=>v.complete).map(([k])=>k);},
  getCount(){return this.getCompletedIds().length;},
  _updateUI(){
    document.querySelectorAll('[data-progress-count]').forEach(el=>el.textContent=this.getCount());
    this.getCompletedIds().forEach(id=>document.querySelectorAll(`[data-lesson-id="${id}"]`)
      .forEach(el=>el.classList.add('ce-done')));
  },
  _celebrate(){
    const b=document.createElement('div');
    b.textContent='🎉 Lesson complete!';
    Object.assign(b.style,{position:'fixed',bottom:'2rem',right:'2rem',
      background:'var(--accent-primary)',color:'#07080a',padding:'1rem 1.5rem',
      borderRadius:'12px',fontFamily:'var(--font-heading)',fontWeight:'700',
      fontSize:'1rem',zIndex:'9999',boxShadow:'0 8px 32px rgba(0,255,170,.4)'});
    document.body.appendChild(b);setTimeout(()=>b.remove(),3500);
  }
};

// ─── HIGHLIGHTER ──────────────────────────────────────────────────────────────
const Highlighter={
  highlight(src){
    if(!src)return'';
    let h=src.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return h
      .replace(/(#[^\n]*)/g,'<span class="cm">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*")/g,'<span class="st">$1</span>')
      .replace(/('(?:[^'\\]|\\.)*')/g,'<span class="st">$1</span>')
      .replace(/\b(import|from|as|def|class|return|if|elif|else|for|in|while|not|and|or|True|False|None|with|try|except|raise|async|await|yield|lambda|pass|break|continue|global|self)\b/g,'<span class="kw">$1</span>')
      .replace(/\b([a-z_][a-z0-9_]*)(?=\s*\()/g,'<span class="fn">$1</span>')
      .replace(/\b([A-Z][A-Za-z0-9_]+)\b/g,'<span class="cl">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g,'<span class="nu">$1</span>');
  }
};

// ─── RENDERER ─────────────────────────────────────────────────────────────────
const Renderer={
  showSkeleton(){
    const body=document.getElementById('ce-body');if(!body)return;
    body.innerHTML=`<div class="lesson-content" style="padding:2rem">
      ${Array(5).fill('<div class="ce-sk"></div>').join('')}
      <div class="ce-sk" style="height:160px;margin-top:1rem"></div></div>`;
    if(!document.getElementById('ce-sk-css')){
      const s=document.createElement('style');s.id='ce-sk-css';
      s.textContent='.ce-sk{background:linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.03) 75%);background-size:200% 100%;animation:cesk 1.5s infinite;border-radius:6px;height:1rem;margin-bottom:.75rem}@keyframes cesk{0%{background-position:200% 0}100%{background-position:-200% 0}}';
      document.head.appendChild(s);}},

  showError(msg){
    document.title='Content Not Found | AI Coding Academy';
    const body=document.getElementById('ce-body');
    if(body)body.innerHTML=`<div class="lesson-content" style="text-align:center;padding:4rem 2rem">
      <div style="font-size:4rem;margin-bottom:1rem">🔍</div>
      <h2 style="color:var(--accent-warning)">Content Not Found</h2>
      <p style="color:var(--text-secondary);margin:1rem 0">${msg}</p>
      <a href="/tutorials/index.html" class="btn btn-primary" style="display:inline-block;margin-top:2rem">Browse All Tutorials →</a></div>`;},

  _cb(code){
    if(!code)return'';
    return`<div class="code-block"><div class="code-block-label"><span>${code.label||'Code'}</span>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('pre').innerText).then(()=>{this.textContent='Copied ✓';setTimeout(()=>this.textContent='Copy',1600)})">Copy</button></div>
      <pre>${Highlighter.highlight(code.src)}</pre></div>`;},

  _tip(t){return t?`<div class="tip-box"><div class="tip-box-title">💡 Pro Tip</div><p>${t}</p></div>`:'';},

  _exercise(e){
    if(!e)return'';
    const steps=(e.steps||[]).map(s=>`<li>${s}</li>`).join('');
    return`<div class="exercise-box">
      <div class="exercise-box-title">🏋️ Exercise: ${e.title||'Practice'}</div>
      <p>${e.description||''}</p>
      ${steps?`<ol>${steps}</ol>`:''}
      ${e.hint?`<details class="exercise-hint"><summary>Hint</summary><p>${e.hint}</p></details>`:''}
    </div>`;},

  _sections(sections){
    return(sections||[]).map(s=>`
      <div class="lesson-content">
        <h2>${s.h2}</h2>
        <p>${(s.body||'').replace(/\n/g,'<br>')}</p>
        ${this._tip(s.tip||'')}
        ${this._cb(s.code||null)}
        ${this._cb(s.code2||null)}
        ${this._exercise(s.exercise||null)}
      </div>`).join('');},

  renderLesson(data){
    document.title=`${data.title} | AI Coding Academy`;
    const md=document.querySelector('meta[name="description"]');
    if(md)md.content=data.desc;
    const bc=document.getElementById('ce-breadcrumb');
    if(bc)bc.innerHTML=`<a href="/">Home</a><span class="separator">/</span>
      <a href="/tutorials/index.html">Tutorials</a><span class="separator">/</span>
      <a href="/tutorials/index.html#tier-${data.trackTier}">${data.trackTitle||''}</a><span class="separator">/</span>
      <span>${data.title}</span>`;
    const hdr=document.getElementById('ce-header');
    if(hdr)hdr.innerHTML=`<div class="lesson-meta">
      <span class="badge badge-${(data.badge||'beginner').toLowerCase()}">${data.badge||'Beginner'}</span>
      <span class="lesson-meta-item">⏱️ ${data.duration||'30 min'}</span>
      ${Progress.isComplete(data.id)?'<span class="lesson-meta-item" style="color:var(--accent-success)">✅ Completed</span>':''}
    </div>
    <h1 class="lesson-title">${data.title}</h1>
    <p class="lesson-description">${data.desc}</p>`;
    const body=document.getElementById('ce-body');
    if(body)body.innerHTML=this._sections(data.sections);
    const nav=document.getElementById('ce-lesson-nav');
    if(nav)nav.innerHTML=`
      ${data.prev?`<a href="?id=${data.prev}&type=lesson" class="prev">
        <div class="lesson-nav-label">← Previous</div>
        <div class="lesson-nav-title" id="ce-pt">…</div></a>`:'<span></span>'}
      <button class="btn btn-primary" id="ce-mark-done"
        onclick="Progress.markComplete('${data.id}');document.getElementById('ce-mark-done').textContent='✅ Done!';document.getElementById('ce-mark-done').disabled=true">
        ${Progress.isComplete(data.id)?'✅ Completed':'Mark Complete'}</button>
      ${data.next?`<a href="?id=${data.next}&type=lesson" class="next">
        <div class="lesson-nav-label">Next →</div>
        <div class="lesson-nav-title" id="ce-nt">…</div></a>`:'<span></span>'}`;
    if(data.prev)Library.findLesson(data.prev).then(l=>{const e=document.getElementById('ce-pt');if(e&&l)e.textContent=l.title;});
    if(data.next)Library.findLesson(data.next).then(l=>{const e=document.getElementById('ce-nt');if(e&&l)e.textContent=l.title;});
    this._adSlot('ce-body');},

  renderProject(data){
    document.title=`${data.title} | Projects | AI Coding Academy`;
    const hdr=document.getElementById('ce-header');
    if(hdr)hdr.innerHTML=`<div class="lesson-meta">
      <span class="badge badge-${(data.difficulty||'advanced').toLowerCase()}">${data.difficulty||'Advanced'}</span>
      <span class="lesson-meta-item">⏱️ ${data.duration}</span>
      <span class="lesson-meta-item">📦 Tier ${data.tier}</span></div>
      <h1 class="lesson-title">${data.title}</h1>
      <p class="lesson-description">${data.desc}</p>
      <div class="stack-tags">${(data.stack||[]).map(s=>`<span class="stack-tag">${s}</span>`).join('')}</div>`;
    const body=document.getElementById('ce-body');
    if(body)body.innerHTML=this._sections(data.sections);
    this._adSlot('ce-body');},

  _adSlot(cid){
    const c=document.getElementById(cid);if(!c)return;
    const secs=c.querySelectorAll('.lesson-content');if(secs.length<2)return;
    const ad=document.createElement('div');ad.style.cssText='margin:1.5rem 0;text-align:center';
    ad.innerHTML=`<ins class="adsbygoogle" style="display:block"
      data-ad-client="ca-pub-8668540803235423" data-ad-slot="auto"
      data-ad-format="auto" data-full-width-responsive="true"></ins>
      <script>(adsbygoogle=window.adsbygoogle||[]).push({});<\/script>`;
    secs[1].after(ad);}
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const Sidebar={
  async init(lesson){
    const sb=document.getElementById('ce-sidebar');if(!sb)return;
    const ml=await Library.load();
    const track=ml.tracks.find(t=>t.lessons.some(l=>l.id===lesson.id));
    if(!track)return;
    const done=track.lessons.filter(l=>Progress.isComplete(l.id)).length;
    const pct=track.lessons.length?Math.round(done/track.lessons.length*100):0;
    sb.innerHTML=`<div class="sidebar-track-title" style="color:${track.color||'var(--accent-primary)'}">${track.icon} ${track.title}</div>
      <div class="sidebar-progress-bar"><div class="sidebar-progress-fill" style="width:${pct}%;background:${track.color||'var(--accent-primary)'}"></div></div>
      <div class="sidebar-progress-label">${pct}% complete</div>
      <ul class="sidebar-lessons">${track.lessons.map(l=>`
        <li class="sidebar-lesson ${l.id===lesson.id?'active':''} ${Progress.isComplete(l.id)?'ce-done':''}" data-lesson-id="${l.id}">
          <a href="?id=${l.id}&type=lesson">
            <span class="sidebar-check">${Progress.isComplete(l.id)?'✅':'○'}</span>
            <span class="sidebar-lesson-title">${l.title}</span>
            <span class="sidebar-lesson-dur">${l.duration}</span>
          </a></li>`).join('')}</ul>`;
    const fix=()=>{sb.style.maxHeight=`${window.innerHeight-130}px`;sb.style.overflowY='auto';};
    fix();window.addEventListener('resize',fix);
  }
};

// ─── SEARCH ───────────────────────────────────────────────────────────────────
const Search={
  modal:null,
  init(){
    document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();this.open();}});
    document.querySelectorAll('.nav-search input').forEach(i=>i.addEventListener('focus',()=>this.open()));},
  open(){
    if(this.modal){this.modal.remove();this.modal=null;}
    this.modal=document.createElement('div');this.modal.id='ce-sm';
    this.modal.innerHTML=`<div class="ce-sb2"></div><div class="ce-sbox2">
      <input id="ce-si2" type="text" placeholder="Search 50+ tutorials…" autocomplete="off">
      <div id="ce-sr2"></div><div class="ce-sh2">↑↓ navigate · ↵ open · esc close</div></div>`;
    this._css();document.body.appendChild(this.modal);
    const inp=document.getElementById('ce-si2'),res=document.getElementById('ce-sr2');
    inp.focus();
    inp.addEventListener('input',async()=>{
      const q=inp.value.trim();if(q.length<2){res.innerHTML='';return;}
      const hits=(await Library.search(q)).slice(0,9);
      res.innerHTML=hits.length?hits.map(h=>`
        <a href="/learn/lesson.html?id=${h.id}&type=lesson" class="ce-sri2">
          <span class="ce-sri-badge badge-${(h.badge||'beginner').toLowerCase()}">${h.badge||'Beginner'}</span>
          <span style="flex:1;color:var(--text-primary);font-size:.95rem">${h.title}</span>
          <span style="font-size:.72rem;color:var(--text-muted);font-family:var(--font-mono)">${h.trackId}</span>
        </a>`).join(''):`<div style="padding:1.5rem;text-align:center;color:var(--text-muted);font-style:italic">No results for "${q}"</div>`;});
    this.modal.querySelector('.ce-sb2').addEventListener('click',()=>this.close());
    document.addEventListener('keydown',e=>e.key==='Escape'&&this.close(),{once:true});},
  close(){if(this.modal){this.modal.remove();this.modal=null;}},
  _css(){
    if(document.getElementById('ce-s-css'))return;
    const s=document.createElement('style');s.id='ce-s-css';
    s.textContent=`#ce-sm{position:fixed;inset:0;z-index:10000}
    .ce-sb2{position:absolute;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(5px)}
    .ce-sbox2{position:relative;max-width:650px;margin:8vh auto 0;background:var(--bg-card);
      border:1px solid rgba(0,255,170,.25);border-radius:16px;overflow:hidden;
      box-shadow:0 24px 60px rgba(0,0,0,.6)}
    #ce-si2{width:100%;padding:1.2rem 1.5rem;background:transparent;border:none;
      color:var(--text-primary);font-size:1.1rem;font-family:var(--font-mono);outline:none}
    .ce-sri2{display:flex;align-items:center;gap:.75rem;padding:.7rem 1.5rem;
      text-decoration:none;border-top:1px solid rgba(255,255,255,.04);transition:background .15s}
    .ce-sri2:hover{background:rgba(0,255,170,.06)}
    .ce-sri-badge{font-size:.62rem;padding:2px 8px;border-radius:20px;font-weight:700;
      text-transform:uppercase;flex-shrink:0}
    .badge-beginner{background:rgba(0,255,170,.15);color:var(--accent-primary)}
    .badge-intermediate{background:rgba(251,191,36,.15);color:var(--accent-warning)}
    .badge-advanced{background:rgba(168,85,247,.15);color:var(--accent-tertiary)}
    .badge-expert{background:rgba(239,68,68,.15);color:var(--accent-error)}
    .ce-sh2{padding:.5rem 1.5rem;font-size:.72rem;color:var(--text-muted);
      font-family:var(--font-mono);border-top:1px solid rgba(255,255,255,.05)}`;
    document.head.appendChild(s);}
};

// ─── TRACK INDEX ──────────────────────────────────────────────────────────────
const TrackIndex={
  async render(cid='ce-track-index'){
    const c=document.getElementById(cid);if(!c)return;
    c.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem">
      ${Array(4).fill('<div style="height:280px;background:var(--bg-card);border-radius:16px"></div>').join('')}</div>`;
    this._css();
    try{
      const ml=await Library.load();
      c.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.75rem">
        ${ml.tracks.map(t=>this._card(t)).join('')}</div>`;
    }catch{c.innerHTML='<p style="color:var(--accent-error)">Failed to load curriculum. Please refresh.</p>';}},

  _card(track){
    const done=track.lessons.filter(l=>Progress.isComplete(l.id)).length;
    const total=track.lessons.length;
    const pct=total?Math.round(done/total*100):0;
    return`<div class="ce-tc" style="border-top:3px solid ${track.color}">
      <div class="ce-th"><span style="font-size:2.2rem">${track.icon}</span>
        <div><div style="font-family:var(--font-mono);font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:${track.color}">Tier ${track.tier}</div>
          <h3 style="font-family:var(--font-heading);font-size:1.1rem;font-weight:700;color:var(--text-primary);margin:0">${track.title}</h3>
          <div style="font-size:.8rem;color:var(--text-muted);margin-top:.15rem">${track.subtitle}</div></div></div>
      <p style="font-size:.87rem;color:var(--text-secondary);line-height:1.6;margin:.75rem 0">${track.description}</p>
      <div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;margin:.5rem 0 .25rem">
        <div style="height:100%;width:${pct}%;background:${track.color};border-radius:2px;transition:width .5s"></div></div>
      <div style="font-size:.72rem;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:.75rem">${done}/${total} completed</div>
      <ul class="ce-tl">${track.lessons.slice(0,5).map(l=>`
        <li data-lesson-id="${l.id}" class="${Progress.isComplete(l.id)?'ce-done':''}">
          <a href="/learn/lesson.html?id=${l.id}&type=lesson">
            <span>${Progress.isComplete(l.id)?'✅':'○'}</span><span>${l.title}</span>
            <span style="margin-left:auto;font-size:.7rem;color:var(--text-muted);font-family:var(--font-mono)">${l.duration}</span>
          </a></li>`).join('')}
        ${total>5?`<li style="padding:.35rem .4rem;color:var(--text-muted);font-size:.8rem">+${total-5} more lessons…</li>`:''}</ul>
      <a href="/learn/lesson.html?id=${track.lessons[0].id}&type=lesson"
         class="btn btn-primary" style="display:block;text-align:center;margin-top:1.25rem;width:100%">
        ${done>0?'Continue Track →':'Start Track →'}</a></div>`;},

  _css(){
    if(document.getElementById('ce-ti-css'))return;
    const s=document.createElement('style');s.id='ce-ti-css';
    s.textContent=`.ce-tc{background:var(--bg-card);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:1.6rem;transition:transform .25s}.ce-tc:hover{transform:translateY(-4px)}.ce-th{display:flex;gap:1rem;align-items:flex-start;margin-bottom:.75rem}.ce-tl{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px}.ce-tl li a{display:flex;align-items:center;gap:.6rem;padding:.4rem .5rem;border-radius:8px;text-decoration:none;color:var(--text-secondary);font-size:.84rem;transition:background .15s}.ce-tl li a:hover{background:rgba(255,255,255,.04);color:var(--text-primary)}.ce-tl li.ce-done a{color:var(--text-muted)}`;
    document.head.appendChild(s);}
};

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
const CE={
  version:CE_CONFIG.version,Library,Progress,Renderer,Sidebar,Search,TrackIndex,Router,
  async init(){
    Router.init();Search.init();Progress._updateUI();
    Library.load().catch(()=>{});
    if(document.getElementById('ce-track-index'))await TrackIndex.render();
    if(document.getElementById('ce-body'))await Router.dispatch();
  },
  markComplete:(id)=>Progress.markComplete(id),
  renderTrackIndex:(id)=>TrackIndex.render(id),
  search:(q)=>Library.search(q)
};
window.CE=CE;
document.addEventListener('DOMContentLoaded',()=>CE.init());
console.log(`🚀 ContentEngine ${CE_CONFIG.version} loaded`);
