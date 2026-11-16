/* =========================================================
   WAVELENGTH — script.js
   Vanilla JS, componentized into small focused functions.
   ========================================================= */

/* ---------------------------------------------------------
   SAMPLE SONG LIBRARY
   `freq` + `freq2` drive the synthesized two-tone preview
   played through the Web Audio API when a card's play
   button is pressed (no external audio files required).
   --------------------------------------------------------- */
const SONG_LIBRARY = [
  { id: 1, title: 'Neon Horizon', artist: 'Lucid Echo', gradient: 'linear-gradient(135deg,#8B5CF6,#10B981)', freq: 220, freq2: 330 },
  { id: 2, title: 'Midnight Drive', artist: 'Nova Fields', gradient: 'linear-gradient(135deg,#10B981,#8B5CF6)', freq: 196, freq2: 294 },
  { id: 3, title: 'Paper Skies', artist: 'Amber Tide', gradient: 'linear-gradient(135deg,#6D28D9,#059669)', freq: 261, freq2: 392 },
  { id: 4, title: 'Glass Static', artist: 'Rho Collective', gradient: 'linear-gradient(135deg,#8B5CF6,#34D399)', freq: 233, freq2: 349 },
  { id: 5, title: 'Velvet Signal', artist: 'Lucid Echo', gradient: 'linear-gradient(135deg,#A78BFA,#6EE7B7)', freq: 174, freq2: 261 },
  { id: 6, title: 'Afterglow', artist: 'Nova Fields', gradient: 'linear-gradient(135deg,#7C3AED,#047857)', freq: 246, freq2: 369 },
  { id: 7, title: 'Low Orbit', artist: 'Amber Tide', gradient: 'linear-gradient(135deg,#9333EA,#10B981)', freq: 207, freq2: 311 },
  { id: 8, title: 'Static Bloom', artist: 'Rho Collective', gradient: 'linear-gradient(135deg,#8B5CF6,#2DD4BF)', freq: 277, freq2: 415 },
];

/* Shared Web Audio context + currently-playing state, so only
   one preview plays at a time across all result cards. */
let audioCtx = null;
let currentlyPlaying = null; // { id, stop() }

const ARTISTS = [
  { name: 'Lucid Echo', genre: 'Synthwave', seed: 101 },
  { name: 'Nova Fields', genre: 'Indie Electronic', seed: 102 },
  { name: 'Amber Tide', genre: 'Dream Pop', seed: 103 },
  { name: 'Rho Collective', genre: 'Future Soul', seed: 104 },
];

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileNav();
  initHeroWaves();
  initSearchWaveform();
  initScrollFadeUp();
  initCounters();
  initSmoothScroll();
  initNewsletterForm();
  initMusicSearch();
  initAuth();
  initHeroCtas();
  initFeaturedArtists();
  initTestimonialAvatars();
});

/* ---------------------------------------------------------
   0. GENERATIVE "PHOTO" ARTWORK
   Produces a blurred, grainy, gradient-blob portrait/cover —
   a photographic look built entirely on canvas, with no
   external images, so nothing here carries copyright or
   real-person identity risk. Seeded so each subject keeps
   a stable, unique look across renders.
   --------------------------------------------------------- */
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp255(v) {
  return Math.max(0, Math.min(255, v));
}

function generatePortraitDataUrl(seed, size, initials) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const rand = mulberry32(seed);
  const palette = ['#8B5CF6', '#10B981', '#6D28D9', '#34D399', '#A78BFA', '#059669', '#7C3AED', '#2DD4BF'];

  // Dark base
  ctx.fillStyle = '#0A0A0F';
  ctx.fillRect(0, 0, size, size);

  // Soft, out-of-focus gradient blobs — the "bokeh" photographic look
  const blobCount = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < blobCount; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = size * (0.3 + rand() * 0.4);
    const color = palette[Math.floor(rand() * palette.length)];

    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `${color}DD`);
    grad.addColorStop(1, `${color}00`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine grain overlay for a photographic (not flat/vector) texture
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let p = 0; p < data.length; p += 4) {
    const noise = (rand() - 0.5) * 22;
    data[p] = clamp255(data[p] + noise);
    data[p + 1] = clamp255(data[p + 1] + noise);
    data[p + 2] = clamp255(data[p + 2] + noise);
  }
  ctx.putImageData(imageData, 0, 0);

  // Subtle vignette
  const vignette = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.35,
    size / 2, size / 2, size * 0.7
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  // Initials monogram (used for artist/user avatars, skipped for album art)
  if (initials) {
    ctx.fillStyle = 'rgba(245,245,247,0.92)';
    ctx.font = `700 ${Math.round(size * 0.36)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, size / 2, size / 2 + size * 0.02);
  }

  return canvas.toDataURL('image/png');
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/* ---------------------------------------------------------
   1. NAVBAR — blur/background on scroll
   --------------------------------------------------------- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const toggleScrolledClass = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  toggleScrolledClass();
  window.addEventListener('scroll', toggleScrolledClass, { passive: true });
}

/* ---------------------------------------------------------
   2. MOBILE NAV — hamburger toggle
   --------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  links.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => links.classList.remove('open'));
  });
}

/* ---------------------------------------------------------
   3. HERO SOUND-WAVE ANIMATION
   --------------------------------------------------------- */
function initHeroWaves() {
  const container = document.getElementById('heroWaves');
  if (!container) return;

  const BAR_COUNT = 48;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';

    const height = 40 + Math.random() * 160;
    const duration = 0.9 + Math.random() * 0.9;
    const delay = Math.random() * 1.2;

    bar.style.height = `${height}px`;
    bar.style.animationDuration = `${duration}s`;
    bar.style.animationDelay = `${delay}s`;

    fragment.appendChild(bar);
  }

  container.appendChild(fragment);
}

/* ---------------------------------------------------------
   4. SEARCH BAR — animated waveform ripple on focus/typing
   --------------------------------------------------------- */
function initSearchWaveform() {
  const box = document.getElementById('searchBox');
  const input = document.getElementById('searchInput');
  const waveform = document.getElementById('searchWaveform');
  if (!box || !input || !waveform) return;

  const BAR_COUNT = 14;
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('span');
    bar.className = 'bar';
    bar.style.height = `${6 + Math.random() * 14}px`;
    bar.style.animationDelay = `${Math.random() * 0.6}s`;
    waveform.appendChild(bar);
  }

  const activate = () => box.classList.add('active');
  const maybeDeactivate = () => {
    if (!input.value && document.activeElement !== input) {
      box.classList.remove('active');
    }
  };

  input.addEventListener('focus', activate);
  input.addEventListener('input', activate);
  input.addEventListener('blur', maybeDeactivate);
}

/* ---------------------------------------------------------
   5. SCROLL-TRIGGERED FADE-UP (Intersection Observer)
   --------------------------------------------------------- */
function initScrollFadeUp() {
  const targets = document.querySelectorAll('.fade-up');
  if (!targets.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    targets.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------
   6. ANIMATED COUNT-UP STATS (Social Proof section)
   --------------------------------------------------------- */
function initCounters() {
  const counters = document.querySelectorAll('.counter-number');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.target || '0');
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);

      el.textContent = `${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = `${target}${suffix}`;
      }
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------
   7. SMOOTH SCROLL for nav links
   --------------------------------------------------------- */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const navbarHeight = document.getElementById('navbar')?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 8;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ---------------------------------------------------------
   8. NEWSLETTER FORM
   --------------------------------------------------------- */
function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button');
    if (!input || !button) return;

    const originalText = button.textContent;
    button.textContent = 'Subscribed ✓';
    button.disabled = true;
    showToast(`You're on the list — we'll email ${input.value}`);

    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
      input.value = '';
    }, 2200);
  });
}

/* ---------------------------------------------------------
   9. MUSIC SEARCH — live filtering + playable preview cards
   --------------------------------------------------------- */
function initMusicSearch() {
  const resultsRow = document.getElementById('resultsRow');
  const noResults = document.getElementById('noResults');
  const noResultsQuery = document.getElementById('noResultsQuery');
  const input = document.getElementById('searchInput');
  if (!resultsRow || !input) return;

  const renderResults = (list) => {
    resultsRow.innerHTML = '';

    if (!list.length) {
      resultsRow.hidden = true;
      if (noResults) {
        noResults.hidden = false;
        if (noResultsQuery) noResultsQuery.textContent = input.value.trim();
      }
      return;
    }

    resultsRow.hidden = false;
    if (noResults) noResults.hidden = true;

    const fragment = document.createDocumentFragment();
    list.forEach((song) => fragment.appendChild(buildResultCard(song)));
    resultsRow.appendChild(fragment);
  };

  const filterSongs = (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return SONG_LIBRARY.slice(0, 4);
    return SONG_LIBRARY.filter(
      (song) => song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q)
    );
  };

  // Initial render: first 4 tracks
  renderResults(filterSongs(''));

  let debounceTimer = null;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderResults(filterSongs(input.value)), 120);
  });
}

function buildResultCard(song) {
  const card = document.createElement('article');
  card.className = 'result-card glass';
  card.dataset.songId = String(song.id);

  const art = document.createElement('div');
  art.className = 'result-art';
  const artImg = document.createElement('img');
  artImg.src = generatePortraitDataUrl(song.id * 97, 240, null);
  artImg.alt = `${song.title} cover art`;
  artImg.loading = 'lazy';
  art.appendChild(artImg);

  const info = document.createElement('div');
  info.className = 'result-info';

  const title = document.createElement('p');
  title.className = 'result-title';
  title.textContent = song.title;

  const artistRow = document.createElement('div');
  artistRow.className = 'result-artist-row';

  const artistAvatar = document.createElement('img');
  const artistSeed = ARTISTS.find((a) => a.name === song.artist)?.seed || song.id * 13;
  artistAvatar.src = generatePortraitDataUrl(artistSeed, 64, null);
  artistAvatar.alt = song.artist;
  artistAvatar.loading = 'lazy';

  const artist = document.createElement('p');
  artist.className = 'result-artist';
  artist.textContent = song.artist;

  artistRow.appendChild(artistAvatar);
  artistRow.appendChild(artist);

  info.appendChild(title);
  info.appendChild(artistRow);

  const playBtn = document.createElement('button');
  playBtn.className = 'play-btn';
  playBtn.setAttribute('aria-label', `Play ${song.title}`);
  playBtn.setAttribute('aria-pressed', 'false');
  playBtn.textContent = '▶';

  playBtn.addEventListener('click', () => togglePlay(song, card, playBtn));

  card.appendChild(art);
  card.appendChild(info);
  card.appendChild(playBtn);

  return card;
}

/* ---------------------------------------------------------
   10. PLAYBACK — synthesized two-tone preview via Web Audio
   (keeps the demo fully self-contained, no audio files)
   --------------------------------------------------------- */
function togglePlay(song, card, btn) {
  // If this song is already playing, stop it.
  if (currentlyPlaying && currentlyPlaying.id === song.id) {
    currentlyPlaying.stop();
    return;
  }

  // Stop whatever else is playing first.
  if (currentlyPlaying) {
    currentlyPlaying.stop();
  }

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      showToast('Audio preview is not supported in this browser.');
      return;
    }
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const now = audioCtx.currentTime;

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';
  osc1.frequency.value = song.freq;
  osc2.frequency.value = song.freq2;

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.15);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);

  osc1.start(now);
  osc2.start(now);

  card.classList.add('playing');
  btn.textContent = '❚❚';
  btn.setAttribute('aria-pressed', 'true');
  btn.setAttribute('aria-label', `Pause ${song.title}`);

  const stop = () => {
    const stopTime = audioCtx.currentTime;
    gain.gain.linearRampToValueAtTime(0, stopTime + 0.1);
    osc1.stop(stopTime + 0.12);
    osc2.stop(stopTime + 0.12);

    card.classList.remove('playing');
    btn.textContent = '▶';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', `Play ${song.title}`);

    if (currentlyPlaying && currentlyPlaying.id === song.id) {
      currentlyPlaying = null;
    }
    clearTimeout(autoStopTimer);
  };

  // Auto-stop after a short preview window (this is a demo, not a real stream)
  const autoStopTimer = setTimeout(stop, 6000);

  currentlyPlaying = { id: song.id, stop };
}

/* ---------------------------------------------------------
   11. AUTH — Log In / Sign Up modal with localStorage session
   (front-end only: no server, but the whole flow works)
   --------------------------------------------------------- */
function initAuth() {
  const overlay = document.getElementById('authOverlay');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const closeBtn = document.getElementById('authModalClose');
  const form = document.getElementById('authForm');
  const title = document.getElementById('authModalTitle');
  const sub = document.getElementById('authModalSub');
  const nameWrap = document.getElementById('authNameWrap');
  const nameInput = document.getElementById('authName');
  const emailInput = document.getElementById('authEmail');
  const passwordInput = document.getElementById('authPassword');
  const errorEl = document.getElementById('authError');
  const submitBtn = document.getElementById('authSubmit');
  const switchText = document.getElementById('authSwitchText');
  const switchBtn = document.getElementById('authSwitchBtn');

  const loggedOutActions = document.getElementById('navActionsLoggedOut');
  const loggedInActions = document.getElementById('navActionsLoggedIn');
  const greeting = document.getElementById('userGreeting');

  if (!overlay || !form) return;

  let mode = 'login'; // or 'signup'

  const setMode = (newMode) => {
    mode = newMode;
    errorEl.hidden = true;

    if (mode === 'signup') {
      title.textContent = 'Create Account';
      sub.textContent = 'Join Wavelength — free, no card required.';
      nameWrap.hidden = false;
      nameInput.required = true;
      submitBtn.textContent = 'Sign Up';
      switchText.textContent = 'Already have an account?';
      switchBtn.textContent = 'Log in';
    } else {
      title.textContent = 'Log In';
      sub.textContent = 'Welcome back to Wavelength.';
      nameWrap.hidden = true;
      nameInput.required = false;
      submitBtn.textContent = 'Log In';
      switchText.textContent = "Don't have an account?";
      switchBtn.textContent = 'Sign up';
    }
  };

  const openModal = (startMode) => {
    setMode(startMode);
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => emailInput.focus(), 50);
  };

  const closeModal = () => {
    overlay.hidden = true;
    document.body.style.overflow = '';
    form.reset();
    errorEl.hidden = true;
  };

  loginBtn?.addEventListener('click', () => openModal('login'));
  signupBtn?.addEventListener('click', () => openModal('signup'));
  closeBtn?.addEventListener('click', closeModal);
  switchBtn?.addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  const showError = (message) => {
    errorEl.textContent = message;
    errorEl.hidden = false;
  };

  const setLoggedInUI = (displayName) => {
    if (greeting) greeting.textContent = `Hi, ${displayName}`;
    if (loggedOutActions) loggedOutActions.hidden = true;
    if (loggedInActions) loggedInActions.hidden = false;
  };

  const setLoggedOutUI = () => {
    if (loggedOutActions) loggedOutActions.hidden = false;
    if (loggedInActions) loggedInActions.hidden = true;
  };

  // Restore session on load
  try {
    const savedUser = JSON.parse(localStorage.getItem('wavelength_user') || 'null');
    if (savedUser && savedUser.name) {
      setLoggedInUI(savedUser.name);
    }
  } catch (err) {
    /* localStorage unavailable or corrupted — stay logged out */
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !email.includes('@')) {
      showError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && !nameInput.value.trim()) {
      showError('Enter your name to sign up.');
      return;
    }

    const displayName = mode === 'signup' ? nameInput.value.trim() : email.split('@')[0];

    try {
      localStorage.setItem('wavelength_user', JSON.stringify({ name: displayName, email }));
    } catch (err) {
      /* storage unavailable — session just won't persist across reloads */
    }

    setLoggedInUI(displayName);
    closeModal();
    showToast(mode === 'signup' ? `Welcome to Wavelength, ${displayName}!` : `Welcome back, ${displayName}!`);
  });

  logoutBtn?.addEventListener('click', () => {
    try {
      localStorage.removeItem('wavelength_user');
    } catch (err) {
      /* ignore */
    }
    setLoggedOutUI();
    showToast('Logged out.');
  });
}

/* ---------------------------------------------------------
   12. HERO CTAs — wire "Start Listening" / "Explore Plans"
   --------------------------------------------------------- */
function initHeroCtas() {
  const startBtn = document.getElementById('heroStartBtn');
  const plansBtn = document.getElementById('heroPlansBtn');

  startBtn?.addEventListener('click', () => {
    const signupBtn = document.getElementById('signupBtn');
    const loggedIn = document.getElementById('navActionsLoggedIn');
    if (loggedIn && !loggedIn.hidden) {
      document.getElementById('search')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      signupBtn?.click();
    }
  });

  plansBtn?.addEventListener('click', () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ---------------------------------------------------------
   13. FEATURED ARTISTS — generative portrait strip
   --------------------------------------------------------- */
function initFeaturedArtists() {
  const row = document.getElementById('artistsRow');
  if (!row) return;

  const fragment = document.createDocumentFragment();
  ARTISTS.forEach((artist) => {
    const card = document.createElement('article');
    card.className = 'artist-card glass';

    const portrait = document.createElement('div');
    portrait.className = 'artist-portrait';
    const img = document.createElement('img');
    img.src = generatePortraitDataUrl(artist.seed, 160, getInitials(artist.name));
    img.alt = artist.name;
    img.loading = 'lazy';
    portrait.appendChild(img);

    const name = document.createElement('p');
    name.className = 'artist-name';
    name.textContent = artist.name;

    const genre = document.createElement('p');
    genre.className = 'artist-genre';
    genre.textContent = artist.genre;

    card.appendChild(portrait);
    card.appendChild(name);
    card.appendChild(genre);
    fragment.appendChild(card);
  });

  row.appendChild(fragment);
}

/* ---------------------------------------------------------
   14. TESTIMONIAL AVATARS — generative portraits in place
   of the gradient-only avatar slots
   --------------------------------------------------------- */
function initTestimonialAvatars() {
  document.querySelectorAll('.avatar-slot').forEach((slot) => {
    const seed = parseInt(slot.dataset.seed, 10) || 1;
    const card = slot.closest('.testimonial-card');
    const name = card?.dataset.name || '';
    const img = document.createElement('img');
    img.src = generatePortraitDataUrl(seed, 80, getInitials(name));
    img.alt = name;
    img.loading = 'lazy';
    slot.appendChild(img);
  });
}

/* ---------------------------------------------------------
   15. TOAST — lightweight feedback messages
   --------------------------------------------------------- */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('show'));

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.hidden = true;
    }, 300);
  }, 2800);
}
