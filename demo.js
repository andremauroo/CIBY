(() => {
  'use strict';

  const screen = document.querySelector('#screen');
  const step = document.querySelector('#step');
  const deviceProgress = document.querySelector('.device-progress');
  const deviceStage = deviceProgress.querySelector('.device-stage');
  const deviceDots = deviceProgress.querySelectorAll('.device-dot');
  const status = document.querySelector('#status');
  const guide = document.querySelector('.demo-guide');
  const guideTrack = guide.querySelector('.guide-track');
  const guideMarkers = guide.querySelectorAll('.guide-progress li');
  const guideSlides = guideTrack.querySelectorAll('.guide-slide');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const recipes = {
    frittata: { title: 'Frittata di zucchine', ingredients: '2 zucchine e 3 uova' },
    riso: { title: 'Riso e zucchine', ingredients: '2 zucchine e 160 g di riso' },
  };
  const foods = [
    ['Zucchine', '2 pezzi', '280eb', true],
    ['Uova', '3 pezzi', '104a0', false],
    ['Riso', '250 g', '6bf46', false],
    ['Pomodori', '4 pezzi', 'dd50e', false],
  ];
  let scene = 0;
  let selected = 'frittata';
  let planned = selected;
  let moved = false;
  let confirming = false;

  function pantry() {
    const items = foods.map(([name, count, art, priority]) => `
      <li><img src="app/public/assets/${art}.svg" alt=""><span><strong>${name}</strong>
      ${priority ? '<small>Da usare prima</small>' : ''}</span><span class="food-state">${count}</span></li>`).join('');
    return `<h3>La tua dispensa</h3><p>Le zucchine sono la tua priorità per la cena.</p>
      <ul class="foods">${items}</ul><button class="action" data-action="choose">Trova un’idea per cena</button>`;
  }

  function ideas() {
    const options = Object.entries(recipes).map(([key, recipe]) => `
      <label><input type="radio" name="ricetta" value="${key}" ${key === selected ? 'checked' : ''}>
      <span><strong>${recipe.title}</strong><small>${recipe.ingredients}</small></span></label>`).join('');
    return `<h3>Cosa prepariamo?</h3><p>Due idee di Fridgy per due persone, con gli ingredienti che hai. Tempo stimato: 20 minuti.</p>
      <fieldset class="recipe-choices"><legend class="sr">Scegli una ricetta</legend>${options}</fieldset>
      <button class="action" data-action="plan">Pianifica per stasera</button>
      <button class="outline" data-action="pantry">Torna alla dispensa</button>`;
  }

  function schedule() {
    const recipe = recipes[planned];
    const when = confirming ? 'Domani a pranzo · anteprima' : moved ? 'Domani a pranzo' : 'Stasera';
    const action = confirming ? 'confirm' : moved ? 'undo' : 'move';
    const label = confirming ? 'Conferma lo spostamento' : moved ? 'Annulla lo spostamento' : 'Sposta a domani';
    const detail = confirming ? 'Sposterai il pasto e le due porzioni. Gli ingredienti restano in dispensa.'
      : moved ? 'Il pasto è stato spostato. Le quantità in dispensa sono le stesse.'
      : 'Stasera mangi fuori? Puoi tenere la ricetta per il pranzo di domani.';
    const heading = confirming ? 'Confermi il cambio?' : moved ? 'Pasto spostato' : 'Il tuo piano';
    return `<h3>${heading}</h3><p>${detail}</p>
      <div class="meal"><span>${when}</span><strong>${recipe.title}</strong><small>2 porzioni · ${recipe.ingredients}</small></div>
      <button class="${moved ? 'outline' : 'action'}" data-action="${action}">${label}</button>
      ${confirming ? '<button class="outline" data-action="cancel">Mantieni stasera</button>' : ''}
      ${!confirming && !moved ? '<button class="outline" data-action="choose">Cambia ricetta</button>' : ''}`;
  }

  function render(focus = false) {
    screen.innerHTML = [pantry, ideas, schedule][scene]();
    const stage = ['Dispensa', 'Ricette', 'Piano'][scene];
    step.textContent = `Passaggio ${scene + 1} di 3: ${stage}`;
    deviceStage.textContent = stage;
    deviceDots.forEach((dot, index) => {
      dot.classList.toggle('is-current', index === scene);
    });
    guideTrack.style.transform = `translateX(${-100 * scene}%)`;
    guideMarkers.forEach((marker, index) => {
      marker.setAttribute('aria-current', index === scene ? 'step' : 'false');
      guideSlides[index].setAttribute('aria-hidden', String(index !== scene));
    });
    screen.scrollTop = 0;
    if (focus) {
      const title = screen.querySelector('h3');
      title.tabIndex = -1;
      title.setAttribute('aria-describedby', `step guide-detail-${scene + 1}`);
      title.focus({ preventScroll: true });
    }
  }

  function openScene(index) {
    scene = index;
    confirming = false;
    render(true);
  }

  screen.addEventListener('change', event => {
    if (event.target.name === 'ricetta') selected = event.target.value;
  });

  screen.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    let message = '';
    switch (button.dataset.action) {
      case 'choose': openScene(1); return;
      case 'pantry': openScene(0); return;
      case 'plan':
        planned = selected;
        moved = false;
        confirming = false;
        scene = 2;
        message = 'Pasto pianificato per stasera: ' + recipes[planned].title + '.';
        break;
      case 'move': confirming = true; break;
      case 'cancel': confirming = false; message = 'Il pasto rimane previsto per stasera.'; break;
      case 'confirm': confirming = false; moved = true; message = 'Pasto spostato a domani a pranzo.'; break;
      case 'undo': moved = false; message = 'Spostamento annullato. Il pasto torna a stasera.'; break;
    }
    render(true);
    status.textContent = message;
  });

  render();
  deviceProgress.hidden = false;
  guide.hidden = false;

  const produce = document.querySelector('.produce');
  const compare = produce.querySelector('.compare');
  const raw = produce.querySelector('.raw');
  const cooked = produce.querySelector('.cooked');
  const rawDescription = raw.alt;
  const caption = produce.querySelector('figcaption');
  const rawCaption = caption.innerHTML;
  const cookedCaption = `<span class="label-head"><svg aria-hidden="true"><use href="#pan"/></svg> Idea per cena</span>
    <strong>Frittata</strong><span class="label-foot">2 porzioni <i></i> 20 minuti</span>`;
  compare.hidden = false;
  const photoChoices = compare.querySelectorAll('button');
  compare.addEventListener('click', event => {
    const choice = event.target.closest('[data-view]');
    if (!choice || choice.getAttribute('aria-pressed') === 'true') return;
    const showMeal = choice.dataset.view === 'cooked';
    produce.classList.toggle('is-cooked', showMeal);
    raw.alt = showMeal ? '' : rawDescription;
    cooked.alt = showMeal ? 'Frittata di zucchine dorata, servita su un piatto con una fetta tagliata.' : '';
    caption.innerHTML = showMeal ? cookedCaption : rawCaption;
    for (const button of photoChoices) {
      button.setAttribute('aria-pressed', String(button === choice));
    }
  });

  // Il movimento segue lo scorrimento solo mentre la fotografia è visibile.
  const photo = document.querySelector('.photo');
  let frame = 0;
  function paintPhoto() {
    frame = 0;
    const rect = photo.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight || reducedMotion.matches) return;
    const progress = Math.min(1, Math.max(0, -rect.top / rect.height));
    photo.style.setProperty('--zoom', (1.045 + progress * .065).toFixed(3));
    photo.style.setProperty('--shift', (progress * 2).toFixed(2) + '%');
  }
  function requestPaint() { if (!frame && !reducedMotion.matches) frame = requestAnimationFrame(paintPhoto); }
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener('scroll', requestPaint, { passive: true });
        requestPaint();
      } else window.removeEventListener('scroll', requestPaint);
    });
    visibility.observe(photo);
  }

  const demo = document.querySelector('#demo');
  const phoneScene = demo.querySelector('.phone-scene');
  const handset = phoneScene.querySelector('.handset');
  const wideLayout = window.matchMedia('(min-width: 1200px) and (min-height: 760px)');
  const singleColumn = window.matchMedia('(max-width: 719px)');
  const entranceOffset = () => singleColumn.matches ? 28 : 96;
  let demoScrollFrame = 0;

  function demoCenter() {
    const bounds = demo.getBoundingClientRect();
    return bounds.top + bounds.height / 2;
  }

  function demoTargetOffset() {
    const height = window.innerHeight;
    if (wideLayout.matches) return demoCenter() - height / 2;

    // Su schermi stretti la guida e la simulazione sono in colonna.
    // Il collegamento porta al punto in cui si può iniziare il task.
    const phone = phoneScene.getBoundingClientRect();
    if (singleColumn.matches) {
      if (height < 540) return phone.top - 16;
      return guide.getBoundingClientRect().top - 16;
    }
    // Centra il dispositivo quando c’è spazio; su finestre basse mostra l’inizio.
    return phone.height + 32 > height ? phone.top - 16 : phone.top + (phone.height - height) / 2;
  }

  function phoneProgress() {
    if (reducedMotion.matches) return 1;

    const viewportHeight = window.innerHeight;
    const entryTop = phoneScene.getBoundingClientRect().top + entranceOffset();
    // L’inizio coincide con il bordo in basso, la fine con il punto utile
    // al task nel layout corrente. Lo scorrimento resta reversibile.
    const travel = Math.max(1, viewportHeight + demoTargetOffset() - entryTop);
    return Math.min(1, Math.max(0, (viewportHeight - entryTop) / travel));
  }

  function handsetPose(progress) {
    if (singleColumn.matches) {
      return { transform: `translateY(${entranceOffset() * (1 - progress)}px)`, opacity: .72 + .28 * progress };
    }
    return {
      transform: `translateY(${entranceOffset() * (1 - progress)}px) scale(${.94 + .06 * progress})`,
      opacity: .25 + .75 * progress,
    };
  }

  function paintPhone() {
    const pose = handsetPose(phoneProgress());
    handset.style.transform = pose.transform;
    handset.style.opacity = pose.opacity;
  }

  function demoScrollTop() {
    return Math.ceil(window.scrollY + demoTargetOffset());
  }

  function cancelDemoScroll() {
    if (!demoScrollFrame) return;
    cancelAnimationFrame(demoScrollFrame);
    demoScrollFrame = 0;
  }

  function finishDemoScroll() {
    demo.focus({ preventScroll: true });
    window.scrollTo({ top: demoScrollTop(), behavior: 'instant' });
  }

  function scrollToDemo() {
    cancelDemoScroll();
    const origin = window.scrollY;
    const distance = Math.abs(demoScrollTop() - origin);
    if (reducedMotion.matches || distance <= 1) {
      finishDemoScroll();
      return;
    }

    const duration = Math.min(2600, Math.max(700, distance * 1.9));
    let startedAt;
    function advance(now) {
      startedAt ??= now;
      const progress = Math.min(1, (now - startedAt) / duration);
      if (progress === 1) {
        demoScrollFrame = 0;
        finishDemoScroll();
        return;
      }
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      // Ricalcola il centro se la barra del browser cambia l’altezza visibile.
      const top = origin + (demoScrollTop() - origin) * eased;
      window.scrollTo({ top, behavior: 'instant' });
      demoScrollFrame = requestAnimationFrame(advance);
    }

    demoScrollFrame = requestAnimationFrame(advance);
  }

  document.querySelector('a[href="#demo"]').addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    // L’anteprima in un iframe può non consentire di aggiornare la cronologia.
    // In quel caso lo scorrimento alla demo deve comunque funzionare.
    if (window.location.hash !== '#demo') {
      try { window.history.pushState(null, '', '#demo'); } catch (error) {
        if (error.name !== 'SecurityError') throw error;
      }
    }
    scrollToDemo();
  });

  for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown', 'popstate']) {
    window.addEventListener(type, cancelDemoScroll, { passive: true });
  }
  window.addEventListener('scroll', paintPhone, { passive: true });
  window.addEventListener('resize', paintPhone);
  window.addEventListener('pageshow', paintPhone);
  reducedMotion.addEventListener('change', paintPhone);
  reducedMotion.addEventListener('change', cancelDemoScroll);
  paintPhone();
})();
