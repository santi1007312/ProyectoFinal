document.addEventListener('DOMContentLoaded', () => {
    // 1. Buscamos las etiquetas exactas mediante los IDs que acabamos de meter
    const userNameEl = document.getElementById('userNameDisplay');
    const userEmailEl = document.getElementById('userEmailDisplay');
    const addressNameEl = document.getElementById('addressNameDisplay');
    const addressStreetEl = document.getElementById('addressStreetDisplay');
    const addressNeighbourEl = document.getElementById('addressNeighbourDisplay');
    const addressCountryEl = document.getElementById('addressCountryDisplay');
    
    // Capturamos su icono del lápiz por su ID o clase de Boxicons
    const btnEditarPerfil = document.getElementById('btnEditPerfil') || document.querySelector('.bx-edit');

    // 2. Pedimos los datos al controlador de Java
    fetch('../UsuarioController?accion=obtenerPerfil')
        .then(res => {
            if (!res.ok) throw new Error('Simulación modo offline');
            return res.json();
        })
        .then(usuario => {
            renderizarDatos(usuario);
        })
        .catch(() => {
            // Sus datos reales por defecto si el servidor está caído
            const datosSimulados = {
                nombre: 'Santiago Carrillo rivera',
                correo: 'carrilloriverasantiago@gmail.com',
                direccion: 'Calle 64e 1w 48',
                barrio: 'Balcones de gratamira',
                pais: 'Colombia'
            };
            renderizarDatos(datosSimulados);
        });

    // 3. Inyectamos los textos de forma dinámica sin romper los estilos de las clases
    function renderizarDatos(user) {
        if (userNameEl) userNameEl.textContent = user.nombre;
        if (userEmailEl) userEmailEl.textContent = user.correo;
        if (addressNameEl) addressNameEl.textContent = user.nombre;
        if (addressStreetEl) addressStreetEl.textContent = user.direccion;
        if (addressNeighbourEl) addressNeighbourEl.textContent = user.barrio;
        if (addressCountryEl) addressCountryEl.textContent = user.pais;
    }

    // 4. Evento del clic en el lápiz
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener('click', () => {
            const nuevoNombre = prompt('Modifique su nombre de perfil:', userNameEl.textContent);
            if (nuevoNombre && nuevoNombre.trim() !== "") {
                userNameEl.textContent = nuevoNombre;
                
                // Aquí manda el fetch por POST al Servlet como vimos antes...
            }
        });
    }
});