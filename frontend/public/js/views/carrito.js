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

    // Estado inicial limpio por defecto (estrictamente [] si está vacío)
    let carrito = CarritoService.obtenerLocal();

    function renderizarCarrito() {
        if (!itemsContainer) return;
        itemsContainer.innerHTML = '';

        if (!carrito || carrito.length === 0) {
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
        itemsContainer.addEventListener('click', async (e) => {
            const idx = e.target.getAttribute('data-index');
            if (idx === null) return;
            const i = parseInt(idx);

            if (e.target.classList.contains('btn-sumar')) {
                carrito[i].cantidad++;
                CarritoService.guardarLocal(carrito);
            } else if (e.target.classList.contains('btn-restar')) {
                if (carrito[i].cantidad > 1) {
                    carrito[i].cantidad--;
                    CarritoService.guardarLocal(carrito);
                }
            } else if (e.target.classList.contains('btn-delete')) {
                // CORRECCIÓN ERROR 3: Al eliminar un producto, sincronizamos la eliminación 
                // y aseguramos que si el carrito queda vacío, se purgue completamente de localStorage
                await CarritoService.eliminar(i);
                carrito = CarritoService.obtenerLocal();
                if (!carrito || carrito.length === 0) {
                    CarritoService.limpiarLocal();
                    carrito = [];
                }
            }

            renderizarCarrito();
        });
    }

    // ── BOTÓN PAGAR → Redirige a la vista de checkout ──────────────────────
    if (btnPagar) {
        btnPagar.addEventListener('click', () => {
            if (!carrito || carrito.length === 0) {
                alert('El carrito está vacío.');
                return;
            }

            // Guardar en checkout temporal
            localStorage.setItem('elixir_checkout_items', JSON.stringify(carrito));
            localStorage.setItem('elixir_checkout_source', 'cart');

            // Redirigir a checkout.html
            window.location.href = 'checkout.html';
        });
    }

    renderizarCarrito();
});
