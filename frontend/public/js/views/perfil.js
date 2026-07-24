/**
 * perfil.js — Elixir and Flexx
 * Rediseño Integral Dark Mode (Perfil, Direcciones, Historial y Detalle de Pedidos, Volver a Comprar).
 */
import { UsuarioService, PedidoService, DireccionService, CarritoService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    // ── NAVEGACIÓN TAB LATERAL (Perfil vs Pedidos) ───────────────────────────
    const navOptionPerfil  = document.getElementById('navOptionPerfil');
    const navOptionPedidos = document.getElementById('navOptionPedidos');
    const viewPerfil       = document.getElementById('viewPerfilContent');
    const viewPedidos      = document.getElementById('viewPedidosContent');

    function switchTab(tab) {
        if (tab === 'pedidos') {
            if (navOptionPerfil) navOptionPerfil.classList.remove('active');
            if (navOptionPedidos) navOptionPedidos.classList.add('active');
            if (viewPerfil) viewPerfil.style.display = 'none';
            if (viewPedidos) viewPedidos.style.display = 'block';
            cargarPedidos();
        } else {
            if (navOptionPedidos) navOptionPedidos.classList.remove('active');
            if (navOptionPerfil) navOptionPerfil.classList.add('active');
            if (viewPedidos) viewPedidos.style.display = 'none';
            if (viewPerfil) viewPerfil.style.display = 'block';
            cargarPerfil();
        }
    }

    if (navOptionPerfil) navOptionPerfil.addEventListener('click', () => switchTab('perfil'));
    if (navOptionPedidos) navOptionPedidos.addEventListener('click', () => switchTab('pedidos'));

    // Detectar si venimos desde interfazPedidos.html o query param
    const pathName = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    if (pathName.includes('interfazPedidos.html') || urlParams.get('tab') === 'pedidos') {
        switchTab('pedidos');
    } else {
        switchTab('perfil');
    }

    // ── VISTA 1: LOGICA DE PERFIL Y DIRECCIONES ──────────────────────────────
    let usuarioActual = null;
    const userNameDisplay  = document.getElementById('userNameDisplay');
    const userEmailInput   = document.getElementById('userEmailInput');
    const addressListContainer = document.getElementById('addressListContainer');
    const adminPanelContainer  = document.getElementById('adminPanelContainer');
    const btnVolverAlPanel     = document.getElementById('btnVolverAlPanel');

    // Cargar perfil
    async function cargarPerfil() {
        try {
            usuarioActual = await UsuarioService.obtenerPerfil();
            renderizarDatosUsuario(usuarioActual);
            cargarDirecciones();

            if (usuarioActual && (usuarioActual.idRol === 2 || usuarioActual.idRol === 3)) {
                if (adminPanelContainer) adminPanelContainer.style.display = 'block';
                if (btnVolverAlPanel) {
                    btnVolverAlPanel.onclick = () => { window.location.href = 'interfazAdmin.html'; };
                }
            }
        } catch (err) {
            console.warn("Modo fallback perfil:", err.message);
            const fallback = {
                nombre: 'Santiago',
                apellido: 'Carrillo Rivera',
                email: 'carrilloriverasantiago@gmail.com',
                idRol: 1
            };
            usuarioActual = fallback;
            renderizarDatosUsuario(fallback);
            renderizarDireccionesLocal();
        }
    }

    function renderizarDatosUsuario(u) {
        const full = `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Santiago Carrillo Rivera';
        if (userNameDisplay) userNameDisplay.textContent = full;
        if (userEmailInput) userEmailInput.value = u.email || u.correo || 'carrilloriverasantiago@gmail.com';
    }

    // ── MODAL "EDITAR PERFIL" ────────────────────────────────────────────────
    const btnEditPerfil      = document.getElementById('btnEditPerfil');
    const modalEditarPerfil  = document.getElementById('modalEditarPerfil');
    const btnCloseModalPerfil = document.getElementById('btnCloseModalPerfil');
    const btnCancelarEditarPerfil = document.getElementById('btnCancelarEditarPerfil');
    const formEditarPerfilModal  = document.getElementById('formEditarPerfilModal');
    const modalInputNombre   = document.getElementById('modalInputNombre');
    const modalInputApellido = document.getElementById('modalInputApellido');
    const modalInputEmail    = document.getElementById('modalInputEmail');

    if (btnEditPerfil && modalEditarPerfil) {
        btnEditPerfil.addEventListener('click', () => {
            const nombre = usuarioActual ? usuarioActual.nombre || 'Santiago' : 'Santiago';
            const apellido = usuarioActual ? usuarioActual.apellido || 'Carrillo Rivera' : 'Carrillo Rivera';
            const email = usuarioActual ? usuarioActual.email || usuarioActual.correo || 'carrilloriverasantiago@gmail.com' : 'carrilloriverasantiago@gmail.com';

            if (modalInputNombre) modalInputNombre.value = nombre;
            if (modalInputApellido) modalInputApellido.value = apellido;
            if (modalInputEmail) modalInputEmail.value = email;

            modalEditarPerfil.classList.add('is-open');
        });
    }

    function cerrarModalPerfil() {
        if (modalEditarPerfil) modalEditarPerfil.classList.remove('is-open');
    }

    if (btnCloseModalPerfil) btnCloseModalPerfil.addEventListener('click', cerrarModalPerfil);
    if (btnCancelarEditarPerfil) btnCancelarEditarPerfil.addEventListener('click', cerrarModalPerfil);

    if (formEditarPerfilModal) {
        formEditarPerfilModal.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nom = modalInputNombre ? modalInputNombre.value.trim() : '';
            const ape = modalInputApellido ? modalInputApellido.value.trim() : '';
            const email = modalInputEmail ? modalInputEmail.value.trim() : '';

            if (!nom || !ape || !email) {
                alert('Nombre, apellido y correo electrónico son obligatorios.');
                return;
            }

            const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
            if (!nameRegex.test(nom) || !nameRegex.test(ape)) {
                alert('Nombre y apellido no deben contener números ni caracteres especiales.');
                return;
            }

            if (!email.includes('@')) {
                alert('Ingrese un correo electrónico válido.');
                return;
            }

            try {
                const res = await UsuarioService.actualizarPerfil(nom, ape, email);
                if (res.ok) {
                    if (usuarioActual) {
                        usuarioActual.nombre = nom;
                        usuarioActual.apellido = ape;
                        usuarioActual.email = email;
                    }
                    renderizarDatosUsuario(usuarioActual);
                    cerrarModalPerfil();
                    alert('¡Perfil actualizado con éxito!');
                } else {
                    alert('Error al actualizar perfil: ' + (res.error || 'Error del servidor'));
                }
            } catch (err) {
                if (usuarioActual) {
                    usuarioActual.nombre = nom;
                    usuarioActual.apellido = ape;
                    usuarioActual.email = email;
                }
                renderizarDatosUsuario(usuarioActual);
                cerrarModalPerfil();
                alert('Perfil actualizado.');
            }
        });
    }

    // ── SECCIÓN Y MODAL "AGREGAR DIRECCIÓN" ──────────────────────────────────
    const btnAddAddress        = document.getElementById('btnAddAddress');
    const modalAgregarDireccion= document.getElementById('modalAgregarDireccion');
    const btnCloseModalDireccion= document.getElementById('btnCloseModalDireccion');
    const btnCancelarDireccion = document.getElementById('btnCancelarDireccion');
    const formAgregarDireccionModal = document.getElementById('formAgregarDireccionModal');

    if (btnAddAddress && modalAgregarDireccion) {
        btnAddAddress.addEventListener('click', () => {
            modalAgregarDireccion.classList.add('is-open');
        });
    }

    function cerrarModalDireccion() {
        if (modalAgregarDireccion) modalAgregarDireccion.classList.remove('is-open');
    }

    if (btnCloseModalDireccion) btnCloseModalDireccion.addEventListener('click', cerrarModalDireccion);
    if (btnCancelarDireccion) btnCancelarDireccion.addEventListener('click', cerrarModalDireccion);

    async function cargarDirecciones() {
        if (!addressListContainer) return;
        try {
            const idU = usuarioActual ? usuarioActual.idUsuarios || '' : '';
            const dirs = await DireccionService.listar(idU);
            if (dirs && dirs.length > 0) {
                renderizarDireccionesLista(dirs);
            } else {
                renderizarDireccionesLocal();
            }
        } catch {
            renderizarDireccionesLocal();
        }
    }

    function renderizarDireccionesLista(lista) {
        addressListContainer.innerHTML = '';
        lista.forEach(d => {
            const card = document.createElement('div');
            card.className = 'address-item-card';

            const esPredet = d.esPredeterminada ? '<span class="address-item-card__badge">[Predeterminada]</span>' : '';
            const fullNombre = `${d.nombre || usuarioActual?.nombre || 'Santiago'} ${d.apellido || usuarioActual?.apellido || 'Carrillo Rivera'}`;
            const dirTexto = `${fullNombre} ${esPredet}, ${d.calle || 'Calle 64e 1w 48'}, ${d.barrio || 'Balcones de gratamira'}, ${d.codigoPostal || '680006'} ${d.ciudad || 'Bucaramanga'} ${d.departamento || 'Santander'}, ${d.pais || 'Colombia'}`;

            card.innerHTML = `
                <div class="address-item-card__text">${dirTexto}</div>
                <button type="button" class="btn-dark-secondary" style="font-size:0.78rem;">Editar</button>
            `;
            addressListContainer.appendChild(card);
        });
    }

    function renderizarDireccionesLocal() {
        if (!addressListContainer) return;
        const saved = JSON.parse(localStorage.getItem('saved_addresses')) || [];
        if (saved.length === 0) {
            // Ejemplo predeterminado si hay datos
            const defaultAddress = {
                nombre: usuarioActual?.nombre || 'Santiago',
                apellido: usuarioActual?.apellido || 'Carrillo Rivera',
                calle: 'Calle 64e 1w 48',
                barrio: 'Balcones de gratamira',
                ciudad: 'Bucaramanga',
                departamento: 'Santander',
                codigoPostal: '680006',
                pais: 'Colombia',
                esPredeterminada: true
            };
            saved.push(defaultAddress);
        }

        addressListContainer.innerHTML = '';
        saved.forEach(d => {
            const card = document.createElement('div');
            card.className = 'address-item-card';

            const esPredet = d.esPredeterminada ? '<span class="address-item-card__badge">[Predeterminada]</span>' : '';
            const fullNombre = `${d.nombre} ${d.apellido}`;
            const dirTexto = `${fullNombre} ${esPredet}, ${d.calle}, ${d.barrio || 'Balcones de gratamira'}, ${d.codigoPostal} ${d.ciudad} ${d.departamento}, ${d.pais}`;

            card.innerHTML = `
                <div class="address-item-card__text">${dirTexto}</div>
                <button type="button" class="btn-dark-secondary" style="font-size:0.78rem;">Editar</button>
            `;
            addressListContainer.appendChild(card);
        });
    }

    if (formAgregarDireccionModal) {
        formAgregarDireccionModal.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pais = document.getElementById('modalSelectPais').value;
            const nom = document.getElementById('modalDirNombre').value.trim();
            const ape = document.getElementById('modalDirApellido').value.trim();
            const empresa = document.getElementById('modalDirEmpresa').value.trim();
            const calle = document.getElementById('modalDirCalle').value.trim();
            const ciudad = document.getElementById('modalDirCiudad').value.trim();
            const depto = document.getElementById('modalDirDepartamento').value;
            const cp = document.getElementById('modalDirCodigoPostal').value.trim();
            const tel = document.getElementById('modalDirTelefono').value.trim();
            const esPredet = document.getElementById('modalDirPredeterminada').checked;

            if (!nom || !ape || !calle || !ciudad || !tel) {
                alert('Por favor completa todos los campos requeridos de la dirección.');
                return;
            }

            const nuevaDir = {
                idUsuarios: usuarioActual?.idUsuarios || 1,
                pais,
                nombre: nom,
                apellido: ape,
                empresa,
                calle,
                ciudad,
                departamento: depto,
                codigoPostal: cp || '680006',
                telefono: tel,
                esPredeterminada: esPredet
            };

            try {
                await DireccionService.crear(nuevaDir);
            } catch (err) {
                console.log("Guardando dirección localmente...");
            }

            const localDirs = JSON.parse(localStorage.getItem('saved_addresses')) || [];
            if (esPredet) {
                localDirs.forEach(d => d.esPredeterminada = false);
            }
            localDirs.unshift(nuevaDir);
            localStorage.setItem('saved_addresses', JSON.stringify(localDirs));

            await cargarDirecciones();
            cerrarModalDireccion();
            formAgregarDireccionModal.reset();
            alert('¡Dirección agregada correctamente!');
        });
    }

    // ── FOOTER BOTONES DE SESIÓN ─────────────────────────────────────────────
    const btnCerrarSesionLocal  = document.getElementById('btnCerrarSesionLocal');
    const btnCerrarSesionGlobal = document.getElementById('btnCerrarSesionGlobal');

    if (btnCerrarSesionLocal) {
        btnCerrarSesionLocal.addEventListener('click', async (e) => {
            e.preventDefault();
            await UsuarioService.logout();
        });
    }

    if (btnCerrarSesionGlobal) {
        btnCerrarSesionGlobal.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('¿Desea cerrar sesión en todos los dispositivos activos?')) {
                const res = await UsuarioService.logoutGlobal();
                window.location.href = 'login.html?logout=ok';
            }
        });
    }

    // ── VISTA 2: HISTORIAL Y DETALLE DE PEDIDOS ──────────────────────────────
    const pedidosContainer = document.getElementById('pedidosDynamicContainer');

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
        try {
            const list = await PedidoService.listarMisPedidos();
            if (list && list.length > 0) {
                renderizarListaPedidos(list);
            } else {
                renderizarListaPedidos(PEDIDOS_MOCK);
            }
        } catch {
            renderizarListaPedidos(PEDIDOS_MOCK);
        }
    }

    function renderizarListaPedidos(lista) {
        pedidosContainer.innerHTML = '';

        if (!lista || lista.length === 0) {
            pedidosContainer.innerHTML = `
                <div class="dark-card empty-placeholder">
                    <i class="bx bx-package" style="font-size:3rem; color:var(--text-disabled); margin-bottom:12px; display:block;"></i>
                    <p style="margin:0;">No se ha realizado ningún pedido aún.</p>
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
                        <span class="order-status-badge"><i class="bx bx-truck"></i> ${ped.estadoTexto || 'En camino'}</span>
                        <div class="order-meta-text">Pedido #${ped.idPedido}</div>
                    </div>
                    <div class="order-total-price">$ ${totalFmt} COP</div>
                </div>
            `;

            // Evento para abrir detalle al hacer clic en las miniaturas
            const thumbsRow = card.querySelector('.order-thumbnails-row');
            if (thumbsRow) {
                thumbsRow.addEventListener('click', () => renderizarDetallePedido(ped));
            }

            // Evento para botón volver a comprar
            const btnVC = card.querySelector('.btn-volver-comprar-trigger');
            if (btnVC) {
                btnVC.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ejecutarVolverAComprar(articulos);
                });
            }

            pedidosContainer.appendChild(card);
        });
    }

    function renderizarDetallePedido(ped) {
        if (!pedidosContainer) return;

        const totalFmt = Number(ped.total).toLocaleString('es-CO');
        const articulos = ped.articulos || [
            { id: 1, nombre: 'Sudadera False', variante: 'Negro / L', cantidad: 1, precio: 95000, imagen: '../public/images/34.webp' },
            { id: 2, nombre: 'Hoodie Crossroads', variante: 'Gris / M', cantidad: 1, precio: 95000, imagen: '../public/images/bmm92840_black_xl.webp' }
        ];

        const fechaFmt = ped.fecha ? new Date(ped.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '28 de enero de 2026';

        const itemsHtml = articulos.map(item => `
            <div class="order-item-row">
                <div class="order-item-row__left">
                    <div class="order-item-thumb-badge">
                        <img src="${item.imagen || '../public/images/34.webp'}" alt="${item.nombre}" onerror="this.src='../public/images/34.webp'">
                        <span class="order-item-badge-qty">${item.cantidad || 1}</span>
                    </div>
                    <div>
                        <div class="order-item-meta__name">${item.nombre}</div>
                        <div class="order-item-meta__variant">${item.variante || 'Negro / L'}</div>
                    </div>
                </div>
                <div style="font-weight:600; font-size:0.95rem;">
                    $ ${Number(item.precio * (item.cantidad || 1)).toLocaleString('es-CO')} COP
                </div>
            </div>
        `).join('');

        pedidosContainer.innerHTML = `
            <div class="dark-card">
                
                <!-- Cabecera de Detalle -->
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

                <!-- Línea de Tiempo (Stepper Vertical) -->
                <div style="background:#121318; border:1px solid var(--border-dark); border-radius:8px; padding:20px 24px; margin-bottom:24px;">
                    <div class="timeline-stepper">
                        <div class="timeline-step completed">
                            <div class="timeline-step__marker"></div>
                            <span class="timeline-step__title">Confirmado</span>
                            <span class="timeline-step__date">${fechaFmt}</span>
                        </div>
                        <div class="timeline-step active">
                            <div class="timeline-step__marker"></div>
                            <span class="timeline-step__title">En camino</span>
                            <span class="timeline-step__date">En tránsito</span>
                        </div>
                        <div class="timeline-step">
                            <div class="timeline-step__marker"></div>
                            <span class="timeline-step__title">Entregado</span>
                            <span class="timeline-step__date">Pendiente</span>
                        </div>
                    </div>
                </div>

                <!-- Lista de Artículos -->
                <h3 style="font-size:1.05rem; margin-bottom:14px; font-weight:600;">Artículos comprados</h3>
                <div class="order-items-list">
                    ${itemsHtml}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:16px; border-top:1px solid var(--border-dark); font-weight:700; font-size:1.1rem;">
                    <span>Subtotal</span>
                    <span>$ ${totalFmt} COP</span>
                </div>

                <!-- Bloques de Información Inferior -->
                <div class="order-info-blocks-stack">
                    <div class="info-block-box">
                        <div class="info-block-box__title">Contacto</div>
                        <div class="info-block-box__content">${ped.contacto || usuarioActual?.email || 'carrilloriverasantiago@gmail.com'}</div>
                    </div>

                    <div class="info-block-box">
                        <div class="info-block-box__title">Enviar a</div>
                        <div class="info-block-box__content" style="white-space:pre-line;">
                            ${ped.direccionCompleta || 'Santiago Carrillo Rivera\nCalle 64e 1w 48, Balcones de gratamira\n680006 Bucaramanga Santander, Colombia'}
                        </div>
                    </div>

                    <div class="info-block-box">
                        <div class="info-block-box__title">Método</div>
                        <div class="info-block-box__content">${ped.metodoPago || 'CONTRAENTREGA'}</div>
                    </div>
                </div>

            </div>
        `;

        // Regresar a la lista
        const btnBack = document.getElementById('btnBackToOrders');
        if (btnBack) btnBack.addEventListener('click', () => cargarPedidos());

        // Botón volver a comprar en detalle
        const btnVCD = document.getElementById('btnVolverComprarDetalle');
        if (btnVCD) {
            btnVCD.addEventListener('click', () => ejecutarVolverAComprar(articulos));
        }
    }

    function ejecutarVolverAComprar(articulos) {
        if (!articulos || articulos.length === 0) return;

        const carritoActual = CarritoService.obtenerLocal() || [];

        articulos.forEach(art => {
            // Verificar si el item ya existe en el carrito local
            const existente = carritoActual.find(c => c.id === art.id && c.talla === (art.variante ? art.variante.split('/')[1]?.trim() : 'M'));
            if (existente) {
                existente.cantidad += (art.cantidad || 1);
            } else {
                carritoActual.push({
                    idVariante: art.idVariante || art.id || 1,
                    id: art.id || 1,
                    nombre: art.nombre || 'Prenda Elixir',
                    precio: art.precio || 95000,
                    color: art.variante ? art.variante.split('/')[0]?.trim() : 'Negro',
                    talla: art.variante ? art.variante.split('/')[1]?.trim() : 'M',
                    cantidad: art.cantidad || 1,
                    imagen: art.imagen || '../public/images/34.webp'
                });
            }
        });

        CarritoService.guardarLocal(carritoActual);
        alert('¡Prendas agregadas al carrito de compras! Redirigiendo...');
        window.location.href = 'interfazCarrito.html';
    }

});