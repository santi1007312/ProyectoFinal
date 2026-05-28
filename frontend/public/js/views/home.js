document.addEventListener('DOMContentLoaded', () => {
    const launchesGrid = document.getElementById('launchesGrid');

    if (launchesGrid) {
        // Hacemos la petición al Servlet pidiendo solo los nuevos lanzamientos
        fetch('ProductoController?accion=lanzamientos')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Error al traer los lanzamientos');
                }
                return res.json();
            })
            .then(productos => {
                // Si el backend nos responde con un arreglo de productos reales, reemplazamos lo estático
                if (productos && productos.length > 0) {
                    launchesGrid.innerHTML = ''; // Limpiamos las tarjetas quemadas en el HTML

                    productos.forEach(prod => {
                        // Creamos el contenedor de la tarjeta
                        const card = document.createElement('div');
                        card.className = 'launches-card';

                        // Le metemos la estructura nativa respetando tus clases de CSS
                        card.innerHTML = `
                            <img src="${prod.imagen || '../public/images/default.webp'}" alt="${prod.nombre}" class="launches-card__img">
                            <div class="launches-card__info">
                                <h4>${prod.nombre}</h4>
                                <p>$${Number(prod.precio).toLocaleString('co')} COP</p>
                            </div>
                        `;

                        // Escuchador por si quieren darle clic a la prenda e ir al detalle
                        card.addEventListener('click', () => {
                            window.location.href = `interfazProductos.html?id=${prod.id}`;
                        });

                        launchesGrid.appendChild(card);
                    });
                }
            })
            .catch(err => {
                // Si el backend no está corriendo, el "catch" evita que se rompa la página 
                // y se quedan viendo las tarjetas por defecto.
                console.warn('Cargando lanzamientos en modo local:', err.message);
            });
    }
});