/**
 * admin.js — Elixir and Flexx
 * Panel de Administración Completo (Dashboard, Productos, Ventas, Usuarios, Cupones).
 */
import { UsuarioService, ProductoService, PedidoService, CategoriaService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const sectionTitle = document.getElementById('adminSectionTitle');
    const dynamicContent = document.getElementById('adminDynamicContent');
    const btnSalir = document.getElementById('btnCerrarSesionLocal');

    // Cargar Dashboard por defecto al iniciar
    cargarSeccion('dashboard');

    // Navegación asíncrona del Sidebar
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const seccion = item.getAttribute('data-target');
            cargarSeccion(seccion);
        });
    });

    function cargarSeccion(seccion) {
        dynamicContent.innerHTML = `<div class="loader">Cargando componentes de la sección...</div>`;

        switch(seccion) {
            case 'dashboard':
                sectionTitle.textContent = "Dashboard General";
                renderDashboard();
                break;
            case 'productos':
                sectionTitle.textContent = "Gestión de Productos e Inventario";
                renderProductos();
                break;
            case 'ventas':
                sectionTitle.textContent = "Historial de Ventas y Despachos";
                renderVentas();
                break;
            case 'usuarios':
                sectionTitle.textContent = "Auditoría y Control de Usuarios";
                renderUsuarios();
                break;
            case 'cupones':
                sectionTitle.textContent = "Marketing y Cupones de Descuento";
                renderCupones();
                break;
        }
    }

    // ── 1. DASHBOARD GENERAL (MÉTRICAS) ──
    function renderDashboard() {
        dynamicContent.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card"><h3>$ 4.850.000</h3><p>Ventas del Mes</p></div>
                <div class="kpi-card warning"><h3>12 Órdenes</h3><p>Pedidos por Despachar</p></div>
                <div class="kpi-card info"><h3>84 Cuentas</h3><p>Clientes Registrados</p></div>
                <div class="kpi-card danger"><h3>4 Prendas</h3><p>Stock Crítico</p></div>
            </div>
            <div class="dashboard-section-split">
                <div class="admin-panel-card">
                    <h3>Resumen de Operaciones Recientes</h3>
                    <p>El sistema se encuentra sincronizado con la base de datos MySQL. Actualmente cuentas con 3 solicitudes de soporte técnico pendientes y las pasarelas de pago operan con normalidad.</p>
                </div>
            </div>
        `;
    }

    // ── 2. GESTIÓN DE PRODUCTOS, TALLAS Y STOCK ──
    async function renderProductos() {
        dynamicContent.innerHTML = `<div class="loader">Cargando productos...</div>`;
        
        let categorias = [];
        try {
            categorias = await CategoriaService.listar();
        } catch (e) {
            categorias = [
                { id: 1, nombre: "Camisetas / Oversize" },
                { id: 2, nombre: "Sweatshirts / Hoodies" },
                { id: 3, nombre: "Pantalones / Joggers" }
            ];
        }

        let productos = [];
        try {
            productos = await ProductoService.listar();
        } catch (e) {
            console.error("Error al cargar productos:", e);
        }

        const catMap = {};
        categorias.forEach(c => {
            catMap[c.idCategorias || c.id] = c.nombreCategoria || c.nombre;
        });

        let filas = '';
        productos.forEach(p => {
            const catNombre = catMap[p.categoria] || 'General';
            const precioFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.precioBase);
            const imgPreview = p.imagen ? `<img src="${p.imagen}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:8px;" onerror="this.src='https://placehold.co/40'">` : '';

            filas += `
                <tr data-json="${encodeURIComponent(JSON.stringify(p))}">
                    <td>${p.id}</td>
                    <td><div style="display:flex;align-items:center;">${imgPreview}<span>${p.nombre}</span></div></td>
                    <td>${catNombre}</td>
                    <td>${precioFormatted}</td>
                    <td>
                        <button class="btn-action btn-editar-prod" style="margin-right:5px;">Editar</button>
                        <button class="btn-action btn-eliminar-prod" style="background:#ff4d4d;color:white;border:none;">Desactivar</button>
                    </td>
                </tr>
            `;
        });

        if (productos.length === 0) {
            filas = `<tr><td colspan="5" style="text-align:center;">No hay productos registrados en el catálogo.</td></tr>`;
        }

        dynamicContent.innerHTML = `
            <div class="action-bar">
                <button id="btnAbrirFormProducto" class="btn-urban">＋ Agregar Nueva Prenda</button>
            </div>
            
            <div id="wrapperFormProducto" class="admin-panel-card" style="display:none; margin-bottom:20px;">
                <h3 id="formProductoTitle">Registrar Prenda en Inventario</h3>
                <form id="formRegistrarProducto" class="admin-grid-form">
                    <input type="hidden" name="idProducto" value="">
                    <div class="input-group"><label>Nombre del Producto</label><input type="text" name="nombre" required></div>
                    <div class="input-group"><label>Categoría</label>
                        <select name="categoria">
                            ${categorias.map(cat => `<option value="${cat.idCategorias || cat.id}">${cat.nombreCategoria || cat.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div class="input-group"><label>Precio de Venta ($COP)</label><input type="number" name="precio" required></div>
                    <div class="input-group"><label>Descripción</label><input type="text" name="descripcion"></div>
                    <div class="input-group" style="grid-column: span 2;"><label>URL de la Imagen del Producto</label><input type="text" name="imagen"></div>
                    <div style="grid-column: span 2; display:flex; gap:10px; margin-top:10px;">
                        <button type="submit" class="btn-urban" id="btnGuardarProducto">Guardar en Catálogo</button>
                        <button type="button" id="btnCancelarProducto" class="btn-action">Cancelar</button>
                    </div>
                </form>
            </div>

            <table class="admin-table">
                <thead>
                    <tr><th>ID</th><th>Prenda</th><th>Categoría</th><th>Precio</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
            </table>
        `;

        const btnAbrir = document.getElementById('btnAbrirFormProducto');
        const btnCancelar = document.getElementById('btnCancelarProducto');
        const wrapper = document.getElementById('wrapperFormProducto');
        const form = document.getElementById('formRegistrarProducto');
        const formTitle = document.getElementById('formProductoTitle');

        if(btnAbrir && wrapper) {
            btnAbrir.addEventListener('click', () => {
                form.reset();
                form.querySelector('[name="idProducto"]').value = '';
                formTitle.textContent = "Registrar Prenda en Inventario";
                wrapper.style.display = 'block';
            });
        }
        if(btnCancelar && wrapper) {
            btnCancelar.addEventListener('click', () => {
                wrapper.style.display = 'none';
                form.reset();
            });
        }

        // Edit buttons click handler
        document.querySelectorAll('.btn-editar-prod').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tr = e.target.closest('tr');
                const p = JSON.parse(decodeURIComponent(tr.getAttribute('data-json')));
                
                formTitle.textContent = "Editar Prenda";
                form.querySelector('[name="idProducto"]').value = p.id;
                form.querySelector('[name="nombre"]').value = p.nombre;
                form.querySelector('[name="categoria"]').value = p.categoria;
                form.querySelector('[name="precio"]').value = p.precioBase;
                form.querySelector('[name="descripcion"]').value = p.descripcion || '';
                form.querySelector('[name="imagen"]').value = p.imagen || '';
                
                wrapper.style.display = 'block';
                wrapper.scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Delete buttons click handler
        document.querySelectorAll('.btn-eliminar-prod').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tr = e.target.closest('tr');
                const p = JSON.parse(decodeURIComponent(tr.getAttribute('data-json')));
                
                if (confirm(`¿Está seguro de desactivar el producto "${p.nombre}" del catálogo?`)) {
                    const res = await ProductoService.eliminar(p.id);
                    if (res.ok) {
                        alert(res.mensaje || 'Producto desactivado con éxito.');
                        renderProductos();
                    } else {
                        alert('Error al desactivar: ' + res.mensaje);
                    }
                }
            });
        });

        // Form submit handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const idProducto = form.querySelector('[name="idProducto"]').value;
            const nombre = form.querySelector('[name="nombre"]').value.trim();
            const idCategorias = form.querySelector('[name="categoria"]').value;
            const precioBase = form.querySelector('[name="precio"]').value;
            const descripcion = form.querySelector('[name="descripcion"]').value.trim();
            const imagen = form.querySelector('[name="imagen"]').value.trim();

            if (nombre.match(/^\d+$/)) {
                alert('⚠️ El nombre de la prenda no puede ser puramente numérico.');
                return;
            }
            if (imagen && imagen.match(/^\d+$/)) {
                alert('⚠️ La URL de la imagen no puede ser puramente numérica.');
                return;
            }

            const payload = {
                nombreProducto: nombre,
                idCategorias,
                precioBase,
                descripcion,
                imagen
            };

            let resultado;
            if (idProducto) {
                payload.idProducto = idProducto;
                resultado = await ProductoService.actualizar(payload);
            } else {
                resultado = await ProductoService.crear(payload);
            }

            if (resultado.ok) {
                alert('🎉 ' + (resultado.mensaje || 'Prenda guardada con éxito en el catálogo.'));
                wrapper.style.display = 'none';
                form.reset();
                renderProductos();
            } else {
                alert('❌ Error al guardar: ' + resultado.mensaje);
            }
        });
    }

    // ── 3. HISTORIAL DE VENTAS Y DESPACHOS (PEDIDOS) ──
    async function renderVentas() {
        dynamicContent.innerHTML = `<div class="loader">Cargando pedidos...</div>`;

        let pedidos = [];
        try {
            pedidos = await PedidoService.listarTodos();
        } catch (e) {
            console.error("Error al listar pedidos:", e);
        }

        let filas = '';
        pedidos.forEach(p => {
            const totalFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.total);
            const dateStr = p.fechaPedido ? new Date(p.fechaPedido).toLocaleDateString('es-CO') : 'Reciente';

            let statusClass = 'preparando';
            if (p.estado === 'enviado') statusClass = 'enviado';
            if (p.estado === 'entregado') statusClass = 'entregado';
            if (p.estado === 'cancelado') statusClass = 'cancelado';

            filas += `
                <tr>
                    <td>#${p.idPedido}</td>
                    <td>${p.clienteNombre || p.idUsuarios || 'Cliente'}</td>
                    <td>${dateStr}</td>
                    <td>${totalFormatted}</td>
                    <td><span class="status-pill ${statusClass}" id="status-pill-${p.idPedido}">${p.estado.toUpperCase()}</span></td>
                    <td>
                        <select class="select-status-pedido" data-id="${p.idPedido}" style="padding: 5px; border-radius: 4px; border: 1px solid #ccc;">
                            <option value="preparando" ${p.estado === 'preparando' ? 'selected' : ''}>En Preparación</option>
                            <option value="enviado" ${p.estado === 'enviado' ? 'selected' : ''}>En Enviado / Despachado</option>
                            <option value="entregado" ${p.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        if (pedidos.length === 0) {
            filas = `<tr><td colspan="6" style="text-align:center;">No hay pedidos registrados en el sistema.</td></tr>`;
        }

        dynamicContent.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr><th>No. Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado Logístico</th><th>Acciones de Envío</th></tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
            </table>
        `;

        document.querySelectorAll('.select-status-pedido').forEach(select => {
            select.addEventListener('change', async (e) => {
                const idPedido = e.target.getAttribute('data-id');
                const nuevoEstado = e.target.value;

                const res = await PedidoService.actualizarEstado(idPedido, nuevoEstado);
                if (res.ok) {
                    const pill = document.getElementById(`status-pill-${idPedido}`);
                    if (pill) {
                        pill.textContent = nuevoEstado.toUpperCase();
                        pill.className = `status-pill ${nuevoEstado}`;
                    }
                } else {
                    alert('Error al actualizar el estado logístico del pedido.');
                }
            });
        });
    }

    // ── 4. CONTROL Y AUDITORÍA DE USUARIOS ──
    async function renderUsuarios() {
        try {
            const usuarios = await UsuarioService.listarTodos();

            let filas = '';
            usuarios.forEach(user => {
                const badgeRol = user.idRol === 1 ? 'Cliente' : 'Staff Admin';
                const statusClass = user.estado === 'activo' ? 'success' : 'danger';
                const isAdmin = user.idRol === 2;
                
                filas += `
                    <tr>
                        <td>${user.idUsuarios}</td>
                        <td>${user.nombre} ${user.apellido || ''}</td>
                        <td>${user.email}</td>
                        <td><span class="badge info">${badgeRol}</span></td>
                        <td><span class="badge ${statusClass}">${user.estado.toUpperCase()}</span></td>
                        <td>
                            ${isAdmin ? `
                            <button class="btn-action btn-ban" disabled style="opacity: 0.5; cursor: not-allowed;" title="El Administrador no puede ser suspendido">
                                Suspender
                            </button>
                            ` : `
                            <button class="btn-action btn-ban" data-id="${user.idUsuarios}" data-estado="${user.estado}">
                                ${user.estado === 'activo' ? 'Suspender' : 'Activar'}
                            </button>
                            `}
                        </td>
                    </tr>
                `;
            });

            dynamicContent.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr><th>ID</th><th>Nombre Completo</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones de Control</th></tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>`;

            // Escuchadores de eventos para la suspensión de cuentas
            document.querySelectorAll('.btn-ban').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (!id) return;
                    const estadoActual = e.target.getAttribute('data-estado');
                    const nuevoEstado = estadoActual === 'activo' ? 'suspendido' : 'activo';

                    if (nuevoEstado === 'suspendido') {
                        if (!confirm('¿Está seguro de suspender o borrar el usuario?')) {
                            return;
                        }
                    }

                    const resultado = await UsuarioService.cambiarEstado(id, nuevoEstado);
                    if(resultado.ok) {
                        renderUsuarios(); 
                    }
                });
            });

        } catch (error) {
            dynamicContent.innerHTML = `<div class="error-msg">⚠️ Error al conectar con el Servlet de Usuarios: ${error.message}</div>`;
        }
    }

    // ── 5. MARKETING (CUPONES Y DESCUENTOS) ──
    function renderCupones() {
        dynamicContent.innerHTML = `
            <div class="action-bar">
                <button id="btnAbrirFormCupón" class="btn-urban">＋ Crear Código de Descuento</button>
            </div>

            <div id="wrapperFormCupón" class="admin-panel-card" style="display:none; margin-bottom:20px;">
                <h3>Crear Nuevo Cupón de Descuento</h3>
                <form id="formRegistrarCupón" class="admin-grid-form">
                    <div class="input-group"><label>Código del Cupón (Ej: FLEXX20)</label><input type="text" name="codigo" placeholder="LETRAS MAYÚSCULAS" required></div>
                    <div class="input-group"><label>Porcentaje de Descuento (%)</label><input type="number" name="descuento" min="1" max="100" required></div>
                    <div class="input-group"><label>Fecha de Expiración</label><input type="date" name="fechaExpiracion" required></div>
                    <div style="grid-column: span 2; display:flex; gap:10px; margin-top:10px;">
                        <button type="submit" class="btn-urban">Activar Cupón</button>
                        <button type="button" id="btnCancelarCupón" class="btn-action">Cancelar</button>
                    </div>
                </form>
            </div>

            <table class="admin-table">
                <thead>
                    <tr><th>ID</th><th>Código</th><th>Descuento</th><th>Vencimiento</th><th>Estado</th></tr>
                </thead>
                <tbody>
                    <tr><td>1</td><td><strong>ELIXIR15</strong></td><td>15% OFF</td><td>31/12/2026</td><td><span class="badge success">Activo</span></td></tr>
                    <tr><td>2</td><td><strong>SENA2026</strong></td><td>20% OFF</td><td>01/07/2026</td><td><span class="badge success">Activo</span></td></tr>
                </tbody>
            </table>
        `;

        const btnAbrir = document.getElementById('btnAbrirFormCupón');
        const btnCancelar = document.getElementById('btnCancelarCupón');
        const wrapper = document.getElementById('wrapperFormCupón');

        if(btnAbrir && wrapper) btnAbrir.addEventListener('click', () => wrapper.style.display = 'block');
        if(btnCancelar && wrapper) btnCancelar.addEventListener('click', () => wrapper.style.display = 'none');
    }

    // Cierre de sesión nativo del panel
    if (btnSalir) {
        btnSalir.addEventListener('click', async () => {
            await UsuarioService.logout();
        });
    }
});