document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DEL DOM ---
    const dropdownToggle = document.getElementById('dropdownToggle');
    const headerDropdown = document.getElementById('headerDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    
    const btnSolicitarDevolucion = document.getElementById('btnSolicitarDevolucion');
    const formDevolucionContainer = document.getElementById('formDevolucionContainer');

    // 1. INTERACCIÓN DEL DROPDOWN EN EL HEADER
    if (dropdownToggle && headerDropdown) {
        dropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            headerDropdown.classList.toggle('show');
            if (dropdownArrow) dropdownArrow.classList.toggle('rotate');
        });

        // Cerrar dropdown al hacer clic en cualquier otra parte externa
        document.addEventListener('click', () => {
            headerDropdown.classList.remove('show');
            if (dropdownArrow) dropdownArrow.classList.remove('rotate');
        });
    }

    // 2. DESPLEGAR FORMULARIO DE DEVOLUCIÓN
    if (btnSolicitarDevolucion && formDevolucionContainer) {
        btnSolicitarDevolucion.addEventListener('click', () => {
            formDevolucionContainer.classList.toggle('show');
            
            // Auto scroll suave hacia el formulario recién abierto
            if (formDevolucionContainer.classList.contains('show')) {
                formDevolucionContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // 3. DETECTAR NAVEGACIÓN DESDE EL DROPDOWN (Scroll automático)
    const urlParams = new URLSearchParams(window.location.search);
    const seccion = urlParams.get('seccion');
    
    if (seccion === 'contacto') {
        const targetSection = document.getElementById('sectionContacto');
        if (targetSection) {
            setTimeout(() => {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    }
});