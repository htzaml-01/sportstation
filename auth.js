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
      if (!data) return null;
      const user = JSON.parse(data);
      if (user && (user.isLoggedIn || user.email)) {
        return user;
      }
      return null;
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
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('sportsstation_admin_logged');

      // If Supabase client exists, signOut
      if (window.SportsStationDB && typeof window.SportsStationDB.getClient === 'function') {
        const sb = window.SportsStationDB.getClient();
        if (sb && sb.auth && typeof sb.auth.signOut === 'function') {
          sb.auth.signOut().catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error during logout:', e);
    }

    window.dispatchEvent(new CustomEvent('sportsstation_auth_changed', { detail: { user: null } }));
    updateAllAuthUI();
    showAuthToast('Berhasil keluar dari akun.');

    // Redirect to home if on a protected page (works for clean URLs without .html)
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('profile') || pathname.includes('order') || pathname.includes('checkout') || pathname.includes('admin')) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 300);
    }
  }

  const REGISTERED_USERS_KEY = 'sportsstation_registered_users';

  const DEFAULT_ACCOUNTS = [
    {
      name: 'Azzam Anindita Daniswara',
      email: 'aznidaniswata@gmail.com',
      password: 'SportsStation123',
      role: 'customer',
      memberId: 'SS-AZZAM-01',
      phone: '081234567890',
      address: 'BSD City, Tangerang Selatan',
      points: 250
    },
    {
      name: 'Administrator',
      email: 'admin@sportsstation.id',
      password: 'admin123',
      role: 'admin',
      memberId: 'SS-ADMIN-01'
    }
  ];

  function getRegisteredUsers() {
    try {
      let list = [];
      const raw = localStorage.getItem(REGISTERED_USERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }

      let modified = false;
      // Pastikan akun default (Admin & Demo) selalu ada
      DEFAULT_ACCOUNTS.forEach(acc => {
        if (!list.some(u => (u.email || '').toLowerCase() === acc.email.toLowerCase())) {
          list.push({ ...acc });
          modified = true;
        }
      });

      if (modified || !raw) {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
      }
      return list;
    } catch (e) {
      return [...DEFAULT_ACCOUNTS];
    }
  }

  function saveRegisteredUsers(users) {
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving registered users:', e);
    }
  }

  /**
   * Log in with Email & Password
   * Wajib terdaftar terlebih dahulu! Jika belum daftar akun, login akan ditolak.
   */
  function loginWithCredentials(email, password, remember = true) {
    if (!email || !password) {
      return { success: false, message: 'Email dan kata sandi wajib diisi.' };
    }

    const cleanId = String(email).trim().toLowerCase();
    const cleanPw = String(password).trim();

    // Check for Admin credentials (username: admin, password: admin123)
    if ((cleanId === 'admin' || cleanId === 'admin@sportsstation.id' || cleanId === 'administrator') && cleanPw === 'admin123') {
      const adminUser = {
        name: 'Administrator',
        email: 'admin@sportsstation.id',
        role: 'admin',
        memberId: 'SS-ADMIN-01',
        isLoggedIn: true
      };
      saveUser(adminUser);
      sessionStorage.setItem('sportsstation_admin_logged', 'true');
      syncAuthWithSupabase('login', 'admin@sportsstation.id', 'SportsStationAdmin123!', 'Administrator', 'admin');
      return { success: true, user: adminUser, isAdmin: true };
    }

    const registeredUsers = getRegisteredUsers();

    // Cari akun terdaftar berdasarkan email atau username
    const existingUser = registeredUsers.find(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      return uEmail === cleanId || (cleanId === 'admin' && u.role === 'admin');
    });

    // Jika akun belum terdaftar, TOLAK LOGIN dan instruksikan untuk Sign Up (Daftar Akun)
    if (!existingUser) {
      return {
        success: false,
        notRegistered: true,
        message: `Akun dengan email "${cleanId}" belum terdaftar. Silakan klik "Daftar Akun" terlebih dahulu.`
      };
    }

    // Validasi kata sandi
    if (existingUser.password && existingUser.password !== cleanPw) {
      return {
        success: false,
        wrongPassword: true,
        message: 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.'
      };
    }

    // Login Berhasil
    const sessionUser = {
      name: existingUser.name || 'Member',
      email: existingUser.email,
      role: existingUser.role || 'customer',
      memberId: existingUser.memberId || ('SS-' + Math.floor(100000 + Math.random() * 900000)),
      points: existingUser.points !== undefined ? existingUser.points : 100,
      phone: existingUser.phone || '',
      address: existingUser.address || '',
      isLoggedIn: true
    };
    saveUser(sessionUser);

    // Sync ke Supabase Auth & public.profiles
    syncAuthWithSupabase('login', sessionUser.email, cleanPw, sessionUser.name, sessionUser.role);

    return { success: true, user: sessionUser, isAdmin: sessionUser.role === 'admin' };
  }

  /**
   * Register new account
   */
  function registerAccount(name, email, password) {
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPw = String(password || '').trim();

    if (!cleanName || !cleanEmail || !cleanPw) {
      return { success: false, message: 'Semua kolom pendaftaran wajib diisi.' };
    }

    if (cleanPw.length < 4) {
      return { success: false, message: 'Kata sandi minimal 4 karakter.' };
    }

    const registeredUsers = getRegisteredUsers();

    // Cek apakah email sudah terdaftar sebelumnya
    const alreadyRegistered = registeredUsers.some(u => (u.email || '').toLowerCase().trim() === cleanEmail);
    if (alreadyRegistered) {
      return {
        success: false,
        alreadyRegistered: true,
        message: `Email "${cleanEmail}" sudah terdaftar. Silakan pilih "Sign In" untuk masuk.`
      };
    }

    // Buat akun baru di database lokal
    const newUser = {
      name: cleanName,
      email: cleanEmail,
      password: cleanPw,
      role: 'customer',
      memberId: 'SS-' + Math.floor(100000 + Math.random() * 900000),
      points: 100,
      createdAt: new Date().toISOString()
    };

    registeredUsers.push(newUser);
    saveRegisteredUsers(registeredUsers);

    // Set sesi pengguna aktif
    const sessionUser = {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      memberId: newUser.memberId,
      points: newUser.points,
      isLoggedIn: true
    };
    saveUser(sessionUser);

    // Sync ke Supabase Auth & public.profiles
    syncAuthWithSupabase('register', cleanEmail, cleanPw, cleanName, 'customer');

    return { success: true, user: sessionUser };
  }

  /**
   * Sinkronisasi data user & profile ke Supabase Cloud
   * Langsung upsert ke tabel profiles tanpa harus lewat auth.users
   */
  function syncAuthWithSupabase(action, email, password, name, role) {
    if (!window.SportsStationDB || !window.SportsStationDB.isConfigured()) return;
    const sb = window.SportsStationDB.getClient();
    if (!sb) return;

    // Generate unique ID dari email (konsisten untuk user yang sama)
    const uniqueId = 'web-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);

    // Langsung upsert ke profiles table (tidak perlu auth.users lagi)
    sb.from('profiles').upsert({
      id: uniqueId,
      email: email,
      full_name: name || email.split('@')[0],
      role: role || 'customer'
    }, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) {
          console.warn('⚠️ Gagal sync profil ke Supabase:', error.message);
          // Coba upsert berdasarkan email sebagai fallback
          sb.from('profiles').select('id').eq('email', email).single()
            .then(({ data: existing }) => {
              if (existing) {
                // Update profil yang sudah ada
                sb.from('profiles').update({
                  full_name: name || email.split('@')[0],
                  role: role || 'customer'
                }).eq('email', email)
                  .then(() => console.log('✅ Profil Supabase diperbarui:', email));
              } else {
                // Insert baru tanpa conflict
                sb.from('profiles').insert({
                  id: uniqueId + '-' + Date.now(),
                  email: email,
                  full_name: name || email.split('@')[0],
                  role: role || 'customer'
                }).then(({ error: insErr }) => {
                  if (insErr) console.warn('⚠️ Insert profil gagal:', insErr.message);
                  else console.log('✅ Profil baru tersimpan di Supabase:', email);
                });
              }
            });
        } else {
          console.log('✅ Profil Supabase tersimpan:', email);
        }
      });

    // Juga coba sync ke profiles jika user sudah ada (merge data dari Supabase)
    if (action === 'login') {
      sb.from('profiles').select('*').eq('email', email).single()
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
        // Profil belum ada di Supabase, langsung buatkan
        const uniqueId = 'web-' + btoa(user.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
        sb.from('profiles').insert({
          id: uniqueId,
          email: user.email,
          full_name: user.name || 'Sports Station Member',
          role: user.role || 'customer'
        }).then(({ error: insErr }) => {
          if (insErr) console.warn('⚠️ Gagal auto-sync profil:', insErr.message);
          else console.log('✅ Profil otomatis tersimpan di Supabase:', user.email);
        });
      }
    });
  }

  /**
   * Helper to display a lightweight toast notification (Matching official Sports Station simple style)
   */
  function showAuthToast(message, type = 'success') {
    let toast = document.querySelector('.sports-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'sports-toast';
      document.body.appendChild(toast);
    }

    let cleanMsg = String(message || '').replace(/^[✅🎉⚠️❌ℹ️🏷️✨\s]+/, '').trim();
    if (!cleanMsg) cleanMsg = 'Success';

    let iconClass = 'fa-solid fa-circle-check';
    let iconColor = '#22c55e';
    toast.className = 'sports-toast';

    const lower = String(message || '').toLowerCase();
    if (type === 'error' || lower.includes('gagal') || lower.includes('habis') || lower.includes('batal') || lower.includes('belum')) {
      iconClass = 'fa-solid fa-circle-xmark';
      iconColor = '#ef4444';
      toast.classList.add('toast-error');
    } else if (type === 'warning' || lower.includes('peringatan') || lower.includes('harap') || lower.includes('wajib')) {
      iconClass = 'fa-solid fa-triangle-exclamation';
      iconColor = '#f59e0b';
      toast.classList.add('toast-warning');
    }

    toast.innerHTML = `
      <i class="${iconClass} sports-toast-icon" style="color: ${iconColor};"></i>
      <span class="sports-toast-text">${cleanMsg}</span>
    `;

    toast.classList.add('show');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
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
                <li>
                  <a href="profile.html" class="profile-menu-item" onclick="event.preventDefault(); window.SportsStationAuth && window.SportsStationAuth.openProfileModal();">
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

    // Update Mobile Drawer Account / Logout Section
    const drawerViewMain = document.getElementById('drawerViewMain');
    if (drawerViewMain) {
      let drawerAuthPanel = drawerViewMain.querySelector('.drawer-auth-panel');
      if (!drawerAuthPanel) {
        drawerAuthPanel = document.createElement('div');
        drawerAuthPanel.className = 'drawer-auth-panel';
        drawerViewMain.appendChild(drawerAuthPanel);
      }

      if (user) {
        drawerAuthPanel.innerHTML = `
          <div style="padding: 16px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; margin-top: auto;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #f95a00, #ea580c); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; flex-shrink: 0;">
                ${(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style="overflow: hidden;">
                <div style="font-weight: 600; font-size: 13.5px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name || 'Member'}</div>
                <div style="font-size: 11.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.email || '-'}</div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
              <a href="profile.html" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 10px; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; font-weight: 600; color: #334155; text-decoration: none;">
                <i class="fa-regular fa-id-card"></i> Profil
              </a>
              <a href="orders.html" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 10px; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; font-weight: 600; color: #334155; text-decoration: none;">
                <i class="fa-solid fa-bag-shopping"></i> Pesanan
              </a>
            </div>
            <button type="button" class="drawer-logout-action-btn" style="width: 100%; padding: 8px 12px; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <i class="fa-solid fa-arrow-right-from-bracket"></i> Keluar (Log Out)
            </button>
          </div>
        `;

        const drawerLogoutBtn = drawerAuthPanel.querySelector('.drawer-logout-action-btn');
        if (drawerLogoutBtn) {
          drawerLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
          });
        }
      } else {
        drawerAuthPanel.innerHTML = `
          <div style="padding: 16px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; margin-top: auto;">
            <a href="login.html" style="width: 100%; padding: 10px 16px; background: #f95a00; color: #ffffff; border-radius: 8px; font-size: 13.5px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none;">
              <i class="fa-regular fa-user"></i> Masuk / Daftar Akun
            </a>
          </div>
        `;
      }
    }
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

  /**
   * Buka Modal Profil / Akun Saya
   */
  function openProfileModal() {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    let modal = document.getElementById('userProfileModalBackdrop');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'userProfileModalBackdrop';
      modal.className = 'user-profile-modal-backdrop';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProfileModal();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          closeProfileModal();
        }
      });
    }

    const initial = (user.name || 'U').charAt(0).toUpperCase();
    const roleLabel = user.role === 'admin' ? 'Administrator' : 'Customer';
    const memberId = user.memberId || ('SS-' + (user.role === 'admin' ? 'ADMIN' : 'USER') + '-01');
    const points = user.points !== undefined ? user.points : 100;

    modal.innerHTML = `
      <div class="user-profile-modal-card">
        <div class="user-profile-modal-header">
          <h3>
            <i class="fa-regular fa-id-card" style="color: #f95a00;"></i>
            Akun &amp; Profil Saya
          </h3>
          <button type="button" class="user-profile-close-btn" onclick="window.SportsStationAuth.closeProfileModal()" title="Tutup">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="user-profile-modal-body">
          <!-- User Summary Row -->
          <div class="profile-card-badge-row">
            <div class="profile-modal-avatar">
              ${initial}
            </div>
            <div class="profile-modal-info">
              <span class="profile-modal-name">${user.name || 'Member'}</span>
              <span style="font-size: 12px; color: #64748b;">${user.email || '-'}</span>
              <div class="profile-modal-pills" style="margin-top: 4px;">
                <span class="profile-pill profile-pill-id">
                  <i class="fa-solid fa-id-badge"></i> ${memberId}
                </span>
                <span class="profile-pill profile-pill-role">
                  <i class="fa-solid fa-shield-halved"></i> ${roleLabel}
                </span>
                <span class="profile-pill profile-pill-points">
                  <i class="fa-solid fa-coins"></i> ${points} Poin
                </span>
              </div>
            </div>
          </div>

          <!-- Edit Form -->
          <div class="profile-form-group">
            <label class="profile-form-label" for="modalProfileName">Nama Lengkap</label>
            <input type="text" id="modalProfileName" class="profile-form-input" value="${user.name || ''}" placeholder="Nama Lengkap Anda">
          </div>

          <div class="profile-form-group">
            <label class="profile-form-label" for="modalProfileEmail">Alamat Email (Identitas Login)</label>
            <input type="email" id="modalProfileEmail" class="profile-form-input" value="${user.email || ''}" readonly disabled style="background: #f8fafc; color: #64748b; cursor: not-allowed;">
          </div>

          <div class="profile-form-group">
            <label class="profile-form-label" for="modalProfilePhone">Nomor WhatsApp / HP</label>
            <input type="tel" id="modalProfilePhone" class="profile-form-input" value="${user.phone || ''}" placeholder="Contoh: 081234567890">
          </div>

          <div class="profile-form-group">
            <label class="profile-form-label" for="modalProfileAddress">Alamat Pengiriman Utama</label>
            <textarea id="modalProfileAddress" class="profile-form-input" rows="3" placeholder="Masukkan alamat lengkap pengiriman untuk mempercepat checkout...">${user.address || ''}</textarea>
          </div>

          <!-- Actions -->
          <div class="profile-modal-actions">
            <button type="button" class="profile-btn-save" onclick="window.SportsStationAuth.saveProfileModal()">
              <i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan
            </button>
            <div class="profile-sub-actions">
              <a href="orders.html" class="profile-sub-link">
                <i class="fa-solid fa-bag-shopping" style="color: #f95a00;"></i> Lihat Pesanan Saya
              </a>
              <button type="button" class="profile-sub-logout" onclick="window.SportsStationAuth.closeProfileModal(); window.SportsStationAuth.logout();">
                <i class="fa-solid fa-arrow-right-from-bracket"></i> Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Tutup panel dropdown jika sedang aktif
    document.querySelectorAll('.profile-dropdown-panel.active').forEach(p => p.classList.remove('active'));

    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  }

  function closeProfileModal() {
    const modal = document.getElementById('userProfileModalBackdrop');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  function saveProfileModal() {
    const user = getCurrentUser();
    if (!user) return;

    const nameInput = document.getElementById('modalProfileName');
    const phoneInput = document.getElementById('modalProfilePhone');
    const addressInput = document.getElementById('modalProfileAddress');

    const newName = nameInput ? nameInput.value.trim() : '';
    const newPhone = phoneInput ? phoneInput.value.trim() : '';
    const newAddress = addressInput ? addressInput.value.trim() : '';

    if (!newName) {
      alert('Nama lengkap tidak boleh kosong.');
      if (nameInput) nameInput.focus();
      return;
    }

    user.name = newName;
    user.phone = newPhone;
    user.address = newAddress;

    saveUser(user);

    // Update in registered users database so changes persist
    try {
      const regList = getRegisteredUsers();
      const match = regList.find(u => (u.email || '').toLowerCase() === (user.email || '').toLowerCase());
      if (match) {
        match.name = newName;
        match.phone = newPhone;
        match.address = newAddress;
        saveRegisteredUsers(regList);
      }
    } catch (e) {
      console.warn('Could not sync user update to registry:', e);
    }

    closeProfileModal();
    showAuthToast('✅ Profil akun Anda berhasil diperbarui!');
  }

  /**
   * Universal Mobile Drawer Controller for all Sports Station pages
   */
  function initGlobalMobileDrawer() {
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerClose = document.getElementById('drawerClose');
    const drawerOverlay = document.getElementById('drawerOverlay');

    if (!mobileDrawer) return;

    // Prevent duplicate binding
    if (mobileDrawer._bound) return;
    mobileDrawer._bound = true;

    function openDrawer() {
      mobileDrawer.classList.add('open');
      if (drawerOverlay) drawerOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      mobileDrawer.classList.remove('open');
      document.querySelectorAll('.drawer-subview').forEach(s => s.classList.remove('active'));
      if (drawerOverlay) drawerOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (mobileToggle) {
      mobileToggle.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
    }

    if (drawerClose) {
      drawerClose.addEventListener('click', (e) => {
        e.preventDefault();
        closeDrawer();
      });
    }

    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', closeDrawer);
    }

    // Subview open buttons (BRANDS, SPORTS, MEN, WOMEN, KIDS, EQUIPMENT)
    document.querySelectorAll('.drawer-link-btn[data-subview]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetId = btn.getAttribute('data-subview') || btn.dataset.subview;
        if (targetId) {
          const subview = document.getElementById(targetId);
          if (subview) {
            subview.classList.add('active');
          }
        }
      });
    });

    // Subview back buttons
    document.querySelectorAll('.drawer-back-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const subview = btn.closest('.drawer-subview');
        if (subview) {
          subview.classList.remove('active');
        }
      });
    });

    // Close buttons inside subviews
    document.querySelectorAll('.drawer-sub-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeDrawer();
      });
    });

    // Accordion toggle behavior for A-B, C-E, F-K, FOOTWEAR, CLOTHING, etc.
    document.querySelectorAll('.brand-acc-header, .drawer-acc-header').forEach(header => {
      header.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const group = header.closest('.brand-acc-group, .drawer-acc-group');
        if (group) {
          group.classList.toggle('active');
        }
      });
    });

    const drawerLinks = document.querySelectorAll('.drawer-links a, .brand-item-link, .drawer-sub-link');
    drawerLinks.forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });
  }

  // Expose public API
  window.SportsStationAuth = {
    getUser: getCurrentUser,
    login: loginWithCredentials,
    register: registerAccount,
    logout: logoutUser,
    updateUI: updateAllAuthUI,
    showToast: showAuthToast,
    openProfileModal: openProfileModal,
    closeProfileModal: closeProfileModal,
    saveProfileModal: saveProfileModal
  };

  // Run on DOM loaded
  function onReady() {
    updateAllAuthUI();
    checkAndSyncLoggedInProfile();
    initGlobalMobileDrawer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
