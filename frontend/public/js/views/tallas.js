/**
 * tallas.js — Elixir and Flexx
 * Lógica específica para la interfaz de Guía de Tallas.
 * Maneja el carrusel dinámico de títulos en el encabezado.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Títulos disponibles para el carrusel
    const titles = [
        "solo sena",
        "venimos a cambiar el sistema",
        "la dian nos busca"
    ];

    let currentIndex = 0;
    let isTransitioning = false;

    const titleElement = document.getElementById('carouselTitle');
    const prevBtn = document.getElementById('prevTitleBtn');
    const nextBtn = document.getElementById('nextTitleBtn');

    if (titleElement && prevBtn && nextBtn) {
        // Función para cambiar el título con animación
        const changeTitle = (direction) => {
            if (isTransitioning) return;
            isTransitioning = true;

            // Determinar clases de animación según la dirección
            const fadeOutClass = direction === 'next' ? 'fade-out-left' : 'fade-out-right';
            const fadeInClass = direction === 'next' ? 'fade-in-left' : 'fade-in-right';

            // 1. Iniciar animación de salida
            titleElement.classList.add(fadeOutClass);

            // 2. Esperar a que termine la salida, actualizar texto y hacer entrada
            setTimeout(() => {
                // Actualizar texto en mayúsculas
                titleElement.textContent = titles[currentIndex].toUpperCase();
                
                // Cambiar clases para animación de entrada
                titleElement.classList.remove(fadeOutClass);
                titleElement.classList.add(fadeInClass);
                
                // Forzar reflow para reiniciar la animación
                titleElement.offsetHeight;
                
                // 3. Quitar clase de entrada cuando acabe la animación
                setTimeout(() => {
                    titleElement.classList.remove(fadeInClass);
                    isTransitioning = false;
                }, 300); // Duración de la transición fade-in (300ms)

            }, 300); // Duración de la transición fade-out (300ms)
        };

        // Evento botón anterior
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + titles.length) % titles.length;
            changeTitle('prev');
        });

        // Evento botón siguiente
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % titles.length;
            changeTitle('next');
        });
    }
});
