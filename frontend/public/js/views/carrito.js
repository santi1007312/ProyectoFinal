/**
 * carrito.js — Elixir and Flexx
 * Gestiona el carrito (localStorage) y crea el pedido real en el backend al pagar.
 */
import { PedidoService, CarritoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const itemsContainer = document.getElementById('cartItemsContainer');
    const totalSumLabel  = document.getElementById('cartTotalSum');
    const btnPagar       = document.getElementById('btnPagarPedido');
    const direccionInput = document.getElementById('inputDireccionEnvio');

    let carrito = CarritoService.obtenerLocal();

    // Si está vacío, mostrar un item de demo para presentación
    if (carrito.length === 0) {
        carrito = [{
            idVariante: 1,
            id: 1,
            nombre: 'Hoodie Crossroads ✦',
            precio: 185000,
            color: 'Negro',
            talla: 'M',
            cantidad: 1,
            imagen: '../public/images/34.webp'
        }];
        CarritoService.guardarLocal(carrito);
    }

    function renderizarCarrito() {
        if (!itemsContainer) return;
        itemsContainer.innerHTML = '';

        if (carrito.length === 0) {
            itemsContainer.innerHTML = '<p style="padding:20px 0;color:var(--color-text-secondary)">El carrito está vacío, añade prendas desde el catálogo.</p>';
            if (totalSumLabel) totalSumLabel.textContent = '$0 COP';
            return;
        }

        let total = 0;

        carrito.forEach((prod, idx) => {
            const subtotal = prod.precio * prod.cantidad;
            total += subtotal;

            const row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML = `
                <div class="item-product">
                    <img
                        src="${prod.imagen || '../public/images/34.webp'}"
                        alt="${prod.nombre}"
                        class="item-img"
                        onerror="this.src='../public/images/34.webp'"
                    >
                    <div class="item-details">
                        <h3>${prod.nombre}</h3>
                        <p>$${prod.precio.toLocaleString('es-CO')} COP</p>
                        <p>Color: ${prod.color} &nbsp;|&nbsp; Talla: ${prod.talla}</p>
                    </div>
                </div>
                <div class="item-qty-selector">
                    <div class="qty-controls">
                        <button class="qty-btn btn-restar" data-index="${idx}" type="button">−</button>
                        <span class="qty-number">${prod.cantidad}</span>
                        <button class="qty-btn btn-sumar" data-index="${idx}" type="button">+</button>
                    </div>
                    <button class="btn-delete bx bxs-trash-alt" data-index="${idx}" type="button" title="Eliminar"></button>
                </div>
                <div class="item-total">
                    $${subtotal.toLocaleString('es-CO')} COP
                </div>
            `;
            itemsContainer.appendChild(row);
        });

        if (totalSumLabel) totalSumLabel.textContent = `$${total.toLocaleString('es-CO')} COP`;
    }

    // Delegación de eventos para sumar, restar y eliminar
    if (itemsContainer) {
        itemsContainer.addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-index');
            if (idx === null) return;
            const i = parseInt(idx);

            if (e.target.classList.contains('btn-sumar')) {
                carrito[i].cantidad++;
            } else if (e.target.classList.contains('btn-restar')) {
                if (carrito[i].cantidad > 1) carrito[i].cantidad--;
            } else if (e.target.classList.contains('btn-delete')) {
                carrito.splice(i, 1);
            }

            CarritoService.guardarLocal(carrito);
            renderizarCarrito();
        });
    }

    // ── BOTÓN PAGAR → crea el pedido real en el backend ──────────────────────
    if (btnPagar) {
        btnPagar.addEventListener('click', async () => {
            if (carrito.length === 0) {
                alert('El carrito está vacío.');
                return;
            }

            const direccion = direccionInput?.value.trim() || 'Sin dirección especificada';
            const total = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

            btnPagar.disabled = true;
            btnPagar.textContent = 'Procesando...';

            const resultado = await PedidoService.crear(total, direccion);

            if (resultado.ok) {
                // Limpiar carrito tras compra exitosa
                CarritoService.limpiarLocal();
                alert(`✅ ¡Pedido #${resultado.idPedido} creado exitosamente!\nTotal: $${total.toLocaleString('es-CO')} COP\nPronto recibirás tu pedido.`);
                window.location.href = 'interfazPedidos.html';
            } else {
                btnPagar.disabled = false;
                btnPagar.textContent = 'PAGAR PEDIDO';
                // Si el backend retorna 401 (no autenticado), redirigir al login
                if (resultado.mensaje && resultado.mensaje.includes('sesion')) {
                    alert('⚠️ Debes iniciar sesión para realizar un pedido.');
                    window.location.href = 'login.html';
                } else {
                    alert('❌ No se pudo procesar el pedido: ' + (resultado.mensaje || 'error del servidor.'));
                }
            }
        });
    }

    renderizarCarrito();
});
