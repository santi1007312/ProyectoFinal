/**
 * login.js — Elixir and Flexx
 * Maneja el formulario de login, detección de rol y modal de recuperación.
 *
 * CORRECCIÓN: lee resultado.esAdmin del JSON del backend (no res.redirected).
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
        } else if (urlParams.get('logout') === 'ok') {
            msgEl.textContent = '👋 Sesión cerrada correctamente.';
            msgEl.className = 'auth-message auth-message--success';
        }
    }

    // ── FORMULARIO DE LOGIN ───────────────────────────────────────────────────
    const formLogin = document.querySelector('.auth-card form');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput     = formLogin.querySelector('input[name="email"]');
            const contraseñaInput = formLogin.querySelector('input[name="contraseña"]');
            const btnSubmit      = formLogin.querySelector('button[type="submit"]');

            const email     = emailInput.value.trim();
            const contraseña = contraseñaInput.value.trim();

            if (!email || !contraseña) {
                mostrarMensaje('⚠️ Complete todos los campos.', 'warning');
                return;
            }

            // Estado de carga
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Verificando...';

            const resultado = await UsuarioService.login(email, contraseña);

            btnSubmit.disabled = false;
            btnSubmit.textContent = 'INICIAR SESIÓN';

            if (resultado.ok) {
                // CORRECCIÓN: redirigimos según esAdmin que viene del JSON
                if (resultado.esAdmin) {
                    window.location.href = 'interfazAdmin.html';
                } else {
                    window.location.href = 'interfazGrafica.html';
                }
            } else {
                mostrarMensaje('❌ ' + resultado.error, 'error');
                contraseñaInput.value = '';
            }
        });
    }

    // ── MODAL DE RECUPERACIÓN ─────────────────────────────────────────────────
    const modal     = document.getElementById('modalRecuperar');
    const btnAbrir  = document.getElementById('btnAbrirModal') || document.querySelector('.auth-forgot-link');
    const btnClose  = document.getElementById('btnCloseModal');
    const formRecup = document.getElementById('formRecuperacion');

    if (btnAbrir && modal) {
        btnAbrir.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'flex';
        });
    }

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
            const btnEnviar = formRecup.querySelector('button[type="submit"]');
            const emailVal = emailInput.value.trim();

            if (!emailVal) { alert('Ingrese su correo electrónico.'); return; }

            btnEnviar.disabled = true;
            btnEnviar.textContent = 'Enviando...';
            const resultado = await UsuarioService.recuperarContraseña(emailVal);
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
