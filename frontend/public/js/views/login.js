/**
 * login.js — Elixir and Flexx
 * CORRECCIÓN: selector del form actualizado a '#formLogin' (ya no tiene action/method nativo).
 */
import { UsuarioService } from '../services/api.js';
 
document.addEventListener('DOMContentLoaded', () => {
 
    // ── MENSAJES DE QUERY PARAMS ──────────────────────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const msgEl = document.getElementById('loginMessage');
 
    if (msgEl) {
        if (urlParams.get('registro') === 'ok') {
            msgEl.textContent = '✅ ¡Registro exitoso! Ya puede iniciar sesión.';
            msgEl.className = 'auth-message auth-message--success';
        } else if (urlParams.get('error') === 'credenciales') {
            msgEl.textContent = '❌ Correo o contraseña incorrectos. Vuelva a intentarlo.';
            msgEl.className = 'auth-message auth-message--error';
        } else if (urlParams.get('error') === 'camposVacios') {
            msgEl.textContent = '⚠️ Complete todos los campos antes de continuar.';
            msgEl.className = 'auth-message auth-message--warning';
        } else if (urlParams.get('error') === 'sesionExpirada') {
            msgEl.textContent = '⚠️ Su sesión ha expirado o no está autenticado.';
            msgEl.className = 'auth-message auth-message--warning';
        } else if (urlParams.get('logout') === 'ok') {
            msgEl.textContent = '👋 Sesión cerrada correctamente.';
            msgEl.className = 'auth-message auth-message--success';
        }
    }
 
    // ── FORMULARIO DE LOGIN ───────────────────────────────────────────────────
    // CORRECCIÓN: selector '#formLogin' (el HTML ya no tiene .auth-card form con action)
    const formLogin = document.getElementById('formLogin');
 
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
 
            const emailInput      = formLogin.querySelector('input[name="email"]');
            const passwordInput = formLogin.querySelector('input[name="password"]');
            const btnSubmit       = formLogin.querySelector('button[type="submit"]');
 
            const email      = emailInput.value.trim();
            const password = passwordInput.value.trim();
 
            if (!email || !password) {
                mostrarMensaje('⚠️ Complete todos los campos.', 'warning');
                return;
            }
 
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Verificando...';
 
            const resultado = await UsuarioService.login(email, password);
 
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'INICIAR SESIÓN';
 
            if (resultado.ok) {
                if (resultado.esAdmin) {
                    window.location.href = 'interfazAdmin.html';
                } else {
                    // Según su árbol de NetBeans, la vista general es interfazGrafica.html
                    window.location.href = 'interfazGrafica.html';
                }
            } else {
                mostrarMensaje('❌ ' + resultado.error, 'error');
                passwordInput.value = '';
            }
        });
    }
 
    // ── MODAL DE RECUPERACIÓN ─────────────────────────────────────────────────
    const modal    = document.getElementById('modalRecuperar');
    const btnClose = document.getElementById('btnCloseModal');
    const formRecup = document.getElementById('formRecuperacion');
 
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
 
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
 
    if (formRecup) {
        formRecup.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = formRecup.querySelector('input[type="email"]');
            const btnEnviar  = formRecup.querySelector('button[type="submit"]');
            const emailVal   = emailInput.value.trim();
 
            if (!emailVal) { alert('Ingrese su correo electrónico.'); return; }
 
            btnEnviar.disabled = true;
            btnEnviar.textContent = 'Enviando...';
            const resultado = await UsuarioService.recuperarPassword(emailVal);
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'ENVIAR ENLACE';
 
            if (resultado.ok) {
                modal.style.display = 'none';
                mostrarMensaje('📧 Enlace de recuperación enviado a su correo.', 'success');
                emailInput.value = '';
            } else {
                alert('❌ ' + resultado.error);
            }
        });
    }
 
    // ── HELPER ────────────────────────────────────────────────────────────────
    function mostrarMensaje(texto, tipo) {
        if (!msgEl) return;
        msgEl.textContent = texto;
        msgEl.className = `auth-message auth-message--${tipo}`;
    }
});
 