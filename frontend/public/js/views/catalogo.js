/**
 * catalogo.js — Elixir and Flexx
 * Carga los productos reales desde ProductoController y los muestra en el grid.
 * Si el backend no responde, muestra las tarjetas estáticas del HTML como fallback.
 */
import { ProductoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const catalogGrid  = document.getElementById('catalogGrid');
    const buscadorInput = document.getElementById('buscadorCatalogo');
    const filtroSelect = document.getElementById('filtroCategoria');

    // Mapa de categorías (ID → nombre) — sincronizado con tu BD
    const CATEGORIAS = {
        1: 'Hoodies',
        2: 'Cargo Pants',
        3: 'Sudaderas',
        4: 'Camisetas',
        5: 'Pantalonetas',
        6: 'Zapatos'
    };

    let todosLosProductos = []; // Cache local para filtrar sin re-fetch

    if (catalogGrid) {
        cargarProductos();
    }

    async function cargarProductos() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const queryBusqueda = urlParams.get('buscar');
            
            const params = queryBusqueda ? { q: queryBusqueda } : {};
            const productos = await ProductoService.listar(params);

            if (queryBusqueda && buscadorInput) {
                buscadorInput.value = queryBusqueda;
            }

            if (!productos || productos.length === 0) {
                todosLosProductos = [];
                renderizarProductos([]);
                return;
            }

            todosLosProductos = productos;
            renderizarProductos(productos);

        } catch (err) {
            // Si falla, el catálogo estático del HTML sigue visible
            console.warn('Modo sin servidor — mostrando catálogo local:', err.message);
        }
    }

    function renderizarProductos(lista) {
        if (!catalogGrid) return;
        catalogGrid.innerHTML = '';

        if (lista.length === 0) {
            catalogGrid.innerHTML = '<p class="catalog-empty">No se encontraron productos para esta búsqueda.</p>';
            return;
        }

        lista.forEach(prod => {
            const card = document.createElement('a');
            card.href  = `interfazProductoDetalle.html?id=${prod.id}`;
            card.className = 'category-card';

            const imgSrc = prod.imagenPrincipal || prod.imagen || '../public/images/34.webp';
            const nombreCategoria = CATEGORIAS[prod.categoria] || 'Ropa';
            const precioFormateado = Number(prod.precioBase).toLocaleString('es-CO');
            const precioFinalFmt   = Number(prod.precioFinal || prod.precioBase).toLocaleString('es-CO');

            const tieneDescuento = prod.descuento > 0;

            card.innerHTML = `
                <div class="category-card__img-wrapper">
                    <img
                        src="${imgSrc}"
                        alt="${prod.nombre}"
                        class="category-card__img"
                        onerror="this.src='../public/images/34.webp'"
                    >
                    ${prod.esNuevo ? '<span class="category-card__badge">NUEVO</span>' : ''}
                    ${tieneDescuento ? `<span class="category-card__badge category-card__badge--discount">-${prod.descuento}%</span>` : ''}
                </div>
                <div class="category-card__info">
                    <h3 class="category-card__name">${prod.nombre.toUpperCase()} <span class="category-card__arrow">&gt;</span></h3>
                    <p class="category-card__category">${nombreCategoria}</p>
                    <div class="category-card__price">
                        ${tieneDescuento
                            ? `<span class="price-original">$${precioFormateado}</span>
                               <span class="price-final">$${precioFinalFmt} COP</span>`
                            : `<span class="price-final">$${precioFormateado} COP</span>`
                        }
                    </div>
                </div>
            `;

            catalogGrid.appendChild(card);
        });
    }

    // ── BUSCADOR EN TIEMPO REAL ───────────────────────────────────────────────
    if (buscadorInput) {
        buscadorInput.addEventListener('input', filtrar);
    }

    if (filtroSelect) {
        filtroSelect.addEventListener('change', filtrar);
    }

    function filtrar() {
        const termino   = (buscadorInput?.value || '').toLowerCase().trim();
        const categoria = filtroSelect?.value || '';

        let resultado = todosLosProductos;

        if (termino) {
            resultado = resultado.filter(p =>
                p.nombre.toLowerCase().includes(termino) ||
                (p.descripcion || '').toLowerCase().includes(termino)
            );
        }

        if (categoria) {
            resultado = resultado.filter(p => String(p.categoria) === categoria);
        }

        renderizarProductos(resultado);
    }
});
