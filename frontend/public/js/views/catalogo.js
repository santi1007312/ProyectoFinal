document.addEventListener('DOMContentLoaded', () => {
    const catalogGrid = document.getElementById('catalogGrid');

    if (catalogGrid) {
        // Llamamos a tu controlador de Java para traer las categorías o productos
        fetch('ProductoController?accion=listar')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Error al conectar con el servidor');
                }
                return res.json(); // Esperamos un JSON desde el Servlet de Java
            })
            .then(data => {
                // Si el backend responde correctamente con datos, limpiamos el diseño estático
                if (data && data.length > 0) {
                    catalogGrid.innerHTML = ''; 

                    // Recorremos el arreglo de forma simple y creamos las tarjetas dinámicas
                    data.forEach(item => {
                        // Creamos la estructura exacta que ya diseñaste en tu HTML estático
                        const card = document.createElement('a');
                        card.href = `interfazProductos.html?categoria=${item.id}`; // Redirección pasando el ID por URL
                        card.className = 'category-card';

                        card.innerHTML = `
                            <div class="category-card__img-wrapper">
                                <img src="${item.imagen || '../public/images/default.webp'}" alt="${item.nombre}" class="category-card__img">
                            </div>
                            <div class="category-card__info">
                                <h3 class="category-card__name">${item.nombre.toUpperCase()} <span class="category-card__arrow">&gt;</span></h3>
                            </div>
                        `;

                        catalogGrid.appendChild(card);
                    });
                }
            })
            .catch(err => {
                // Si falla el fetch, no vaciamos el contenedor y se muestran las categorías estáticas por seguridad
                console.warn('Cargando catálogo en modo local/diseño: ', err.message);
            });
    }
});