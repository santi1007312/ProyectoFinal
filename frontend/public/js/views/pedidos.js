/**
 * pedidos.js — Elixir and Flexx
 * Vista independiente de Pedidos (consumida desde la Navbar).
 */
import { PedidoService, CarritoService } from '../services/api.js';

// CORRECCIÓN ERROR 1: Encapsulamos la inicialización en una función initPedidos() 
// y verificamos document.readyState para asegurar que cargarPedidos() se ejecute 
// inmediatamente aunque el script module cargue cuando DOMContentLoaded ya haya ocurrido.
function initPedidos() {
    const pedidosContainer = document.getElementById('pedidosDynamicContainer');

    function ejecutarVolverAComprar(articulos) {
        if (!articulos || articulos.length === 0) return;

        const carritoActual = CarritoService.obtenerLocal() || [];

        articulos.forEach(art => {
            const existente = carritoActual.find(c => (c.id === art.id || c.idVariante === art.idVariante) && c.talla === (art.variante ? art.variante.split('/')[1]?.trim() : (art.talla || 'M')));
            if (existente) {
                existente.cantidad += (art.cantidad || 1);
            } else {
                carritoActual.push({
                    idVariante: art.idVariante || art.id || 1,
                    id: art.id || 1,
                    nombre: art.nombre || 'Prenda Elixir',
                    precio: art.precio || 95000,
                    color: art.variante ? art.variante.split('/')[0]?.trim() : (art.color || 'Negro'),
                    talla: art.variante ? art.variante.split('/')[1]?.trim() : (art.talla || 'M'),
                    cantidad: art.cantidad || 1,
                    imagen: art.imagen || '../public/images/34.webp'
                });
            }
        });

        CarritoService.guardarLocal(carritoActual);
        alert('¡Prendas agregadas al carrito de compras! Redirigiendo...');
        window.location.href = 'interfazCarrito.html';
    }

    const PEDIDOS_MOCK = [
        {
            idPedido: 1585,
            fecha: '2026-01-28',
            estado: 'en_camino',
            estadoTexto: 'En camino',
            total: 190000,
            contacto: 'carrilloriverasantiago@gmail.com',
            direccionCompleta: 'Santiago Carrillo Rivera\nCalle 64e 1w 48, Balcones de gratamira\n680006 Bucaramanga Santander, Colombia',
            metodoPago: 'CONTRAENTREGA',
            articulos: [
                { id: 1, nombre: 'Sudadera False', variante: 'Negro / L', cantidad: 1, precio: 95000, imagen: '../public/images/34.webp' },
                { id: 2, nombre: 'Hoodie Crossroads', variante: 'Gris / M', cantidad: 1, precio: 95000, imagen: '../public/images/bmm92840_black_xl.webp' }
            ]
        }
    ];

    async function cargarPedidos() {
        if (!pedidosContainer) return;
        pedidosContainer.innerHTML = '<div style="color:#ccc; padding:20px; text-align:center;">Cargando mis pedidos...</div>';
        try {
            const list = await PedidoService.listarMisPedidos();
            if (list && list.length > 0) {
                renderizarListaPedidos(list);
            } else {
                renderizarListaPedidos(PEDIDOS_MOCK);
            }
        } catch (err) {
            console.warn("Modo fallback pedidos:", err);
            renderizarListaPedidos(PEDIDOS_MOCK);
        }
    }

    function renderizarListaPedidos(lista) {
        pedidosContainer.innerHTML = '';

        if (!lista || lista.length === 0) {
            pedidosContainer.innerHTML = `
                <div class="dark-card empty-placeholder" style="background:#18181b; border:1px solid #27272a; border-radius:8px; padding:40px; text-align:center;">
                    <i class="bx bx-package" style="font-size:3rem; color:#71717a; margin-bottom:12px; display:block;"></i>
                    <p style="margin:0; color:#a1a1aa;">No se ha realizado ningún pedido aún.</p>
                </div>
            `;
            return;
        }

        lista.forEach(ped => {
            const card = document.createElement('div');
            card.className = 'order-summary-card';

            const totalFmt = Number(ped.total).toLocaleString('es-CO');
            const articulos = ped.articulos || [
                { id: 1, nombre: 'Sudadera False', variante: 'Negro / L', cantidad: 1, precio: 95000, imagen: '../public/images/34.webp' },
                { id: 2, nombre: 'Camisa Oversized', variante: 'Blanco / M', cantidad: 1, precio: 95000, imagen: '../public/images/bmm92840_black_xl.webp' }
            ];

            const thumbsHtml = articulos.map(item => `
                <div class="order-thumb-box">
                    <img src="${item.imagen || '../public/images/34.webp'}" alt="${item.nombre}" onerror="this.src='../public/images/34.webp'">
                </div>
            `).join('');

            card.innerHTML = `
                <div class="order-summary-card__top">
                    <div>
                        <div class="order-thumbnails-row" title="Haz clic para ver el detalle del pedido">
                            ${thumbsHtml}
                        </div>
                    </div>
                    <button type="button" class="btn-dark-action btn-volver-comprar-trigger" data-ped='${JSON.stringify(articulos)}'>
                        Volver a comprar
                    </button>
                </div>
                <div class="order-summary-card__info">
                    <div>
                        <span class="order-status-badge"><i class="bx bx-truck"></i> ${ped.estadoTexto || ped.estado || 'En camino'}</span>
                        <div class="order-meta-text">Pedido #${ped.idPedido}</div>
                    </div>
                    <div class="order-total-price">$ ${totalFmt} COP</div>
                </div>
            `;

            const thumbsRow = card.querySelector('.order-thumbnails-row');
            if (thumbsRow) {
                thumbsRow.addEventListener('click', () => renderizarDetallePedido(ped));
            }

            const btnVC = card.querySelector('.btn-volver-comprar-trigger');
            if (btnVC) {
                btnVC.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ejecutarVolverAComprar(ped.articulos);
                });
            }

            pedidosContainer.appendChild(card);
        });
    }

    async function renderizarDetallePedido(ped) {
        if (!pedidosContainer) return;
        pedidosContainer.innerHTML = '<div style="color:#ccc; padding:20px; text-align:center;">Cargando detalle del pedido...</div>';

        let articulosReales = ped.articulos || [];
        let estadoPedido = ped.estado || 'pendiente';
        let direccionEnvio = ped.direccionCompleta || '';

        try {
            const detalleCompleto = await PedidoService.obtenerDetalleCompleto(ped.idPedido);
            if (detalleCompleto && detalleCompleto.items && detalleCompleto.items.length > 0) {
                articulosReales = detalleCompleto.items.map(it => ({
                    id: it.idDetallePedidos,
                    nombre: it.nombreSnapshot,
                    variante: `${it.colorSnapshot || 'Único'} / ${it.tallaSnapshot}`,
                    cantidad: it.cantidad,
                    precio: it.precioUnitario,
                    imagen: '../public/images/34.webp'
                }));
            }
            if (detalleCompleto && detalleCompleto.pedido) {
                estadoPedido = detalleCompleto.pedido.estado || estadoPedido;
                direccionEnvio = detalleCompleto.pedido.direccionEnvio || direccionEnvio;
            }
        } catch (e) {
            console.warn("No se pudo cargar detalle completo del pedido, usando datos disponibles:", e);
        }

        const totalFmt = Number(ped.total).toLocaleString('es-CO');
        const articulos = articulosReales;
        const fechaFmt = ped.fechaPedido || ped.fecha ? new Date(ped.fechaPedido || ped.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Reciente';

        const itemsHtml = articulos.map(item => `
            <div class="order-item-row">
                <div class="order-item-row__left">
                    <div class="order-item-thumb-badge">
                        <img src="${item.imagen || '../public/images/34.webp'}" alt="${item.nombre}" onerror="this.src='../public/images/34.webp'">
                        <span class="order-item-badge-qty">${item.cantidad || 1}</span>
                    </div>
                    <div>
                        <div class="order-item-meta__name">${item.nombre}</div>
                        <div class="order-item-meta__variant">${item.variante || 'Única'}</div>
                    </div>
                </div>
                <div style="font-weight:600; font-size:0.95rem;">
                    $ ${Number(item.precio * (item.cantidad || 1)).toLocaleString('es-CO')} COP
                </div>
            </div>
        `).join('');

        pedidosContainer.innerHTML = `
            <div class="dark-card">
                <div class="order-detail-header">
                    <div class="order-detail-header__left">
                        <button type="button" id="btnBackToOrders" class="btn-back-arrow" title="Regresar al historial">
                            <i class="bx bx-left-arrow-alt"></i>
                        </button>
                        <div>
                            <h2 style="margin:0; font-size:1.3rem; font-weight:700;">Pedido #${ped.idPedido}</h2>
                            <span style="font-size:0.85rem; color:var(--text-muted);">Confirmado el ${fechaFmt}</span>
                        </div>
                    </div>
                    <button type="button" id="btnVolverComprarDetalle" class="btn-dark-action">Volver a comprar</button>
                </div>

                <div style="background:#121318; border:1px solid var(--border-dark); border-radius:8px; padding:20px 24px; margin-bottom:24px;">
                    <div class="timeline-stepper">
                        <div class="timeline-step completed">
                            <div class="timeline-step__marker"></div>
                            <span class="timeline-step__title">Confirmado</span>
                            <span class="timeline-step__date">${fechaFmt}</span>
                        </div>
                        <div class="timeline-step active">
                            <div class="timeline-step__marker"></div>
                            <span class="timeline-step__title">${estadoPedido.toUpperCase()}</span>
                            <span class="timeline-step__date">Estado Logístico</span>
                        </div>
                    </div>
                </div>

                <h3 style="font-size:1.05rem; margin-bottom:14px; font-weight:600;">Artículos comprados</h3>
                <div class="order-items-list">
                    ${itemsHtml}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:16px; border-top:1px solid var(--border-dark); font-weight:700; font-size:1.1rem;">
                    <span>Total del Pedido</span>
                    <span>$ ${totalFmt} COP</span>
                </div>
            </div>
        `;

        const btnBack = document.getElementById('btnBackToOrders');
        if (btnBack) {
            btnBack.addEventListener('click', cargarPedidos);
        }

        const btnVC = document.getElementById('btnVolverComprarDetalle');
        if (btnVC) {
            btnVC.addEventListener('click', () => {
                ejecutarVolverAComprar(articulos);
            });
        }
    }

    cargarPedidos();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPedidos);
} else {
    initPedidos();
}