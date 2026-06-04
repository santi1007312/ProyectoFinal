/**
 * main.js — Elixir and Flexx
 * Script global: maneja el menú desplegable del header (dropdown)
 * que aparece en todas las vistas del proyecto.
 * Este archivo NO contiene lógica de admin ni de ninguna vista específica.
 */
document.addEventListener('DOMContentLoaded', () => {

    // ── DROPDOWN DEL HEADER (Políticas de Devolución) ─────────────────────────
    const dropdownToggle = document.getElementById('dropdownToggle');
    const headerDropdown = document.getElementById('headerDropdown');

    if (dropdownToggle && headerDropdown) {
        dropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            headerDropdown.classList.toggle('open');
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!dropdownToggle.contains(e.target) && !headerDropdown.contains(e.target)) {
                headerDropdown.classList.remove('open');
            }
        });
    }
});
