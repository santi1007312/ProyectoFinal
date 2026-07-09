/**
 * home.js — Elixir and Flexx
 * Gestiona el comportamiento de Nuevos Lanzamientos y el enrutamiento de categorías.
 */
import { ProductoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const launchesGrid = document.getElementById('launchesGrid');

    cargarConjuntos();
    configurarCategorias();

    async function cargarConjuntos() {
        if (!launchesGrid) return;
        try {
            // Obtener todos los productos del backend
            const productos = await ProductoService.listar();

            // Filtrar los productos pertenecientes a la categoría 7 ("CONJUNTOS")
            const conjuntos = (productos || []).filter(p => Number(p.categoria) === 7);

            // Obtener las tarjetas conceptuales estáticas ya presentes en el HTML
            const cards = launchesGrid.querySelectorAll('.launches-card');

            cards.forEach((card, index) => {
                // Asociamos cada tarjeta estática a un producto real del backend (por índice)
                const prod = conjuntos[index] || conjuntos[0];
                if (prod) {
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', () => {
                        window.location.href = `checkout.html?id=${prod.id}`;
                    });
                }
            });

        } catch (err) {
            console.warn('Error al cargar conjuntos reales. Conservando vista conceptual:', err.message);
        }
    }

    function configurarCategorias() {
        const categoryCards = document.querySelectorAll('.tarjeta-categoria');
        const categoriasMap = {
            'HOODIES': 1,
            'SUDADERAS': 3,
            'CAMISAS': 2,
            'CONJUNTO HOODIE Y SUDADERA': 5
        };
        categoryCards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                const titleEl = card.querySelector('.info-categoria h3');
                if (titleEl) {
                    const text = titleEl.textContent.replace('→', '').trim();
                    const catId = categoriasMap[text];
                    if (catId) {
                        e.preventDefault();
                        window.location.href = `interfazCatalogo.html?categoria=${catId}`;
                    }
                }
            });
        });
    }
});