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
