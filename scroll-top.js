(function(){
  const scrollTarget = document.querySelector('.container');
  const btn = document.createElement('button');
  btn.textContent = '\u2191';
  btn.setAttribute('aria-label', 'Scroll to top');
  Object.assign(btn.style, {
    position: 'fixed',
    right: '20px',
    bottom: '20px',
    width: '40px',
    height: '40px',
    border: 'none',
    borderRadius: '50%',
    background: '#4a5568',
    color: '#fff',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    zIndex: '1000'
  });
  document.body.appendChild(btn);

  const scroller = scrollTarget || window;
  function currentScrollTop(){
    return scrollTarget ? scrollTarget.scrollTop : (window.scrollY || document.documentElement.scrollTop);
  }
  function toggle(){
    btn.style.display = currentScrollTop() > 100 ? 'flex' : 'none';
  }
  scroller.addEventListener('scroll', toggle);
  toggle();

  btn.addEventListener('click', () => {
    if (scrollTarget) {
      scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
})();
