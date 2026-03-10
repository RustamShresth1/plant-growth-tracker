/* ═══════════════════════════════════════════════════
   PLANTSCAN  ·  script.js
   Complete single-page application
   Pages: Landing, Login, Signup, Dashboard, Scan,
          IdentifyResult, AddPlant, PlantProfile,
          AddLog, PublicShare
════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════ */
const State = {
  currentUser: null,
  currentPage: 'landing',
  scanResult:  null,    // held between scan → identify → addPlant
  currentPlantId: null, // when viewing a plant profile

  // Demo users store
  users: [
    { id: 'u1', email: 'demo@plantscan.app', password: 'demo1234', username: 'GardenGuru' }
  ],

  // Demo plant data
  plants: [
    {
      id: 'p1', userId: 'u1',
      name: 'Monstera Deluxe', species: 'Monstera deliciosa',
      identifiedName: 'Monstera deliciosa', identifiedProb: 94,
      description: 'My pride and joy. Lives by the east-facing window.',
      imageEmoji: '🌿',
      currentStreak: 12, longestStreak: 19, lastLogDate: today(),
      logCount: 23, createdAt: daysAgo(45),
      shareToken: 'abc123xyz', isPublic: true,
    },
    {
      id: 'p2', userId: 'u1',
      name: 'Fiddle Leaf', species: 'Ficus lyrata',
      identifiedName: 'Ficus lyrata', identifiedProb: 88,
      description: 'Tricky but worth it.',
      imageEmoji: '🌳',
      currentStreak: 4, longestStreak: 11, lastLogDate: daysAgo(1),
      logCount: 9, createdAt: daysAgo(22),
      shareToken: 'ficus456', isPublic: false,
    },
    {
      id: 'p3', userId: 'u1',
      name: 'Pothos Hang', species: 'Epipremnum aureum',
      identifiedName: 'Epipremnum aureum', identifiedProb: 97,
      description: 'Hanging from the bookshelf. Almost unkillable.',
      imageEmoji: '🪴',
      currentStreak: 0, longestStreak: 7, lastLogDate: daysAgo(3),
      logCount: 5, createdAt: daysAgo(10),
      shareToken: '', isPublic: false,
    },
  ],

  // Demo growth logs
  logs: {
    p1: [
      { id: 'l1', plantId: 'p1', heightCm: 42, notes: 'New leaf unfurling! Looking healthy.', loggedAt: todayTime('09:15'), photoEmoji: null },
      { id: 'l2', plantId: 'p1', heightCm: 40, notes: 'Watered. Soil was quite dry.', loggedAt: daysAgoTime(1, '08:30'), photoEmoji: null },
      { id: 'l3', plantId: 'p1', heightCm: 38, notes: 'Rotated 90° toward light.', loggedAt: daysAgoTime(2, '10:00'), photoEmoji: null },
      { id: 'l4', plantId: 'p1', heightCm: 35, notes: 'Started this journal!', loggedAt: daysAgoTime(5, '14:22'), photoEmoji: null },
      { id: 'l5', plantId: 'p1', heightCm: 30, notes: 'Looking a little droopy. Gave it some water.', loggedAt: daysAgoTime(12, '11:00'), photoEmoji: null },
    ],
    p2: [
      { id: 'l6', plantId: 'p2', heightCm: 95, notes: 'Top leaves yellowing slightly.', loggedAt: daysAgoTime(1, '17:00'), photoEmoji: null },
      { id: 'l7', plantId: 'p2', heightCm: 90, notes: 'Repotted into bigger container.', loggedAt: daysAgoTime(7, '12:00'), photoEmoji: null },
    ],
    p3: [
      { id: 'l8', plantId: 'p3', heightCm: null, notes: 'Trailing nicely!', loggedAt: daysAgoTime(3, '09:00'), photoEmoji: null },
    ],
  },
};

/* ══════════════════════════════════════════════════
   DATE HELPERS
══════════════════════════════════════════════════ */
function today() {
  return new Date().toISOString().split('T')[0];
}
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function todayTime(time) {
  return `${today()}T${time}:00`;
}
function daysAgoTime(n, time) {
  return `${daysAgo(n)}T${time}:00`;
}
function formatDate(str) {
  const d = new Date(str);
  const t = new Date(); t.setHours(0,0,0,0);
  const y = new Date(t); y.setDate(t.getDate()-1);
  const dt = new Date(str); dt.setHours(0,0,0,0);
  if (dt.getTime() === t.getTime()) return 'Today';
  if (dt.getTime() === y.getTime()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(str) {
  return new Date(str).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function formatDateSince(str) {
  const d = Math.floor((Date.now() - new Date(str)) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

/* ══════════════════════════════════════════════════
   ROUTER / PAGE ENGINE
══════════════════════════════════════════════════ */
const app = document.getElementById('app');

function navigate(page, params = {}) {
  State.currentPage = page;
  Object.assign(State, params);
  renderNavbar();
  renderPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPage(page) {
  const renders = {
    landing:        renderLanding,
    login:          () => renderAuth('login'),
    signup:         () => renderAuth('signup'),
    dashboard:      renderDashboard,
    scan:           renderScan,
    identifyResult: renderIdentifyResult,
    addPlant:       renderAddPlant,
    plantProfile:   renderPlantProfile,
    addLog:         renderAddLog,
    publicShare:    renderPublicShare,
  };
  (renders[page] || renderLanding)();
}

/* ══════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════ */
function renderNavbar() {
  const links  = document.getElementById('navLinks');
  const actions = document.getElementById('navActions');
  const page = State.currentPage;

  if (State.currentUser) {
    document.body.classList.add('authed');
    links.innerHTML = `
      <a class="nav-link ${page==='dashboard'?'active':''}" data-page="dashboard">Dashboard</a>
      <a class="nav-link ${page==='scan'?'active':''}" data-page="scan">Scan Plant</a>
    `;
    actions.innerHTML = `
      <div class="nav-user">
        <div class="nav-avatar" title="${State.currentUser.username}">${State.currentUser.username[0].toUpperCase()}</div>
        <span class="nav-logout" id="navLogout">Logout</span>
      </div>
    `;
    document.getElementById('navLogout').addEventListener('click', () => {
      State.currentUser = null;
      document.body.classList.remove('authed');
      showToast('Logged out. See you soon! 🌿');
      navigate('landing');
    });
  } else {
    document.body.classList.remove('authed');
    links.innerHTML = '';
    actions.innerHTML = `
      <a class="btn-ghost nav-signin" data-page="login">Sign in</a>
      <a class="btn-primary nav-cta" data-page="signup">Get started</a>
    `;
  }
  bindNavLinks();
}

function bindNavLinks() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const page = el.dataset.page;
      if ((page === 'dashboard' || page === 'scan') && !State.currentUser) {
        navigate('login');
      } else {
        navigate(page);
      }
      closeMobileMenu();
    });
  });
}

// Navbar scroll shadow
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
});

// Hamburger
document.getElementById('hamburger').addEventListener('click', () => {
  const open = document.getElementById('hamburger').classList.toggle('open');
  const links = document.getElementById('navLinks');
  const actions = document.getElementById('navActions');
  links.classList.toggle('mobile-open', open);
  actions.classList.toggle('mobile-open', open);
});

function closeMobileMenu() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('navLinks').classList.remove('mobile-open');
  document.getElementById('navActions').classList.remove('mobile-open');
}

/* ══════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════ */
let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, 3000);
}

/* ══════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════ */
function showModal({ title, desc, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, danger = false }) {
  const overlay = document.getElementById('modalOverlay');
  const box     = document.getElementById('modalBox');
  box.innerHTML = `
    <h2 class="modal-title">${title}</h2>
    <p class="modal-desc">${desc}</p>
    <div class="modal-actions">
      <button class="btn-ghost" id="modalCancel">${cancelLabel}</button>
      <button class="${danger ? 'btn-danger' : 'btn-primary'}" id="modalConfirm">${confirmLabel}</button>
    </div>
  `;
  overlay.classList.remove('hidden');
  document.getElementById('modalCancel').addEventListener('click', () => overlay.classList.add('hidden'));
  document.getElementById('modalConfirm').addEventListener('click', () => {
    overlay.classList.add('hidden');
    if (onConfirm) onConfirm();
  });
}

/* ══════════════════════════════════════════════════
   PAGE: LANDING
══════════════════════════════════════════════════ */
function renderLanding() {
  app.innerHTML = `
    <div class="page">
      <!-- Hero -->
      <section class="landing-hero">
        <div class="container">
          <div class="hero-eyebrow">
            <span class="eyebrow-dot"></span>
            AI-Powered Plant Care
          </div>
          <h1 class="hero-title">Know your plants.<br><em>Watch them grow.</em></h1>
          <p class="hero-sub">Scan any plant for instant AI identification. Log daily growth. Build care streaks. Share your journey.</p>
          <div class="hero-ctas">
            <button class="btn-primary lg" id="heroSignup">Start for free</button>
            <button class="btn-ghost" id="heroLogin">Sign in →</button>
          </div>
          <div class="hero-deco">🌿 🌱 🪴</div>
        </div>
      </section>

      <!-- Features -->
      <section>
        <div class="container">
          <div class="features-grid">
            ${[
              { icon:'📸', title:'Snap & Identify', desc:'AI-powered plant identification in seconds. Get species, common names, and confidence scores.', delay:1 },
              { icon:'📈', title:'Track Growth', desc:'Log height and notes daily. Watch your plant grow over time on beautiful charts.', delay:2 },
              { icon:'🔥', title:'Build Streaks', desc:'Daily care logging builds your streak. Hit milestones at 7, 14, 30, and 100 days.', delay:3 },
              { icon:'🃏', title:'Share Progress', desc:'Generate a shareable card for any plant. Show off your green thumb.', delay:4 },
            ].map(f => `
              <div class="feature-card stagger-${f.delay}">
                <div class="feature-icon">${f.icon}</div>
                <h3 class="feature-title">${f.title}</h3>
                <p class="feature-desc">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Stats banner -->
      <section>
        <div class="container">
          <div class="stats-banner stagger-3">
            <div class="stat-item">
              <div class="stat-num">10K+</div>
              <div class="stat-label">PLANTS IDENTIFIED</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">500K</div>
              <div class="stat-label">GROWTH LOGS</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">98%</div>
              <div class="stat-label">ID ACCURACY</div>
            </div>
          </div>
        </div>
      </section>

      <footer class="landing-footer">PlantScan © ${new Date().getFullYear()} · Grow something beautiful.</footer>
    </div>
  `;

  document.getElementById('heroSignup').addEventListener('click', () => navigate('signup'));
  document.getElementById('heroLogin').addEventListener('click', () => navigate('login'));
}

/* ══════════════════════════════════════════════════
   PAGE: AUTH
══════════════════════════════════════════════════ */
function renderAuth(mode) {
  const isLogin = mode === 'login';
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-left-inner">
          <div class="auth-illustration">🌿</div>
          <h2 class="auth-left-title">PlantScan</h2>
          <p class="auth-left-desc">Your personal plant growth journal. Identify, track, and celebrate every plant in your life.</p>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form-wrap">
          <h1 class="auth-form-title">${isLogin ? 'Welcome back' : 'Create account'}</h1>
          <p class="auth-form-sub">
            ${isLogin ? "Don't have an account?" : 'Already have one?'}
            <a id="authSwitch">${isLogin ? 'Sign up free' : 'Sign in'}</a>
          </p>

          <div id="authError" class="auth-error hidden"></div>

          <div class="auth-form">
            ${!isLogin ? `
              <div class="form-group">
                <label class="form-label">Username</label>
                <input class="form-input" id="authUsername" type="text" placeholder="Your display name" autocomplete="nickname" />
              </div>
            ` : ''}
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" id="authEmail" type="email" placeholder="you@email.com" autocomplete="email" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-input" id="authPassword" type="password" placeholder="${isLogin ? '••••••••' : 'At least 8 characters'}" autocomplete="${isLogin ? 'current-password' : 'new-password'}" />
            </div>

            ${isLogin ? `
              <div class="auth-divider">or try demo</div>
              <button class="btn-outline w-full" id="demoLogin">🌱 Sign in as Demo User</button>
            ` : ''}

            <button class="btn-primary w-full" id="authSubmit" style="justify-content:center;padding:14px;">
              ${isLogin ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('authSwitch').addEventListener('click', () => navigate(isLogin ? 'signup' : 'login'));

  if (isLogin) {
    document.getElementById('demoLogin').addEventListener('click', () => {
      loginUser('demo@plantscan.app', 'demo1234');
    });
  }

  document.getElementById('authSubmit').addEventListener('click', () => {
    const email    = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const username = isLogin ? null : document.getElementById('authUsername').value.trim();

    const errEl = document.getElementById('authError');
    errEl.classList.add('hidden');

    if (!email || !password) {
      showError(errEl, 'Please fill in all fields.'); return;
    }
    if (!isLogin && !username) {
      showError(errEl, 'Please enter a username.'); return;
    }
    if (!isLogin && password.length < 8) {
      showError(errEl, 'Password must be at least 8 characters.'); return;
    }

    if (isLogin) {
      loginUser(email, password);
    } else {
      registerUser(email, password, username);
    }
  });

  // Enter key
  document.querySelectorAll('.form-input').forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('authSubmit').click(); });
  });
}

function loginUser(email, password) {
  const btn = document.getElementById('authSubmit');
  const errEl = document.getElementById('authError');
  if (!btn) { // demo login path
    const user = State.users.find(u => u.email === email && u.password === password);
    if (user) { State.currentUser = user; renderNavbar(); navigate('dashboard'); }
    return;
  }
  btn.classList.add('loading');
  setTimeout(() => {
    btn.classList.remove('loading');
    const user = State.users.find(u => u.email === email.toLowerCase() && u.password === password);
    if (user) {
      State.currentUser = user;
      renderNavbar();
      showToast(`Welcome back, ${user.username}! 🌿`, 'green');
      navigate('dashboard');
    } else {
      showError(errEl, 'Invalid email or password.');
    }
  }, 900);
}

function registerUser(email, password, username) {
  const btn = document.getElementById('authSubmit');
  const errEl = document.getElementById('authError');
  btn.classList.add('loading');
  setTimeout(() => {
    btn.classList.remove('loading');
    if (State.users.find(u => u.email === email.toLowerCase())) {
      showError(errEl, 'An account with this email already exists.'); return;
    }
    const newUser = { id: 'u' + Date.now(), email: email.toLowerCase(), password, username };
    State.users.push(newUser);
    State.currentUser = newUser;
    renderNavbar();
    showToast(`Welcome to PlantScan, ${username}! 🌱`, 'green');
    navigate('dashboard');
  }, 900);
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

/* ══════════════════════════════════════════════════
   PAGE: DASHBOARD
══════════════════════════════════════════════════ */
function renderDashboard() {
  if (!State.currentUser) { navigate('login'); return; }
  const plants = State.plants.filter(p => p.userId === State.currentUser.id);
  const totalStreak = plants.reduce((s, p) => s + (p.currentStreak || 0), 0);
  const totalLogs   = plants.reduce((s, p) => s + (p.logCount || 0), 0);

  app.innerHTML = `
    <div class="page dashboard-page">
      <div class="container">
        <div class="dashboard-header">
          <div>
            <p class="dashboard-greeting">Good ${timeOfDay()},</p>
            <h1 class="dashboard-title">${State.currentUser.username} 🌱</h1>
          </div>
          <button class="btn-primary" id="btnScanNew">+ Scan Plant</button>
        </div>

        ${plants.length > 0 ? `
          <div class="stats-row stagger-1">
            <div class="stat-card">
              <span class="stat-card-emoji">🪴</span>
              <div>
                <div class="stat-card-num">${plants.length}</div>
                <div class="stat-card-label">Plants</div>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-card-emoji">🔥</span>
              <div>
                <div class="stat-card-num green">${totalStreak}</div>
                <div class="stat-card-label">Total streak days</div>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-card-emoji">📓</span>
              <div>
                <div class="stat-card-num">${totalLogs}</div>
                <div class="stat-card-label">Total logs</div>
              </div>
            </div>
          </div>
        ` : ''}
function startApp() {
  alert("Plant scanner starting 🌱");
}

function signup() {
  alert("Signup coming soon!");
}
        <div class="plants-grid stagger-2" id="plantsGrid">
          ${plants.map(p => plantCardHTML(p)).join('')}

          <!-- Add ghost card -->
          <div class="plant-card-add" id="addPlantCard">
            <div class="plant-card-add-inner">
              <div class="plant-card-add-plus">＋</div>
              <div class="plant-card-add-label">Add plant</div>
            </div>
          </div>

          ${plants.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">🌱</div>
              <h3 class="empty-title">No plants yet</h3>
              <p class="empty-desc">Scan your first plant to start tracking its growth journey.</p>
              <button class="btn-primary" id="emptyScan">Scan your first plant</button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnScanNew').addEventListener('click', () => navigate('scan'));
  document.getElementById('addPlantCard').addEventListener('click', () => navigate('scan'));
  document.getElementById('emptyScan')?.addEventListener('click', () => navigate('scan'));

  // Plant card clicks
  plants.forEach(p => {
    document.getElementById(`plant-${p.id}`)?.addEventListener('click', () => {
      State.currentPlantId = p.id;
      navigate('plantProfile');
    });
  });
}

function plantCardHTML(plant) {
  const streakColor = plant.currentStreak >= 7 ? '#f59e0b' : plant.currentStreak > 0 ? '#4a9b6f' : '#a8a89e';
  const streakEmoji = plant.currentStreak >= 7 ? '🔥' : plant.currentStreak > 0 ? '🌱' : '💤';
  return `
    <div class="plant-card" id="plant-${plant.id}">
      <div class="plant-card-img">
        <div class="plant-card-emoji-placeholder">${plant.imageEmoji}</div>
        <div class="plant-streak-badge" style="color:${streakColor}">
          ${streakEmoji} <span>${plant.currentStreak}d</span>
        </div>
      </div>
      <div class="plant-card-body">
        <div class="plant-card-name">${plant.name}</div>
        <div class="plant-card-species">${plant.identifiedName || plant.species || 'Unknown species'}</div>
        <div class="plant-card-footer">
          <span class="plant-card-logs">📓 ${plant.logCount} ${plant.logCount === 1 ? 'log' : 'logs'}</span>
          <span class="plant-card-age">${formatDateSince(plant.createdAt)}</span>
        </div>
      </div>
    </div>
  `;
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/* ══════════════════════════════════════════════════
   PAGE: SCAN
══════════════════════════════════════════════════ */
function renderScan() {
  if (!State.currentUser) { navigate('login'); return; }

  app.innerHTML = `
    <div class="page scan-page">
      <div class="container-sm">
        <h1 class="scan-title stagger-1">Scan a Plant</h1>
        <p class="scan-sub stagger-2">Upload a clear photo to identify your plant with AI.</p>

        <div class="upload-zone stagger-2" id="uploadZone">
          <div class="upload-icon-wrap" id="uploadIconWrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6 2 3 8 3 14c0 4.4 3.6 8 9 8 2 0 4.5-.8 6-3 .8-1.2 1-2.5 1-4C19 8 16 2 12 2z" fill="#d0d0c8" opacity=".7"/>
              <path d="M12 20V12M9 15l3-3 3 3" stroke="#a8a89e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="upload-zone-title">Take or upload a plant photo</div>
          <div class="upload-zone-hint">Drag & drop or click to browse · JPG, PNG, WebP · max 10 MB</div>
          <img id="uploadPreview" style="display:none;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
          <div class="upload-overlay" id="uploadOverlay" style="display:none;">
            <span class="upload-change-label">Change photo</span>
          </div>
          <input type="file" id="fileInput" accept="image/*" style="display:none;" />
        </div>

        <div class="scan-tips stagger-3" id="scanTips">
          <p class="scan-tips-title">📷 Tips for best results</p>
          <ul class="scan-tips-list">
            <li>• Center the plant in frame</li>
            <li>• Use good natural lighting</li>
            <li>• Show leaves clearly</li>
          </ul>
        </div>

        <div id="scanError" class="auth-error hidden mb-16"></div>

        <div class="flex gap-8">
          <button class="btn-primary" id="btnIdentify" style="flex:1;justify-content:center;padding:14px;" disabled>
            🔍 Identify Plant
          </button>
          <button class="btn-ghost" id="btnClearScan" style="display:none;">Clear</button>
        </div>
      </div>
    </div>
  `;

  const zone    = document.getElementById('uploadZone');
  const fileIn  = document.getElementById('fileInput');
  const preview = document.getElementById('uploadPreview');
  const overlay = document.getElementById('uploadOverlay');
  const btnId   = document.getElementById('btnIdentify');
  const btnClr  = document.getElementById('btnClearScan');

  let selectedFile = null;

  zone.addEventListener('click', () => fileIn.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) setFile(f);
  });

  fileIn.addEventListener('change', () => {
    if (fileIn.files[0]) setFile(fileIn.files[0]);
  });

  function setFile(f) {
    selectedFile = f;
    const reader = new FileReader();
    reader.onload = ev => {
      preview.src = ev.target.result;
      preview.style.display = 'block';
      overlay.style.display = 'flex';
      document.getElementById('uploadIconWrap').style.display = 'none';
      zone.querySelector('.upload-zone-title').style.display = 'none';
      zone.querySelector('.upload-zone-hint').style.display = 'none';
      zone.classList.add('has-preview');
      document.getElementById('scanTips').style.display = 'none';
      btnId.disabled = false;
      btnClr.style.display = 'inline-flex';
    };
    reader.readAsDataURL(f);
  }

  btnClr.addEventListener('click', () => {
    selectedFile = null;
    preview.style.display = 'none';
    overlay.style.display = 'none';
    document.getElementById('uploadIconWrap').style.display = 'flex';
    zone.querySelector('.upload-zone-title').style.display = 'block';
    zone.querySelector('.upload-zone-hint').style.display = 'block';
    zone.classList.remove('has-preview');
    document.getElementById('scanTips').style.display = 'block';
    btnId.disabled = true;
    btnClr.style.display = 'none';
    fileIn.value = '';
  });

  btnId.addEventListener('click', () => {
    if (!selectedFile) {
      const e = document.getElementById('scanError');
      showError(e, 'Please select a photo first.'); return;
    }
    btnId.classList.add('loading');
    btnId.disabled = true;

    // Simulate AI identification
    setTimeout(() => {
      const results = [
        { name: 'Monstera deliciosa', prob: 94, common: ['Swiss Cheese Plant', 'Mexican Breadfruit'] },
        { name: 'Philodendron hederaceum', prob: 89, common: ['Heartleaf Philodendron'] },
        { name: 'Epipremnum aureum', prob: 97, common: ['Golden Pothos', 'Devils Ivy'] },
        { name: 'Ficus lyrata', prob: 88, common: ['Fiddle Leaf Fig'] },
        { name: 'Calathea orbifolia', prob: 91, common: ['Prayer Plant', 'Calathea'] },
        { name: 'Dracaena marginata', prob: 85, common: ['Dragon Tree', 'Madagascar Dragon Tree'] },
      ];
      const pick = results[Math.floor(Math.random() * results.length)];
      const others = results.filter(r => r !== pick).slice(0, 3).map(r => ({ name: r.name, prob: Math.floor(Math.random() * 25) + 10 }));

      State.scanResult = {
        imageUrl: preview.src,
        identifiedName: pick.name,
        identifiedProb: pick.prob,
        commonNames: pick.common,
        allSuggestions: others,
      };
      navigate('identifyResult');
    }, 1800);
  });
}

/* ══════════════════════════════════════════════════
   PAGE: IDENTIFY RESULT
══════════════════════════════════════════════════ */
function renderIdentifyResult() {
  if (!State.scanResult) { navigate('scan'); return; }
  const r = State.scanResult;

  app.innerHTML = `
    <div class="page identify-page">
      <div class="container-sm">
        <h1 class="identify-title stagger-1">Identification</h1>
        <p class="identify-sub stagger-2">Here's what our AI found.</p>

        <div class="identify-result-card stagger-2">
          <div class="identify-result-img">
            <img src="${r.imageUrl}" alt="Plant" />
          </div>
          <div class="identify-result-body">
            <div class="flex items-center justify-between gap-8" style="margin-bottom:4px;">
              <div class="identify-result-name">${r.identifiedName}</div>
              <span class="badge badge-green">${r.identifiedProb}% match</span>
            </div>
            <div class="identify-result-common">${r.commonNames.join(' · ')}</div>

            <div class="confidence-bar-wrap">
              <div class="confidence-label">
                <span>Confidence</span>
                <span>${r.identifiedProb}%</span>
              </div>
              <div class="confidence-bar">
                <div class="confidence-fill" id="confFill" style="width:0%"></div>
              </div>
            </div>

            ${r.allSuggestions.length ? `
              <div class="suggestions-title">Other possibilities</div>
              ${r.allSuggestions.map(s => `
                <div class="suggestion-item">
                  <span class="suggestion-name">${s.name}</span>
                  <span class="suggestion-prob">${s.prob}%</span>
                </div>
              `).join('')}
            ` : ''}
          </div>
        </div>

        <div class="flex gap-8 mt-16 stagger-3">
          <button class="btn-primary" id="btnSavePlant" style="flex:1;justify-content:center;padding:14px;">
            ✓ Save this plant
          </button>
          <button class="btn-ghost" id="btnRescan">Try again</button>
        </div>
      </div>
    </div>
  `;

  // Animate confidence bar
  setTimeout(() => {
    const fill = document.getElementById('confFill');
    if (fill) fill.style.width = r.identifiedProb + '%';
  }, 300);

  document.getElementById('btnSavePlant').addEventListener('click', () => navigate('addPlant'));
  document.getElementById('btnRescan').addEventListener('click', () => navigate('scan'));
}

/* ══════════════════════════════════════════════════
   PAGE: ADD PLANT
══════════════════════════════════════════════════ */
function renderAddPlant() {
  if (!State.currentUser) { navigate('login'); return; }
  const r = State.scanResult || {};

  app.innerHTML = `
    <div class="page add-plant-page">
      <div class="container-sm">
        <h1 class="add-plant-title stagger-1">Add Plant</h1>
        <p class="add-plant-sub stagger-2">Give your plant a name and fill in the details.</p>

        ${r.identifiedName ? `
          <div class="ai-notice stagger-2">
            <span class="ai-notice-icon">🔬</span>
            <div>
              <div class="ai-notice-title">AI Identified</div>
              <div class="ai-notice-desc">${r.identifiedName} · ${r.identifiedProb}% confidence</div>
            </div>
          </div>
        ` : ''}

        <div id="addPlantError" class="auth-error hidden mb-16"></div>

        <div class="add-plant-form stagger-3">
          <div class="form-group">
            <label class="form-label">Plant name *</label>
            <input class="form-input" id="plantName" type="text" value="${r.commonNames?.[0] || r.identifiedName || ''}" placeholder="e.g. My Monstera" />
          </div>
          <div class="form-group">
            <label class="form-label">Species</label>
            <input class="form-input" id="plantSpecies" type="text" value="${r.identifiedName || ''}" placeholder="e.g. Monstera deliciosa" />
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" id="plantDesc" rows="3" placeholder="Where it lives, when you got it…"></textarea>
          </div>
          <div class="flex gap-8 mt-8">
            <button class="btn-primary" id="btnCreatePlant" style="flex:1;justify-content:center;padding:14px;">Save Plant</button>
            <button class="btn-ghost" id="btnCancelAdd">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnCancelAdd').addEventListener('click', () => navigate('dashboard'));
  document.getElementById('btnCreatePlant').addEventListener('click', () => {
    const name = document.getElementById('plantName').value.trim();
    const species = document.getElementById('plantSpecies').value.trim();
    const desc = document.getElementById('plantDesc').value.trim();
    const errEl = document.getElementById('addPlantError');

    if (!name) { showError(errEl, 'Plant name is required.'); return; }

    const btn = document.getElementById('btnCreatePlant');
    btn.classList.add('loading'); btn.disabled = true;

    setTimeout(() => {
      const emojis = ['🌿','🌱','🪴','🌳','🌸','🌺','🌼','🌻'];
      const newPlant = {
        id: 'p' + Date.now(),
        userId: State.currentUser.id,
        name, species, description: desc,
        identifiedName: r.identifiedName || species || null,
        identifiedProb: r.identifiedProb || null,
        imageEmoji: emojis[Math.floor(Math.random() * emojis.length)],
        currentStreak: 0, longestStreak: 0, lastLogDate: null,
        logCount: 0, createdAt: today(),
        shareToken: '', isPublic: false,
      };
      State.plants.push(newPlant);
      if (!State.logs[newPlant.id]) State.logs[newPlant.id] = [];
      State.scanResult = null;
      State.currentPlantId = newPlant.id;
      showToast(`${name} added to your garden! 🌱`, 'green');
      navigate('plantProfile');
    }, 800);
  });
}

/* ══════════════════════════════════════════════════
   PAGE: PLANT PROFILE
══════════════════════════════════════════════════ */
function renderPlantProfile() {
  if (!State.currentUser || !State.currentPlantId) { navigate('dashboard'); return; }
  const plant = State.plants.find(p => p.id === State.currentPlantId);
  if (!plant) { navigate('dashboard'); return; }

  const logs  = State.logs[plant.id] || [];
  const growthLogs = logs.filter(l => l.heightCm !== null).sort((a,b) => new Date(a.loggedAt)-new Date(b.loggedAt));
  const streak = plant.currentStreak || 0;
  const milestones = [3,7,14,30,60,100];
  const nextM = milestones.find(m => m > streak) || null;
  const progress = nextM ? Math.round((streak / nextM) * 100) : 100;
  const streakClass = streak >= 7 ? 'amber' : streak > 0 ? 'green' : 'gray';
  const streakEmoji = streak >= 7 ? '🔥' : streak > 0 ? '🌱' : '💤';

  // Current height + total growth
  const heights = growthLogs.map(l => parseFloat(l.heightCm));
  const currentH = heights.length ? heights[heights.length-1] : null;
  const totalG   = heights.length >= 2 ? (heights[heights.length-1] - heights[0]).toFixed(1) : null;

  app.innerHTML = `
    <div class="page plant-profile-page">
      <div class="container">
        <div class="back-link" id="backToDash">← Dashboard</div>

        <div class="profile-grid">
          <!-- LEFT -->
          <div class="profile-left">
            <!-- Plant info card -->
            <div class="plant-info-card stagger-1">
              <div class="plant-info-hero">
                <div class="plant-info-hero-placeholder">${plant.imageEmoji}</div>
              </div>
              <div class="plant-info-body">
                <div class="flex items-center justify-between gap-8">
                  <div class="plant-info-name">${plant.name}</div>
                  ${plant.identifiedProb ? `<span class="badge badge-green">${plant.identifiedProb}%</span>` : ''}
                </div>
                ${plant.identifiedName ? `<div class="plant-info-species">${plant.identifiedName}</div>` : ''}
                ${plant.description ? `<div class="plant-info-desc">${plant.description}</div>` : ''}
                <div class="plant-info-meta">
                  <span>📅 Added ${formatDate(plant.createdAt)}</span>
                  ${plant.identifiedName ? '<span>·</span><span>🔬 AI identified</span>' : ''}
                </div>
              </div>
            </div>

            <!-- Streak card -->
            <div class="streak-card stagger-2">
              <div class="streak-card-title">Care Streak</div>
              <div class="streak-hero">
                <div class="streak-icon ${streakClass}">${streakEmoji}</div>
                <div>
                  <div class="streak-count">${streak}<span>days</span></div>
                  <div class="streak-sub">current streak</div>
                </div>
              </div>

              ${nextM ? `
                <div class="streak-progress-wrap">
                  <div class="streak-progress-label">
                    <span>Progress to ${nextM}-day milestone</span>
                    <span>${streak}/${nextM}</span>
                  </div>
                  <div class="streak-bar">
                    <div class="streak-bar-fill" style="width:${progress}%"></div>
                  </div>
                </div>
              ` : `<div class="mb-16"><span class="badge badge-amber">🏆 All milestones reached!</span></div>`}

              <div class="streak-stats">
                <div>
                  <div class="streak-stat-num">${plant.longestStreak}d</div>
                  <div class="streak-stat-label">Best streak</div>
                </div>
                <div class="streak-stat-divider"></div>
                <div>
                  <div class="streak-stat-num">${streak === 0 ? 'Start today!' : streak >= 7 ? 'On fire 🔥' : 'Growing 🌱'}</div>
                  <div class="streak-stat-label">Status</div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="profile-actions stagger-3">
              <button class="btn-primary" id="btnAddLog" style="justify-content:center;">📓 Add Today's Log</button>
              <button class="btn-danger" id="btnDeletePlant">Delete plant</button>
            </div>
          </div>

          <!-- RIGHT -->
          <div class="profile-right">
            <!-- Tabs -->
            <div class="tab-bar stagger-1" id="tabBar">
              <button class="tab-btn active" data-tab="timeline">Timeline</button>
              <button class="tab-btn" data-tab="growth">Growth</button>
              <button class="tab-btn" data-tab="share">Share</button>
            </div>

            <!-- TIMELINE TAB -->
            <div class="tab-panel active" id="tab-timeline">
              <div class="timeline-card">
                <div class="timeline-header">
                  <span class="timeline-header-title">Growth Timeline</span>
                  <button class="btn-secondary sm" id="btnAddLog2">+ Log</button>
                </div>
                ${renderTimeline(logs)}
              </div>
            </div>

            <!-- GROWTH TAB -->
            <div class="tab-panel" id="tab-growth">
              <div class="chart-card">
                <div class="chart-card-header">
                  <div class="chart-card-title">Height Over Time</div>
                  <div class="chart-stats">
                    ${currentH !== null ? `<div><div class="chart-stat-val">${currentH}cm</div><div class="chart-stat-lbl">Now</div></div>` : ''}
                    ${totalG !== null ? `<div><div class="chart-stat-val green">+${totalG}cm</div><div class="chart-stat-lbl">Total growth</div></div>` : ''}
                  </div>
                </div>
                ${heights.length >= 2
                  ? `<div class="chart-wrap"><canvas id="growthChart"></canvas></div>`
                  : `<div class="chart-empty"><div class="chart-empty-icon">📏</div><div class="chart-empty-text">Log height in 2+ entries<br>to see your plant's growth chart.</div></div>`
                }
              </div>
            </div>

            <!-- SHARE TAB -->
            <div class="tab-panel" id="tab-share">
              <div class="share-panel-card">
                <div class="share-panel-title">Share Progress</div>

                <!-- Visual card -->
                <div class="share-visual-card" id="shareVisualCard">
                  <div class="share-vc-body">
                    <div class="share-vc-header">
                      <div class="share-vc-img">${plant.imageEmoji}</div>
                      <div>
                        <div class="share-vc-name">${plant.name}</div>
                        <div class="share-vc-species">${plant.identifiedName || plant.species || 'My plant'}</div>
                      </div>
                      <div class="share-vc-brand">PlantScan</div>
                    </div>
                    <div class="share-vc-stats">
                      <div class="share-vc-stat">
                        <div class="share-vc-stat-emoji">📏</div>
                        <div class="share-vc-stat-val">${currentH !== null ? currentH + 'cm' : '—'}</div>
                        <div class="share-vc-stat-lbl">Height</div>
                      </div>
                      <div class="share-vc-stat">
                        <div class="share-vc-stat-emoji">📈</div>
                        <div class="share-vc-stat-val green">${totalG !== null ? '+' + totalG + 'cm' : '—'}</div>
                        <div class="share-vc-stat-lbl">Growth</div>
                      </div>
                      <div class="share-vc-stat">
                        <div class="share-vc-stat-emoji">🔥</div>
                        <div class="share-vc-stat-val">${streak}d</div>
                        <div class="share-vc-stat-lbl">Streak</div>
                      </div>
                    </div>
                  </div>
                </div>

                ${plant.isPublic && plant.shareToken ? `
                  <div class="share-link-row">
                    <div class="share-link-input" id="shareLinkDisplay">plantscan.app/share/${plant.shareToken}</div>
                    <button class="btn-secondary sm" id="btnCopyLink">Copy</button>
                  </div>
                  <div class="share-actions">
                    <button class="btn-ghost" id="btnViewShare" style="font-size:.8rem;">👁 View public page</button>
                    <button class="btn-ghost" id="btnDownloadCard" style="font-size:.8rem;">⬇ Download card</button>
                  </div>
                ` : `
                  <div class="share-actions">
                    <button class="btn-secondary" id="btnEnableShare" style="justify-content:center;width:100%;">🌐 Create share link</button>
                    <button class="btn-ghost" id="btnDownloadCard" style="font-size:.8rem;width:100%;justify-content:center;">⬇ Download card</button>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Back link
  document.getElementById('backToDash').addEventListener('click', () => navigate('dashboard'));

  // Add log buttons
  document.getElementById('btnAddLog').addEventListener('click', () => navigate('addLog'));
  document.getElementById('btnAddLog2')?.addEventListener('click', () => navigate('addLog'));

  // Delete plant
  document.getElementById('btnDeletePlant').addEventListener('click', () => {
    showModal({
      title: `Delete "${plant.name}"?`,
      desc: 'This will permanently delete all logs and streak data. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        State.plants = State.plants.filter(p => p.id !== plant.id);
        delete State.logs[plant.id];
        showToast('Plant deleted.');
        navigate('dashboard');
      }
    });
  });

  // Tabs
  document.getElementById('tabBar').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Draw chart when growth tab becomes active
    if (tabId === 'growth' && heights.length >= 2) {
      setTimeout(() => drawGrowthChart(growthLogs), 50);
    }
  });

  // Share actions
  document.getElementById('btnEnableShare')?.addEventListener('click', () => {
    plant.shareToken = Math.random().toString(36).slice(2,10);
    plant.isPublic = true;
    showToast('Share link created! 🔗', 'green');
    navigate('plantProfile'); // re-render
  });

  document.getElementById('btnCopyLink')?.addEventListener('click', () => {
    showToast('Link copied to clipboard! 📋', 'green');
  });

  document.getElementById('btnViewShare')?.addEventListener('click', () => {
    State.shareToken = plant.shareToken;
    navigate('publicShare');
  });

  document.getElementById('btnDownloadCard')?.addEventListener('click', () => {
    showToast('Card downloaded! 🃏', 'green');
  });
}

function renderTimeline(logs) {
  if (!logs.length) {
    return `<div class="text-center" style="padding:40px 0;color:var(--stone-400);">
      <div style="font-size:2rem;margin-bottom:10px;">📓</div>
      <div style="font-size:.875rem;">No logs yet. Add your first entry!</div>
    </div>`;
  }

  // Group by date
  const grouped = {};
  logs.forEach(log => {
    const date = new Date(log.loggedAt).toDateString();
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });

  // Sort dates newest first
  const sortedDates = Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a));

  return sortedDates.map(dateKey => {
    const dayLogs = grouped[dateKey];
    return `
      <div class="timeline-date-group">
        <div class="timeline-date-label">${formatDate(dayLogs[0].loggedAt)}</div>
        ${dayLogs.map((log, i) => `
          <div class="timeline-entry">
            <div class="timeline-dot-col">
              <div class="timeline-dot"></div>
              ${i < dayLogs.length - 1 ? '<div class="timeline-line"></div>' : ''}
            </div>
            <div class="timeline-content">
              <div class="timeline-meta">
                ${log.heightCm ? `<span class="badge badge-green">📏 ${log.heightCm} cm</span>` : ''}
                <span class="timeline-time">${formatTime(log.loggedAt)}</span>
              </div>
              ${log.notes ? `<div class="timeline-note">${log.notes}</div>` : '<div class="timeline-note" style="color:var(--stone-300);font-style:italic;">No notes</div>'}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

function drawGrowthChart(logs) {
  const canvas = document.getElementById('growthChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Set canvas resolution
  const wrap = canvas.parentElement;
  canvas.width  = wrap.offsetWidth * window.devicePixelRatio;
  canvas.height = wrap.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  const W = wrap.offsetWidth, H = wrap.offsetHeight;

  const data = logs.map(l => ({ date: new Date(l.loggedAt), h: parseFloat(l.heightCm) }));
  const minH = Math.min(...data.map(d => d.h));
  const maxH = Math.max(...data.map(d => d.h));
  const pad  = { t: 16, r: 20, b: 36, l: 44 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = pad.t + (chartH / steps) * i;
    const val = maxH - ((maxH - minH) / steps) * i;
    ctx.beginPath();
    ctx.strokeStyle = '#f4f4f0';
    ctx.lineWidth = 1;
    ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y);
    ctx.stroke();
    ctx.fillStyle = '#a8a89e';
    ctx.font = `10px 'DM Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(0) + 'cm', pad.l - 8, y + 4);
  }

  // X labels
  data.forEach((d, i) => {
    const x = pad.l + (chartW / (data.length - 1)) * i;
    const label = d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    ctx.fillStyle = '#a8a89e';
    ctx.font = `10px 'DM Mono', monospace`;
    ctx.textAlign = 'center';
    if (i === 0 || i === data.length - 1 || (data.length <= 6)) {
      ctx.fillText(label, x, H - 8);
    }
  });

  // Map value → y
  const toY = h => {
    if (maxH === minH) return pad.t + chartH / 2;
    return pad.t + chartH - ((h - minH) / (maxH - minH)) * chartH;
  };
  const toX = i => pad.l + (chartW / (data.length - 1)) * i;

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, 'rgba(74,155,111,0.18)');
  grad.addColorStop(1, 'rgba(74,155,111,0)');
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(data[0].h));
  data.forEach((d, i) => {
    if (i === 0) return;
    const px = toX(i-1), py = toY(data[i-1].h);
    const cx = toX(i),   cy = toY(d.h);
    const cpx = (px + cx) / 2;
    ctx.bezierCurveTo(cpx, py, cpx, cy, cx, cy);
  });
  ctx.lineTo(toX(data.length-1), H - pad.b);
  ctx.lineTo(toX(0), H - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#4a9b6f';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  data.forEach((d, i) => {
    if (i === 0) { ctx.moveTo(toX(0), toY(d.h)); return; }
    const px = toX(i-1), py = toY(data[i-1].h);
    const cx = toX(i),   cy = toY(d.h);
    const cpx = (px + cx) / 2;
    ctx.bezierCurveTo(cpx, py, cpx, cy, cx, cy);
  });
  ctx.stroke();

  // Points
  data.forEach((d, i) => {
    const x = toX(i), y = toY(d.h);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#4a9b6f';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

/* ══════════════════════════════════════════════════
   PAGE: ADD LOG
══════════════════════════════════════════════════ */
function renderAddLog() {
  if (!State.currentUser || !State.currentPlantId) { navigate('dashboard'); return; }
  const plant = State.plants.find(p => p.id === State.currentPlantId);
  if (!plant) { navigate('dashboard'); return; }

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  app.innerHTML = `
    <div class="page add-log-page">
      <div class="container-sm">
        <div class="back-link" id="backToProfile">← ${plant.name}</div>
        <h1 class="add-log-title stagger-1">Daily Log</h1>
        <p class="add-log-date stagger-1">${dateLabel}</p>

        <div class="streak-reminder stagger-2">
          <span class="streak-reminder-icon">🔥</span>
          <span class="streak-reminder-text">Logging today keeps your care streak alive! Current streak: <strong>${plant.currentStreak} days</strong></span>
        </div>

        <div id="logError" class="auth-error hidden mb-16"></div>

        <div class="add-log-form stagger-3">
          <div class="form-group">
            <label class="form-label">Height (cm)</label>
            <input class="form-input" id="logHeight" type="number" step="0.1" min="0" placeholder="e.g. 24.5" />
            <span class="form-hint">Leave blank if you're not measuring today</span>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" id="logNotes" rows="4" placeholder="How does your plant look today? New leaves? Changed watering?"></textarea>
          </div>

          <div class="flex gap-8 mt-16">
            <button class="btn-primary" id="btnSaveLog" style="flex:1;justify-content:center;padding:14px;">Save Log</button>
            <button class="btn-ghost" id="btnCancelLog">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backToProfile').addEventListener('click', () => navigate('plantProfile'));
  document.getElementById('btnCancelLog').addEventListener('click', () => navigate('plantProfile'));

  document.getElementById('btnSaveLog').addEventListener('click', () => {
    const height = document.getElementById('logHeight').value;
    const notes  = document.getElementById('logNotes').value.trim();
    const errEl  = document.getElementById('logError');

    if (!height && !notes) {
      showError(errEl, 'Add at least a height or a note.'); return;
    }

    const btn = document.getElementById('btnSaveLog');
    btn.classList.add('loading'); btn.disabled = true;

    setTimeout(() => {
      const newLog = {
        id: 'l' + Date.now(),
        plantId: plant.id,
        heightCm: height ? parseFloat(height) : null,
        notes: notes || null,
        loggedAt: new Date().toISOString(),
      };

      if (!State.logs[plant.id]) State.logs[plant.id] = [];
      State.logs[plant.id].unshift(newLog);
      plant.logCount++;

      // Streak logic
      const todayStr = today();
      if (plant.lastLogDate === todayStr) {
        // already logged today
      } else if (plant.lastLogDate === daysAgo(1)) {
        plant.currentStreak++;
      } else {
        plant.currentStreak = 1;
      }
      plant.longestStreak = Math.max(plant.longestStreak, plant.currentStreak);
      plant.lastLogDate = todayStr;

      showToast(`Log saved! 🌱 Streak: ${plant.currentStreak} days 🔥`, 'green');
      navigate('plantProfile');
    }, 700);
  });
}

/* ══════════════════════════════════════════════════
   PAGE: PUBLIC SHARE
══════════════════════════════════════════════════ */
function renderPublicShare() {
  const token = State.shareToken;
  const plant = token
    ? State.plants.find(p => p.shareToken === token && p.isPublic)
    : null;

  if (!plant) {
    app.innerHTML = `
      <div class="page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;text-align:center;padding:40px 24px;">
        <div style="font-size:3rem;margin-bottom:16px;">🌵</div>
        <h2 style="font-family:var(--font-display);font-size:1.5rem;color:var(--stone-700);margin-bottom:8px;">Oops</h2>
        <p style="color:var(--stone-400);margin-bottom:24px;">This share link is invalid or the plant is private.</p>
        <button class="btn-primary" id="shareBackHome">← Back to PlantScan</button>
      </div>
    `;
    document.getElementById('shareBackHome').addEventListener('click', () => navigate('landing'));
    return;
  }

  const logs = State.logs[plant.id] || [];
  const growthLogs = logs.filter(l => l.heightCm !== null);
  const heights = growthLogs.map(l => parseFloat(l.heightCm));
  const currentH = heights.length ? heights[heights.length-1] : null;
  const totalG   = heights.length >= 2 ? (heights[heights.length-1] - heights[0]).toFixed(1) : null;

  app.innerHTML = `
    <div class="share-page">
      <div class="share-page-brand" id="shareBrandBack">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6 2 3 8 3 14c0 4.4 3.6 8 9 8 2 0 4.5-.8 6-3 .8-1.2 1-2.5 1-4C19 8 16 2 12 2z" fill="#4a9b6f"/>
        </svg>
        PlantScan
      </div>

      <div class="share-main-card">
        <div class="share-card-hero">
          <div class="share-card-hero-placeholder">${plant.imageEmoji}</div>
        </div>
        <div class="share-card-body">
          <div class="share-card-owner">shared by @${State.users.find(u=>u.id===plant.userId)?.username || 'gardener'}</div>
          <div class="share-card-name">${plant.name}</div>
          <div class="share-card-species">${plant.identifiedName || plant.species || ''}</div>
          <div class="share-card-stats">
            <div class="share-card-stat">
              <div class="share-card-stat-emoji">📏</div>
              <div class="share-card-stat-val">${currentH !== null ? currentH + 'cm' : '—'}</div>
              <div class="share-card-stat-lbl">Height</div>
            </div>
            <div class="share-card-stat">
              <div class="share-card-stat-emoji">📈</div>
              <div class="share-card-stat-val green">${totalG !== null ? '+' + totalG + 'cm' : '—'}</div>
              <div class="share-card-stat-lbl">Growth</div>
            </div>
            <div class="share-card-stat">
              <div class="share-card-stat-emoji">🔥</div>
              <div class="share-card-stat-val">${plant.currentStreak}d</div>
              <div class="share-card-stat-lbl">Streak</div>
            </div>
          </div>
          <div class="share-card-logs-count">${logs.length} care logs recorded</div>
        </div>
      </div>

      <div class="share-page-cta">
        <p class="share-page-cta-text">Track your own plants with PlantScan</p>
        <button class="btn-primary lg" id="shareSignupCTA">Start for free →</button>
      </div>
    </div>
  `;

  document.getElementById('shareBrandBack').addEventListener('click', () => navigate('landing'));
  document.getElementById('shareSignupCTA').addEventListener('click', () => navigate('signup'));
}

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
renderNavbar();
renderPage('landing');
