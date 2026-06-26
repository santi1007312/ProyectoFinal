/**
 * home.js — Elixir and Flexx
 * Carga los últimos 3 lanzamientos desde ProductoController para el home.
 */
import { ProductoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const contenedorLanzamientos = document.getElementById('contenedor-lanzamientos');

    if (contenedorLanzamientos) {
        cargarLanzamientos();
    }

    async function cargarLanzamientos() {
        try {
            const productos = await ProductoService.lanzamientos();

            if (!productos || productos.length === 0) return; // Deja las tarjetas estáticas intactas

            contenedorLanzamientos.innerHTML = '';

            productos.forEach(prod => {
                const card = document.createElement('div');
                card.className = 'launches-card';

                const imgSrc = prod.imagenPrincipal || prod.imagen || '../public/images/34.webp';
                const precio = Number(prod.precioFinal || prod.precioBase).toLocaleString('es-CO');

                card.innerHTML = `
                    <img
                        src="${imgSrc}"
                        alt="${prod.nombre}"
                        class="launches-card__img"
                        onerror="this.src='../public/images/34.webp'"
                    >
                    <div class="launches-card__info">
                        <h4>${prod.nombre}</h4>
                        <p>$${precio} COP</p>
                        ${prod.descuento > 0 ? `<span class="launches-card__discount">-${prod.descuento}% OFF</span>` : ''}
                    </div>
                `;

                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    window.location.href = `interfazProductoDetalle.html?id=${prod.id}`;
                });

                contenedorLanzamientos.appendChild(card);
            });

        } catch (err) {
            console.warn('Cargando lanzamientos en modo local:', err.message);
        }
    }
});