/**
 * detalle.js — Elixir and Flexx
 * Vista de detalle de producto: carga datos reales y conecta el carrito al backend.
 */
import { ProductoService, VarianteService, CarritoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const imgEl           = document.getElementById('productDetailImg');
    const nameEl          = document.getElementById('productDetailName');
    const priceEl         = document.getElementById('productDetailPrice');
    const descEl          = document.getElementById('productDetailDesc');
    const colorContainer  = document.getElementById('colorContainer');
    const tallaContainer  = document.getElementById('tallaContainer');
    const colorDisplay    = document.getElementById('selectedColorDisplay');
    const tallaDisplay    = document.getElementById('selectedTallaDisplay');
    const btnAdd          = document.getElementById('btnAddToCart');
    const btnFeedback     = document.getElementById('addCartFeedback');

    let productoActual  = null;
    let variantesDisp   = [];
    let colorSeleccionado = '';
    let tallaSeleccionada = '';
    let idVarianteSeleccionada = null;

    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');

    if (!idProducto) {
        if (nameEl) nameEl.textContent = 'Producto no encontrado';
        return;
    }

    // Cargamos producto y sus variantes en paralelo
    cargarDetalle(idProducto);

    async function cargarDetalle(id) {
        try {
            const [prod, variantes] = await Promise.all([
                ProductoService.detalle(id),
                VarianteService.listarPorProducto(id).catch(() => [])
            ]);

            productoActual = prod;
            variantesDisp  = variantes;
            inicializarVista(prod, variantes);

        } catch {
            // Fallback visual si el backend no responde
            const fallback = {
                id: parseInt(idProducto),
                nombre: 'CONJUNTO DRAGÓN 🥷',
                precioBase: 220000,
                precioFinal: 220000,
                imagen: '../public/images/34.webp',
                descripcion: 'Conjunto streetwear de edición limitada.',
                colores: ['Negro', 'Gris', 'Blanco'],
                tallas: ['S', 'M', 'L', 'XL']
            };
            productoActual = fallback;
            inicializarVistaSimple(fallback);
        }
    }

    function inicializarVista(prod, variantes) {
        if (nameEl)  nameEl.textContent  = prod.nombre;
        if (descEl)  descEl.textContent  = prod.descripcion || '';
        if (imgEl) {
            imgEl.src = prod.imagenPrincipal || prod.imagen || '../public/images/34.webp';
            imgEl.onerror = () => { imgEl.src = '../public/images/34.webp'; };
        }

        const precio = Number(prod.precioFinal || prod.precioBase).toLocaleString('es-CO');
        if (priceEl) priceEl.textContent = `$${precio} COP`;

        // Extraer colores y tallas únicos desde las variantes reales
        const coloresUnicos = [...new Set(variantes.map(v => v.color).filter(Boolean))];
        const tallasUnicas  = [...new Set(variantes.map(v => v.talla).filter(Boolean))];

        // Si no hay variantes, usar fallback
        const colores = coloresUnicos.length ? coloresUnicos : ['Negro'];
        const tallas  = tallasUnicas.length  ? tallasUnicas  : ['S', 'M', 'L', 'XL'];

        renderizarColores(colores);
        renderizarTallas(tallas);
        actualizarVarianteSeleccionada();
    }

    function inicializarVistaSimple(prod) {
        if (nameEl)  nameEl.textContent  = prod.nombre;
        if (descEl)  descEl.textContent  = prod.descripcion || '';
        if (imgEl)   imgEl.src = prod.imagen;
        if (priceEl) priceEl.textContent = `$${Number(prod.precioFinal || prod.precioBase).toLocaleString('es-CO')} COP`;

        renderizarColores(prod.colores || ['Negro']);
        renderizarTallas(prod.tallas  || ['S', 'M', 'L', 'XL']);
    }

    function renderizarColores(colores) {
        if (!colorContainer) return;
        colorContainer.innerHTML = '';

        const mapaColoreCSS = {
            'Negro': '#111111',
            'Blanco': '#f0f0f0',
            'Gris': '#555555',
            'Rojo': '#CC0000',
            'Azul': '#1a3c8f',
            'Verde': '#1a6b2c',
            'Café': '#6b3a1f'
        };

        colores.forEach((col, index) => {
            const ball = document.createElement('div');
            ball.className = `color-ball ${index === 0 ? 'active' : ''}`;
            ball.style.backgroundColor = mapaColoreCSS[col] || '#333';
            ball.title = col;

            if (index === 0) {
                colorSeleccionado = col;
                if (colorDisplay) colorDisplay.textContent = col;
            }

            ball.addEventListener('click', () => {
                colorContainer.querySelectorAll('.color-ball').forEach(b => b.classList.remove('active'));
                ball.classList.add('active');
                colorSeleccionado = col;
                if (colorDisplay) colorDisplay.textContent = col;
                actualizarVarianteSeleccionada();
            });

            colorContainer.appendChild(ball);
        });
    }

    function renderizarTallas(tallas) {
        if (!tallaContainer) return;
        tallaContainer.innerHTML = '';

        tallas.forEach((talla, index) => {
            const box = document.createElement('button');
            box.className = `size-box ${index === 0 ? 'active' : ''}`;
            box.textContent = talla;
            box.type = 'button';

            if (index === 0) {
                tallaSeleccionada = talla;
                if (tallaDisplay) tallaDisplay.textContent = talla;
            }

            box.addEventListener('click', () => {
                tallaContainer.querySelectorAll('.size-box').forEach(b => b.classList.remove('active'));
                box.classList.add('active');
                tallaSeleccionada = talla;
                if (tallaDisplay) tallaDisplay.textContent = talla;
                actualizarVarianteSeleccionada();
            });

            tallaContainer.appendChild(box);
        });
    }

    function actualizarVarianteSeleccionada() {
        if (!variantesDisp.length) return;
        const variante = variantesDisp.find(v =>
            v.color === colorSeleccionado && v.talla === tallaSeleccionada
        );
        idVarianteSeleccionada = variante ? variante.idVariantes : null;

        // Mostrar stock si hay elemento en el DOM para ello
        const stockEl = document.getElementById('stockDisponible');
        if (stockEl && variante) {
            stockEl.textContent = variante.stock > 0
                ? `${variante.stock} disponibles`
                : '⚠️ Sin stock';
            stockEl.style.color = variante.stock > 0 ? 'inherit' : '#c0392b';
        }
    }

    // ── AGREGAR AL CARRITO ────────────────────────────────────────────────────
    if (btnAdd) {
        btnAdd.addEventListener('click', async () => {
            if (!productoActual) return;

            const itemLocal = {
                id:     productoActual.id,
                nombre: productoActual.nombre,
                precio: productoActual.precioFinal || productoActual.precioBase,
                color:  colorSeleccionado,
                talla:  tallaSeleccionada,
                cantidad: 1,
                imagen: productoActual.imagenPrincipal || productoActual.imagen || '../public/images/34.webp'
            };

            btnAdd.disabled = true;
            btnAdd.textContent = 'Agregando...';

            const idVar = idVarianteSeleccionada || 1; // fallback si no hay variantes cargadas
            await CarritoService.agregar(idVar, 1, itemLocal);

            btnAdd.disabled = false;
            btnAdd.textContent = 'AGREGAR AL CARRITO';

            // Feedback visual antes de redirigir
            if (btnFeedback) {
                btnFeedback.textContent = '✅ ¡Prenda agregada!';
                btnFeedback.style.display = 'block';
            }

            setTimeout(() => {
                window.location.href = 'interfazCarrito.html';
            }, 800);
        });
    }
});