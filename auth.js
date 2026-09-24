/**
 * SPORTS STATION - AUTHENTICATION MODULE
 * Manages user login state, header auth UI (Login / Profile), and session storage.
 */

(function () {
  const STORAGE_KEY = 'sportsstation_user';

  /**
   * Get currently logged-in user
   * @returns {Object|null}
   */
  function getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading auth storage:', e);
      return null;
    }
  }

  /**
   * Save user session and notify listeners
   */
  function saveUser(user) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('sportsstation_auth_changed', { detail: { user } }));
      updateAllAuthUI();
    } catch (e) {
      console.error('Error saving auth storage:', e);
    }
  }

  /**
   * Log out user
   */
  function logoutUser() {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('sportsstation_auth_changed', { detail: { user: null } }));
    updateAllAuthUI();
    showAuthToast('Berhasil keluar dari akun.');
  }

  /**
   * Log in with Email & Password
   */
  function loginWithCredentials(email, password, remember = true) {
    if (!email || !password) {
      return { success: false, message: 'Email dan kata sandi wajib diisi.' };
    }

    const cleanId = String(email).trim().toLowerCase();
    const cleanPw = String(password).trim();

    // Check for Admin credentials (username: admin, password: admin123)
    if ((cleanId === 'admin' || cleanId === 'admin@sportsstation.id') && cleanPw === 'admin123') {
      const adminUser = {
        name: 'Administrator',
        email: 'admin@sportsstation.id',
        role: 'admin',
        memberId: 'SS-ADMIN-01',
        isLoggedIn: true
      };
      saveUser(adminUser);
      return { success: true, user: adminUser, isAdmin: true };
    }

    // Generate name from email username
    const username = cleanId.includes('@') ? cleanId.split('@')[0] : cleanId;
    const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
    
    const user = {
      name: formattedName,
      email: cleanId.includes('@') ? cleanId : `${cleanId}@sportsstation.id`,
      role: 'customer',
      memberId: 'SS-' + Math.floor(100000 + Math.random() * 900000),
      isLoggedIn: true
    };
    saveUser(user);

    // Sync ke Supabase Auth & public.profiles
    syncAuthWithSupabase('login', user.email, cleanPw, user.name, user.role);

    return { success: true, user, isAdmin: false };
  }

  /**
   * Register new account
   */
  function registerAccount(name, email, password) {
    if (!name || !email || !password) {
      return { success: false, message: 'Semua kolom wajib diisi.' };
    }
    const user = {
      name: name,
      email: email,
      memberId: 'SS-' + Math.floor(100000 + Math.random() * 900000),
      points: 100,
      isLoggedIn: true
    };
    saveUser(user);

    // Sync ke Supabase Auth & public.profiles
    syncAuthWithSupabase('register', email, password, name, 'customer');

    return { success: true, user };
  }

  /**
   * Sinkronisasi data user & profile ke Supabase Cloud
   */
  function syncAuthWithSupabase(action, email, password, name, role) {
    if (!window.SportsStationDB || !window.SportsStationDB.isConfigured()) return;
    const sb = window.SportsStationDB.getClient();
    if (!sb) return;

    if (action === 'register') {
      sb.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: name, role: role || 'customer' } }
      }).then(({ data, error }) => {
        if (data && data.user) {
          sb.from('profiles').upsert({
            id: data.user.id,
            email: email,
            full_name: name,
            role: role || 'customer'
          }).then(() => console.log('✅ Profil Supabase tersimpan:', email))
            .catch(err => console.warn('Gagal upsert profile di Supabase:', err));
        }
      }).catch(err => console.warn('Supabase signUp error:', err));
    } else if (action === 'login') {
      sb.auth.signInWithPassword({ email: email, password: password })
        .then(({ data, error }) => {
          if (data && data.user) {
            sb.from('profiles').select('*').eq('id', data.user.id).single()
              .then(({ data: prof }) => {
                if (prof) {
                  const currentUser = getCurrentUser();
                  if (currentUser) {
                    currentUser.name = prof.full_name || currentUser.name;
                    currentUser.phone = prof.phone || currentUser.phone;
                    currentUser.address = prof.address || currentUser.address;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
                    updateAllAuthUI();
                  }
                } else {
                  // Profil belum ada, buatkan
                  sb.from('profiles').upsert({
                    id: data.user.id,
                    email: email,
                    full_name: name || email.split('@')[0],
                    role: role || 'customer'
                  });
                }
              });
          } else if (error) {
            // Jika akun belum ada di Supabase Auth, otomatis daftarkan
            sb.auth.signUp({
              email: email,
              password: password,
              options: { data: { full_name: name || email.split('@')[0], role: role || 'customer' } }
            }).then(({ data: suData }) => {
              if (suData && suData.user) {
                sb.from('profiles').upsert({
                  id: suData.user.id,
                  email: email,
                  full_name: name || email.split('@')[0],
                  role: role || 'customer'
                });
              }
            });
          }
        });
    }
  }

  function checkAndSyncLoggedInProfile() {
    const user = getCurrentUser();
    if (!user || !user.email) return;
    if (!window.SportsStationDB || !window.SportsStationDB.isConfigured()) return;
    const sb = window.SportsStationDB.getClient();
    if (!sb) return;

    sb.from('profiles').select('id, email, full_name').eq('email', user.email).then(({ data, error }) => {
      if (!error && (!data || data.length === 0)) {
        sb.auth.getUser().then(({ data: authData }) => {
          if (authData && authData.user) {
            sb.from('profiles').upsert({
              id: authData.user.id,
              email: user.email,
              full_name: user.name || 'Sports Station Member',
              role: user.role || 'customer'
            });
          }
        });
      }
    });
  }

  /**
   * Helper to display a lightweight toast notification
   */
  function showAuthToast(message) {
    if (typeof window.showToast === 'function') {
      window.showToast(message);
      return;
    }
    let toast = document.querySelector('.sports-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'sports-toast';
      document.body.appendChild(toast);
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        backgroundColor: '#1f2937',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        fontSize: '13px',
        fontWeight: '500',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateY(10px)',
        transition: 'all 0.3s ease',
        pointerEvents: 'none',
        borderLeft: '4px solid #f26522',
        maxWidth: '320px'
      });
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 3200);
  }

  /**
   * Render the Login / Profile button in header action slot
   */
  function updateAllAuthUI() {
    const user = getCurrentUser();
    const authSlots = document.querySelectorAll('.header-auth-slot');

    authSlots.forEach((slot) => {
      if (!user) {
        // Not logged in: Show "Login"
        slot.innerHTML = `
          <a href="login.html" class="header-auth-btn" id="headerAuthBtn" title="Masuk ke Akun">
            <i class="fa-regular fa-user"></i>
            <span class="auth-btn-label">Login</span>
          </a>
        `;
      } else {
        // Logged in: Show "Profile" with dropdown
        slot.innerHTML = `
          <div class="header-profile-menu" id="headerProfileMenu">
            <button class="header-profile-trigger" id="profileTriggerBtn" aria-haspopup="true" aria-expanded="false" title="Menu Akun">
              <i class="fa-solid fa-circle-user profile-icon"></i>
              <span class="profile-btn-label">Profile</span>
              <i class="fa-solid fa-chevron-down profile-chevron"></i>
            </button>
            <div class="profile-dropdown-panel" id="profileDropdownPanel">
              <div class="profile-user-summary">
                <div class="profile-avatar-circle">
                  ${user.name.charAt(0).toUpperCase()}
                </div>
                <div class="profile-user-details">
                  <span class="profile-user-name">${user.name}</span>
                  <span class="profile-user-email">${user.email}</span>
                </div>
              </div>
              <div class="profile-menu-divider"></div>
              <ul class="profile-links-list">
                ${user.role === 'admin' ? `
                <li>
                  <a href="admin.html" class="profile-menu-item" style="color: #f95a00; font-weight: 600;">
                    <i class="fa-solid fa-chart-line" style="color: #f95a00;"></i>
                    <span>Dashboard Admin</span>
                  </a>
                </li>
                ` : ''}
                <li>
                  <a href="#" class="profile-menu-item" onclick="event.preventDefault(); window.showAuthToast && window.showAuthToast('Fitur profil akun');">
                    <i class="fa-regular fa-id-card"></i>
                    <span>Akun Saya</span>
                  </a>
                </li>
                <li>
                  <a href="orders.html" class="profile-menu-item">
                    <i class="fa-solid fa-bag-shopping"></i>
                    <span>Pesanan Saya</span>
                  </a>
                </li>
              </ul>
              <div class="profile-menu-divider"></div>
              <button class="profile-logout-btn" id="logoutActionBtn" type="button">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                <span>Keluar</span>
              </button>
            </div>
          </div>
        `;

        // Profile Dropdown Toggle
        const trigger = slot.querySelector('#profileTriggerBtn');
        const panel = slot.querySelector('#profileDropdownPanel');
        const logoutBtn = slot.querySelector('#logoutActionBtn');

        if (trigger && panel) {
          trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = panel.classList.contains('active');
            // Close any other open dropdowns
            document.querySelectorAll('.profile-dropdown-panel.active').forEach(p => p.classList.remove('active'));
            if (!isOpen) {
              panel.classList.add('active');
              trigger.setAttribute('aria-expanded', 'true');
            } else {
              panel.classList.remove('active');
              trigger.setAttribute('aria-expanded', 'false');
            }
          });
        }

        if (logoutBtn) {
          logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            logoutUser();
          });
        }
      }
    });

    // Also update top-bar "Sign In" text if present
    const topBarSignIn = document.querySelectorAll('.top-bar-signin');
    topBarSignIn.forEach((elem) => {
      if (user) {
        elem.innerHTML = `Halo, ${user.name}`;
        elem.href = '#';
        elem.onclick = (e) => {
          e.preventDefault();
          const trigger = document.getElementById('profileTriggerBtn');
          if (trigger) trigger.click();
        };
      } else {
        elem.innerHTML = `Sign In`;
        elem.href = 'login.html';
        elem.onclick = null;
      }
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-profile-menu')) {
      document.querySelectorAll('.profile-dropdown-panel.active').forEach(panel => {
        panel.classList.remove('active');
        const trigger = panel.parentElement?.querySelector('.header-profile-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Listen for storage events (multi-tab sync)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      updateAllAuthUI();
    }
  });

  // Expose public API
  window.SportsStationAuth = {
    getUser: getCurrentUser,
    login: loginWithCredentials,
    register: registerAccount,
    logout: logoutUser,
    updateUI: updateAllAuthUI,
    showToast: showAuthToast
  };

  // Run on DOM loaded
  function onReady() {
    updateAllAuthUI();
    checkAndSyncLoggedInProfile();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
