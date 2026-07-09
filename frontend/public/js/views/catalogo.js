/**
 * catalogo.js — Elixir and Flexx
 * Carga los productos reales desde ProductoController y controla la navegación
 * dinámica de categorías (vista principal de menú de categorías vs vista secundaria de productos filtrados).
 */
import { ProductoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    // Contenedores del DOM
    const catalogGrid = document.getElementById('catalogGrid');
    const productosSeccion = document.getElementById('productosSeccion');
    const categoriaTitulo = document.getElementById('categoriaTitulo');
    const contenedorProductos = document.getElementById('contenedor-productos');
    const btnVolver = document.getElementById('btnVolverCategorias');

    // Mapa de categorías (ID → Nombre comercial)
    const CATEGORIAS = {
        1: 'Hoodies',
        2: 'Camisas',
        3: 'Sudaderas',
        4: 'Zapatos',
        5: 'Hoodies y Sudadera',
        6: 'Pantalonetas',
        7: 'Conjuntos',
        8: 'Edición Limitada'
    };

    let todosLosProductos = []; // Caché local para filtrados instantáneos

    // Cargar productos al iniciar
    cargarProductos();

    async function cargarProductos() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const queryBusqueda = urlParams.get('buscar');
            const queryCategoria = urlParams.get('categoria');

            // Listamos productos (con búsqueda si aplica)
            const params = queryBusqueda ? { q: queryBusqueda } : {};
            const productos = await ProductoService.listar(params);
            todosLosProductos = productos || [];

            // Vincular evento de clic a las tarjetas de categorías principales
            document.querySelectorAll('#catalogGrid .category-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    const catId = card.getAttribute('data-id');
                    
                    // Modificar la URL sin refrescar la página
                    const url = new URL(window.location);
                    url.searchParams.set('categoria', catId);
                    window.history.pushState({}, '', url);

                    mostrarCategoria(catId);
                });
            });

            // Determinar la vista inicial según los query params
            if (queryCategoria) {
                mostrarCategoria(queryCategoria);
            } else if (queryBusqueda) {
                mostrarBusquedaGeneral(queryBusqueda);
            } else {
                mostrarVistaMenuCategorias();
            }

        } catch (err) {
            console.warn('Error al cargar productos desde el servidor:', err.message);
        }
    }

    // ── 1. MOSTRAR VISTA INICIAL (MENÚ DE CATEGORÍAS) ────────────────────────
    function mostrarVistaMenuCategorias() {
        if (catalogGrid) catalogGrid.style.display = 'grid';
        if (productosSeccion) productosSeccion.style.display = 'none';

        // Remover cualquier mensaje previo de "no resultados"
        const msgPrevio = document.getElementById('mensaje-no-resultados');
        if (msgPrevio) msgPrevio.remove();
    }

    // ── 2. MOSTRAR VISTA DE PRODUCTOS FILTRADOS POR CATEGORÍA ────────────────
    function mostrarCategoria(catId) {
        if (catalogGrid) catalogGrid.style.display = 'none';
        if (productosSeccion) productosSeccion.style.display = 'block';

        const nombreCat = CATEGORIAS[catId] || 'Productos';
        if (categoriaTitulo) categoriaTitulo.textContent = nombreCat.toUpperCase();

        // Filtrar del listado en memoria
        const productosFiltrados = todosLosProductos.filter(p => String(p.categoria) === String(catId));
        renderizarProductos(productosFiltrados);
    }

    // ── 3. MOSTRAR RESULTADOS DE BÚSQUEDA GENERAL ────────────────────────────
    function mostrarBusquedaGeneral(query) {
        if (catalogGrid) catalogGrid.style.display = 'none';
        if (productosSeccion) productosSeccion.style.display = 'block';

        if (categoriaTitulo) categoriaTitulo.textContent = `BÚSQUEDA: "${query.toUpperCase()}"`;
        renderizarProductos(todosLosProductos);
    }

    // ── 4. RENDERIZAR LA CUADRÍCULA DE PRODUCTOS ─────────────────────────────
    function renderizarProductos(lista) {
        if (!contenedorProductos) return;
        contenedorProductos.innerHTML = '';

        // Limpiar mensaje previo de resultados vacíos
        const msgPrevio = document.getElementById('mensaje-no-resultados');
        if (msgPrevio) msgPrevio.remove();

        if (lista.length === 0) {
            contenedorProductos.innerHTML = '<p class="catalog-empty">No se encontraron prendas registradas en esta categoría.</p>';
            return;
        }

        lista.forEach(prod => {
            const card = document.createElement('a');
            card.href  = `checkout.html?id=${prod.id}`;
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
            contenedorProductos.appendChild(card);
        });
    }

    // ── 5. EVENTO CLIC DEL BOTÓN "VOLVER" ────────────────────────────────────
    if (btnVolver) {
        btnVolver.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Limpiar los query params del URL sin refrescar la página
            const url = new URL(window.location);
            url.searchParams.delete('categoria');
            url.searchParams.delete('buscar');
            window.history.pushState({}, '', url);

            mostrarVistaMenuCategorias();
        });
    }
});
