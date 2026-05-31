document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DEL DOM ---
    const btnSolicitarDevolucion = document.getElementById('btnSolicitarDevolucion');
    const formDevolucionContainer = document.getElementById('formDevolucionContainer');

    // DESPLEGAR FORMULARIO DE DEVOLUCIÓN
    if (btnSolicitarDevolucion && formDevolucionContainer) {
        btnSolicitarDevolucion.addEventListener('click', () => {
            formDevolucionContainer.classList.toggle('is-visible');
            
            if (formDevolucionContainer.classList.contains('is-visible')) {
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