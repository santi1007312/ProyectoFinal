document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleccionamos el formulario de registro por su ID 
    const formRegistro = document.getElementById('formRegistro');

    if (formRegistro) {
        formRegistro.addEventListener('submit', (e) => {
            // Evitamos que la página se recargue sola
            e.preventDefault();

            // 2. Capturamos los datos de los inputs
            const nombre = document.getElementById('inputNombre').value;
            const correo = document.getElementById('inputCorreo').value;
            const password = document.getElementById('inputPassword').value;

            // Validación antes de mandar al backend
            if (nombre === '' || correo === '' || password === '') {
                alert('Por favor, llene todos los campos, mi ñero.');
                return;
            }

            // 3. Creamos el objeto con los datos del nuevo usuario
            const datosUsuario = {
                nombre: nombre,
                correo: correo,
                password: password
            };

            // 4. Lo mandamos al backend
            fetch('UsuarioController', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ accion: 'registro', nombre, correo, password })
            })
            .then(respuesta => respuesta.json())
            .then(data => {
                if (data.success) {
                    alert('¡Usuario registrado! Ya puede iniciar sesión.');
                    window.location.href = 'login.html'; // Lo mandamos al login
                } else {
                    alert('Huy, hubo un error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error conectando al backend:', error);
                alert('No se pudo conectar con el servidor backend.');
            });
        });
    }
});