document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener los elementos clave del DOM
    const imgEl = document.getElementById('productDetailImg');
    const nameEl = document.getElementById('productDetailName');
    const priceEl = document.getElementById('productDetailPrice');
    const colorContainer = document.getElementById('colorContainer');
    const tallaContainer = document.getElementById('tallaContainer');
    const colorDisplay = document.getElementById('selectedColorDisplay');
    const tallaDisplay = document.getElementById('selectedTallaDisplay');
    const btnAdd = document.getElementById('btnAddToCart');

    // Estado local de la selección actual del cliente
    let productoActual = null;
    let colorSeleccionado = "";
    let tallaSeleccionada = "";

    // 2. Extraer el ID que viene de la URL de la página (?id=X)
    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');

    if (idProducto) {
        // Consultar al Servlet los datos del producto específico
        fetch(`ProductoController?accion=detalle&id=${idProducto}`)
            .then(res => {
                if (!res.ok) throw new Error('Cargando modo simulación local');
                return res.json();
            })
            .then(data => {
                inicializarVista(data);
            })
            .catch(() => {
                // FALLBACK: Si tu servidor Java no está corriendo en este momento,
                // creamos un objeto por defecto simulando el "Conjunto Dragón" de tus capturas
                const simulacionPrenda = {
                    id: parseInt(idProducto),
                    nombre: 'CONJUNTO DRAGÓN 🥷',
                    precio: 220000,
                    imagen: '../public/images/34.webp', // Usa la foto urbana que tienes de A$AP Rocky
                    colores: ['Negro', 'Gris', 'Blanco'],
                    tallas: ['S', 'M', 'L', 'XL']
                };
                inicializarVista(simulacionPrenda);
            });
    }

    // 3. Función para rellenar la interfaz con los datos reales
    function inicializarVista(producto) {
        productoActual = producto;
        nameEl.textContent = producto.nombre;
        priceEl.textContent = `$${producto.precio.toLocaleString('es-CO')},00 COP`;
        imgEl.src = producto.imagen;

        // Renderizar opciones de color
        colorContainer.innerHTML = '';
        producto.colores.forEach((col, index) => {
            const ball = document.createElement('div');
            ball.className = `color-ball ${index === 0 ? 'active' : ''}`;
            
            // Mapeo básico de color en CSS según tu texto
            const colorMapa = { 'Negro': '#111', 'Gris': '#555', 'Blanco': '#fff' };
            ball.style.backgroundColor = colorMapa[col] || '#333';
            
            if(index === 0) {
                colorSeleccionado = col;
                colorDisplay.textContent = col;
            }

            ball.addEventListener('click', () => {
                document.querySelectorAll('.color-ball').forEach(b => b.classList.remove('active'));
                ball.classList.add('active');
                colorSeleccionado = col;
                colorDisplay.textContent = col;
            });
            colorContainer.appendChild(ball);
        });

        // Renderizar opciones de talla
        tallaContainer.innerHTML = '';
        producto.tallas.forEach((talla, index) => {
            const box = document.createElement('button');
            box.className = `size-box ${index === 0 ? 'active' : ''}`;
            box.textContent = talla;

            if(index === 0) {
                tallaSeleccionada = talla;
                tallaDisplay.textContent = talla;
            }

            box.addEventListener('click', () => {
                document.querySelectorAll('.size-box').forEach(b => b.classList.remove('active'));
                box.classList.add('active');
                tallaSeleccionada = talla;
                tallaDisplay.textContent = talla;
            });
            tallaContainer.appendChild(box);
        });
    }

    // 4. Lógica para añadir el artículo al LocalStorage del Carrito
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            if (!productoActual) return;

            // Traemos el carrito actual de la memoria local
            let carrito = JSON.parse(localStorage.getItem('elixir_cart')) || [];

            // Creamos la estructura exacta que lee nuestra vista del carrito
            const itemParaCarrito = {
                id: productoActual.id,
                nombre: productoActual.nombre,
                precio: productoActual.precio,
                color: colorSeleccionado,
                talla: tallaSeleccionada,
                cantidad: 1,
                imagen: productoActual.imagen
            };

            // Validamos si ya existe el mismo artículo con id, talla y color exacto en el carrito
            const existeIndex = carrito.findIndex(item => 
                item.id === itemParaCarrito.id && 
                item.color === itemParaCarrito.color && 
                item.talla === itemParaCarrito.talla
            );

            if (existeIndex !== -1) {
                // Si ya está, le sumamos a la cantidad
                carrito[existeIndex].cantidad++;
            } else {
                // Si es nuevo, lo empujamos al arreglo
                carrito.push(itemParaCarrito);
            }

            // Guardamos de vuelta en la memoria global del navegador
            localStorage.setItem('elixir_cart', JSON.stringify(carrito));

            // Redireccionamos de una para ver el carrito con la nueva prenda metida
            window.location.href = 'interfazCarrito.html';
        });
    }
});