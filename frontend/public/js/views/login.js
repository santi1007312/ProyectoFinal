document.addEventListener('DOMContentLoaded', () => {
    // LÓGICA DEL MODAL DE RECUPERACIÓN
    const modal = document.getElementById('modalRecuperar');
    const btnClose = document.getElementById('btnCloseModal');

    if (modal && btnClose) {
        btnClose.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // LÓGICA DEL LOGIN (CONEXIÓN BACKEND)
    // Buscamos el formulario dentro de la tarjeta de autenticación
    const formLogin = document.querySelector('.auth-card form');

    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault(); // Evita que la página parpadee o se recargue

            // Capturamos los datos usando el atributo 'name' de los inputs
            const email = formLogin.querySelector('input[name="email"]').value.trim();
            const contrasena = formLogin.querySelector('input[name="contrasena"]').value.trim();
            const accion = formLogin.querySelector('input[name="accion"]').value;

            if (email === '' || contrasena === '') {
                alert('ojo, complete todos los campos.');
                return;
            }

            // Creamos los parámetros estructurados como los espera tu Controller de Java
            const urlParams = new URLSearchParams();
            urlParams.append('accion', accion);
            urlParams.append('email', email);
            urlParams.append('contrasena', contrasena);

            // Enviamos la petición al Servlet de Java
            fetch('UsuarioController', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: urlParams
            })
            .then(res => {
                if (res.ok) {
                    // Si el backend responde bien, redirigimos al catálogo o interfaz principal
                    window.location.href = 'interfazCatalogo.html'; 
                } else {
                    alert('Credenciales incorrectas o error en el servidor, verifique.');
                }
            })
            .catch(err => {
                console.error('Error en el login:', err);
                alert('No se pudo conectar con el servidor backend.');
            });
        });
    }
});