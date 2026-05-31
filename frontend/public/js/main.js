document.addEventListener('DOMContentLoaded', () => {
    const dropdownToggle = document.getElementById('dropdownToggle');
    const headerDropdown = document.getElementById('headerDropdown');

    if (dropdownToggle && headerDropdown) {
        // 1. Controlar el despliegue del menú al hacer clic en la flecha o el texto principal
        dropdownToggle.addEventListener('click', (e) => {
            // Solo detenemos el comportamiento si el menú está oculto para poder mostrarlo
            if (!headerDropdown.classList.contains('is-active')) {
                e.preventDefault(); 
                headerDropdown.classList.add('is-active');
            } else {
                // Si ya está abierto y le vuelve a dar clic, lo cierra
                e.preventDefault();
                headerDropdown.classList.remove('is-active');
            }
        });

        // 2. Permitir que los enlaces de adentro SÍ redirijan a las secciones
        const dropdownLinks = headerDropdown.querySelectorAll('.nav-bar__dropdown-link');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // No ponemos preventDefault para que el navegador cambie de página normal
                headerDropdown.classList.remove('is-active'); // Lo cierra al hacer clic
            });
        });

        // 3. Cerrar el menú si da un clic en cualquier otra parte de la pantalla
        document.addEventListener('click', (e) => {
            if (!dropdownToggle.contains(e.target) && !headerDropdown.contains(e.target)) {
                headerDropdown.classList.remove('is-active');
            }
        });
    }
});