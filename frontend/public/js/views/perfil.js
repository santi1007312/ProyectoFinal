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

            const esAdmin = usuarioActual && (usuarioActual.idRol === 2 || usuarioActual.idRol === 3 || usuarioActual.esAdmin === true);
            if (adminPanelContainer) {
                if (esAdmin) {
                    adminPanelContainer.style.display = 'block';
                    if (btnVolverAlPanel) {
                        btnVolverAlPanel.onclick = () => { window.location.href = 'interfazAdmin.html'; };
                    }
                } else {
                    adminPanelContainer.style.display = 'none';
                }
            }
        } catch (err) {
            console.warn("Modo fallback perfil:", err.message);
            const fallback = {
                nombre: 'Usuario',
                apellido: '',
                email: 'usuario@ejemplo.com',
                idRol: 1
            };
            usuarioActual = fallback;
            renderizarDatosUsuario(fallback);
            cargarDirecciones();
            if (adminPanelContainer) adminPanelContainer.style.display = 'none';
        }
    }

    function renderizarDatosUsuario(u) {
        const full = `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Usuario';
        if (userNameDisplay) userNameDisplay.textContent = full;
        if (userEmailInput) userEmailInput.value = u.email || u.correo || '';
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

    // ── SECCIÓN Y MODAL "AGREGAR / EDITAR DIRECCIÓN" ─────────────────────────
    const btnAddAddress        = document.getElementById('btnAddAddress');
    const modalAgregarDireccion= document.getElementById('modalAgregarDireccion');
    const btnCloseModalDireccion= document.getElementById('btnCloseModalDireccion');
    const btnCancelarDireccion = document.getElementById('btnCancelarDireccion');
    const formAgregarDireccionModal = document.getElementById('formAgregarDireccionModal');
    let direccionEditandoIndex = null;

    if (btnAddAddress && modalAgregarDireccion) {
        btnAddAddress.addEventListener('click', () => {
            // CORRECCIÓN ERROR 2: Al hacer clic en '+ Agregar', reseteamos la variable de edición
            // y restauramos el título original del modal.
            direccionEditandoIndex = null;
            const modalTitle = modalAgregarDireccion.querySelector('.modal-header h3');
            if (modalTitle) modalTitle.textContent = 'Agregar dirección';
            if (formAgregarDireccionModal) formAgregarDireccionModal.reset();
            modalAgregarDireccion.classList.add('is-open');
        });
    }

    function cerrarModalDireccion() {
        if (modalAgregarDireccion) modalAgregarDireccion.classList.remove('is-open');
        direccionEditandoIndex = null;
    }

    // CORRECCIÓN ERROR 2: Función helper para abrir el modal precargado con los datos de la dirección a editar
    function abrirModalEditarDireccion(d, idx) {
        direccionEditandoIndex = idx;
        const modalTitle = modalAgregarDireccion ? modalAgregarDireccion.querySelector('.modal-header h3') : null;
        if (modalTitle) modalTitle.textContent = 'Editar dirección';

        if (document.getElementById('modalSelectPais')) document.getElementById('modalSelectPais').value = d.pais || 'Colombia';
        if (document.getElementById('modalDirNombre')) document.getElementById('modalDirNombre').value = d.nombre || usuarioActual?.nombre || '';
        if (document.getElementById('modalDirApellido')) document.getElementById('modalDirApellido').value = d.apellido || usuarioActual?.apellido || '';
        if (document.getElementById('modalDirEmpresa')) document.getElementById('modalDirEmpresa').value = d.empresa || '';
        if (document.getElementById('modalDirCalle')) document.getElementById('modalDirCalle').value = d.calle || '';
        if (document.getElementById('modalDirCiudad')) document.getElementById('modalDirCiudad').value = d.ciudad || '';
        if (document.getElementById('modalDirDepartamento')) document.getElementById('modalDirDepartamento').value = d.departamento || 'Santander';
        if (document.getElementById('modalDirCodigoPostal')) document.getElementById('modalDirCodigoPostal').value = d.codigoPostal || '';
        if (document.getElementById('modalDirTelefono')) document.getElementById('modalDirTelefono').value = d.telefono || '';
        if (document.getElementById('modalDirPredeterminada')) document.getElementById('modalDirPredeterminada').checked = Boolean(d.esPredeterminada);

        if (modalAgregarDireccion) modalAgregarDireccion.classList.add('is-open');
    }

    if (btnCloseModalDireccion) btnCloseModalDireccion.addEventListener('click', cerrarModalDireccion);
    if (btnCancelarDireccion) btnCancelarDireccion.addEventListener('click', cerrarModalDireccion);

    async function cargarDirecciones() {
        if (!addressListContainer) return;
        try {
            const idU = usuarioActual ? usuarioActual.idUsuarios || '' : '';
            const dirs = await DireccionService.listar(idU);
            if (dirs && Array.isArray(dirs) && dirs.length > 0) {
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
        lista.forEach((d, idx) => {
            const card = document.createElement('div');
            card.className = 'address-item-card';

            const esPredet = d.esPredeterminada ? '<span class="address-item-card__badge">[Predeterminada]</span>' : '';
            const fullNombre = `${d.nombre || usuarioActual?.nombre || ''} ${d.apellido || usuarioActual?.apellido || ''}`.trim();
            const telText = d.telefono ? `, Tel: ${d.telefono}` : '';
            const dirTexto = `${fullNombre} ${esPredet}, ${d.calle || ''}, ${d.codigoPostal || ''} ${d.ciudad || ''} ${d.departamento || ''}, ${d.pais || 'Colombia'}${telText}`;

            card.innerHTML = `
                <div class="address-item-card__text">${dirTexto}</div>
                <button type="button" class="btn-dark-secondary btn-editar-direccion" style="font-size:0.78rem;">Editar</button>
            `;

            const btnEdit = card.querySelector('.btn-editar-direccion');
            if (btnEdit) {
                btnEdit.addEventListener('click', () => abrirModalEditarDireccion(d, idx));
            }

            addressListContainer.appendChild(card);
        });
    }

    function renderizarDireccionesLocal() {
        if (!addressListContainer) return;
        const saved = JSON.parse(localStorage.getItem('saved_addresses')) || [];
        if (saved.length === 0) {
            addressListContainer.innerHTML = '<div class="empty-placeholder" style="padding:20px; color:var(--text-muted, #a1a1aa); text-align:center;">No tienes direcciones de envío guardadas.</div>';
            return;
        }

        addressListContainer.innerHTML = '';
        saved.forEach((d, idx) => {
            const card = document.createElement('div');
            card.className = 'address-item-card';

            const esPredet = d.esPredeterminada ? '<span class="address-item-card__badge">[Predeterminada]</span>' : '';
            const fullNombre = `${d.nombre} ${d.apellido}`;
            const dirTexto = `${fullNombre} ${esPredet}, ${d.calle}, ${d.codigoPostal || ''} ${d.ciudad} ${d.departamento}, ${d.pais}`;

            card.innerHTML = `
                <div class="address-item-card__text">${dirTexto}</div>
                <button type="button" class="btn-dark-secondary btn-editar-direccion" style="font-size:0.78rem;">Editar</button>
            `;

            const btnEdit = card.querySelector('.btn-editar-direccion');
            if (btnEdit) {
                btnEdit.addEventListener('click', () => abrirModalEditarDireccion(d, idx));
            }

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

            // CORRECCIÓN ERROR 2: Si estábamos editando, actualizamos la dirección en la posición correspondiente.
            // De lo contrario, insertamos una nueva dirección al inicio de la lista.
            if (direccionEditandoIndex !== null && direccionEditandoIndex >= 0 && direccionEditandoIndex < localDirs.length) {
                localDirs[direccionEditandoIndex] = { ...localDirs[direccionEditandoIndex], ...nuevaDir };
                direccionEditandoIndex = null;
                alert('¡Dirección actualizada correctamente!');
            } else {
                localDirs.unshift(nuevaDir);
                alert('¡Dirección agregada correctamente!');
            }

            localStorage.setItem('saved_addresses', JSON.stringify(localDirs));

            await cargarDirecciones();
            cerrarModalDireccion();
            formAgregarDireccionModal.reset();
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

    async function cargarPedidos() {
        if (!pedidosContainer) return;
        pedidosContainer.innerHTML = '';
        try {
            const list = await PedidoService.listarMisPedidos();
            if (list && Array.isArray(list) && list.length > 0) {
                renderizarListaPedidos(list);
            } else {
                renderizarEstadoPedidosVacio();
            }
        } catch (err) {
            console.warn("No se pudieron cargar los pedidos:", err);
            renderizarEstadoPedidosVacio();
        }
    }

    function renderizarEstadoPedidosVacio() {
        if (!pedidosContainer) return;
        pedidosContainer.innerHTML = `
            <div class="dark-card empty-placeholder" style="text-align: center; padding: 40px 20px;">
                <i class="bx bx-package" style="font-size: 3rem; color: var(--text-disabled, #71717a); margin-bottom: 12px; display: block;"></i>
                <p style="margin-bottom: 16px; color: var(--text-muted, #a1a1aa);">Aún no has realizado ningún pedido.</p>
                <a href="interfazCatalogo.html" class="btn-dark-action" style="text-decoration: none; display: inline-block; padding: 10px 20px;">Explorar productos</a>
            </div>
        `;
    }

    function renderizarListaPedidos(lista) {
        pedidosContainer.innerHTML = '';

        if (!lista || lista.length === 0) {
            renderizarEstadoPedidosVacio();
            return;
        }

        lista.forEach(ped => {
            const card = document.createElement('div');
            card.className = 'order-summary-card';

            const totalFmt = Number(ped.total).toLocaleString('es-CO');
            const articulos = ped.items || ped.detalles || ped.articulos || [];

            const thumbsHtml = articulos.length > 0
                ? articulos.slice(0, 4).map(item => {
                    const imgSrc = item.urlImagen || item.imagen || '';
                    return `
                        <div class="order-thumb-box">
                            ${imgSrc 
                                ? `<img src="${imgSrc}" alt="${item.nombreSnapshot || item.nombre || 'Producto'}" onerror="this.style.display='none'">` 
                                : `<i class="bx bx-package" style="font-size:1.2rem; color:#71717a;"></i>`}
                        </div>
                    `;
                }).join('')
                : `<div class="order-thumb-box"><i class="bx bx-package" style="font-size:1.2rem; color:#71717a;"></i></div>`;

            card.innerHTML = `
                <div class="order-summary-card__top">
                    <div>
                        <div class="order-thumbnails-row" title="Haz clic para ver el detalle del pedido">
                            ${thumbsHtml}
                        </div>
                    </div>
                    <button type="button" class="btn-dark-action btn-volver-comprar-trigger">
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

    async function renderizarDetallePedido(ped) {
        if (!pedidosContainer) return;
        pedidosContainer.innerHTML = '<div style="color:#ccc; padding:20px; text-align:center;">Cargando detalle del pedido...</div>';

        let articulosReales = ped.items || ped.detalles || ped.articulos || [];
        let estadoPedido = ped.estado || 'pendiente';

        try {
            const detalleCompleto = await PedidoService.obtenerDetalleCompleto(ped.idPedido);
            if (detalleCompleto && detalleCompleto.items && detalleCompleto.items.length > 0) {
                articulosReales = detalleCompleto.items.map(it => ({
                    id: it.idDetallePedidos,
                    nombre: it.nombreSnapshot || it.nombre || 'Prenda',
                    variante: `${it.colorSnapshot || 'Único'} / ${it.tallaSnapshot || 'M'}`,
                    cantidad: it.cantidad,
                    precio: it.precioUnitario || it.precio || 0,
                    urlImagen: it.urlImagen || it.imagen || ''
                }));
            }
            if (detalleCompleto && detalleCompleto.pedido) {
                estadoPedido = detalleCompleto.pedido.estado || estadoPedido;
            }
        } catch (e) {
            console.warn("No se pudo obtener el detalle completo del pedido:", e);
        }

        const totalFmt = Number(ped.total).toLocaleString('es-CO');
        const articulos = articulosReales;
        const fechaFmt = ped.fechaPedido || ped.fecha ? new Date(ped.fechaPedido || ped.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Reciente';

        const itemsHtml = articulos.map(item => {
            const imgSrc = item.urlImagen || item.imagen || '';
            return `
            <div class="order-item-row">
                <div class="order-item-row__left">
                    <div class="order-item-thumb-badge">
                        ${imgSrc 
                            ? `<img src="${imgSrc}" alt="${item.nombre}" onerror="this.style.display='none'">` 
                            : `<i class="bx bx-package" style="font-size:1.5rem; color:#71717a;"></i>`}
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
        `;
        }).join('');

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
            const rawVar = art.variante || '';
            const parts = rawVar.includes('/') ? rawVar.split('/') : [rawVar, ''];
            const colorVal = parts[0] && parts[0].trim() !== '' ? parts[0].trim() : (art.color || 'Único');
            const tallaVal = parts[1] && parts[1].trim() !== '' ? parts[1].trim() : (art.talla || 'Única');

            const existente = carritoActual.find(c => c.id === art.id && c.talla === tallaVal);
            if (existente) {
                existente.cantidad += (art.cantidad || 1);
            } else {
                carritoActual.push({
                    idVariante: art.idVariante || art.id || 1,
                    id: art.id || 1,
                    nombre: art.nombre || 'Prenda Elixir',
                    precio: art.precio || 95000,
                    color: colorVal,
                    talla: tallaVal,
                    cantidad: art.cantidad || 1,
                    imagen: art.urlImagen || art.imagen || '../public/images/34.webp'
                });
            }
        });

        CarritoService.guardarLocal(carritoActual);
        alert('¡Prendas agregadas al carrito de compras! Redirigiendo...');
        window.location.href = 'interfazCarrito.html';
    }

});