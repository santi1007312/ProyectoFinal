/**
 * main.js — Elixir and Flexx
 * Script global: maneja el menú desplegable del header (dropdown)
 * y la barra de búsqueda dinámica.
 */
import { getBaseUrl, NotificacionService } from './services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    // ── DROPDOWN Y ENLACES DE POLÍTICAS DE DEVOLUCIÓN ──────────────────────
    const dropdownToggle = document.getElementById('dropdownToggle');
    const headerDropdown = document.getElementById('headerDropdown');

    if (dropdownToggle && headerDropdown) {
        dropdownToggle.addEventListener('click', (e) => {
            // Permitir navegación si es doble clic o redireccionar directo a interfazDevoluciones.html si se prefiere
            e.preventDefault();
            headerDropdown.classList.toggle('is-active');
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!dropdownToggle.contains(e.target) && !headerDropdown.contains(e.target)) {
                headerDropdown.classList.remove('is-active');
            }
        });
    }

    // Vincular todos los botones/enlaces de "Políticas de devolución"
    document.querySelectorAll('a[href*="politicas"], a[href*="devolucion"], .enlace-footer-devolucion').forEach(link => {
        if (link.id === 'dropdownToggle') return;
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#' || href === 'politicas.html') {
                e.preventDefault();
                window.location.href = 'interfazDevoluciones.html?seccion=devoluciones';
            }
        });
    });

    // ── BARRA DE BÚSQUEDA DINÁMICA DE LA NAVBAR (OVERLAY Y TIEMPO REAL) ─────────
    // Inyectar el HTML del buscador dinámicamente si no existe en la página actual
    if (!document.getElementById('searchOverlay')) {
        const overlayHtml = `
            <div id="searchOverlay" class="search-overlay">
                <div class="search-overlay__container">
                    <input type="text" id="searchOverlayInput" class="search-overlay__input" placeholder="Búsqueda de productos..." autocomplete="off">
                    <div class="search-overlay__icons-right">
                        <i class="bx bx-search search-overlay__icon" id="searchOverlayBtn"></i>
                        <i class="bx bx-x search-overlay__close" id="searchOverlayClose"></i>
                    </div>
                    <div id="searchOverlayResults" class="search-results"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', overlayHtml);
    }

    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchOverlayInput');
    const closeBtn = document.getElementById('searchOverlayClose');
    const searchBtn = document.getElementById('searchOverlayBtn');
    const resultsContainer = document.getElementById('searchOverlayResults');

    // Vincular TODOS los iconos de búsqueda (en navbar o header)
    document.querySelectorAll('.bx-search, .search-icon, #btnSearch').forEach(searchIcon => {
        if (searchIcon.id !== 'searchOverlayBtn') {
            searchIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (overlay) {
                    overlay.classList.add('is-active');
                    setTimeout(() => {
                        if (input) input.focus();
                    }, 100);
                }
            });
        }
    });

    if (closeBtn && overlay) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cerrarBuscador();
        });
    }

    if (overlay) {
        // Cerrar al presionar la tecla Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cerrarBuscador();
            }
        });

        // Cerrar al hacer clic fuera del contenedor de búsqueda
        document.addEventListener('click', (e) => {
            if (overlay.classList.contains('is-active')) {
                const container = document.querySelector('.search-overlay__container');
                if (container && !container.contains(e.target) && !e.target.closest('.bx-search, .search-icon, #btnSearch')) {
                    cerrarBuscador();
                }
            }
        });
    }

    function cerrarBuscador() {
        if (overlay) overlay.classList.remove('is-active');
        if (resultsContainer) resultsContainer.classList.remove('is-active');
        if (input) {
            input.value = '';
        }
    }

    let debounceTimer;
    if (input) {
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const query = input.value.trim();
            if (query.length < 2) {
                if (resultsContainer) {
                    resultsContainer.innerHTML = '';
                    resultsContainer.classList.remove('is-active');
                }
                return;
            }
            debounceTimer = setTimeout(() => {
                realizarBusqueda(query);
            }, 300);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = input.value.trim();
                if (query) {
                    window.location.href = `interfazCatalogo.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    if (searchBtn && input) {
        searchBtn.addEventListener('click', () => {
            const query = input.value.trim();
            if (query) {
                window.location.href = `interfazCatalogo.html?q=${encodeURIComponent(query)}`;
            }
        });
    }

    async function realizarBusqueda(query) {
        try {
            const baseUrl = await getBaseUrl();
            const res = await fetch(`${baseUrl}/ProductoController?accion=buscar&q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            renderSearchResults(data);
        } catch (err) {
            console.error('Error al realizar búsqueda:', err);
        }
    }

    function renderSearchResults(data) {
        if (!resultsContainer) return;
        const { productos, categorias } = data;
        resultsContainer.innerHTML = '';

        if ((!productos || productos.length === 0) && (!categorias || categorias.length === 0)) {
            resultsContainer.innerHTML = `<div class="search-results__empty">No se encontraron resultados para su búsqueda.</div>`;
            resultsContainer.classList.add('is-active');
            return;
        }

        resultsContainer.classList.add('is-active');

        // Columna de Productos
        const prodCol = document.createElement('div');
        prodCol.innerHTML = `<h4 class="search-results__column-title">Productos</h4>`;
        const prodList = document.createElement('div');
        prodList.className = 'search-results__products-list';

        if (productos && productos.length > 0) {
            productos.forEach(p => {
                const item = document.createElement('a');
                item.href = `interfazProductoDetalle.html?id=${p.id}`;
                item.className = 'search-product-item';

                const priceFmt = Number(p.precio).toLocaleString('es-CO');
                const imgUrl = p.imagen || '../public/images/34.webp';

                item.innerHTML = `
                    <img class="search-product-item__img" src="${imgUrl}" alt="${p.nombre}" onerror="this.src='../public/images/34.webp'">
                    <div class="search-product-item__info">
                        <span class="search-product-item__name">${p.nombre}</span>
                        <span class="search-product-item__price">$${priceFmt} COP</span>
                    </div>
                `;
                prodList.appendChild(item);
            });
        } else {
            prodList.innerHTML = `<p style="color: #555; font-size: 0.85rem; padding: 10px;">No hay productos que coincidan.</p>`;
        }
        prodCol.appendChild(prodList);
        resultsContainer.appendChild(prodCol);

        // Columna de Categorías
        const catCol = document.createElement('div');
        catCol.innerHTML = `<h4 class="search-results__column-title">Categorías</h4>`;
        const catList = document.createElement('div');
        catList.className = 'search-results__categories-list';

        if (categorias && categorias.length > 0) {
            categorias.forEach(c => {
                const item = document.createElement('a');
                item.href = `interfazCatalogo.html?categoria=${c.id}`;
                item.className = 'search-category-item';
                item.textContent = c.nombre;
                catList.appendChild(item);
            });
        } else {
            catList.innerHTML = `<p style="color: #555; font-size: 0.85rem; padding: 10px;">No hay categorías que coincidan.</p>`;
        }
        catCol.appendChild(catList);
        resultsContainer.appendChild(catCol);
    }
});
