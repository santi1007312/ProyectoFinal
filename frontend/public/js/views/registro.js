/**
 * registro.js — Elixir and Flexx
 * CORRECCIÓN: import apunta a '../services/api.js' (estaba roto con '../UsuarioController')
 */
import { UsuarioService } from '../services/api.js';
 
document.addEventListener('DOMContentLoaded', () => {
 
    const urlParams = new URLSearchParams(window.location.search);
    const msgEl = document.getElementById('registroMessage');
 
    if (msgEl) {
        if (urlParams.get('error') === 'camposVacios') {
            msgEl.textContent = '⚠️ Complete todos los campos obligatorios.';
            msgEl.className = 'auth-message auth-message--warning';
        } else if (urlParams.get('error') === 'registroFallido') {
            msgEl.textContent = '❌ No se pudo crear la cuenta. El correo puede estar ya registrado.';
            msgEl.className = 'auth-message auth-message--error';
        } else if (urlParams.get('error') === 'edadInvalida') {
            msgEl.textContent = '⚠️ Ingrese una edad válida.';
            msgEl.className = 'auth-message auth-message--warning';
        }
    }
 
    const formRegistro = document.getElementById('formRegistro') || document.querySelector('.auth-card form');
    if (!formRegistro) return;
 
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
 
        const nombre     = (formRegistro.querySelector('[name="nombre"]')?.value     || '').trim();
        const apellido   = (formRegistro.querySelector('[name="apellido"]')?.value   || '').trim();
        const edad       = (formRegistro.querySelector('[name="edad"]')?.value       || '0').trim();
        const email      = (formRegistro.querySelector('[name="email"]')?.value      || '').trim();
        const password = (formRegistro.querySelector('[name="password"]')?.value || '').trim();
        const telefono   = (formRegistro.querySelector('[name="telefono"]')?.value   || '').trim();
 
        if (!nombre || !email || !password) {
            mostrarMensaje('⚠️ Nombre, correo y contraseña son obligatorios.', 'warning');
            return;
        }
 
        if (contraseña.length < 6) {
            mostrarMensaje('⚠️ La contraseña debe tener al menos 6 caracteres.', 'warning');
            return;
        }
 
        const btnSubmit = formRegistro.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Registrando...';
 
        const resultado = await UsuarioService.registrar({
            nombre, apellido, edad, email, password, telefono
        });
 
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'CREAR CUENTA';
 
        if (resultado.ok) {
            window.location.href = 'login.html?registro=ok';
        } else {
            mostrarMensaje('❌ ' + resultado.error, 'error');
        }
    });
 
    function mostrarMensaje(texto, tipo) {
        if (!msgEl) { alert(texto); return; }
        msgEl.textContent = texto;
        msgEl.className = `auth-message auth-message--${tipo}`;
    }
});