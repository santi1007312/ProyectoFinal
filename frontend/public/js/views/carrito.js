document.addEventListener('DOMContentLoaded', () => {
    const itemsContainer = document.getElementById('cartItemsContainer');
    const totalSumLabel = document.getElementById('cartTotalSum');
    const btnPagar = document.getElementById('btnPagarPedido');

    // 1. Simulación de carga inicial si no hay nada en el carrito (Para tu presentación)
    let carrito = JSON.parse(localStorage.getItem('elixir_cart')) || [];

    if (carrito.length === 0) {
        carrito = [
            {
                id: 101,
                nombre: 'Conjunto Dragón 🥷',
                precio: 220000,
                color: 'Negro',
                talla: 'S',
                cantidad: 1,
                imagen: '../public/images/el_estilo_de_asap_rocky_947117425.webp' // Cambia por tu ruta real de imagen si quieres
            }
        ];
        guardarCarrito();
    }

    // 2. Función para renderizar los productos en la pantalla
    function renderizarCarrito() {
        if (!itemsContainer) return;
        itemsContainer.innerHTML = ''; // Limpiamos pantalla

        if (carrito.length === 0) {
            itemsContainer.innerHTML = '<p style="padding: 20px 0; color: #555;">El carrito está vacío, mi ñero.</p>';
            totalSumLabel.textContent = '$0,00 COP';
            return;
        }

        let acumuladorTotal = 0;

        carrito.forEach((producto, indice) => {
            const subtotalItem = producto.precio * producto.cantidad;
            acumuladorTotal += subtotalItem;

            // Creamos el div con el grid del item
            const itemRow = document.createElement('div');
            itemRow.className = 'cart-item';

            itemRow.innerHTML = `
                <div class="item-product">
                    <img src="${producto.imagen}" alt="${producto.nombre}" class="item-img" onerror="this.src='../public/images/34.webp'">
                    <div class="item-details">
                        <h3>${producto.nombre}</h3>
                        <p>$${producto.precio.toLocaleString('es-CO')},00</p>
                        <p>Color: ${producto.color}</p>
                        <p>Talla: ${producto.talla}</p>
                    </div>
                </div>

                <div class="item-qty-selector">
                    <div class="qty-controls">
                        <button class="qty-btn btn-restar" data-index="${indice}">−</button>
                        <span class="qty-number">${producto.cantidad}</span>
                        <button class="qty-btn btn-sumar" data-index="${indice}">+</button>
                    </div>
                    <button class="btn-delete bxs-trash-alt bx" data-index="${indice}"></button>
                </div>

                <div class="item-total">
                    $${subtotalItem.toLocaleString('es-CO')},00
                </div>
            `;

            itemsContainer.appendChild(itemRow);
        });

        // Actualizamos el bloque inferior del total general
        totalSumLabel.textContent = `$${acumuladorTotal.toLocaleString('es-CO')},00 COP`;
    }

    // 3. Escuchador de clics del contenedor para manejar la lógica de sumar, restar y eliminar
    if (itemsContainer) {
        itemsContainer.addEventListener('click', (e) => {
            const indice = e.target.getAttribute('data-index');
            if (indice === null) return;

            if (e.target.classList.contains('btn-sumar')) {
                carrito[indice].cantidad++;
            } 
            else if (e.target.classList.contains('btn-restar')) {
                if (carrito[indice].cantidad > 1) {
                    carrito[indice].cantidad--;
                }
            } 
            else if (e.target.classList.contains('btn-delete')) {
                carrito.splice(indice, 1); // Lo saca del arreglo
            }

            guardarCarrito();
            renderizarCarrito();
        });
    }

    // 4. Función para guardar los cambios en el LocalStorage
    function guardarCarrito() {
        localStorage.setItem('elixir_cart', JSON.stringify(carrito));
    }

    // 5. Lógica del botón Pagar Pedido (Envío al backend)
    if (btnPagar) {
        btnPagar.addEventListener('click', () => {
            if (carrito.length === 0) {
                alert('No hay prendas en el carrito para procesar el pago.');
                return;
            }

            // Aquí recolectamos los datos para mandárselos a tu Servlet en Java (PedidoController)
            const datosPedido = {
                items: carrito,
                accion: 'guardarPedido'
            };

            console.log('Enviando datos al backend de Java:', datosPedido);
            
            // Simulación o ejecución de Fetch hacia tu backend:
            alert('¡Conexión melo! Procesando el pago en el sistema de Elixir and Flexx...');
            
            // Si necesitas vaciar el carrito tras comprar exitosamente descomenta esto:
            // carrito = [];
            // guardarCarrito();
            // renderizarCarrito();
        });
    }

    // Dibujamos todo por primera vez
    renderizarCarrito();
});