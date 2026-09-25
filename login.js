/**
 * SPORTS STATION - LOGIN PAGE INTERACTION LOGIC
 * Handles Sign In, Sign Up toggle, and credential validation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('authForm');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const nameInput = document.getElementById('nameInput');
  const nameGroup = document.getElementById('nameGroup');
  const authHeading = document.getElementById('authHeading');
  const toggleAuthLink = document.getElementById('toggleAuthMode');
  const submitAuthBtn = document.getElementById('submitAuthBtn');
  const forgotPassLink = document.getElementById('forgotPassLink');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const authAlert = document.getElementById('authAlert');
  const demoFillBtn = document.getElementById('demoFillBtn');

  // Mode: 'signin' or 'signup'
  let currentMode = 'signin';

  // Check URL parameter (?mode=signup or ?logout=true)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('logout') === 'true' || urlParams.get('action') === 'logout') {
    localStorage.removeItem('sportsstation_user');
    sessionStorage.removeItem('sportsstation_admin_logged');
    if (window.SportsStationAuth) {
      window.SportsStationAuth.logout();
    }
  }

  // Toggle Password Visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePasswordBtn.innerHTML = isPassword 
        ? '<i class="fa-regular fa-eye-slash"></i>' 
        : '<i class="fa-regular fa-eye"></i>';
    });
  }

  // Function to switch auth modes
  function setAuthMode(mode) {
    currentMode = mode;
    hideAlert();
    if (mode === 'signup') {
      authHeading.textContent = 'Create Account';
      toggleAuthLink.textContent = 'Already have an account? Sign In';
      nameGroup.style.display = 'block';
      submitAuthBtn.textContent = 'Create Account';
      if (forgotPassLink && forgotPassLink.parentElement) {
        forgotPassLink.parentElement.style.display = 'none';
      }
      setTimeout(() => {
        if (nameInput) nameInput.focus();
      }, 60);
    } else {
      currentMode = 'signin';
      authHeading.textContent = 'Sign In';
      toggleAuthLink.textContent = "I don't have an account";
      nameGroup.style.display = 'none';
      submitAuthBtn.textContent = 'Sign In';
      if (forgotPassLink && forgotPassLink.parentElement) {
        forgotPassLink.parentElement.style.display = 'flex';
      }
      setTimeout(() => {
        if (emailInput) emailInput.focus();
      }, 60);
    }
  }

  // Check URL parameter (?mode=signup)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'signup' || urlParams.get('action') === 'signup') {
    setAuthMode('signup');
  }

  // Notifikasi jika diarahkan dari checkout karena belum login
  const redirectTarget = urlParams.get('redirect');
  if (redirectTarget && redirectTarget.includes('checkout')) {
    showAlert('Silakan masuk ke akun Anda terlebih dahulu untuk menyelesaikan pesanan dan pembayaran (checkout).', 'error');
  }

  // Switch between Sign In and Sign Up (Create Account)
  if (toggleAuthLink) {
    toggleAuthLink.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthMode(currentMode === 'signin' ? 'signup' : 'signin');
    });
  }

  // Demo auto-fill helper
  if (demoFillBtn) {
    demoFillBtn.addEventListener('click', () => {
      setAuthMode('signin');
      emailInput.value = 'aznidaniswata@gmail.com';
      passwordInput.value = 'SportsStation123';
      hideAlert();
      if (authForm) {
        authForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
  }

  // Admin auto-fill helper
  const adminFillBtn = document.getElementById('adminFillBtn');
  if (adminFillBtn) {
    adminFillBtn.addEventListener('click', () => {
      setAuthMode('signin');
      emailInput.value = 'admin';
      passwordInput.value = 'admin123';
      hideAlert();
      if (authForm) {
        authForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
  }

  // Form Submit
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideAlert();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      // Basic validation
      if (!email) {
        showAlert('Silakan masukkan alamat email yang valid.', 'error');
        emailInput.focus();
        return;
      }
      if (!password || password.length < 4) {
        showAlert('Kata sandi harus minimal 4 karakter.', 'error');
        passwordInput.focus();
        return;
      }

      submitAuthBtn.disabled = true;
      submitAuthBtn.style.opacity = '0.7';
      const originalText = submitAuthBtn.textContent;
      submitAuthBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

      setTimeout(() => {
        submitAuthBtn.disabled = false;
        submitAuthBtn.style.opacity = '1';
        submitAuthBtn.textContent = originalText;

        if (currentMode === 'signin') {
          // Process Sign In: Wajib akun terdaftar
          const result = window.SportsStationAuth.login(email, password);
          if (result.success) {
            if (result.user.role === 'admin') {
              showAlert('Login Administrator Berhasil! Mengalihkan ke Dashboard...', 'success');
              setTimeout(() => {
                window.location.href = 'admin.html';
              }, 700);
            } else {
              showAlert(`Selamat datang kembali, ${result.user.name}!`, 'success');
              setTimeout(() => {
                window.location.href = getRedirectUrl();
              }, 900);
            }
          } else {
            if (result.notRegistered) {
              showAlert(`
                <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                  <div><strong>Akun Belum Terdaftar!</strong> Email "<strong>${email}</strong>" belum terdaftar. Anda harus daftar akun terlebih dahulu untuk bisa masuk.</div>
                  <button type="button" id="btnSwitchToSignUpNow" style="background: #0f172a; color: #ffffff; border: none; padding: 7px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-user-plus"></i> Daftar Akun Sekarang
                  </button>
                </div>
              `, 'error');
              const btnSwitch = document.getElementById('btnSwitchToSignUpNow');
              if (btnSwitch) {
                btnSwitch.addEventListener('click', () => {
                  setAuthMode('signup');
                });
              }
            } else {
              showAlert(result.message || 'Gagal masuk. Periksa kembali email dan kata sandi.', 'error');
            }
          }
        } else {
          // Process Sign Up: Mendaftar akun baru
          const name = nameInput.value.trim();
          if (!name) {
            showAlert('Silakan masukkan nama lengkap Anda.', 'error');
            nameInput.focus();
            return;
          }
          const result = window.SportsStationAuth.register(name, email, password);
          if (result.success) {
            showAlert(`Akun berhasil dibuat! Selamat datang, ${result.user.name}.`, 'success');
            setTimeout(() => {
              window.location.href = getRedirectUrl();
            }, 900);
          } else {
            if (result.alreadyRegistered) {
              showAlert(`
                <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                  <div><strong>${result.message}</strong></div>
                  <button type="button" id="btnSwitchToSignInNow" style="background: #0f172a; color: #ffffff; border: none; padding: 7px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-right-to-bracket"></i> Masuk Sekarang (Sign In)
                  </button>
                </div>
              `, 'error');
              const btnSwitch = document.getElementById('btnSwitchToSignInNow');
              if (btnSwitch) {
                btnSwitch.addEventListener('click', () => {
                  setAuthMode('signin');
                });
              }
            } else {
              showAlert(result.message || 'Gagal mendaftar.', 'error');
            }
          }
        }
      }, 400);
    });
  }

  // Forgot password click
  if (forgotPassLink) {
    forgotPassLink.addEventListener('click', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email) {
        showAlert('Masukkan email Anda terlebih dahulu untuk mengatur ulang kata sandi.', 'error');
        emailInput.focus();
      } else {
        showAlert(`Tautan pemulihan kata sandi telah dikirim ke ${email}.`, 'success');
      }
    });
  }

  function showAlert(msg, type = 'error') {
    if (!authAlert) return;
    authAlert.className = `auth-alert ${type}`;
    authAlert.innerHTML = type === 'error' 
      ? `<i class="fa-solid fa-circle-exclamation"></i> <span>${msg}</span>`
      : `<i class="fa-solid fa-circle-check"></i> <span>${msg}</span>`;
    authAlert.style.display = 'flex';
  }

  function hideAlert() {
    if (authAlert) {
      authAlert.style.display = 'none';
    }
  }

  function getRedirectUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect && !redirect.includes('login.html')) {
      return redirect;
    }
    return 'index.html';
  }
});
