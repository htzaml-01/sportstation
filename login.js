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

  // Check if user is already logged in
  if (window.SportsStationAuth) {
    const currentUser = window.SportsStationAuth.getUser();
    if (currentUser) {
      if (currentUser.role === 'admin') {
        window.location.href = 'admin.html';
        return;
      }
      showAlert(`Anda sudah masuk sebagai ${currentUser.name}. Mengalihkan...`, 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
      return;
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

  // Switch between Sign In and Sign Up (Create Account)
  if (toggleAuthLink) {
    toggleAuthLink.addEventListener('click', (e) => {
      e.preventDefault();
      hideAlert();
      if (currentMode === 'signin') {
        currentMode = 'signup';
        authHeading.textContent = 'Create Account';
        toggleAuthLink.textContent = 'Already have an account? Sign In';
        nameGroup.style.display = 'block';
        submitAuthBtn.textContent = 'Create Account';
        forgotPassLink.parentElement.style.display = 'none';
      } else {
        currentMode = 'signin';
        authHeading.textContent = 'Sign In';
        toggleAuthLink.textContent = "I don't have an account";
        nameGroup.style.display = 'none';
        submitAuthBtn.textContent = 'Sign In';
        forgotPassLink.parentElement.style.display = 'flex';
      }
    });
  }

  // Demo auto-fill helper
  if (demoFillBtn) {
    demoFillBtn.addEventListener('click', () => {
      emailInput.value = 'user@sportsstation.id';
      passwordInput.value = 'SportsStation123';
      hideAlert();
    });
  }

  // Admin auto-fill helper
  const adminFillBtn = document.getElementById('adminFillBtn');
  if (adminFillBtn) {
    adminFillBtn.addEventListener('click', () => {
      emailInput.value = 'admin';
      passwordInput.value = 'admin123';
      hideAlert();
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
          // Process Sign In
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
            showAlert(result.message || 'Gagal masuk. Periksa kembali email dan kata sandi.', 'error');
          }
        } else {
          // Process Sign Up
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
            showAlert(result.message || 'Gagal mendaftar.', 'error');
          }
        }
      }, 500);
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
