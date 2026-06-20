// cursor-follow glow on service cards
document.querySelectorAll('.svc-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  });
});

// header scroll state
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 12);
}, {passive:true});

// mobile menu
const toggle = document.getElementById('menuToggle');
const links = document.getElementById('navLinks');
toggle.addEventListener('click', () => {
  toggle.classList.toggle('open');
  links.classList.toggle('open');
  document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  toggle.classList.remove('open');
  links.classList.remove('open');
  document.body.style.overflow = '';
}));

// reduced motion check (dipakai beberapa fitur di bawah)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== particle background animation =====
(function(){
  const canvas = document.getElementById('particleCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  const palette = [
    'rgba(238,241,251,OPA)',  // paper — putih lembut
    'rgba(238,241,251,OPA)',
    'rgba(238,241,251,OPA)',
    'rgba(201,163,104,OPA)',  // gold
    'rgba(111,155,219,OPA)'   // azure-bright
  ];
  const LINK_DIST = 130;
  const LINK_DIST_SQ = LINK_DIST * LINK_DIST;

  let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let particles = [];
  let mouseX = -9999, mouseY = -9999;
  let targetParX = 0, targetParY = 0, parX = 0, parY = 0;
  let rafId = null;
  let running = false;

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function particleCount(){
    const area = w * h;
    return Math.max(36, Math.min(110, Math.round(area / 16000)));
  }

  function makeParticle(){
    return {
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-0.10, 0.10),
      vy: rand(-0.08, 0.08),
      r: rand(0.7, 1.9),
      baseAlpha: rand(0.35, 0.9),
      phase: rand(0, Math.PI * 2),
      twinkleSpeed: rand(0.4, 1.1),
      color: palette[Math.floor(rand(0, palette.length))]
    };
  }

  function resize(){
    const rect = canvas.parentElement.getBoundingClientRect();
    w = Math.max(window.innerWidth, rect.width);
    h = Math.max(window.innerHeight, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = particleCount();
    if(particles.length === 0){
      particles = Array.from({length: count}, makeParticle);
    } else if(particles.length < count){
      while(particles.length < count){ particles.push(makeParticle()); }
    } else if(particles.length > count){
      particles.length = count;
    }
  }

  function drawStatic(){
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.fillStyle = p.color.replace('OPA', p.baseAlpha.toFixed(2));
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  let t = 0;
  function tick(){
    t += 1;
    ctx.clearRect(0, 0, w, h);

    // parallax halus mengikuti kursor
    parX += (targetParX - parX) * 0.04;
    parY += (targetParY - parY) * 0.04;
    canvas.style.transform = `translate3d(${parX}px, ${parY}px, 0)`;

    // gerakkan & gambar partikel
    for(let i = 0; i < particles.length; i++){
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if(p.x < -10) p.x = w + 10;
      if(p.x > w + 10) p.x = -10;
      if(p.y < -10) p.y = h + 10;
      if(p.y > h + 10) p.y = -10;

      const twinkle = 0.65 + 0.35 * Math.sin(t * 0.02 * p.twinkleSpeed + p.phase);
      const alpha = p.baseAlpha * twinkle;

      ctx.beginPath();
      ctx.fillStyle = p.color.replace('OPA', alpha.toFixed(2));
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // garis penghubung tipis antar partikel berdekatan (efek constellation)
    for(let i = 0; i < particles.length; i++){
      for(let j = i + 1; j < particles.length; j++){
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if(distSq < LINK_DIST_SQ){
          const lineAlpha = (1 - distSq / LINK_DIST_SQ) * 0.16;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(226,233,255,${lineAlpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if(running){ rafId = requestAnimationFrame(tick); }
  }

  function start(){
    if(running || reduceMotion) return;
    running = true;
    rafId = requestAnimationFrame(tick);
  }
  function stop(){
    running = false;
    if(rafId){ cancelAnimationFrame(rafId); rafId = null; }
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if(reduceMotion){ drawStatic(); }
    }, 150);
  });

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    targetParX = ((mouseX / window.innerWidth) - 0.5) * -14;
    targetParY = ((mouseY / window.innerHeight) - 0.5) * -14;
  }, {passive:true});

  document.addEventListener('visibilitychange', () => {
    if(document.hidden){ stop(); } else { start(); }
  });

  resize();
  if(reduceMotion){
    drawStatic();
  } else {
    start();
  }
})();

// ===== counter angka statistik =====
(function(){
  const counters = document.querySelectorAll('.num[data-count-to]');
  if(!counters.length) return;

  function animateCount(el){
    const target = parseFloat(el.dataset.countTo);
    if(isNaN(target)){ return; }
    const suffix = el.dataset.suffix || '';
    const pad = parseInt(el.dataset.pad || '0', 10);
    if(reduceMotion){
      el.textContent = (pad ? String(target).padStart(pad,'0') : String(target)) + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function tick(now){
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = (pad ? String(val).padStart(pad,'0') : String(val)) + suffix;
      if(p < 1){ requestAnimationFrame(tick); }
    }
    requestAnimationFrame(tick);
  }

  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        animateCount(entry.target);
        counterIO.unobserve(entry.target);
      }
    });
  }, {threshold:0.5});
  counters.forEach(c => counterIO.observe(c));
})();

// ===== testimonial slider otomatis =====
(function(){
  const track = document.getElementById('testiTrack');
  const dotsWrap = document.getElementById('testiDots');
  const prevBtn = document.getElementById('testiPrev');
  const nextBtn = document.getElementById('testiNext');
  const slider = document.querySelector('.testi-slider');
  if(!track || !dotsWrap || !slider) return;

  const slides = track.children;
  const AUTOPLAY_MS = 5000;
  let idx = 0;
  let timer = null;

  function goTo(i){
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dotsWrap.querySelectorAll('.tdot').forEach((d, di) => d.classList.toggle('active', di === idx));
  }
  function next(){ goTo(idx + 1); }
  function prev(){ goTo(idx - 1); }
  function startAutoplay(){
    if(reduceMotion) return;
    stopAutoplay();
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay(){
    if(timer){ clearInterval(timer); timer = null; }
  }

  nextBtn.addEventListener('click', () => { next(); startAutoplay(); });
  prevBtn.addEventListener('click', () => { prev(); startAutoplay(); });
  dotsWrap.addEventListener('click', (e) => {
    const d = e.target.closest('.tdot');
    if(!d) return;
    goTo(parseInt(d.dataset.i, 10));
    startAutoplay();
  });

  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);

  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; stopAutoplay(); }, {passive:true});
  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(Math.abs(dx) > 40){ dx < 0 ? next() : prev(); }
    startAutoplay();
  }, {passive:true});

  // dipanggil oleh form ulasan untuk menambah testimoni baru ke slider, lalu langsung menampilkannya
  window.addTestimonialSlide = function(data){
    const rating = Math.min(5, Math.max(1, parseInt(data.rating, 10) || 5));
    const starsStr = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    const el = document.createElement('div');
    el.className = 'testi';

    const starsDiv = document.createElement('div');
    starsDiv.className = 'stars';
    starsDiv.textContent = starsStr;

    const p = document.createElement('p');
    p.textContent = '"' + data.comment + '"';

    const who = document.createElement('div');
    who.className = 'who';
    const ava = document.createElement('div');
    ava.className = 'ava';
    ava.textContent = (data.name || '?').trim().charAt(0).toUpperCase() || '?';
    const info = document.createElement('div');
    const nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    nameDiv.textContent = data.name;
    const roleDiv = document.createElement('div');
    roleDiv.className = 'role';
    roleDiv.textContent = data.role || 'Pelanggan';
    info.appendChild(nameDiv);
    info.appendChild(roleDiv);
    who.appendChild(ava);
    who.appendChild(info);

    el.appendChild(starsDiv);
    el.appendChild(p);
    el.appendChild(who);
    track.appendChild(el);

    const newDot = document.createElement('button');
    newDot.className = 'tdot';
    newDot.dataset.i = String(slides.length - 1);
    newDot.setAttribute('aria-label', 'Ke testimoni ' + slides.length);
    dotsWrap.appendChild(newDot);

    goTo(slides.length - 1);
    startAutoplay();
  };

  goTo(0);
  startAutoplay();
})();

// ===== form ulasan pelanggan (penilaian bintang + komentar) =====
(function(){
  const form = document.getElementById('reviewForm');
  if(!form) return;
  const starsWrap = document.getElementById('rfStars');
  const starBtns = starsWrap.querySelectorAll('.rf-star');
  const ratingInput = document.getElementById('rfRating');
  const ratingText = document.getElementById('rfRatingText');
  const note = document.getElementById('rfNote');
  const labels = ['Belum dipilih','Kurang baik','Cukup','Baik','Sangat baik','Istimewa'];
  let rating = 0;

  function paintStars(value){
    starBtns.forEach(btn => {
      const v = parseInt(btn.dataset.val, 10);
      btn.classList.toggle('filled', v <= value);
    });
    ratingText.textContent = labels[value] || labels[0];
  }

  starBtns.forEach(btn => {
    const v = parseInt(btn.dataset.val, 10);
    btn.addEventListener('mouseenter', () => paintStars(v));
    btn.addEventListener('focus', () => paintStars(v));
    btn.addEventListener('click', () => {
      rating = v;
      ratingInput.value = rating;
      paintStars(rating);
    });
  });
  starsWrap.addEventListener('mouseleave', () => paintStars(rating));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('rfName').value.trim();
    const role = document.getElementById('rfRole').value.trim();
    const comment = document.getElementById('rfComment').value.trim();

    if(rating < 1){
      note.textContent = 'Silakan pilih penilaian bintang terlebih dahulu.';
      note.classList.add('err');
      return;
    }
    if(!name || !comment){
      note.textContent = 'Nama dan komentar wajib diisi.';
      note.classList.add('err');
      return;
    }

    note.classList.remove('err');

    if(typeof window.addTestimonialSlide === 'function'){
      window.addTestimonialSlide({name, role, rating, comment});
    }

    note.textContent = 'Terima kasih! Ulasan Anda berhasil ditambahkan ke testimoni di atas.';
    form.reset();
    rating = 0;
    ratingInput.value = 0;
    paintStars(0);
  });
})();

// ===== parallax lembut pada hero =====
(function(){
  if(reduceMotion) return;
  const heroGrid = document.querySelector('.hero-grid');
  const heroBg = document.querySelector('.hero-bg');
  const heroEl = document.querySelector('.hero');
  if(!heroGrid && !heroBg) return;
  let ticking = false;

  function update(){
    const y = window.scrollY;
    const heroH = heroEl ? heroEl.offsetHeight : 800;
    if(y < heroH * 1.4){
      if(heroGrid){ heroGrid.style.transform = `translateY(${y * 0.12}px)`; }
      if(heroBg){ heroBg.style.transform = `translateY(${y * 0.06}px)`; }
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if(!ticking){ requestAnimationFrame(update); ticking = true; }
  }, {passive:true});
})();

// scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.classList.add('in');
      e.target.addEventListener('transitionend', () => {
        e.target.style.willChange = 'auto';
      }, {once:true});
      io.unobserve(e.target);
    }
  });
}, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
revealEls.forEach(el => io.observe(el));
