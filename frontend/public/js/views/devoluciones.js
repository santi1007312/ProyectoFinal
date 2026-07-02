import { SoporteService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DEL DOM ---
    const btnSolicitarDevolucion = document.getElementById('btnSolicitarDevolucion');
    const formDevolucionContainer = document.getElementById('formDevolucionContainer');

    const formDevolucion = document.getElementById('formDevolucion');
    const formContacto = document.getElementById('formContacto');

    // DESPLEGAR FORMULARIO DE DEVOLUCIÓN
    if (btnSolicitarDevolucion && formDevolucionContainer) {
        btnSolicitarDevolucion.addEventListener('click', () => {
            formDevolucionContainer.classList.toggle('is-visible');
            
            if (formDevolucionContainer.classList.contains('is-visible')) {
                formDevolucionContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Scroll automático si viene del dropdown
    const urlParams = new URLSearchParams(window.location.search);
    const seccion = urlParams.get('seccion');
    
    if (seccion === 'contacto') {
        const targetSection = document.getElementById('sectionContacto');
        if (targetSection) {
            setTimeout(() => {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    }

    // ─── VALIDACIONES GENERALES Y MANEJO DE ERRORES ───────────────────────────
    function mostrarError(form, inputName, mensaje) {
        const input = form.querySelector(`[name="${inputName}"]`);
        if (input) {
            const group = input.closest('.support-form__group');
            const errorSpan = group.querySelector('.error-msg');
            if (errorSpan) {
                errorSpan.textContent = mensaje;
                errorSpan.style.display = 'block';
                input.style.border = '1px solid #ff3333';
            }
        }
    }

    function limpiarError(form, inputName) {
        const input = form.querySelector(`[name="${inputName}"]`);
        if (input) {
            const group = input.closest('.support-form__group');
            const errorSpan = group.querySelector('.error-msg');
            if (errorSpan) {
                errorSpan.style.display = 'none';
                errorSpan.textContent = '';
                input.style.border = 'none'; // reset to original style
            }
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Configurar validaciones en tiempo real para un input dado
    function registrarValidacionReal(form, name, validador) {
        const input = form.querySelector(`[name="${name}"]`);
        if (input) {
            input.addEventListener('input', () => {
                const val = input.value.trim();
                const error = validador(val);
                if (error) {
                    mostrarError(form, name, error);
                } else {
                    limpiarError(form, name);
                }
            });
        }
    }

    // Validador de nombre
    const validarNombre = (val) => {
        if (!val) return 'El nombre es obligatorio.';
        return null;
    };

    // Validador de documento
    const validarDocumento = (val) => {
        if (!val) return 'El número de documento es obligatorio.';
        if (val.length < 8) return 'Debe tener un mínimo de 8 caracteres.';
        return null;
    };

    // Validador de email
    const validarEmail = (val) => {
        if (!val) return 'El correo electrónico es obligatorio.';
        if (/^\d+$/.test(val)) return 'El correo no puede contener únicamente números.';
        if (!emailRegex.test(val)) return 'Ingrese un formato de correo electrónico válido (ejemplo@dominio.com).';
        return null;
    };

    // Validador de motivo/mensaje
    const validarMensaje = (val) => {
        if (!val) return 'Este campo es obligatorio y no puede estar vacío.';
        return null;
    };

    // Registrar en tiempo real para Formulario Devoluciones
    if (formDevolucion) {
        registrarValidacionReal(formDevolucion, 'nombre', validarNombre);
        registrarValidacionReal(formDevolucion, 'documento', validarDocumento);
        registrarValidacionReal(formDevolucion, 'email', validarEmail);
        registrarValidacionReal(formDevolucion, 'motivo', validarMensaje);

        formDevolucion.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = formDevolucion.querySelector('[name="nombre"]').value.trim();
            const documento = formDevolucion.querySelector('[name="documento"]').value.trim();
            const email = formDevolucion.querySelector('[name="email"]').value.trim();
            const motivo = formDevolucion.querySelector('[name="motivo"]').value.trim();

            let hayError = false;

            const errNombre = validarNombre(nombre);
            if (errNombre) { mostrarError(formDevolucion, 'nombre', errNombre); hayError = true; }
            
            const errDoc = validarDocumento(documento);
            if (errDoc) { mostrarError(formDevolucion, 'documento', errDoc); hayError = true; }

            const errEmail = validarEmail(email);
            if (errEmail) { mostrarError(formDevolucion, 'email', errEmail); hayError = true; }

            const errMotivo = validarMensaje(motivo);
            if (errMotivo) { mostrarError(formDevolucion, 'motivo', errMotivo); hayError = true; }

            if (hayError) return;

            // Enviar al servidor
            const btnSubmit = formDevolucion.querySelector('.support-form__btn-submit');
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Enviando...';

            const res = await SoporteService.crearDevolucion({ nombre, documento, email, motivo });
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Enviar Solicitud';

            if (res.ok) {
                alert('Solicitud de devolución enviada con éxito.');
                formDevolucion.reset();
                formDevolucionContainer.classList.remove('is-visible');
            } else {
                alert('❌ Error al enviar solicitud: ' + (res.mensaje || 'Error del servidor'));
            }
        });
    }

    // Registrar en tiempo real para Formulario Contacto
    if (formContacto) {
        registrarValidacionReal(formContacto, 'nombre', validarNombre);
        registrarValidacionReal(formContacto, 'email', validarEmail);
        registrarValidacionReal(formContacto, 'comentario', validarMensaje);

        formContacto.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = formContacto.querySelector('[name="nombre"]').value.trim();
            const email = formContacto.querySelector('[name="email"]').value.trim();
            const telefono = formContacto.querySelector('[name="telefono"]').value.trim();
            const comentario = formContacto.querySelector('[name="comentario"]').value.trim();

            let hayError = false;

            const errNombre = validarNombre(nombre);
            if (errNombre) { mostrarError(formContacto, 'nombre', errNombre); hayError = true; }

            const errEmail = validarEmail(email);
            if (errEmail) { mostrarError(formContacto, 'email', errEmail); hayError = true; }

            const errComentario = validarMensaje(comentario);
            if (errComentario) { mostrarError(formContacto, 'comentario', errComentario); hayError = true; }

            if (hayError) return;

            // Enviar al servidor
            const btnSubmit = formContacto.querySelector('.support-form__btn-submit');
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Enviando...';

            const res = await SoporteService.crearContacto({ nombre, email, telefono, comentario });
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Enviar';

            if (res.ok) {
                alert('Mensaje de contacto enviado con éxito.');
                formContacto.reset();
            } else {
                alert(' Error al enviar mensaje: ' + (res.mensaje || 'Error del servidor'));
            }
        });
    }
});