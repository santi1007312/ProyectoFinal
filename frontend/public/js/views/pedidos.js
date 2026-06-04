/**
 * pedidos.js — Elixir and Flexx
 * Carga los pedidos reales del usuario desde PedidoController.
 */
import { PedidoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const contenedor   = document.getElementById('contenedorPedidos');
    const btnLista     = document.getElementById('btnVistaLista');
    const btnGaleria   = document.getElementById('btnVistaGaleria');

    // Alternar vista lista / galería
    if (btnLista && btnGaleria && contenedor) {
        btnLista.addEventListener('click', () => {
            btnGaleria.classList.remove('active');
            btnLista.classList.add('active');
            contenedor.classList.remove('view-gallery');
            contenedor.classList.add('view-list');
        });

        btnGaleria.addEventListener('click', () => {
            btnLista.classList.remove('active');
            btnGaleria.classList.add('active');
            contenedor.classList.remove('view-list');
            contenedor.classList.add('view-gallery');
        });
    }

    // Menú de tres puntos (dots)
    const dotsBtn      = document.querySelector('.menu-dots-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu-pedido');

    if (dotsBtn && dropdownMenu) {
        dotsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!dropdownMenu.contains(e.target) && e.target !== dotsBtn) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    // Cargar pedidos reales
    if (contenedor) {
        cargarPedidos();
    }

    async function cargarPedidos() {
        try {
            const pedidos = await PedidoService.listarMisPedidos();

            if (!pedidos || pedidos.length === 0) {
                contenedor.innerHTML = '<p style="padding:20px;color:var(--color-text-secondary)">Aún no tienes pedidos realizados. ¡Explora el catálogo!</p>';
                return;
            }

            contenedor.innerHTML = '';

            pedidos.forEach(ped => {
                const card = document.createElement('div');
                card.className = 'pedido-card';

                const fecha = ped.fecha ? new Date(ped.fecha).toLocaleDateString('es-CO') : 'Sin fecha';
                const total = Number(ped.total).toLocaleString('es-CO');
                const estadoClass = {
                    'pendiente':  'estado--pendiente',
                    'enviado':    'estado--enviado',
                    'entregado':  'estado--entregado',
                    'cancelado':  'estado--cancelado'
                }[ped.estado] || '';

                card.innerHTML = `
                    <div class="pedido-card__header">
                        <span class="pedido-card__id">Pedido #${ped.idPedido}</span>
                        <span class="pedido-card__estado ${estadoClass}">${(ped.estado || 'pendiente').toUpperCase()}</span>
                    </div>
                    <div class="pedido-card__body">
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Total:</strong> $${total} COP</p>
                        <p><strong>Dirección:</strong> ${ped.direccion || 'No especificada'}</p>
                    </div>
                `;

                contenedor.appendChild(card);
            });

        } catch (err) {
            // Si no hay sesión, redirigir
            if (err.message && err.message.includes('401')) {
                window.location.href = 'login.html';
            } else {
                console.warn('Pedidos modo local:', err.message);
            }
        }
    }
});