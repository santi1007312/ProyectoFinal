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
    const btnBuyNow       = document.getElementById('btnBuyNow');
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

    let cantidadSeleccionada = 1;
    const qtyDisplay = document.getElementById('qtyDisplay');
    const btnDecrement = document.getElementById('btnDecrement');
    const btnIncrement = document.getElementById('btnIncrement');

    function inicializarVista(prod, variantes) {
        if (nameEl)  nameEl.textContent  = prod.nombre;

        // Renderizar banner "PRODUCTO DESTACADO" debajo del título si esDestacado / isDestacado es true
        const isDestacado = prod.esDestacado === true || prod.esDestacado === 'true' || prod.isDestacado === true || prod.isDestacado === 'true';
        let badgeEl = document.getElementById('destacadoBadge');
        if (isDestacado) {
            if (!badgeEl && nameEl && nameEl.parentNode) {
                badgeEl = document.createElement('div');
                badgeEl.id = 'destacadoBadge';
                badgeEl.style.cssText = 'background-color: #ffcc00; color: #000000; font-weight: bold; padding: 6px 12px; border-radius: 4px; margin-top: 8px; margin-bottom: 12px; text-align: center; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;';
                badgeEl.textContent = 'PRODUCTO DESTACADO';
                nameEl.parentNode.insertBefore(badgeEl, nameEl.nextSibling);
            } else if (badgeEl) {
                badgeEl.style.display = 'block';
            }
        } else if (badgeEl) {
            badgeEl.style.display = 'none';
        }

        if (descEl)  {
            descEl.textContent  = prod.descripcion || 'Esta prenda cuenta con un diseño exclusivo, confeccionada con los mejores materiales de alta calidad.';
            descEl.style.display = 'block';
        }
        if (imgEl) {
            imgEl.src = prod.imagenPrincipal || prod.imagen || '../public/images/34.webp';
            imgEl.onerror = () => { imgEl.src = '../public/images/34.webp'; };
        }

        const precio = Number(prod.precioFinal || prod.precioBase).toLocaleString('es-CO');
        if (priceEl) priceEl.textContent = `$${precio} COP`;

        // Renderizar fecha de lanzamiento
        const releaseContainer = document.getElementById('productReleaseContainer');
        const releaseDateEl = document.getElementById('productReleaseDate');
        if (releaseContainer && releaseDateEl) {
            if (prod.esNuevo) {
                releaseDateEl.textContent = prod.esNuevo;
                releaseContainer.style.display = 'block';
            } else {
                releaseContainer.style.display = 'none';
            }
        }

        // Extraer colores y tallas únicos desde las variantes reales
        const esZapatos = String(prod.categoria) === '4' || (prod.nombre && prod.nombre.toUpperCase().includes('ZAPATO'));
        const tallasValidasCalzado = ['34', '36', '38', '39', '40', '42', '43'];
        const tallasValidasRopa = ['S', 'M', 'L', 'XL'];

        const coloresUnicos = [...new Set(variantes.map(v => v.color).filter(Boolean))];
        let tallasUnicas  = [...new Set(variantes.map(v => v.talla).filter(Boolean))];

        if (esZapatos) {
            tallasUnicas = tallasUnicas.filter(t => tallasValidasCalzado.includes(t));
            if (!tallasUnicas.length) tallasUnicas = tallasValidasCalzado;
        } else {
            tallasUnicas = tallasUnicas.filter(t => tallasValidasRopa.includes(t));
            if (!tallasUnicas.length) tallasUnicas = tallasValidasRopa;
        }

        const colores = coloresUnicos.length ? coloresUnicos : ['Negro'];
        const tallas  = tallasUnicas;

        renderizarColores(colores);
        renderizarTallas(tallas);
        actualizarVarianteSeleccionada();
        actualizarTextoCarrito();
    }

    function formatearFechaLanzamiento(fecha) {
        if (!fecha) return '';
        if (/^\d{2}\/\d{2}\/\d{2}$/.test(fecha)) {
            return fecha;
        }
        try {
            const valorNumerico = Number(fecha);
            const d = !isNaN(valorNumerico) && String(fecha).trim() !== '' ? new Date(valorNumerico) : new Date(fecha);
            if (!isNaN(d.getTime())) {
                const dia = String(d.getDate()).padStart(2, '0');
                const mes = String(d.getMonth() + 1).padStart(2, '0');
                const anio = String(d.getFullYear()).slice(-2);
                return `${dia}/${mes}/${anio}`;
            }
        } catch (err) {
            console.error("Error formateando fecha:", err);
        }
        return fecha;
    }

    function inicializarVistaSimple(prod) {
        if (nameEl)  nameEl.textContent  = prod.nombre;
        if (descEl)  {
            descEl.textContent  = prod.descripcion || 'Esta prenda cuenta con un diseño exclusivo, confeccionada con los mejores materiales de alta calidad.';
            descEl.style.display = 'block';
        }
        if (imgEl)   imgEl.src = prod.imagen;
        if (priceEl) priceEl.textContent = `$${Number(prod.precioFinal || prod.precioBase).toLocaleString('es-CO')} COP`;

        // Renderizar fecha de lanzamiento
        const releaseContainer = document.getElementById('productReleaseContainer');
        const releaseDateEl = document.getElementById('productReleaseDate');
        if (releaseContainer && releaseDateEl) {
            if (prod.esNuevo) {
                releaseDateEl.textContent = prod.esNuevo;
                releaseContainer.style.display = 'block';
            } else {
                releaseContainer.style.display = 'none';
            }
        }

        renderizarColores(prod.colores || ['Negro']);
        renderizarTallas(prod.tallas  || ['S', 'M', 'L', 'XL']);
        actualizarTextoCarrito();
    }

    function renderizarColores(colores) {
        if (!colorContainer) return;
        colorContainer.innerHTML = '';

        const mapaColoreCSS = {
            'Negro': '#111111',
            'Blanco': '#ffffff',
            'Gris': '#888888',
            'Rojo': '#CC0000',
            'Azul': '#1a3c8f',
            'Verde': '#1a6b2c',
            'Café': '#6b3a1f'
        };

        colores.forEach((col, index) => {
            const ball = document.createElement('div');
            ball.className = `color-ball ${index === 0 ? 'active' : ''}`;
            ball.style.backgroundColor = mapaColoreCSS[col] || '#333';
            ball.style.width = '24px';
            ball.style.height = '24px';
            ball.style.borderRadius = '50%';
            ball.style.cursor = 'pointer';
            if (col === 'Blanco') {
                ball.style.border = '1px solid #ccc';
            } else {
                ball.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            }
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
                // Reset quantity to 1 when changing selection
                cantidadSeleccionada = 1;
                if (qtyDisplay) qtyDisplay.textContent = cantidadSeleccionada;
            });

            colorContainer.appendChild(ball);
        });
    }

    // Renderizar Tallas
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
                // Reset quantity to 1 when changing selection
                cantidadSeleccionada = 1;
                if (qtyDisplay) qtyDisplay.textContent = cantidadSeleccionada;
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

    // ── TEXTO DE ESTADO DINÁMICO EN EL CARRITO ───────────────────────────────
    function actualizarTextoCarrito() {
        if (!productoActual) return;
        const carrito = CarritoService.obtenerLocal();
        const totalEnCarrito = carrito
            .filter(item => item.id === productoActual.id)
            .reduce((sum, item) => sum + item.cantidad, 0);
        
        const cartStatusText = document.getElementById('cartStatusText');
        if (cartStatusText) {
            cartStatusText.textContent = `Cantidad (${totalEnCarrito} en el carrito)`;
        }
    }

    // ── CONFIGURACIÓN DEL SELECTOR DE CANTIDAD ───────────────────────────────
    if (btnDecrement && qtyDisplay) {
        btnDecrement.addEventListener('click', () => {
            if (cantidadSeleccionada > 1) {
                cantidadSeleccionada--;
                qtyDisplay.textContent = cantidadSeleccionada;
            }
        });
    }

    if (btnIncrement && qtyDisplay) {
        btnIncrement.addEventListener('click', () => {
            const variante = variantesDisp.find(v => v.color === colorSeleccionado && v.talla === tallaSeleccionada);
            // Si la variante fue devuelta por la BD usamos su stock real; si aun no se han cargado variantes permitimos hasta stock disponible
            const stockMax = variante ? variante.stock : (variantesDisp.length > 0 ? 0 : 99);
            if (stockMax <= 0) {
                alert('⚠️ Esta variante no cuenta con stock disponible actualmente.');
                return;
            }
            if (cantidadSeleccionada < stockMax) {
                cantidadSeleccionada++;
                qtyDisplay.textContent = cantidadSeleccionada;
            } else {
                alert(`Límite alcanzado: Solo hay ${stockMax} unidades disponibles de esta variante.`);
            }
        });
    }

    // ── AGREGAR AL CARRITO ────────────────────────────────────────────────────
    if (btnAdd) {
        btnAdd.addEventListener('click', async () => {
            if (!productoActual) return;

            const variante = variantesDisp.find(v => v.color === colorSeleccionado && v.talla === tallaSeleccionada);
            if (variante && variante.stock <= 0) {
                alert('⚠️ No se puede agregar al carrito: Esta variante está agotada.');
                return;
            }

            const itemLocal = {
                id:     productoActual.id,
                nombre: productoActual.nombre,
                precio: productoActual.precioFinal || productoActual.precioBase,
                color:  colorSeleccionado,
                talla:  tallaSeleccionada,
                cantidad: cantidadSeleccionada,
                imagen: productoActual.imagenPrincipal || productoActual.imagen || '../public/images/34.webp'
            };

            btnAdd.disabled = true;
            btnAdd.textContent = 'Agregando...';

            const idVar = idVarianteSeleccionada || 1; // fallback si no hay variantes cargadas
            await CarritoService.agregar(idVar, cantidadSeleccionada, itemLocal);

            btnAdd.disabled = false;
            btnAdd.textContent = 'AGREGAR AL CARRITO';

            // Actualizar texto del selector
            actualizarTextoCarrito();

            // Desplegar modal flotante superior derecho
            const cartModal = document.getElementById('cartModal');
            if (cartModal) {
                document.getElementById('modalProductImg').src = itemLocal.imagen;
                const mTitle = document.getElementById('modalProductTitle');
                if (mTitle) {
                    mTitle.textContent = itemLocal.nombre.toUpperCase();
                    mTitle.style.fontWeight = 'bold';
                }
                document.getElementById('modalProductColor').textContent = itemLocal.color;
                document.getElementById('modalProductTalla').textContent = itemLocal.talla;

                const carrito = CarritoService.obtenerLocal();
                const totalUnits = carrito.reduce((sum, item) => sum + item.cantidad, 0);
                
                const btnViewCart = document.getElementById('btnModalViewCart');
                if (btnViewCart) {
                    btnViewCart.textContent = `Ver carrito (${totalUnits})`;
                }

                cartModal.style.display = 'block';
            }
        });
    }

    if (btnBuyNow) {
        btnBuyNow.addEventListener('click', () => {
            if (!productoActual) return;

            const itemLocal = {
                idVariante: idVarianteSeleccionada || 1,
                id:     productoActual.id,
                nombre: productoActual.nombre,
                precio: productoActual.precioFinal || productoActual.precioBase,
                color:  colorSeleccionado,
                talla:  tallaSeleccionada,
                cantidad: cantidadSeleccionada,
                imagen: productoActual.imagenPrincipal || productoActual.imagen || '../public/images/34.webp'
            };

            localStorage.setItem('elixir_checkout_items', JSON.stringify([itemLocal]));
            localStorage.setItem('elixir_checkout_source', 'direct');
            window.location.href = 'checkout.html';
        });
    }

    // EVENTOS DEL MODAL FLOTANTE
    const cartModal = document.getElementById('cartModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const lnkModalContinue = document.getElementById('lnkModalContinue');
    const btnModalViewCart = document.getElementById('btnModalViewCart');
    const btnModalCheckout = document.getElementById('btnModalCheckout');

    if (btnCloseModal && cartModal) {
        btnCloseModal.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    }

    if (lnkModalContinue && cartModal) {
        lnkModalContinue.addEventListener('click', (e) => {
            e.preventDefault();
            cartModal.style.display = 'none';
        });
    }

    if (btnModalViewCart) {
        btnModalViewCart.addEventListener('click', () => {
            window.location.href = 'interfazCarrito.html';
        });
    }

    if (btnModalCheckout) {
        btnModalCheckout.addEventListener('click', () => {
            const items = CarritoService.obtenerLocal();
            if (items.length === 0) {
                alert('El carrito está vacío.');
                return;
            }
            localStorage.setItem('elixir_checkout_items', JSON.stringify(items));
            localStorage.setItem('elixir_checkout_source', 'cart');
            window.location.href = 'checkout.html';
        });
    }
});