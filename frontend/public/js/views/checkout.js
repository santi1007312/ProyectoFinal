/**
 * checkout.js — Elixir and Flexx
 * Lógica de la pantalla de pago (Checkout).
 * Carga los productos guardados para comprar, gestiona el modal de edición de dirección,
 * la visibilidad dinámica de los métodos de pago, el acordeón de facturación y el procesamiento final.
 */
import { PedidoService, CarritoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- VARIABLES DE ESTADO LOCAL DE DIRECCIÓN ---
    let shippingAddress = {
        pais: 'CO',
        nombre: 'Santiago',
        apellidos: 'Carrillo Rivera',
        documento: '1015243859', // por defecto pre-cargado
        direccion: 'Calle 64e 1w 48, Balcones de gratamira',
        ciudad: 'Bucaramanga',
        estado: 'SAN',
        codigoPostal: '680006',
        telefono: '3112457533'
    };

    // --- ELEMENTOS DEL DOM ---
    const checkoutItemsList = document.getElementById('checkoutItemsList');
    const summarySubtotal   = document.getElementById('summarySubtotal');
    const summaryTotal      = document.getElementById('summaryTotal');
    const btnPayNow         = document.getElementById('btnPayNow');

    // Elementos de Dirección de Envío en pantalla
    const displayNombre             = document.getElementById('displayNombre');
    const displayDireccion          = document.getElementById('displayDireccion');
    const displayCiudadEstadoPostal = document.getElementById('displayCiudadEstadoPostal');
    const displayTelefono          = document.getElementById('displayTelefono');
    const btnModifyAddress          = document.getElementById('btnModifyAddress');

    // Elementos del Modal
    const addressModal           = document.getElementById('addressModal');
    const btnCloseAddressModal   = document.getElementById('btnCloseAddressModal');
    const btnCancelAddressModal  = document.getElementById('btnCancelAddressModal');
    const addressForm            = document.getElementById('addressForm');
    const editCountry            = document.getElementById('editCountry');
    const editName               = document.getElementById('editName');
    const editLastName           = document.getElementById('editLastName');
    const editDoc                = document.getElementById('editDoc');
    const editDocError           = document.getElementById('editDocError');
    const editAddress            = document.getElementById('editAddress');
    const editCity               = document.getElementById('editCity');
    const editState              = document.getElementById('editState');
    const editPostal             = document.getElementById('editPostal');
    const editPhone              = document.getElementById('editPhone');

    // Métodos de Pago
    const nequiOptionBox = document.getElementById('nequiOptionBox');
    const cardOptionBox  = document.getElementById('cardOptionBox');
    const cashOptionBox  = document.getElementById('cashOptionBox');
    const nequiSubform   = document.getElementById('nequiSubform');
    const cardSubform    = document.getElementById('cardSubform');
    const cashSubform    = document.getElementById('cashSubform');

    // Dirección de Facturación Accordion
    const billingAddressAccordion = document.getElementById('billingAddressAccordion');
    
    // Inputs de Pago
    const nequiPhone      = document.getElementById('nequiPhone');
    const nequiPhoneError = document.getElementById('nequiPhoneError');
    const cardNumber      = document.getElementById('cardNumber');
    const cardNumberError = document.getElementById('cardNumberError');
    const cardExpiry      = document.getElementById('cardExpiry');
    const cardExpiryError = document.getElementById('cardExpiryError');
    const cardCvv         = document.getElementById('cardCvv');
    const cardCvvError    = document.getElementById('cardCvvError');
    const cardName        = document.getElementById('cardName');
    const cardNameError   = document.getElementById('cardNameError');

    // Inputs de Facturación
    const billingCountry  = document.getElementById('billingCountry');
    const billingName     = document.getElementById('billingName');
    const billingNameError = document.getElementById('billingNameError');
    const billingLastName = document.getElementById('billingLastName');
    const billingLastNameError = document.getElementById('billingLastNameError');
    const billingDoc      = document.getElementById('billingDoc');
    const billingDocError = document.getElementById('billingDocError');
    const billingAddress  = document.getElementById('billingAddress');
    const billingAddressError = document.getElementById('billingAddressError');
    const billingCity     = document.getElementById('billingCity');
    const billingCityError = document.getElementById('billingCityError');
    const billingState    = document.getElementById('billingState');
    const billingPostal   = document.getElementById('billingPostal');
    const billingPostalError = document.getElementById('billingPostalError');
    const billingPhone    = document.getElementById('billingPhone');
    const billingPhoneError = document.getElementById('billingPhoneError');

    // --- CARGAR PRODUCTOS DEL CHECKOUT ---
    let checkoutItems = [];
    let checkoutSource = 'direct';

    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');

    if (idProducto) {
        cargarProductoDirecto(idProducto);
    } else {
        inicializarCheckoutDesdeLocal();
    }

    async function cargarProductoDirecto(id) {
        try {
            const prod = await ProductoService.detalle(id);
            const itemLocal = {
                idProducto: prod.id || prod.idProducto,
                idVariante: prod.idVariante || 0,
                id:     prod.id || prod.idProducto,
                nombre: prod.nombre || prod.nombreProducto,
                precio: prod.precioFinal || prod.precioBase,
                color:  (prod.colores && prod.colores.length > 0) ? prod.colores[0] : 'Blanco',
                talla:  (prod.tallas && prod.tallas.length > 0) ? prod.tallas[0] : 'L',
                cantidad: 1,
                imagen: prod.imagenPrincipal || prod.imagen || prod.urlImagen || ''
            };

            checkoutItems = [itemLocal];
            checkoutSource = 'direct';
            localStorage.setItem('elixir_checkout_items', JSON.stringify(checkoutItems));
            localStorage.setItem('elixir_checkout_source', checkoutSource);
            renderSummary();
        } catch (err) {
            // Fallback visual si el backend no responde
            const fallback = {
                idProducto: parseInt(id),
                id: parseInt(id),
                nombre: 'Prenda Elixir',
                precioBase: 130000,
                precioFinal: 130000,
                imagen: '',
                color: 'Blanco',
                talla: 'L',
                cantidad: 1
            };
            const itemLocal = {
                idProducto: fallback.id,
                idVariante: 0,
                id:     fallback.id,
                nombre: fallback.nombre,
                precio: fallback.precioFinal || fallback.precioBase,
                color:  fallback.color,
                talla:  fallback.talla,
                cantidad: fallback.cantidad,
                imagen: fallback.imagen
            };

            checkoutItems = [itemLocal];
            checkoutSource = 'direct';
            localStorage.setItem('elixir_checkout_items', JSON.stringify(checkoutItems));
            localStorage.setItem('elixir_checkout_source', checkoutSource);
            renderSummary();
        }
    }

    function inicializarCheckoutDesdeLocal() {
        checkoutItems = JSON.parse(localStorage.getItem('elixir_checkout_items')) || [];
        checkoutSource = localStorage.getItem('elixir_checkout_source') || 'direct';

        // Si no hay productos en checkout, redirigimos al catálogo
        if (checkoutItems.length === 0) {
            alert('No hay productos seleccionados para pagar.');
            window.location.href = 'interfazCatalogo.html';
            return;
        }

        renderSummary();
    }

    function renderSummary() {
        if (!checkoutItemsList) return;
        checkoutItemsList.innerHTML = '';
        let total = 0;

        checkoutItems.forEach(item => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;

            const itemRow = document.createElement('div');
            itemRow.className = 'summary-item-row';
            itemRow.innerHTML = `
                <div class="summary-item-left">
                    <div class="summary-item-img-wrapper">
                        <img 
                            src="${item.imagen || '../public/images/34.webp'}" 
                            alt="${item.nombre}" 
                            class="summary-item-img"
                            onerror="this.src='../public/images/34.webp'"
                        >
                        <span class="summary-item-qty-badge">${item.cantidad}</span>
                    </div>
                    <div class="summary-item-info">
                        <h4 class="summary-item-name">${item.nombre.toUpperCase()}</h4>
                        <p class="summary-item-meta">${item.color} / ${item.talla}</p>
                    </div>
                </div>
                <div class="summary-item-price">
                    $${(item.precio * item.cantidad).toLocaleString('es-CO')} COP
                </div>
            `;
            checkoutItemsList.appendChild(itemRow);
        });

        const subtotalText = `$${total.toLocaleString('es-CO')} COP`;
        const totalText = `COP $ ${total.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (summarySubtotal) summarySubtotal.textContent = subtotalText;
        if (summaryTotal) summaryTotal.textContent = totalText;
    }

    // --- GESTIÓN DEL MODAL DE EDICIÓN DE DIRECCIÓN ---
    if (btnModifyAddress) {
        btnModifyAddress.addEventListener('click', () => {
            // Rellenar formulario modal con datos actuales
            editCountry.value = shippingAddress.pais;
            editName.value = shippingAddress.nombre;
            editLastName.value = shippingAddress.apellidos;
            editDoc.value = shippingAddress.documento;
            editAddress.value = shippingAddress.direccion;
            editCity.value = shippingAddress.ciudad;
            editState.value = shippingAddress.estado;
            editPostal.value = shippingAddress.codigoPostal;
            editPhone.value = shippingAddress.telefono;

            // Limpiar errores previos
            editDocError.style.display = 'none';
            editDoc.classList.remove('error-input');

            // Abrir modal
            addressModal.style.display = 'flex';
        });
    }

    function cerrarModalAddress() {
        addressModal.style.display = 'none';
    }

    if (btnCloseAddressModal) btnCloseAddressModal.addEventListener('click', cerrarModalAddress);
    if (btnCancelAddressModal) btnCancelAddressModal.addEventListener('click', cerrarModalAddress);

    // Guardar cambios del modal
    if (addressForm) {
        addressForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validar CC o NIT
            const docVal = editDoc.value.trim();
            if (!docVal) {
                editDocError.style.display = 'block';
                editDoc.classList.add('error-input');
                editDoc.focus();
                return;
            } else {
                editDocError.style.display = 'none';
                editDoc.classList.remove('error-input');
            }

            // Actualizar objeto de dirección
            shippingAddress.pais = editCountry.value;
            shippingAddress.nombre = editName.value.trim();
            shippingAddress.apellidos = editLastName.value.trim();
            shippingAddress.documento = docVal;
            shippingAddress.direccion = editAddress.value.trim();
            shippingAddress.ciudad = editCity.value.trim();
            shippingAddress.estado = editState.value;
            shippingAddress.codigoPostal = editPostal.value.trim();
            shippingAddress.telefono = editPhone.value.trim();

            // Renderizar en la tarjeta
            displayNombre.textContent = `${shippingAddress.nombre} ${shippingAddress.apellidos}`;
            displayDireccion.textContent = shippingAddress.direccion;
            displayCiudadEstadoPostal.textContent = `${shippingAddress.codigoPostal} ${shippingAddress.ciudad} ${shippingAddress.estado}, ${shippingAddress.pais}`;
            displayTelefono.textContent = shippingAddress.telefono;

            cerrarModalAddress();
        });
    }

    // --- MANEJO DE MÉTODOS DE PAGO DINÁMICOS ---
    const paymentRadioButtons = document.querySelectorAll('input[name="paymentMethod"]');
    
    paymentRadioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            // Limpiar estados activos
            nequiOptionBox.classList.remove('active');
            cardOptionBox.classList.remove('active');
            cashOptionBox.classList.remove('active');

            nequiSubform.style.display = 'none';
            cardSubform.style.display = 'none';
            cashSubform.style.display = 'none';

            // Activar la seleccionada
            if (radio.value === 'nequi') {
                nequiOptionBox.classList.add('active');
                nequiSubform.style.display = 'block';
            } else if (radio.value === 'card') {
                cardOptionBox.classList.add('active');
                cardSubform.style.display = 'block';
            } else if (radio.value === 'cash') {
                cashOptionBox.classList.add('active');
                cashSubform.style.display = 'block';
            }
        });
    });

    // --- ACORDEÓN DE DIRECCIÓN DE FACTURACIÓN ---
    const billingRadioButtons = document.querySelectorAll('input[name="billingOption"]');
    
    billingRadioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'different') {
                billingAddressAccordion.classList.add('open');
            } else {
                billingAddressAccordion.classList.remove('open');
                // Limpiar errores del acordeón
                ocultarErroresFacturacion();
            }
        });
    });

    function ocultarErroresFacturacion() {
        const errorMsgs = billingAddressAccordion.querySelectorAll('.error-msg');
        errorMsgs.forEach(err => err.style.display = 'none');
        const inputs = billingAddressAccordion.querySelectorAll('.checkout-input');
        inputs.forEach(input => input.classList.remove('error-input'));
    }

    // --- FORMATEO EN TIEMPO REAL ---
    // Expiración tarjeta MM/AA
    if (cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // Número de tarjeta con espacios
    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            let formatted = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) formatted += ' ';
                formatted += value[i];
            }
            e.target.value = formatted.substring(0, 19);
        });
    }

    // Teléfono Nequi sólo números
    if (nequiPhone) {
        nequiPhone.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
        });
    }

    // CVV sólo números
    if (cardCvv) {
        cardCvv.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
    }

    // --- PROCESAR PAGO AL HACER CLIC EN PAGAR AHORA ---
    if (btnPayNow) {
        btnPayNow.addEventListener('click', async () => {
            // 1. Validaciones básicas
            let isValid = true;

            // A. VALIDAR PAGO SELECCIONADO
            const activePayment = document.querySelector('input[name="paymentMethod"]:checked').value;
            
            if (activePayment === 'nequi') {
                const phone = nequiPhone.value.trim();
                if (phone.length < 10) {
                    nequiPhoneError.style.display = 'block';
                    nequiPhone.classList.add('error-input');
                    nequiPhone.focus();
                    isValid = false;
                } else {
                    nequiPhoneError.style.display = 'none';
                    nequiPhone.classList.remove('error-input');
                }
            } else if (activePayment === 'card') {
                // Tarjeta
                const numberVal = cardNumber.value.replace(/\s/g, '');
                const expiryVal = cardExpiry.value.trim();
                const cvvVal    = cardCvv.value.trim();
                const nameVal   = cardName.value.trim();

                if (numberVal.length < 15) {
                    cardNumberError.style.display = 'block';
                    cardNumber.classList.add('error-input');
                    cardNumber.focus();
                    isValid = false;
                } else {
                    cardNumberError.style.display = 'none';
                    cardNumber.classList.remove('error-input');
                }

                if (!/^\d{2}\/\d{2}$/.test(expiryVal)) {
                    cardExpiryError.style.display = 'block';
                    cardExpiry.classList.add('error-input');
                    isValid = false;
                } else {
                    cardExpiryError.style.display = 'none';
                    cardExpiry.classList.remove('error-input');
                }

                if (cvvVal.length < 3) {
                    cardCvvError.style.display = 'block';
                    cardCvv.classList.add('error-input');
                    isValid = false;
                } else {
                    cardCvvError.style.display = 'none';
                    cardCvv.classList.remove('error-input');
                }

                if (nameVal === '') {
                    cardNameError.style.display = 'block';
                    cardName.classList.add('error-input');
                    isValid = false;
                } else {
                    cardNameError.style.display = 'none';
                    cardName.classList.remove('error-input');
                }
            }

            // B. VALIDAR DIRECCIÓN DE FACTURACIÓN SI ES DIFERENTE
            const activeBilling = document.querySelector('input[name="billingOption"]:checked').value;
            let billingAddressString = '';

            if (activeBilling === 'different') {
                const bName     = billingName.value.trim();
                const bLastName = billingLastName.value.trim();
                const bDoc      = billingDoc.value.trim();
                const bAddress  = billingAddress.value.trim();
                const bCity     = billingCity.value.trim();
                const bPostal   = billingPostal.value.trim();
                const bPhone    = billingPhone.value.trim();

                if (!bName) {
                    billingNameError.style.display = 'block';
                    billingName.classList.add('error-input');
                    isValid = false;
                } else {
                    billingNameError.style.display = 'none';
                    billingName.classList.remove('error-input');
                }

                if (!bLastName) {
                    billingLastNameError.style.display = 'block';
                    billingLastName.classList.add('error-input');
                    isValid = false;
                } else {
                    billingLastNameError.style.display = 'none';
                    billingLastName.classList.remove('error-input');
                }

                // VALIDACIÓN DE DOCUMENTO FACTURACIÓN EN ROJO
                if (!bDoc) {
                    billingDocError.style.display = 'block';
                    billingDoc.classList.add('error-input');
                    isValid = false;
                } else {
                    billingDocError.style.display = 'none';
                    billingDoc.classList.remove('error-input');
                }

                if (!bAddress) {
                    billingAddressError.style.display = 'block';
                    billingAddress.classList.add('error-input');
                    isValid = false;
                } else {
                    billingAddressError.style.display = 'none';
                    billingAddress.classList.remove('error-input');
                }

                if (!bCity) {
                    billingCityError.style.display = 'block';
                    billingCity.classList.add('error-input');
                    isValid = false;
                } else {
                    billingCityError.style.display = 'none';
                    billingCity.classList.remove('error-input');
                }

                if (!bPostal) {
                    billingPostalError.style.display = 'block';
                    billingPostal.classList.add('error-input');
                    isValid = false;
                } else {
                    billingPostalError.style.display = 'none';
                    billingPostal.classList.remove('error-input');
                }

                if (!bPhone) {
                    billingPhoneError.style.display = 'block';
                    billingPhone.classList.add('error-input');
                    isValid = false;
                } else {
                    billingPhoneError.style.display = 'none';
                    billingPhone.classList.remove('error-input');
                }

                if (isValid) {
                    billingAddressString = `Facturación: ${bName} ${bLastName}, Doc: ${bDoc}, ${bAddress}, ${bCity} ${billingState.value} ${bPostal}, ${billingCountry.value}, Tel: ${bPhone}`;
                }
            }

            if (!isValid) {
                alert('⚠️ Por favor corrige los errores en el formulario antes de proceder.');
                return;
            }

            // 2. CONSTRUIR DIRECCIÓN TOTAL Y REALIZAR PEDIDO
            const finalShippingStr = `${shippingAddress.nombre} ${shippingAddress.apellidos}, Doc: ${shippingAddress.documento}, ${shippingAddress.direccion}, ${shippingAddress.codigoPostal} ${shippingAddress.ciudad} ${shippingAddress.estado}, ${shippingAddress.pais}, Tel: ${shippingAddress.telefono}`;
            
            // Si hay facturación diferente, la concatenamos o la manejamos
            const direccionPedidoCompleta = activeBilling === 'different' 
                ? `${finalShippingStr} | [${billingAddressString}]`
                : finalShippingStr;

            // Calcular total a pagar
            const total = checkoutItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

            // Deshabilitar botón para evitar doble envío
            btnPayNow.disabled = true;
            btnPayNow.textContent = 'PROCESANDO PAGO...';

            try {
                // Crear pedido en backend con ítems del carrito
                const resultado = await PedidoService.crear(total, direccionPedidoCompleta, checkoutItems);

                if (resultado.ok) {
                    alert(`✅ ¡Pedido #${resultado.idPedido} creado exitosamente!\nTotal: $${total.toLocaleString('es-CO')} COP\nTu compra ha sido procesada mediante ${activePayment.toUpperCase()}.`);
                    
                    // Limpiar local storage
                    localStorage.removeItem('elixir_checkout_items');
                    localStorage.removeItem('elixir_checkout_source');

                    // Si la compra provino del carrito, vaciar el carrito
                    if (checkoutSource === 'cart') {
                        CarritoService.vaciar();
                    }

                    // Redirigir a pedidos
                    window.location.href = 'interfazPedidos.html';
                } else {
                    btnPayNow.disabled = false;
                    btnPayNow.textContent = 'PAGAR AHORA';

                    if (resultado.mensaje && resultado.mensaje.includes('sesion')) {
                        alert('⚠️ Debes iniciar sesión para finalizar la compra.');
                        window.location.href = 'login.html';
                    } else {
                        alert('❌ No se pudo completar el pedido: ' + (resultado.mensaje || 'Error desconocido del servidor.'));
                    }
                }
            } catch (err) {
                console.error(err);
                btnPayNow.disabled = false;
                btnPayNow.textContent = 'PAGAR AHORA';
                alert('❌ Ocurrió un error al procesar el pedido. Comprueba la conexión.');
            }
        });
    }
});
