/**
 * admin.js — Elixir and Flexx
 * Panel de Administración Completo (Dashboard, Productos, Ventas, Usuarios, Cupones).
 */
import { UsuarioService } from '../services/api.js';

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
    function renderProductos() {
        dynamicContent.innerHTML = `
            <div class="action-bar">
                <button id="btnAbrirFormProducto" class="btn-urban">＋ Agregar Nueva Prenda</button>
            </div>
            
            <div id="wrapperFormProducto" class="admin-panel-card" style="display:none; margin-bottom:20px;">
                <h3>Registrar Prenda en Inventario</h3>
                <form id="formRegistrarProducto" class="admin-grid-form">
                    <div class="input-group"><label>Nombre del Producto</label><input type="text" name="nombre" required></div>
                    <div class="input-group"><label>Categoría</label>
                        <select name="categoria">
                            <option value="Camisetas">Camisetas / Oversize</option>
                            <option value="Sweatshirts">Sweatshirts / Hoodies</option>
                            <option value="Pantalones">Pantalones / Joggers</option>
                        </select>
                    </div>
                    <div class="input-group"><label>Precio de Venta ($COP)</label><input type="number" name="precio" required></div>
                    <div class="input-group"><label>Stock Inicial (Talla S)</label><input type="number" name="stockS" value="0"></div>
                    <div class="input-group"><label>Stock Inicial (Talla M)</label><input type="number" name="stockM" value="0"></div>
                    <div class="input-group"><label>Stock Inicial (Talla L)</label><input type="number" name="stockL" value="0"></div>
                    <div class="input-group" style="grid-column: span 2;"><label>URL de la Imagen del Producto</label><input type="text" name="imagen"></div>
                    <div style="grid-column: span 2; display:flex; gap:10px; margin-top:10px;">
                        <button type="submit" class="btn-urban">Guardar en Catálogo</button>
                        <button type="button" id="btnCancelarProducto" class="btn-action">Cancelar</button>
                    </div>
                </form>
            </div>

            <table class="admin-table">
                <thead>
                    <tr><th>ID</th><th>Prenda</th><th>Categoría</th><th>Precio</th><th>Stock por Talla (S/M/L)</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    <tr><td>1</td><td>Camiseta Oversize Flexx</td><td>Camisetas</td><td>$85.000</td><td><span class="badge success">S:15 | M:20 | L:10</span></td><td><span class="badge success">Disponible</span></td><td><button class="btn-action">Editar</button></td></tr>
                    <tr><td>2</td><td>Sudadera Elixir Street</td><td>Sweatshirts</td><td>$140.000</td><td><span class="badge danger">S:0 | M:2 | L:0</span></td><td><span class="badge danger">Stock Crítico</span></td><td><button class="btn-action">Editar</button></td></tr>
                </tbody>
            </table>
        `;

        // Lógica interactiva para ocultar/mostrar el formulario de productos
        const btnAbrir = document.getElementById('btnAbrirFormProducto');
        const btnCancelar = document.getElementById('btnCancelarProducto');
        const wrapper = document.getElementById('wrapperFormProducto');

        if(btnAbrir && wrapper) btnAbrir.addEventListener('click', () => wrapper.style.display = 'block');
        if(btnCancelar && wrapper) btnCancelar.addEventListener('click', () => wrapper.style.display = 'none');
    }

    // ── 3. HISTORIAL DE VENTAS Y DESPACHOS (PEDIDOS) ──
    function renderVentas() {
        dynamicContent.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr><th>No. Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado Logístico</th><th>Acciones de Envío</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>#1024</td>
                        <td>Santiago Carrillo</td>
                        <td>15/06/2026</td>
                        <td>$225.000</td>
                        <td><span class="status-pill preparando">En Preparación</span></td>
                        <td>
                            <select class="select-status-pedido" data-id="1024">
                                <option value="preparando" selected>En Preparación</option>
                                <option value="enviado">Enviado / Despachado</option>
                                <option value="entregado">Entregado</option>
                            </select>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    // ── 4. CONTROL Y AUDITORÍA DE USUARIOS ──
    async function renderUsuarios() {
        try {
            const usuarios = await UsuarioService.listarTodos();

            let filas = '';
            usuarios.forEach(user => {
                const badgeRol = user.idRol === 1 ? 'Cliente' : 'Staff Admin';
                const statusClass = user.estado === 'activo' ? 'success' : 'danger';
                
                filas += `
                    <tr>
                        <td>${user.idUsuarios}</td>
                        <td>${user.nombre} ${user.apellido || ''}</td>
                        <td>${user.email}</td>
                        <td><span class="badge info">${badgeRol}</span></td>
                        <td><span class="badge ${statusClass}">${user.estado.toUpperCase()}</span></td>
                        <td>
                            <button class="btn-action btn-ban" data-id="${user.idUsuarios}" data-estado="${user.estado}">
                                ${user.estado === 'activo' ? 'Suspender' : 'Activar'}
                            </button>
                        </td>
                    </tr>
                `;
            });

            dynamicContent.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr><th>ID</th><th>Nombre Complete</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones de Control</th></tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>`;

            // Escuchadores de eventos para la suspensión de cuentas
            document.querySelectorAll('.btn-ban').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const estadoActual = e.target.getAttribute('data-estado');
                    const nuevoEstado = estadoActual === 'activo' ? 'suspendido' : 'activo';

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