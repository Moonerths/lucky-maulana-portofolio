(function(){
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var names = ['Profil','Pengalaman','Organisasi','Keahlian','Pencapaian','Galeri','Kontak'];
  var hashes = ['profil','pengalaman','organisasi','keahlian','pencapaian','galeri','kontak'];
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var dotsEl = document.getElementById('dots');
  var cur = document.getElementById('cur'), count = document.getElementById('count');
  var prev = document.getElementById('prev'), next = document.getElementById('next');
  var idx = 0, lbOpen = false;

  slides.forEach(function(s){
    Array.prototype.slice.call(s.querySelectorAll('[data-r]')).forEach(function(el, i){ el.style.setProperty('--i', i); });
  });

  var dots = names.map(function(n, i){
    var b = document.createElement('button');
    b.className = 'dot'; b.setAttribute('aria-label', n); b.title = n;
    b.innerHTML = '<i></i>';
    b.addEventListener('click', function(){ go(i); });
    dotsEl.appendChild(b);
    return b;
  });

  function runCounters(slide){
    Array.prototype.slice.call(slide.querySelectorAll('[data-count]')).forEach(function(el){
      var to = parseFloat(el.getAttribute('data-count')), dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var fmt = function(v){ return v.toLocaleString('id-ID', {minimumFractionDigits: dec, maximumFractionDigits: dec}); };
      if(reduced){ el.textContent = fmt(to); return; }
      var t0 = performance.now(), dur = 1300;
      var tick = function(t){
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e);
        if(p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function render(){
    slides.forEach(function(s, i){
      s.classList.toggle('is-active', i === idx);
      s.classList.toggle('is-before', i < idx);
    });
    tabs.forEach(function(t, i){
      t.classList.toggle('on', i === idx);
      if(i === idx) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    dots.forEach(function(d, i){
      d.classList.toggle('on', i === idx);
      if(i === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
    cur.textContent = names[idx];
    count.textContent = (idx + 1) + ' / ' + slides.length;
    prev.disabled = idx === 0;
    next.disabled = idx === slides.length - 1;
    slides[idx].scrollTop = 0;
    runCounters(slides[idx]);
  }

  function go(n){
    n = Math.max(0, Math.min(slides.length - 1, n));
    if(n === idx) return;
    idx = n; render();
    if(location.hash !== '#' + hashes[idx]) location.hash = hashes[idx];
  }

  document.addEventListener('click', function(e){
    var g = e.target.closest && e.target.closest('[data-go]');
    if(g){ go(parseInt(g.getAttribute('data-go'), 10)); }
  });
  prev.addEventListener('click', function(){ go(idx - 1); });
  next.addEventListener('click', function(){ go(idx + 1); });
  document.addEventListener('keydown', function(e){
    if(e.altKey || e.ctrlKey || e.metaKey || lbOpen) return;
    if(e.key === 'ArrowRight'){ go(idx + 1); }
    else if(e.key === 'ArrowLeft'){ go(idx - 1); }
  });
  window.addEventListener('hashchange', function(){
    var i = hashes.indexOf(location.hash.replace('#', ''));
    if(i > -1 && i !== idx){ idx = i; render(); }
  });

  var lock = 0;
  stage.addEventListener('wheel', function(e){
    var now = performance.now(); if(now < lock) return;
    var s = slides[idx], ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
    if(ax > ay && ax > 40){ go(idx + (e.deltaX > 0 ? 1 : -1)); lock = now + 900; return; }
    if(s.scrollHeight > s.clientHeight + 4) return;
    if(ay > 30){ go(idx + (e.deltaY > 0 ? 1 : -1)); lock = now + 900; }
  }, {passive: true});

  var tx = 0, ty = 0;
  stage.addEventListener('touchstart', function(e){ tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, {passive: true});
  stage.addEventListener('touchend', function(e){
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5){ go(idx + (dx < 0 ? 1 : -1)); }
  }, {passive: true});

  /* organisasi: master-detail */
  var orgTabs = Array.prototype.slice.call(document.querySelectorAll('.org-tab'));
  function pickOrg(i, focus){
    orgTabs.forEach(function(t, k){
      var on = k === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if(focus) orgTabs[i].focus();
  }
  orgTabs.forEach(function(t, i){
    t.addEventListener('click', function(){ pickOrg(i); });
    t.addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
        e.preventDefault();
        pickOrg((i + (e.key === 'ArrowDown' ? 1 : orgTabs.length - 1)) % orgTabs.length, true);
      }
    });
  });

  /* pointer: card spotlight + parallax */
  var root = document.documentElement, ticking = false, px = 0, py = 0;
  document.addEventListener('pointermove', function(e){
    var g = e.target.closest && e.target.closest('.glass');
    if(g){
      var r = g.getBoundingClientRect();
      g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      g.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }
    px = (e.clientX / innerWidth - .5) * 2; py = (e.clientY / innerHeight - .5) * 2;
    mouse.x = e.clientX; mouse.y = e.clientY;
    if(!ticking && !reduced){
      ticking = true;
      requestAnimationFrame(function(){
        stage.style.setProperty('--px', px.toFixed(3)); stage.style.setProperty('--py', py.toFixed(3));
        ticking = false;
      });
    }
  }, {passive: true});

  /* copy buttons */
  Array.prototype.slice.call(document.querySelectorAll('[data-copy]')).forEach(function(b){
    var label = b.textContent;
    b.addEventListener('click', function(){
      var done = function(msg){ b.textContent = msg; setTimeout(function(){ b.textContent = label; }, 1800); };
      var select = function(){
        var el = document.getElementById(b.getAttribute('data-target'));
        var r = document.createRange(); r.selectNodeContents(el);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        done('Teks dipilih, salin manual');
      };
      try{
        navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function(){ done('Tersalin'); }, select);
      }catch(err){ select(); }
    });
  });

  /* background: drifting light + particles */
  var cv = document.getElementById('fx'), ctx = cv.getContext('2d');
  var W = 0, H = 0, parts = [], mouse = {x: -9999, y: -9999}, running = true;
  var orbs = [
    {fx: .00021, fy: .00017, ph: 0, r: .55, c: '230,211,174', a: .10},
    {fx: .00015, fy: .00023, ph: 2.1, r: .5, c: '70,100,190', a: .22},
    {fx: .00018, fy: .00014, ph: 4.2, r: .45, c: '198,169,121', a: .09}
  ];
  function resize(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(70, W * H / 20000));
    parts = [];
    for(var i = 0; i < n; i++){
      parts.push({x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, r: Math.random() * 1.5 + .6});
    }
  }
  function draw(t){
    ctx.clearRect(0, 0, W, H);
    orbs.forEach(function(o){
      var x = W * (.5 + .38 * Math.sin(t * o.fx * 6 + o.ph)), y = H * (.5 + .36 * Math.cos(t * o.fy * 6 + o.ph));
      var rad = Math.max(W, H) * o.r;
      var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(' + o.c + ',' + o.a + ')'); g.addColorStop(1, 'rgba(' + o.c + ',0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    for(var i = 0; i < parts.length; i++){
      var p = parts[i];
      p.x += p.vx; p.y += p.vy;
      if(p.x < 0) p.x = W; else if(p.x > W) p.x = 0;
      if(p.y < 0) p.y = H; else if(p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(230,211,174,.55)'; ctx.fill();
      for(var j = i + 1; j < parts.length; j++){
        var q = parts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
        if(d < 12100){
          ctx.strokeStyle = 'rgba(230,211,174,' + (0.16 * (1 - d / 12100)).toFixed(3) + ')';
          ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      var mx = p.x - mouse.x, my = p.y - mouse.y, md = mx * mx + my * my;
      if(md < 25000){
        ctx.strokeStyle = 'rgba(230,211,174,' + (0.32 * (1 - md / 25000)).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
  }
  function loop(t){ if(!running) return; draw(t); requestAnimationFrame(loop); }
  resize();
  window.addEventListener('resize', function(){ resize(); if(reduced) draw(0); });
  if(reduced){ draw(0); }
  else{
    requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function(){
      running = !document.hidden;
      if(running) requestAnimationFrame(loop);
    });
  }

  /* foto: sembunyikan yang belum ada, perbesar saat diklik */
  function dropFig(fig){
    var strip = fig.parentNode;
    fig.remove();
    if(!strip.querySelector('.ph')){
      strip.hidden = true;
      if(strip.classList.contains('gallery')) document.getElementById('gallery-empty').hidden = false;
    }
  }
  Array.prototype.slice.call(document.querySelectorAll('.ph img')).forEach(function(img){
    var fig = img.parentNode;
    fig.tabIndex = 0; fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', 'Perbesar foto: ' + img.alt);
    if(img.complete && img.naturalWidth === 0) dropFig(fig);
    else img.addEventListener('error', function(){ dropFig(fig); });
  });
  var av = document.querySelector('.avatar');
  if(av){
    if(av.complete && av.naturalWidth === 0) av.remove();
    else av.addEventListener('error', function(){ av.remove(); });
  }

  var lb = document.getElementById('lb'), lbImg = document.getElementById('lb-img'), lbCap = document.getElementById('lb-cap');
  var lbList = [], lbI = 0, lbFrom = null;
  function lbShow(){
    var f = lbList[lbI], im = f.querySelector('img');
    lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt;
    lbCap.textContent = (f.querySelector('figcaption') || {}).textContent || '';
    var many = lbList.length > 1;
    document.getElementById('lb-prev').hidden = !many; document.getElementById('lb-next').hidden = !many;
  }
  function lbOpenAt(fig){
    lbList = Array.prototype.slice.call(fig.parentNode.querySelectorAll('.ph'));
    lbI = lbList.indexOf(fig); lbFrom = fig;
    lbShow(); lb.hidden = false; lbOpen = true;
    document.getElementById('lb-x').focus();
  }
  function lbClose(){ lb.hidden = true; lbOpen = false; if(lbFrom) lbFrom.focus(); }
  function lbStep(d){ lbI = (lbI + d + lbList.length) % lbList.length; lbShow(); }
  document.addEventListener('click', function(e){
    var f = e.target.closest && e.target.closest('.ph');
    if(f) lbOpenAt(f);
  });
  document.addEventListener('keydown', function(e){
    if(lbOpen){
      if(e.key === 'Escape') lbClose();
      else if(e.key === 'ArrowRight') lbStep(1);
      else if(e.key === 'ArrowLeft') lbStep(-1);
      return;
    }
    var f = e.target.closest && e.target.closest('.ph');
    if(f && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); lbOpenAt(f); }
  });
  document.getElementById('lb-x').addEventListener('click', lbClose);
  document.getElementById('lb-prev').addEventListener('click', function(){ lbStep(-1); });
  document.getElementById('lb-next').addEventListener('click', function(){ lbStep(1); });
  lb.addEventListener('click', function(e){ if(e.target === lb) lbClose(); });

  /* start */
  var h = hashes.indexOf(location.hash.replace('#', ''));
  idx = h > -1 ? h : 0;
  render();
})();
