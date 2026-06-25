/**
 * perfil.js — Elixir and Flexx
 * Carga los datos del perfil, gestiona actualizaciones y cierres de sesión.
 */
import { UsuarioService, PedidoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const userNameEl       = document.getElementById('userNameDisplay');
    const userEmailEl      = document.getElementById('userEmailDisplay');
    const addressNameEl    = document.getElementById('addressNameDisplay');
    const addressStreetEl  = document.getElementById('addressStreetDisplay');
    const addressNeighEl   = document.getElementById('addressNeighbourDisplay');
    const addressCountryEl = document.getElementById('addressCountryDisplay');
    
    // Botones de Cierre de Sesión
    const btnCerrarSesionLocal  = document.getElementById('btnCerrarSesionLocal');
    const btnCerrarSesionGlobal = document.getElementById('btnCerrarSesionGlobal');
    
    // Botón de Edición de Perfil
    const btnEditarPerfil  = document.getElementById('btnEditPerfil') || document.querySelector('.bx-edit');

    // Cargar perfil automáticamente al entrar
    cargarPerfil();

    async function cargarPerfil() {
        try {
            const usuario = await UsuarioService.obtenerPerfil();
            renderizarDatos(usuario);
            document.body.style.display = 'block';
        } catch (error) {
            console.error("Error al cargar perfil:", error);
            // Si no hay sesión activa, redirigir al login principal
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

    // ── 1. GESTIÓN DE EDICIÓN (Persistida al Backend) ────────────────────────
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener('click', async () => {
            const actual = userNameEl?.textContent || '';
            const nuevo = prompt('Modifique su nombre completo:', actual);
            
            if (nuevo && nuevo.trim() && nuevo.trim() !== actual) {
                try {
                    // Actualización visual inmediata (UX limpia)
                    if (userNameEl)    userNameEl.textContent    = nuevo.trim();
                    if (addressNameEl) addressNameEl.textContent = nuevo.trim();

                    // Separar de forma básica Nombre y Apellido para enviar al controlador
                    const partes = nuevo.trim().split(" ");
                    const nombre = partes[0] || '';
                    const apellido = partes.slice(1).join(" ") || '';

                    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
                    if (!nameRegex.test(nombre)) {
                        alert('⚠️ El nombre no debe contener números ni caracteres especiales.');
                        cargarPerfil();
                        return;
                    }
                    if (apellido && !nameRegex.test(apellido)) {
                        alert('⚠️ El apellido no debe contener números ni caracteres especiales.');
                        cargarPerfil();
                        return;
                    }

                    // Petición al backend usando la estructura del backend de Elixir and Flexx
                    const response = await fetch('/UsuarioController?accion=actualizarPerfil', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `nombre=${encodeURIComponent(nombre)}&apellido=${encodeURIComponent(apellido)}`
                    });

                    const data = await response.json();
                    if (data.success) {
                        alert('¡Perfil actualizado correctamente en la Base de Datos! 🔄');
                    } else {
                        alert('El servidor no pudo actualizar los datos: ' + (data.error || 'Error desconocido'));
                        cargarPerfil(); // revierte los cambios visuales si falla
                    }
                } catch (error) {
                    console.error("Error al actualizar perfil:", error);
                    alert('Hubo un problema de conexión para guardar los cambios.');
                    cargarPerfil(); 
                }
            }
        });
    }

    // ── 2. CIERRE DE SESIÓN LOCAL ─────────────────────────────────────────────
    if (btnCerrarSesionLocal) {
        btnCerrarSesionLocal.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                // Llama al caso "logout" que ya tiene programado en su doPost de Java
                const response = await fetch('/UsuarioController?accion=logout', { 
                    method: 'POST' 
                });
                const data = await response.json();
                
                if (data.success) {
                    // Redirige al login pasándole el parámetro de cierre exitoso
                    window.location.href = 'login.html?logout=ok';
                }
            } catch (error) {
                console.error("Error en logout local:", error);
            }
        });
    }

    // ── 3. CIERRE DE SESIÓN GLOBAL (Todos los dispositivos) ───────────────────
    if (btnCerrarSesionGlobal) {
        btnCerrarSesionGlobal.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!confirm('¿Está completamente seguro de cerrar sesión en todos los dispositivos conectados?')) return;
            
            try {
                // Llama al caso nuevo "logoutGlobal" que mapeamos en su Servlet
                const response = await fetch('/UsuarioController?accion=logoutGlobal', { 
                    method: 'POST' 
                });
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = 'login.html?logout=ok';
                }
            } catch (error) {
                console.error("Error en logout global:", error);
            }
        });
    }
});