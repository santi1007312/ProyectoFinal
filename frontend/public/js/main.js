/**
 * main.js — Elixir and Flexx
 * Script global: maneja el menú desplegable del header (dropdown)
 * y la barra de búsqueda dinámica.
 */
document.addEventListener('DOMContentLoaded', () => {

    // ── DROPDOWN DEL HEADER (Políticas de Devolución) ─────────────────────────
    const dropdownToggle = document.getElementById('dropdownToggle');
    const headerDropdown = document.getElementById('headerDropdown');

    if (dropdownToggle && headerDropdown) {
        dropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            headerDropdown.classList.toggle('is-active');
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!dropdownToggle.contains(e.target) && !headerDropdown.contains(e.target)) {
                headerDropdown.classList.remove('is-active');
            }
        });
    }

    // ── BARRA DE BÚSQUEDA DINÁMICA DE LA NAVBAR ───────────────────────────────
    const navSearchIcon = document.getElementById('navSearchIcon');
    const navSearchInput = document.getElementById('navSearchInput');

    if (navSearchIcon && navSearchInput) {
        navSearchIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!navSearchInput.classList.contains('active')) {
                navSearchInput.classList.add('active');
                navSearchInput.focus();
            } else {
                ejecutarBusqueda();
            }
        });

        navSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                ejecutarBusqueda();
            }
        });

        // Cerrar si hace clic en cualquier otro lado y está vacío
        document.addEventListener('click', (e) => {
            if (!navSearchIcon.contains(e.target) && !navSearchInput.contains(e.target)) {
                if (navSearchInput.value.trim() === '') {
                    navSearchInput.classList.remove('active');
                }
            }
        });

        function ejecutarBusqueda() {
            const query = navSearchInput.value.trim();
            if (query) {
                window.location.href = `interfazCatalogo.html?buscar=${encodeURIComponent(query)}`;
            } else {
                navSearchInput.classList.remove('active');
            }
        }
    }
});
