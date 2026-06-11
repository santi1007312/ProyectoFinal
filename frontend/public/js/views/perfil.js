/**
 * perfil.js — Elixir and Flexx
 * Carga los datos del perfil del usuario logueado desde el backend.
 */
import { UsuarioService, PedidoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const userNameEl       = document.getElementById('userNameDisplay');
    const userEmailEl      = document.getElementById('userEmailDisplay');
    const addressNameEl    = document.getElementById('addressNameDisplay');
    const addressStreetEl  = document.getElementById('addressStreetDisplay');
    const addressNeighEl   = document.getElementById('addressNeighbourDisplay');
    const addressCountryEl = document.getElementById('addressCountryDisplay');
    const btnLogout        = document.getElementById('btnLogout');
    const btnEditarPerfil  = document.getElementById('btnEditPerfil') || document.querySelector('.bx-edit');

    // Cargar perfil
    cargarPerfil();

    async function cargarPerfil() {
        try {
            const usuario = await UsuarioService.obtenerPerfil();
            renderizarDatos(usuario);
            document.body.style.display = 'block';
        } catch {
            // Si no hay sesión activa, redirigir al login
            window.location.href = 'login.html?error=sesionExpirada';
        }
    }

    function renderizarDatos(user) {
        const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();
        if (userNameEl)       userNameEl.textContent       = nombreCompleto;
        if (userEmailEl)      userEmailEl.textContent      = user.correo || user.email || '';
        if (addressNameEl)    addressNameEl.textContent    = nombreCompleto;
        if (addressStreetEl)  addressStreetEl.textContent  = user.direccion || 'Sin dirección registrada';
        if (addressNeighEl)   addressNeighEl.textContent   = user.barrio || '';
        if (addressCountryEl) addressCountryEl.textContent = user.pais || 'Colombia';
    }

    // Edición básica de nombre
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener('click', () => {
            const actual = userNameEl?.textContent || '';
            const nuevo = prompt('Modifique su nombre:', actual);
            if (nuevo && nuevo.trim()) {
                if (userNameEl)    userNameEl.textContent    = nuevo.trim();
                if (addressNameEl) addressNameEl.textContent = nuevo.trim();
            }
        });
    }

    // Cerrar sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('¿Desea cerrar sesión?')) {
                await UsuarioService.logout();
            }
        });
    }
});