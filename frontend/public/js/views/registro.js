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

    const edadInput = formRegistro.querySelector('[name="edad"]');
    const edadErrorSpan = document.getElementById('edadErrorMsg');

    function validarEdad(valStr) {
        if (!valStr) {
            return '⚠️ La edad es obligatoria.';
        }
        const valNum = parseInt(valStr, 10);
        if (isNaN(valNum)) {
            return '⚠️ La edad debe ser un número.';
        }
        if (valNum < 13) {
            return '⚠️ Debes tener al menos 13 años para registrarte.';
        }
        if (valStr.trim().length > 2 || valNum >= 100) {
            return '⚠️ La edad debe tener como máximo 2 dígitos (rango 13-99 años).';
        }
        return '';
    }

    if (edadInput && edadErrorSpan) {
        edadInput.addEventListener('input', () => {
            const errorMsg = validarEdad(edadInput.value);
            if (errorMsg) {
                edadErrorSpan.textContent = errorMsg;
                edadErrorSpan.style.display = 'block';
            } else {
                edadErrorSpan.style.display = 'none';
            }
        });
    }
 
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

        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!nameRegex.test(nombre)) {
            mostrarMensaje('⚠️ El nombre no debe contener números ni caracteres especiales.', 'warning');
            return;
        }
        if (apellido && !nameRegex.test(apellido)) {
            mostrarMensaje('⚠️ El apellido no debe contener números ni caracteres especiales.', 'warning');
            return;
        }

        const edadError = validarEdad(edad);
        if (edadError) {
            if (edadErrorSpan) {
                edadErrorSpan.textContent = edadError;
                edadErrorSpan.style.display = 'block';
            } else {
                mostrarMensaje(edadError, 'warning');
            }
            edadInput?.focus();
            return;
        } else {
            if (edadErrorSpan) edadErrorSpan.style.display = 'none';
        }

        // Validación de Teléfono
        if (!/^\d{9,}$/.test(telefono)) {
            mostrarMensaje('⚠️ El número telefónico debe tener un mínimo de 9 caracteres numéricos.', 'warning');
            return;
        }

        // Filtro de Email
        if (email.includes('@')) {
            const emailParts = email.split('@');
            if (emailParts.length === 2) {
                const username = emailParts[0];
                const hasLetter = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(username);
                if (!hasLetter) {
                    mostrarMensaje('⚠️ El correo electrónico debe exigir al menos un carácter alfabético en su nombre de usuario.', 'warning');
                    return;
                }
            }
        }
 
        if (password.length < 6) {
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