document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCrearProducto');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombreProducto').value;

            // Función nativa para generar el slug dinámicamente basado en tu nombre
            const slugGenerado = nombre
                .toLowerCase()
                .trim()
                .replace(/[\s_]+/g, '-')     // Cambia espacios por guiones
                .replace(/[^\w\-]+/g, '');   // Remueve caracteres raros

            // Recolectamos toda la información mapeada a tu BD
            const datosProducto = {
                accion: 'crear',
                nombreProducto: nombre,
                slug: slugGenerado,
                descripcion: document.getElementById('descripcion').value,
                precioBase: document.getElementById('precioBase').value,
                idCategorias: document.getElementById('idCategorias').value,
                material: document.getElementById('material').value,
                imagen: document.getElementById('imagen').value,
                colores: document.getElementById('colores').value,
                tallas: document.getElementById('tallas').value
            };

            // Convertimos a parámetros URL codificados
            const params = new URLSearchParams(datosProducto);

            // Fetch directo a tu Servlet controlador en Java
            fetch('../ProductoController', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            })
            .then(res => {
                if (res.ok) {
                    alert('¡Prenda registrada melamente en la base de datos de Elixir and Flexx! 🔥');
                    form.reset();
                } else {
                    alert('Grave mi ñero, hubo un error interno en el Servlet de Java.');
                }
            })
            .catch(err => {
                console.error('Error de red al conectar con MariaDB:', err);
            });
        });
    }
});