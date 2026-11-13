(() => {
  const search = document.getElementById('tool-search');
  const count = document.getElementById('result-count');
  const cards = [...document.querySelectorAll('.card')];
  const sections = [...document.querySelectorAll('.section')];
  cards.forEach((card, i) => card.style.setProperty('--i', i));
  const update = () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const match = !q || (card.innerText + ' ' + (card.dataset.search || '')).toLowerCase().includes(q);
      card.hidden = !match;
      if (match) visible++;
    });
    sections.forEach(section => {
      const grid = section.querySelector('.grid');
      if (grid) section.classList.toggle('no-results', ![...grid.querySelectorAll('.card')].some(c => !c.hidden));
    });
    count.textContent = `${visible} ${visible === 1 ? 'tool' : 'tools'} available`;
  };
  search.addEventListener('input', update);
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault(); search.focus();
    }
    if (e.key === 'Escape' && document.activeElement === search) {
      search.value = ''; update(); search.blur();
    }
  });
  if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener('pointermove', e => {
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
      document.documentElement.style.setProperty('--my', `${e.clientY}px`);
    }, {passive:true});
    cards.forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX-r.left)/r.width, y = (e.clientY-r.top)/r.height;
        card.style.setProperty('--card-x', `${x*100}%`);
        card.style.setProperty('--card-y', `${y*100}%`);
        card.style.setProperty('--ry', `${(x-.5)*5}deg`);
        card.style.setProperty('--rx', `${(.5-y)*5}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx','0deg'); card.style.setProperty('--ry','0deg');
      });
    });
  }

  // Subtle particle background: slow movement, low density, and capped frame rate.
  const canvas = document.getElementById('particle-field');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d', { alpha: true });
    let w=0,h=0,dpr=1,particles=[],lastFrame=0,raf=0;
    const pointer={x:-1000,y:-1000,active:false};
    const colors=[8,18,28,38];
    const resize=()=>{
      dpr=Math.min(window.devicePixelRatio||1,1.25);
      w=window.innerWidth;h=window.innerHeight;
      canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);
      canvas.style.width=w+'px';canvas.style.height=h+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const n=Math.min(58,Math.max(24,Math.floor(w*h/22000)));
      particles=Array.from({length:n},(_,i)=>({
        x:Math.random()*w,y:Math.random()*h,
        vx:(Math.random()-.5)*.16,vy:(Math.random()-.5)*.16,
        r:Math.random()*1.05+.45,hue:colors[i%colors.length]
      }));
    };
    const move=e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;};
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerleave',()=>{pointer.active=false;},{passive:true});
    window.addEventListener('resize',resize,{passive:true});
    resize();
    const draw=now=>{
      raf=0;
      if(document.hidden)return;
      if(now-lastFrame<32){raf=requestAnimationFrame(draw);return;}
      lastFrame=now;
      ctx.clearRect(0,0,w,h);
      const maxDist=w<650?78:112;
      for(let i=0;i<particles.length;i++){
        const p=particles[i];
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<-8)p.x=w+8;if(p.x>w+8)p.x=-8;
        if(p.y<-8)p.y=h+8;if(p.y>h+8)p.y=-8;
        if(pointer.active){
          const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy);
          if(d<105&&d>0){p.x+=(dx/d)*.045;p.y+=(dy/d)*.045;}
        }
        for(let j=i+1;j<particles.length;j++){
          const q=particles[j],dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);
          if(d<maxDist){
            ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
            ctx.strokeStyle=`hsla(${p.hue},82%,72%,${(1-d/maxDist)*.12})`;
            ctx.lineWidth=.55;ctx.stroke();
          }
        }
        if(pointer.active){
          const d=Math.hypot(p.x-pointer.x,p.y-pointer.y);
          if(d<125){
            ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pointer.x,pointer.y);
            ctx.strokeStyle=`rgba(255,126,76,${(1-d/125)*.16})`;
            ctx.lineWidth=.6;ctx.stroke();
          }
        }
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue},88%,75%,.62)`;ctx.fill();
      }
      raf=requestAnimationFrame(draw);
    };
    const startLoop=()=>{if(!document.hidden&&!raf)raf=requestAnimationFrame(draw);};
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}
      else startLoop();
    });
    startLoop();
  }
})();
