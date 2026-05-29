document.addEventListener('DOMContentLoaded', () => {
    const btnLista = document.getElementById('btnVistaLista');
    const btnGaleria = document.getElementById('btnVistaGaleria');
    const contenedor = document.getElementById('contenedorPedidos');

    if (btnLista && btnGaleria && contenedor) {
        
        // Evento para activar Modo Lista
        btnLista.addEventListener('click', () => {
            btnGaleria.classList.remove('active');
            btnLista.classList.add('active');
            
            contenedor.classList.remove('view-gallery');
            contenedor.classList.add('view-list');
        });

        // Evento para activar Modo Galería
        btnGaleria.addEventListener('click', () => {
            btnLista.classList.remove('active');
            btnGaleria.classList.add('active');
            
            contenedor.classList.remove('view-list');
            contenedor.classList.add('view-gallery');
        });
    }

    // --- LÓGICA DEL MENÚ DESPLEGABLE EN PEDIDOS ---
    const dotsBtn = document.querySelector('.menu-dots-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu-pedido');

    if (dotsBtn && dropdownMenu) {
    // Alternar el menú al dar clic en los tres puntos
        dotsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el evento se propague al documento
            dropdownMenu.classList.toggle('show');
        });

    // Cerrar el menú automáticamente si da clic fuera de él
        document.addEventListener('click', (e) => {
            if (!dropdownMenu.contains(e.target) && e.target !== dotsBtn) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
});