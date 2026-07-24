/**
 * admin.js — Elixir and Flexx
 * Panel de Administración Completo (Dashboard, Productos, Ventas, Usuarios, Cupones).
 */
import { UsuarioService, ProductoService, PedidoService, CategoriaService, SoporteService, VarianteService, ProveedorService, getBaseUrl } from '../services/api.js';

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
            case 'soporte':
                sectionTitle.textContent = "Gestión de PQR y Devoluciones";
                renderSoporte();
                break;
            case 'proveedores':
                sectionTitle.textContent = "Gestión de Proveedores";
                renderProveedores();
                break;
        }
    }

    // ── 1. DASHBOARD GENERAL (MÉTRICAS) ──
    async function renderDashboard() {
        dynamicContent.innerHTML = `<div class="loader">Cargando métricas del dashboard...</div>`;
        try {
            const data = await PedidoService.obtenerMetricas();
            
            // Formatear Ventas del Mes en pesos colombianos sin decimales
            const ventasFormatted = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
            }).format(data.ventasMes || 0);

            const ordenesCount = data.totalPedidos || 0;
            const usuariosCount = data.totalUsuarios || 0;
            const criticoCount = data.stockCriticoCount || 0;

            let tablaCriticosHtml = '';
            if (data.listaStockCritico && data.listaStockCritico.length > 0) {
                data.listaStockCritico.forEach(item => {
                    tablaCriticosHtml += `
                        <tr>
                            <td>${item.nombre}</td>
                            <td><span class="badge-talla">${item.talla}</span></td>
                            <td>${item.color}</td>
                            <td><strong style="color: #ff4d4d;">${item.stock}</strong></td>
                            <td><code>${item.sku}</code></td>
                        </tr>
                    `;
                });
            } else {
                tablaCriticosHtml = `<tr><td colspan="5" style="text-align:center; color:#2ecc71; padding: 15px;">🎉 ¡Todo el inventario está en niveles óptimos! No hay stock crítico.</td></tr>`;
            }

            dynamicContent.innerHTML = `
                <div class="kpi-grid">
                    <div class="kpi-card"><h3>${ventasFormatted}</h3><p>Ventas del Mes</p></div>
                    <div class="kpi-card warning"><h3>${ordenesCount} Órdenes</h3><p>Total Pedidos</p></div>
                    <div class="kpi-card info"><h3>${usuariosCount} Cuentas</h3><p>Clientes Registrados</p></div>
                    <div class="kpi-card danger"><h3>${criticoCount} Prendas</h3><p>Stock Crítico (&lt; 5)</p></div>
                </div>
                <div class="dashboard-section-split">
                    <div class="admin-panel-card" style="width: 100%;">
                        <h3 style="color: #ff4d4d; display: flex; align-items: center; gap: 8px;">
                            <i class='bx bx-error-circle'></i> Alerta de Stock Crítico (&lt; 5 unidades)
                        </h3>
                        <p style="margin-bottom: 15px; font-size: 0.9rem; color: #a6a6a6;">
                            Las siguientes variantes de prendas tienen menos de 5 unidades en inventario. Se recomienda reabastecer a la brevedad.
                        </p>
                        <table class="admin-table">
                            <thead>
                                <tr><th>Prenda</th><th>Talla</th><th>Color</th><th>Stock Actual</th><th>SKU</th></tr>
                            </thead>
                            <tbody>
                                ${tablaCriticosHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error("Error al cargar métricas de dashboard:", e);
            dynamicContent.innerHTML = `<div class="error-msg">Error al cargar las métricas del dashboard.</div>`;
        }
    }

    // ── GESTIÓN DE PRODUCTOS, TALLAS Y STOCK ──
    async function renderProductos() {
        let imagenesSeleccionadas = [];
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

        // Cargar variantes para cada producto de forma asíncrona en paralelo
        const productosConVariantes = await Promise.all(productos.map(async p => {
            try {
                const variantes = await VarianteService.listarPorProducto(p.id).catch(() => []);
                return { ...p, variantes };
            } catch {
                return { ...p, variantes: [] };
            }
        }));

        function getStockPorTalla(variantes, talla) {
            const v = (variantes || []).find(varItem => varItem.talla === talla);
            return v ? v.stock : 0;
        }

        let filas = '';
        productosConVariantes.forEach(p => {
            const catNombre = catMap[p.categoria] || 'General';
            const precioFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.precioBase);
            const imgPreview = p.imagen ? `<img src="${p.imagen}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:8px;" onerror="this.src='https://placehold.co/40'">` : '';

            const esZapatos = String(p.categoria) === '4' || catNombre.toUpperCase() === 'ZAPATOS';
            let desgloseHtml = '';
            let totalStock = 0;

            const formatStock = (talla, cant) => {
                if (cant === 0) return `<span class="stock-out-badge">${talla}: 0</span>`;
                return `${talla}: ${cant}`;
            };

            if (esZapatos) {
                const tallasCalzado = ['34', '36', '38', '39', '40', '42', '43'];
                desgloseHtml = tallasCalzado.map(t => {
                    const cant = getStockPorTalla(p.variantes, t);
                    totalStock += cant;
                    return formatStock(t, cant);
                }).join(' | ');
            } else {
                const stockS = getStockPorTalla(p.variantes, 'S');
                const stockM = getStockPorTalla(p.variantes, 'M');
                const stockL = getStockPorTalla(p.variantes, 'L');
                const stockXL = getStockPorTalla(p.variantes, 'XL');
                totalStock = stockS + stockM + stockL + stockXL;
                desgloseHtml = `${formatStock('S', stockS)} | ${formatStock('M', stockM)} | ${formatStock('L', stockL)} | ${formatStock('XL', stockXL)}`;
            }

            filas += `
                <tr data-json="${encodeURIComponent(JSON.stringify(p))}">
                    <td>${p.id}</td>
                    <td><div style="display:flex;align-items:center;">${imgPreview}<span>${p.nombre}</span></div></td>
                    <td>${catNombre}</td>
                    <td>${precioFormatted}</td>
                    <td>
                        <div class="stock-cell">
                            <strong>${totalStock}</strong>
                            <span class="stock-desglose">${desgloseHtml}</span>
                        </div>
                    </td>
                    <td>
                        <button class="btn-action btn-editar-prod" style="margin-right:5px;">Editar</button>
                        <button class="btn-action btn-eliminar-prod" style="background:#ff4d4d;color:white;border:none;">Desactivar</button>
                    </td>
                </tr>
            `;
        });

        if (productos.length === 0) {
            filas = `<tr><td colspan="6" style="text-align:center;">No hay productos registrados en el catálogo.</td></tr>`;
        }

        dynamicContent.innerHTML = `
            <div class="action-bar" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                <button id="btnAbrirFormProducto" class="btn-urban">＋ Agregar Nueva Prenda</button>
                <button id="btnVerProductosDesactivados" class="btn-action" style="background:#28a745; color:white; border:none; padding:10px 18px; border-radius:4px; font-weight:bold; cursor:pointer;">Ver productos desactivados</button>
            </div>
            
            <div id="wrapperFormProducto" class="admin-panel-card" style="display:none; margin-bottom:20px;">
                <h3 id="formProductoTitle">Registrar Prenda en Inventario</h3>
                <form id="formRegistrarProducto" class="admin-grid-form" novalidate>
                    <input type="hidden" name="idProducto" value="">
                    
                    <div class="input-group">
                        <label>Nombre del Producto</label>
                        <input type="text" name="nombre">
                        <span class="error-msg"></span>
                    </div>
                    
                    <div class="input-group">
                        <label>Categoría</label>
                        <select name="categoria" id="selectCategoriaProducto">
                            ${categorias.map(cat => `<option value="${cat.idCategorias || cat.id}">${cat.nombreCategoria || cat.nombre}</option>`).join('')}
                        </select>
                        <span class="error-msg"></span>
                    </div>
                    
                    <div class="input-group">
                        <label>Precio de Venta ($COP)</label>
                        <input type="number" name="precio">
                        <span class="error-msg"></span>
                    </div>
                    
                    <div class="input-group">
                        <label>Descripción</label>
                        <input type="text" name="descripcion">
                        <span class="error-msg"></span>
                    </div>
                    
                    <div class="input-group" style="grid-column: span 2;">
                        <label>Seleccionar Imagen(es) del Producto</label>
                        <input type="file" name="imagen" accept="image/*" multiple>
                        <span class="error-msg"></span>
                    </div>

                    <div class="input-group" style="grid-column: span 2;">
                        <label>Colores Disponibles</label>
                        <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 5px;">
                            <label style="display: flex; align-items: center; gap: 5px; color: #e1e1e6;"><input type="checkbox" name="color_option" value="Negro" checked> Negro</label>
                            <label style="display: flex; align-items: center; gap: 5px; color: #e1e1e6;"><input type="checkbox" name="color_option" value="Blanco"> Blanco</label>
                            <label style="display: flex; align-items: center; gap: 5px; color: #e1e1e6;"><input type="checkbox" name="color_option" value="Gris"> Gris</label>
                            <label style="display: flex; align-items: center; gap: 5px; color: #e1e1e6;"><input type="checkbox" name="color_option" value="Rojo"> Rojo</label>
                            <label style="display: flex; align-items: center; gap: 5px; color: #e1e1e6;"><input type="checkbox" name="color_option" value="Azul"> Azul</label>
                            <label style="display: flex; align-items: center; gap: 5px; color: #e1e1e6;"><input type="checkbox" name="color_option" value="Verde"> Verde</label>
                            <label style="display: flex; align-items: center; gap: 5px; color: #e1e1e6;"><input type="checkbox" name="color_option" value="Café"> Café</label>
                        </div>
                        <span class="error-msg" id="colorErrorMsg"></span>
                    </div>

                    <div class="input-group" style="grid-column: span 2;">
                        <label>Stock por Tallas (Cantidad Disponible)</label>
                        <div class="size-stock-container" id="containerStockRopa">
                            <div class="size-stock-item"><label>Talla S</label><input type="number" name="stock_S" min="0" value="0"><span class="error-msg"></span></div>
                            <div class="size-stock-item"><label>Talla M</label><input type="number" name="stock_M" min="0" value="0"><span class="error-msg"></span></div>
                            <div class="size-stock-item"><label>Talla L</label><input type="number" name="stock_L" min="0" value="0"><span class="error-msg"></span></div>
                            <div class="size-stock-item"><label>Talla XL</label><input type="number" name="stock_XL" min="0" value="0"><span class="error-msg"></span></div>
                        </div>
                        <div class="size-stock-container" id="containerStockZapatos" style="display:none; flex-wrap:wrap; gap:10px;">
                            <div class="size-stock-item"><label>Talla 34</label><input type="number" name="stock_34" min="0" value="0"><span class="error-msg"></span></div>
                            <div class="size-stock-item"><label>Talla 36</label><input type="number" name="stock_36" min="0" value="0"><span class="error-msg"></span></div>
                            <div class="size-stock-item"><label>Talla 38</label><input type="number" name="stock_38" min="0" value="0"><span class="error-msg"></span></div>
                            <div class="size-stock-item"><label>Talla 39</label><input type="number" name="stock_39" min="0" value="0"><span class="error-msg"></span></div>
                            <div class="size-stock-item"><label>Talla 40</label><input type="number" name="stock_40" min="0" value="0"><span class="error-msg"></span></div>
                            <div class="size-stock-item"><label>Talla 42</label><input type="number" name="stock_42" min="0" value="0"><span class="error-msg"></span></div>
                            <div class="size-stock-item"><label>Talla 43</label><input type="number" name="stock_43" min="0" value="0"><span class="error-msg"></span></div>
                        </div>
                    </div>

                    <div class="input-group" style="grid-column: span 2; display: flex; flex-direction: row; align-items: center; gap: 12px; margin-top: 10px;">
                        <label class="switch-container">
                            <input type="checkbox" name="esDestacado" id="chkEsDestacado">
                            <span class="slider round"></span>
                        </label>
                        <span style="font-weight: 500; font-size: 0.95rem; color: #e1e1e6;">Marcar como Producto Destacado</span>
                    </div>
                    
                    <div style="grid-column: span 2; display:flex; gap:10px; margin-top:10px;">
                        <button type="submit" class="btn-urban" id="btnGuardarProducto">Guardar en Catálogo</button>
                        <button type="button" id="btnCancelarProducto" class="btn-action">Cancelar</button>
                    </div>
                </form>
            </div>

            <!-- Contenedor Modal / Sección para Productos Desactivados -->
            <div id="wrapperProductosDesactivados" class="admin-panel-card" style="display:none; margin-bottom:20px; border:1px solid #28a745;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="color:#28a745;">Productos Desactivados (Inactivos)</h3>
                    <button type="button" id="btnCerrarInactivos" class="btn-action" style="background:#555; color:white;">Cerrar</button>
                </div>
                <div id="tablaInactivosContainer">
                    <p style="color:#ccc;">Cargando productos desactivados...</p>
                </div>
            </div>

            <table class="admin-table">
                <thead>
                    <tr><th>ID</th><th>Prenda</th><th>Categoría</th><th>Precio</th><th>Stock Total</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
            </table>
        `;

        const selectCategoria = document.getElementById('selectCategoriaProducto');
        const containerStockRopa = document.getElementById('containerStockRopa');
        const containerStockZapatos = document.getElementById('containerStockZapatos');

        function actualizarContenedoresStock() {
            const valCat = selectCategoria ? selectCategoria.value : '';
            if (String(valCat) === '4') {
                if (containerStockRopa) containerStockRopa.style.display = 'none';
                if (containerStockZapatos) containerStockZapatos.style.display = 'flex';
            } else {
                if (containerStockRopa) containerStockRopa.style.display = 'flex';
                if (containerStockZapatos) containerStockZapatos.style.display = 'none';
            }
        }

        if (selectCategoria) {
            selectCategoria.addEventListener('change', actualizarContenedoresStock);
        }

        // Manejo de "Ver productos desactivados"
        const btnVerInactivos = document.getElementById('btnVerProductosDesactivados');
        const wrapperInactivos = document.getElementById('wrapperProductosDesactivados');
        const btnCerrarInactivos = document.getElementById('btnCerrarInactivos');
        const tablaInactivosContainer = document.getElementById('tablaInactivosContainer');

        if (btnVerInactivos && wrapperInactivos) {
            btnVerInactivos.addEventListener('click', async () => {
                wrapperInactivos.style.display = 'block';
                wrapperInactivos.scrollIntoView({ behavior: 'smooth' });
                await cargarTablaInactivos();
            });
        }

        if (btnCerrarInactivos && wrapperInactivos) {
            btnCerrarInactivos.addEventListener('click', () => {
                wrapperInactivos.style.display = 'none';
            });
        }

        async function cargarTablaInactivos() {
            if (!tablaInactivosContainer) return;
            tablaInactivosContainer.innerHTML = '<p style="color:#ccc;">Cargando productos desactivados...</p>';
            try {
                const list = await ProductoService.listarInactivos();
                if (!list || list.length === 0) {
                    tablaInactivosContainer.innerHTML = '<p style="color:#aaa; padding:10px;">No hay productos desactivados en el sistema.</p>';
                    return;
                }

                let html = `
                    <table class="admin-table" style="background:#1a1a1e;">
                        <thead>
                            <tr><th>ID</th><th>Prenda</th><th>Categoría</th><th>Precio Base</th><th>Acción</th></tr>
                        </thead>
                        <tbody>
                `;
                list.forEach(p => {
                    const catNombre = catMap[p.categoria] || 'General';
                    const precioFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.precioBase);
                    html += `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.nombre}</td>
                            <td>${catNombre}</td>
                            <td>${precioFmt}</td>
                            <td>
                                <button class="btn-reactivar-prod" data-id="${p.id}" style="background:#28a745; color:white; border:none; padding:6px 14px; border-radius:4px; font-weight:bold; cursor:pointer;">
                                    Reactivar
                                </button>
                            </td>
                        </tr>
                    `;
                });
                html += `</tbody></table>`;
                tablaInactivosContainer.innerHTML = html;

                tablaInactivosContainer.querySelectorAll('.btn-reactivar-prod').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const id = btn.getAttribute('data-id');
                        btn.disabled = true;
                        btn.textContent = 'Reactivando...';
                        const res = await ProductoService.reactivar(id);
                        if (res.ok) {
                            alert('¡Producto reactivado exitosamente!');
                            await cargarTablaInactivos();
                            renderProductos();
                        } else {
                            alert('Error al reactivar: ' + (res.mensaje || 'Intente de nuevo.'));
                            btn.disabled = false;
                            btn.textContent = 'Reactivar';
                        }
                    });
                });
            } catch (err) {
                tablaInactivosContainer.innerHTML = '<p style="color:#ff6666;">Error al cargar la lista de inactivos.</p>';
            }
        }

        // Helper functions for showing/hiding validation errors
        function mostrarError(inputName, mensaje) {
            const input = form.querySelector(`[name="${inputName}"]`);
            if (input) {
                const group = input.closest('.input-group') || input.closest('.size-stock-item');
                const errorSpan = group.querySelector('.error-msg');
                if (errorSpan) {
                    errorSpan.textContent = mensaje;
                    errorSpan.style.display = 'block';
                    input.style.borderColor = '#f75a68';
                }
            }
        }

        function limpiarError(inputName) {
            const input = form.querySelector(`[name="${inputName}"]`);
            if (input) {
                const group = input.closest('.input-group') || input.closest('.size-stock-item');
                const errorSpan = group.querySelector('.error-msg');
                if (errorSpan) {
                    errorSpan.style.display = 'none';
                    errorSpan.textContent = '';
                    input.style.borderColor = '';
                }
            }
        }

        function limpiarTodosLosErrores() {
            ['nombre', 'precio', 'descripcion', 'imagen', 'stock_S', 'stock_M', 'stock_L', 'stock_XL', 'stock_34', 'stock_36', 'stock_38', 'stock_39', 'stock_40', 'stock_42', 'stock_43'].forEach(name => limpiarError(name));
        }

        // Real-time dynamic validations as user types
        const inputsAValidar = ['nombre', 'precio', 'descripcion', 'imagen'];
        inputsAValidar.forEach(name => {
            const input = form.querySelector(`[name="${name}"]`);
            if (input) {
                input.addEventListener('input', () => {
                    const val = input.value.trim();
                    if (val !== '') {
                        if (name === 'precio') {
                            const num = Number(val);
                            if (num >= 50000) {
                                limpiarError(name);
                            } else {
                                mostrarError(name, 'El precio mínimo de registro es de $50,000');
                            }
                        } else {
                            limpiarError(name);
                        }
                    } else {
                        mostrarError(name, 'Este campo es obligatorio');
                    }
                });
            }
        });

        ['stock_S', 'stock_M', 'stock_L', 'stock_XL', 'stock_34', 'stock_36', 'stock_38', 'stock_39', 'stock_40', 'stock_42', 'stock_43'].forEach(name => {
            const input = form.querySelector(`[name="${name}"]`);
            if (input) {
                input.addEventListener('input', () => {
                    const val = parseInt(input.value);
                    if (!isNaN(val) && val >= 0) {
                        limpiarError(name);
                    } else {
                        mostrarError(name, 'El stock no puede ser negativo');
                    }
                });
            }
        });

        const fileInput = form.querySelector('[name="imagen"]');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                imagenesSeleccionadas = [...imagenesSeleccionadas, ...files];
                console.log("Imágenes acumuladas:", imagenesSeleccionadas);
                if (imagenesSeleccionadas.length > 0) {
                    limpiarError('imagen');
                }
            });
        }

        if(btnAbrir && wrapper) {
            btnAbrir.addEventListener('click', () => {
                form.reset();
                limpiarTodosLosErrores();
                imagenesSeleccionadas = [];
                form.querySelector('[name="idProducto"]').value = '';
                formTitle.textContent = "Registrar Prenda en Inventario";
                wrapper.style.display = 'block';
                form.querySelector('[name="esDestacado"]').checked = false;
                ['stock_S', 'stock_M', 'stock_L', 'stock_XL', 'stock_34', 'stock_36', 'stock_38', 'stock_39', 'stock_40', 'stock_42', 'stock_43'].forEach(n => {
                    const inp = form.querySelector(`[name="${n}"]`);
                    if (inp) inp.value = 0;
                });
                actualizarContenedoresStock();
                // Reset checkboxes to Negro default
                form.querySelectorAll('[name="color_option"]').forEach(cb => {
                    cb.checked = cb.value === 'Negro';
                });
            });
        }
        if(btnCancelar && wrapper) {
            btnCancelar.addEventListener('click', () => {
                wrapper.style.display = 'none';
                form.reset();
                imagenesSeleccionadas = [];
                limpiarTodosLosErrores();
            });
        }

        // Edit buttons click handler
        document.querySelectorAll('.btn-editar-prod').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tr = e.target.closest('tr');
                const p = JSON.parse(decodeURIComponent(tr.getAttribute('data-json')));
                
                limpiarTodosLosErrores();
                imagenesSeleccionadas = [];
                formTitle.textContent = "Editar Prenda";
                form.querySelector('[name="idProducto"]').value = p.id;
                form.querySelector('[name="nombre"]').value = p.nombre;
                form.querySelector('[name="categoria"]').value = p.categoria;
                form.querySelector('[name="precio"]').value = p.precioBase;
                form.querySelector('[name="descripcion"]').value = p.descripcion || '';
                // Clear the file input (cannot set value programmatically)
                form.querySelector('[name="imagen"]').value = '';
                form.querySelector('[name="esDestacado"]').checked = p.esDestacado === true;

                // Pre-fill color checkboxes from product variants
                const coloresDeVariantes = [...new Set((p.variantes || []).map(v => v.color).filter(Boolean))];
                form.querySelectorAll('[name="color_option"]').forEach(cb => {
                    cb.checked = coloresDeVariantes.includes(cb.value);
                });

                ['S', 'M', 'L', 'XL'].forEach(t => {
                    const inp = form.querySelector(`[name="stock_${t}"]`);
                    if (inp) inp.value = getStockPorTalla(p.variantes, t);
                });
                ['34', '36', '38', '39', '40', '42', '43'].forEach(t => {
                    const inp = form.querySelector(`[name="stock_${t}"]`);
                    if (inp) inp.value = getStockPorTalla(p.variantes, t);
                });

                actualizarContenedoresStock();
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
            const esDestacado = form.querySelector('[name="esDestacado"]').checked;

            const stockS = parseInt(form.querySelector('[name="stock_S"]').value) || 0;
            const stockM = parseInt(form.querySelector('[name="stock_M"]').value) || 0;
            const stockL = parseInt(form.querySelector('[name="stock_L"]').value) || 0;
            const stockXL = parseInt(form.querySelector('[name="stock_XL"]').value) || 0;

            let hayError = false;

            // Validar Nombre del Producto
            if (!nombre) {
                mostrarError('nombre', 'El nombre del producto es obligatorio.');
                hayError = true;
            } else if (nombre.match(/^\d+$/)) {
                mostrarError('nombre', 'El nombre de la prenda no puede ser puramente numérico.');
                hayError = true;
            } else {
                limpiarError('nombre');
            }

            // Validar Precio
            if (!precioBase) {
                mostrarError('precio', 'El precio de venta es obligatorio.');
                hayError = true;
            } else {
                const precioNum = Number(precioBase);
                if (precioNum < 50000) {
                    mostrarError('precio', 'El precio mínimo de registro es de $50,000 COP.');
                    hayError = true;
                } else {
                    limpiarError('precio');
                }
            }

            // Validar Descripción
            if (!descripcion) {
                mostrarError('descripcion', 'La descripción es obligatoria.');
                hayError = true;
            } else {
                limpiarError('descripcion');
            }

            // Validar Imagen
            if (!idProducto && imagenesSeleccionadas.length === 0) {
                mostrarError('imagen', 'Debes seleccionar al menos una imagen para registrar la prenda.');
                hayError = true;
            } else {
                limpiarError('imagen');
            }

            // Validar Colores
            const coloresSeleccionados = Array.from(form.querySelectorAll('[name="color_option"]:checked')).map(cb => cb.value);
            const colorErrorSpan = document.getElementById('colorErrorMsg');
            if (coloresSeleccionados.length === 0) {
                if (colorErrorSpan) {
                    colorErrorSpan.textContent = 'Debes seleccionar al menos un color.';
                    colorErrorSpan.style.display = 'block';
                }
                hayError = true;
            } else {
                if (colorErrorSpan) {
                    colorErrorSpan.style.display = 'none';
                }
            }

            // Validar Stocks
            const stockFieldsToValidate = String(idCategorias) === '4'
                ? ['stock_34', 'stock_36', 'stock_38', 'stock_39', 'stock_40', 'stock_42', 'stock_43']
                : ['stock_S', 'stock_M', 'stock_L', 'stock_XL'];

            stockFieldsToValidate.forEach(stockField => {
                const inp = form.querySelector(`[name="${stockField}"]`);
                const val = inp ? parseInt(inp.value) : 0;
                if (isNaN(val) || val < 0) {
                    mostrarError(stockField, 'El stock no puede ser negativo.');
                    hayError = true;
                } else {
                    limpiarError(stockField);
                }
            });

            if (hayError) {
                return; // Detener el envío del formulario
            }

            // Crear FormData
            const formData = new FormData();
            if (idProducto) {
                formData.append('idProducto', idProducto);
            }
            formData.append('nombreProducto', nombre);
            formData.append('idCategorias', idCategorias);
            formData.append('precioBase', precioBase);
            formData.append('descripcion', descripcion);
            formData.append('esDestacado', esDestacado ? 'true' : 'false');
            
            // Adjuntar stocks ropa
            formData.append('stock_S', stockS);
            formData.append('stock_M', stockM);
            formData.append('stock_L', stockL);
            formData.append('stock_XL', stockXL);
            
            // Adjuntar stocks calzado
            ['34', '36', '38', '39', '40', '42', '43'].forEach(t => {
                const inp = form.querySelector(`[name="stock_${t}"]`);
                formData.append(`stock_${t}`, inp ? (parseInt(inp.value) || 0) : 0);
            });
            
            // Adjuntar colores seleccionados
            coloresSeleccionados.forEach(color => {
                formData.append('colores', color);
                formData.append('color_option', color);
            });
            
            // Adjuntar imágenes acumuladas
            imagenesSeleccionadas.forEach(archivo => {
                formData.append('imagenes', archivo);
                formData.append('imagen', archivo);
            });

            try {
                formData.append('accion', idProducto ? 'actualizar' : 'crear');

                console.log("Enviando prenda al servidor con datos:");
                for (let [key, val] of formData.entries()) {
                    if (val instanceof File) {
                        console.log(`- ${key}: [Archivo] ${val.name} (${val.size} bytes)`);
                    } else {
                        console.log(`- ${key}: ${val}`);
                    }
                }

                const baseUrl = await getBaseUrl();
                const url = `${baseUrl}/ProductoController`.replace(/([^:]\/)\/+/g, "$1");
                const method = 'POST';

                console.log(`Realizando petición fetch a URL: ${url} [MÉTODO: ${method}]`);

                const res = await fetch(url, {
                    method: method,
                    body: formData,
                    credentials: 'include'
                });

                if (!res.ok) {
                    const textError = await res.text();
                    console.error("Error HTTP " + res.status + " al guardar prenda:", textError);
                    alert("Error HTTP " + res.status + " del servidor: " + textError);
                    return;
                }

                const json = await res.json();
                console.log("Respuesta JSON del servidor para prenda:", json);

                if (json.status === 'success') {
                    alert('🎉 ' + (json.mensaje || 'Prenda guardada con éxito en el catálogo.'));
                    wrapper.style.display = 'none';
                    form.reset();
                    imagenesSeleccionadas = [];
                    renderProductos();
                } else {
                    console.error("Error devuelto por el controlador al guardar prenda:", json.mensaje || json);
                    alert('❌ Error al guardar: ' + (json.mensaje || 'Ocurrió un error.'));
                }
            } catch (error) {
                console.error('Excepción detectada al intentar guardar la prenda:', error);
                alert('Excepción detectada en JS al intentar guardar la prenda: ' + error.message);
            }
        });
    }

    // ── 3. HISTORIAL DE VENTAS Y DESPACHOS (PEDIDOS & LOGÍSTICA FULL-STACK) ──
    async function renderVentas() {
        dynamicContent.innerHTML = `<div class="loader">Cargando panel logístico de pedidos...</div>`;

        let listaPedidosOriginal = [];
        try {
            const data = await PedidoService.listarTodos();
            listaPedidosOriginal = Array.isArray(data) ? data : [];
        } catch (e) {
            console.error("Error al cargar la lista de pedidos:", e);
        }

        // Renderizar Barra de Filtros y Estructura Principal
        dynamicContent.innerHTML = `
            <div class="logistics-filter-bar">
                <div class="logistics-filter-group">
                    <div class="search-box-wrapper">
                        <i class='bx bx-search'></i>
                        <input type="text" id="logisticsSearchInput" placeholder="Buscar por # Pedido, Cliente o Email...">
                    </div>
                    <div>
                        <select id="logisticsStatusFilter" class="filter-select">
                            <option value="TODOS">Todos los Estados</option>
                            <option value="pendiente">Pendiente (Naranja)</option>
                            <option value="preparando">En Preparación (Amarillo)</option>
                            <option value="enviado">Enviado (Azul)</option>
                            <option value="entregado">Entregado (Verde)</option>
                            <option value="cancelado">Cancelado (Rojo)</option>
                        </select>
                    </div>
                </div>

                <div class="logistics-filter-group">
                    <span class="filter-label">Rango de Fechas:</span>
                    <input type="date" id="logisticsDateStart" class="filter-date-input" title="Fecha Inicial">
                    <span class="filter-label">a</span>
                    <input type="date" id="logisticsDateEnd" class="filter-date-input" title="Fecha Final">
                    <button id="btnResetLogisticsFilters" class="btn-reset-filters" title="Limpiar Filtros">
                        <i class='bx bx-refresh'></i> Limpiar
                    </button>
                </div>
            </div>

            <div class="admin-panel-card">
                <table class="admin-table" id="tablaLogisticaPedidos">
                    <thead>
                        <tr>
                            <th># Pedido</th>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado Logístico</th>
                            <th style="text-align: center;">Acciones de Envío</th>
                        </tr>
                    </thead>
                    <tbody id="tbodyLogisticaPedidos">
                        <!-- Filas dinámicas se insertan aquí -->
                    </tbody>
                </table>
            </div>

            <!-- MODAL 1: DETALLE COMPLETO DEL PEDIDO (VISIBILIDAD 360°) -->
            <div class="admin-modal-overlay" id="modalDetallePedido">
                <div class="admin-modal-container">
                    <div class="admin-modal-header">
                        <h2><i class='bx bx-paperclip'></i> Expediente de Pedido <span id="m1NumeroPedido" style="color: #04d361;"></span></h2>
                        <button class="admin-modal-close" data-modal="modalDetallePedido">&times;</button>
                    </div>
                    <div class="admin-modal-body" id="m1Body">
                        <div class="loader">Cargando visibilidad 360°...</div>
                    </div>
                    <div class="admin-modal-footer">
                        <button class="btn-action btn-modal-close" data-modal="modalDetallePedido">Cerrar Expediente</button>
                    </div>
                </div>
            </div>

            <!-- MODAL 2: GESTIÓN DE ESTADO Y DESPACHO (ORQUESTADOR LOGÍSTICO) -->
            <div class="admin-modal-overlay" id="modalGestionDespacho">
                <div class="admin-modal-container">
                    <div class="admin-modal-header">
                        <h2><i class='bx bx-truck'></i> Gestión de Despacho & Rastreo <span id="m2NumeroPedido" style="color: #04d361;"></span></h2>
                        <button class="admin-modal-close" data-modal="modalGestionDespacho">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <form id="formGestionDespachoLogistico" class="logistics-form">
                            <input type="hidden" id="m2IdPedido" name="idPedido">
                            
                            <div class="logistics-form-group">
                                <label for="m2EstadoSelect">Nuevo Estado Logístico <span class="required">*</span></label>
                                <select id="m2EstadoSelect" name="estado" class="logistics-input" required>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="preparando">En Preparación / Empaque</option>
                                    <option value="enviado">Enviado / En Ruta</option>
                                    <option value="entregado">Entregado Exitosa</option>
                                    <option value="cancelado">Cancelado (Reabastecer Kárdex)</option>
                                </select>
                            </div>

                            <div class="logistics-form-group">
                                <label for="m2Transportadora">Empresa Transportadora <span class="required" id="m2ReqTrans" style="display:none;">*</span></label>
                                <select id="m2Transportadora" name="transportadora" class="logistics-input">
                                    <option value="">-- Seleccionar Transportadora --</option>
                                    <option value="Servientrega">Servientrega</option>
                                    <option value="Interrapidisimo">Interrapidísimo</option>
                                    <option value="Envía">Envía Colvanes</option>
                                    <option value="Coordinadora">Coordinadora Mercantil</option>
                                    <option value="Mensajeria Local Bucaramanga">Mensajería Express Local (Bucaramanga)</option>
                                    <option value="Otra Transportadora">Otra Empresa Transportadora</option>
                                </select>
                            </div>

                            <div class="logistics-form-group">
                                <label for="m2NumeroGuia">Número de Guía de Rastreo <span class="required" id="m2ReqGuia" style="display:none;">*</span></label>
                                <input type="text" id="m2NumeroGuia" name="numeroGuia" class="logistics-input" placeholder="Ej: SE-982347102">
                            </div>

                            <div class="logistics-form-group">
                                <label for="m2Notas">Notas / Observaciones del Envío (Mensaje al Cliente)</label>
                                <textarea id="m2Notas" name="descripcion" class="logistics-input" rows="3" placeholder="Ingresa notas internas o mensaje directo al cliente..."></textarea>
                            </div>

                            <h3 class="tracking-history-title"><i class='bx bx-history'></i> Historial de Movimientos de Rastreo</h3>
                            <div id="m2HistorialRastreoContainer">
                                <div class="loader">Cargando historial de rastreo...</div>
                            </div>

                            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px;">
                                <button type="button" class="btn-action btn-modal-close" data-modal="modalGestionDespacho">Cancelar</button>
                                <button type="submit" class="btn-action" style="background-color:#04d361; color:#121214; font-weight:bold;">
                                    <i class='bx bx-save'></i> Guardar y Notificar al Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- MODAL 3: VISTA DE IMPRESIÓN REMISIÓN / FACTURA DE EMPAQUE -->
            <div class="admin-modal-overlay" id="modalPrintRemision">
                <div class="admin-modal-container" style="max-width: 750px;">
                    <div class="admin-modal-header">
                        <h2><i class='bx bx-printer'></i> Remisión de Despacho & Empaque</h2>
                        <button class="admin-modal-close" data-modal="modalPrintRemision">&times;</button>
                    </div>
                    <div class="admin-modal-body" id="m3PrintContainer">
                        <div class="loader">Generando remisión de despacho...</div>
                    </div>
                    <div class="admin-modal-footer">
                        <button class="btn-action btn-modal-close" data-modal="modalPrintRemision">Cerrar</button>
                        <button id="btnEjecutarImpresionRemision" class="btn-action" style="background-color:#04d361; color:#121214; font-weight:bold;">
                            <i class='bx bx-printer'></i> Imprimir Etiqueta de Caja
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Referencias a Elementos DOM de Filtros y Tabla
        const tbody = document.getElementById('tbodyLogisticaPedidos');
        const inputSearch = document.getElementById('logisticsSearchInput');
        const selectStatus = document.getElementById('logisticsStatusFilter');
        const inputDateStart = document.getElementById('logisticsDateStart');
        const inputDateEnd = document.getElementById('logisticsDateEnd');
        const btnReset = document.getElementById('btnResetLogisticsFilters');

        // Función para renderizar la tabla aplicando filtros
        function renderTablaFiltrada() {
            const query = inputSearch.value.trim().toLowerCase();
            const statusFilter = selectStatus.value.toLowerCase();
            const dateStartVal = inputDateStart.value;
            const dateEndVal = inputDateEnd.value;

            const pedidosFiltrados = listaPedidosOriginal.filter(p => {
                // Filtro por Texto (IdPedido, NumeroPedido, Cliente, Email)
                const idStr = String(p.idPedido || '');
                const numStr = (p.numeroPedido || '').toLowerCase();
                const clienteStr = (p.clienteNombre || '').toLowerCase();
                const emailStr = (p.clienteEmail || '').toLowerCase();

                const matchesQuery = !query || 
                    idStr.includes(query) || 
                    numStr.includes(query) || 
                    clienteStr.includes(query) || 
                    emailStr.includes(query);

                // Filtro por Estado
                const estadoPed = (p.estado || 'pendiente').toLowerCase();
                const matchesStatus = (statusFilter === 'todos') || (estadoPed === statusFilter);

                // Filtro por Rango de Fechas
                let matchesDate = true;
                if (p.fechaPedido) {
                    const pDateStr = p.fechaPedido.split(' ')[0]; // Formato YYYY-MM-DD
                    if (dateStartVal && pDateStr < dateStartVal) matchesDate = false;
                    if (dateEndVal && pDateStr > dateEndVal) matchesDate = false;
                }

                return matchesQuery && matchesStatus && matchesDate;
            });

            if (pedidosFiltrados.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:25px; color:#a8a8b3;">No se encontraron pedidos con los criterios de búsqueda seleccionados.</td></tr>`;
                return;
            }

            let filasHtml = '';
            pedidosFiltrados.forEach(p => {
                const totalFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.total || 0);
                const dateStr = p.fechaPedido ? new Date(p.fechaPedido).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Reciente';

                const estadoKey = (p.estado || 'pendiente').toLowerCase();

                // Construcción del Badge Visual Dinámico
                let badgeHtml = '';
                if (estadoKey === 'pendiente') {
                    badgeHtml = `<span class="status-badge pendiente"><i class='bx bx-time-five'></i> Pendiente</span>`;
                } else if (estadoKey === 'preparando' || estadoKey === 'preparacion') {
                    badgeHtml = `<span class="status-badge preparando"><i class='bx bx-cog'></i> En Empaque</span>`;
                } else if (estadoKey === 'enviado') {
                    badgeHtml = `<span class="status-badge enviado"><i class='bx bx-truck'></i> Enviado</span>`;
                } else if (estadoKey === 'entregado') {
                    badgeHtml = `<span class="status-badge entregado"><i class='bx bx-check-circle'></i> Entregado</span>`;
                } else if (estadoKey === 'cancelado') {
                    badgeHtml = `<span class="status-badge cancelado"><i class='bx bx-x-circle'></i> Cancelado</span>`;
                } else {
                    badgeHtml = `<span class="status-badge pendiente">${estadoKey.toUpperCase()}</span>`;
                }

                const numPedidoMostrar = p.numeroPedido ? p.numeroPedido : `#${p.idPedido}`;
                const clienteNombreMostrar = p.clienteNombre ? p.clienteNombre : `Cliente #${p.idUsuarios}`;

                filasHtml += `
                    <tr data-id="${p.idPedido}">
                        <td><strong style="color: #fff;">${numPedidoMostrar}</strong></td>
                        <td>
                            <div>
                                <strong style="color: #e1e1e6;">${clienteNombreMostrar}</strong>
                                ${p.clienteEmail ? `<br><small style="color: #a8a8b3;">${p.clienteEmail}</small>` : ''}
                            </div>
                        </td>
                        <td>${dateStr}</td>
                        <td><strong style="color: #04d361;">${totalFormatted}</strong></td>
                        <td>${badgeHtml}</td>
                        <td style="text-align: center;">
                            <div class="action-buttons-group" style="justify-content: center;">
                                <button class="btn-log-action btn-view btn-abrir-detalle" data-id="${p.idPedido}" title="Ver Detalle Completo 360°">
                                    <i class='bx bx-show'></i>
                                </button>
                                <button class="btn-log-action btn-ship btn-abrir-despacho" data-id="${p.idPedido}" title="Gestionar Envío & Despacho">
                                    <i class='bx bx-truck'></i>
                                </button>
                                <button class="btn-log-action btn-print btn-abrir-impresion" data-id="${p.idPedido}" title="Imprimir Remisión de Caja">
                                    <i class='bx bx-printer'></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = filasHtml;

            // Re-vincular eventos a botones recién creados
            vincularEventosTabla();
        }

        // Eventos de Filtros en Tiempo Real
        inputSearch.addEventListener('input', renderTablaFiltrada);
        selectStatus.addEventListener('change', renderTablaFiltrada);
        inputDateStart.addEventListener('change', renderTablaFiltrada);
        inputDateEnd.addEventListener('change', renderTablaFiltrada);
        btnReset.addEventListener('click', () => {
            inputSearch.value = '';
            selectStatus.value = 'TODOS';
            inputDateStart.value = '';
            inputDateEnd.value = '';
            renderTablaFiltrada();
        });

        // Inicializar Renderizado de Tabla
        renderTablaFiltrada();

        // Manejadores de Modales (Cierre)
        document.querySelectorAll('.btn-modal-close, .admin-modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = btn.getAttribute('data-modal');
                const overlay = document.getElementById(modalId);
                if (overlay) overlay.classList.remove('active');
            });
        });

        document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // ── VINCULAR EVENTOS DE BOTONES DE ACCIÓN ──
        function vincularEventosTabla() {

            // MODAL 1: VER DETALLE COMPLETO (VISIBILIDAD 360°)
            document.querySelectorAll('.btn-abrir-detalle').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idPedido = btn.getAttribute('data-id');
                    const modal = document.getElementById('modalDetallePedido');
                    const m1Body = document.getElementById('m1Body');
                    const m1Numero = document.getElementById('m1NumeroPedido');

                    m1Numero.textContent = `#${idPedido}`;
                    m1Body.innerHTML = `<div class="loader">Cargando expediente 360° del pedido #${idPedido}...</div>`;
                    modal.classList.add('active');

                    try {
                        const data = await PedidoService.obtenerDetalleCompleto(idPedido);
                        if (!data || data.status === 'error') {
                            m1Body.innerHTML = `<div class="error-msg">Error al cargar datos del pedido: ${data ? data.mensaje : 'Desconocido'}</div>`;
                            return;
                        }

                        const p = data.pedido || {};
                        const c = data.cliente || {};
                        const pg = data.pago || {};
                        const items = data.items || [];

                        const numPed = p.numeroPedido || `#${p.idPedido}`;
                        m1Numero.textContent = numPed;

                        const totalFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.total || 0);
                        const costoEnvioFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.costoEnvio || 0);
                        const subtotalItems = (p.total || 0) - (p.costoEnvio || 0);
                        const subtotalFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(subtotalItems);

                        const fechaStr = p.fechaPedido ? new Date(p.fechaPedido).toLocaleString('es-CO') : 'N/A';

                        let itemsRows = '';
                        items.forEach(it => {
                            const unitFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(it.precioUnitario || 0);
                            const subFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(it.subtotal || 0);
                            
                            itemsRows += `
                                <tr>
                                    <td><strong style="color:#fff;">${it.nombreSnapshot || 'Prenda'}</strong></td>
                                    <td><span class="badge info">${it.tallaSnapshot || 'Única'}</span></td>
                                    <td>${it.colorSnapshot || 'N/A'}</td>
                                    <td>${it.cantidad}</td>
                                    <td>${unitFormatted}</td>
                                    <td><strong style="color:#04d361;">${subFormatted}</strong></td>
                                </tr>
                            `;
                        });

                        if (items.length === 0) {
                            itemsRows = `<tr><td colspan="6" style="text-align:center;">No hay ítems registrados en este pedido.</td></tr>`;
                        }

                        m1Body.innerHTML = `
                            <div class="modal-grid-2col">
                                <div class="modal-info-box">
                                    <h4><i class='bx bx-user'></i> Datos del Cliente</h4>
                                    <ul class="modal-info-list">
                                        <li><span class="label">Nombre:</span> <strong>${c.nombre || ''} ${c.apellido || ''}</strong></li>
                                        <li><span class="label">Correo Electrónico:</span> ${c.email || 'N/A'}</li>
                                        <li><span class="label">Teléfono / WhatsApp:</span> ${c.telefono || 'N/A'}</li>
                                        <li><span class="label">ID de Usuario:</span> #${c.idUsuarios || 'N/A'}</li>
                                    </ul>
                                </div>

                                <div class="modal-info-box">
                                    <h4><i class='bx bx-map'></i> Dirección & Envío</h4>
                                    <ul class="modal-info-list">
                                        <li><span class="label">Dirección Completa:</span> <strong>${p.direccionEnvio || 'No especificada'}</strong></li>
                                        <li><span class="label">Fecha del Pedido:</span> ${fechaStr}</li>
                                        <li><span class="label">Estado Actual:</span> <strong style="text-transform:uppercase; color:#04d361;">${p.estado}</strong></li>
                                    </ul>
                                </div>
                            </div>

                            <div class="modal-info-box" style="margin-bottom: 20px;">
                                <h4><i class='bx bx-credit-card'></i> Información de Pago (Trazabilidad)</h4>
                                <ul class="modal-info-list" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                    <li><span class="label">Pasarela / Método:</span> <strong>${pg.metodoPago || 'PSE'}</strong></li>
                                    <li><span class="label">Estado del Pago:</span> <strong style="color:#04d361;">${(pg.estadoPago || 'aprobado').toUpperCase()}</strong></li>
                                    <li><span class="label">Referencia de Pago:</span> <code>${pg.referencia || 'REF-' + p.idPedido}</code></li>
                                    <li><span class="label">Monto Acreditado:</span> ${totalFormatted}</li>
                                </ul>
                            </div>

                            <h4 style="color:#04d361; margin-bottom:10px;"><i class='bx bx-shopping-bag'></i> Ítems Comprados (Snapshot de Prenda)</h4>
                            <table class="modal-items-table">
                                <thead>
                                    <tr>
                                        <th>Prenda (Snapshot)</th>
                                        <th>Talla</th>
                                        <th>Color</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unitario</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsRows}
                                </tbody>
                            </table>

                            <div class="modal-breakdown-box">
                                <div class="modal-breakdown-row">
                                    <span>Subtotal Prendas:</span>
                                    <span>${subtotalFormatted}</span>
                                </div>
                                <div class="modal-breakdown-row">
                                    <span>Costo de Envío:</span>
                                    <span>${costoEnvioFormatted}</span>
                                </div>
                                <div class="modal-breakdown-row total">
                                    <span>Total Pedido:</span>
                                    <span>${totalFormatted}</span>
                                </div>
                            </div>
                        `;

                    } catch (err) {
                        console.error(err);
                        m1Body.innerHTML = `<div class="error-msg">Error de conexión al obtener detalles.</div>`;
                    }
                });
            });

            // MODAL 2: GESTIÓN DE DESPACHO & RASTREO
            document.querySelectorAll('.btn-abrir-despacho').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idPedido = btn.getAttribute('data-id');
                    const modal = document.getElementById('modalGestionDespacho');
                    const m2Numero = document.getElementById('m2NumeroPedido');
                    const m2IdInput = document.getElementById('m2IdPedido');
                    const m2EstadoSelect = document.getElementById('m2EstadoSelect');
                    const m2TransSelect = document.getElementById('m2Transportadora');
                    const m2GuiaInput = document.getElementById('m2NumeroGuia');
                    const m2NotasInput = document.getElementById('m2Notas');
                    const m2Historial = document.getElementById('m2HistorialRastreoContainer');

                    m2Numero.textContent = `#${idPedido}`;
                    m2IdInput.value = idPedido;
                    m2Historial.innerHTML = `<div class="loader">Cargando historial de rastreo...</div>`;
                    modal.classList.add('active');

                    // Pre-llenar datos si se encuentran en la lista original
                    const pedEncontrado = listaPedidosOriginal.find(p => String(p.idPedido) === String(idPedido));
                    if (pedEncontrado) {
                        m2EstadoSelect.value = pedEncontrado.estado || 'pendiente';
                        m2TransSelect.value = pedEncontrado.transportadora || '';
                        m2GuiaInput.value = pedEncontrado.numeroGuia || '';
                        m2NotasInput.value = '';
                    }

                    // Cargar Historial de Rastreo desde Backend
                    try {
                        const historial = await PedidoService.obtenerHistorialRastreo(idPedido);
                        if (Array.isArray(historial) && historial.length > 0) {
                            let histRows = '';
                            historial.forEach(h => {
                                const fStr = h.fechaEstado ? new Date(h.fechaEstado).toLocaleString('es-CO') : '';
                                histRows += `
                                    <tr>
                                        <td><strong>${h.estadoEnvio ? h.estadoEnvio.toUpperCase() : ''}</strong></td>
                                        <td>${h.transportadora || '-'}</td>
                                        <td><code>${h.numeroGuia || '-'}</code></td>
                                        <td>${h.descripcion || ''}</td>
                                        <td><small>${fStr}</small></td>
                                    </tr>
                                `;
                            });

                            m2Historial.innerHTML = `
                                <table class="modal-items-table" style="font-size:0.82rem;">
                                    <thead>
                                        <tr><th>Estado</th><th>Transportadora</th><th>No. Guía</th><th>Observaciones</th><th>Fecha / Hora</th></tr>
                                    </thead>
                                    <tbody>
                                        ${histRows}
                                    </tbody>
                                </table>
                            `;
                        } else {
                            m2Historial.innerHTML = `<p style="color:#a8a8b3; font-size:0.88rem; margin:10px 0;">No hay eventos previos de rastreo registrados para este pedido.</p>`;
                        }
                    } catch (e) {
                        m2Historial.innerHTML = `<p style="color:#ff4d4d; font-size:0.88rem;">Error al cargar historial de rastreo.</p>`;
                    }
                });
            });

            // MODAL 3: IMPRIMIR REMISIÓN DE EMPAQUE
            document.querySelectorAll('.btn-abrir-impresion').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idPedido = btn.getAttribute('data-id');
                    const modal = document.getElementById('modalPrintRemision');
                    const container = document.getElementById('m3PrintContainer');

                    container.innerHTML = `<div class="loader">Generando remisión limpia de empaque para pedido #${idPedido}...</div>`;
                    modal.classList.add('active');

                    try {
                        const data = await PedidoService.obtenerDetalleCompleto(idPedido);
                        if (!data || data.status === 'error') {
                            container.innerHTML = `<div class="error-msg">Error al generar la remisión de empaque.</div>`;
                            return;
                        }

                        const p = data.pedido || {};
                        const c = data.cliente || {};
                        const items = data.items || [];
                        const rastreoList = data.rastreo || [];
                        const ultimoRastreo = rastreoList.length > 0 ? rastreoList[0] : {};

                        const numPed = p.numeroPedido || `#${p.idPedido}`;
                        const fechaStr = p.fechaPedido ? new Date(p.fechaPedido).toLocaleDateString('es-CO') : 'Reciente';

                        let itemRows = '';
                        items.forEach(it => {
                            itemRows += `
                                <tr>
                                    <td><strong>${it.nombreSnapshot}</strong></td>
                                    <td>${it.tallaSnapshot}</td>
                                    <td>${it.colorSnapshot || 'N/A'}</td>
                                    <td><strong>${it.cantidad}</strong></td>
                                </tr>
                            `;
                        });

                        container.innerHTML = `
                            <div class="print-shipping-label">
                                <div class="print-header">
                                    <div>
                                        <div class="print-brand">ELIXIR & FLEXX</div>
                                        <span style="font-size:0.85rem; color:#555;">E-Commerce Streetwear Colombia</span>
                                    </div>
                                    <div style="text-align:right;">
                                        <h3 style="margin:0; font-size:1.2rem;">REMISIÓN DE EMPAQUE</h3>
                                        <span style="font-size:1rem; font-weight:bold;">${numPed}</span><br>
                                        <small style="color:#555;">Fecha: ${fechaStr}</small>
                                    </div>
                                </div>

                                <div class="print-grid">
                                    <div class="print-box">
                                        <h5>ORIGEN / REMITENTE:</h5>
                                        <p><strong>ELIXIR & FLEXX BODEGA CENTRAL</strong></p>
                                        <p>Centro Logístico Bucaramanga</p>
                                        <p>Bucaramanga, Santander, Colombia</p>
                                        <p>Tel: +57 300 000 0000</p>
                                    </div>

                                    <div class="print-box">
                                        <h5>DESTINATARIO / CLIENTE:</h5>
                                        <p><strong>${c.nombre || ''} ${c.apellido || ''}</strong></p>
                                        <p><strong>Dirección:</strong> ${p.direccionEnvio || 'N/A'}</p>
                                        <p>Teléfono: ${c.telefono || 'N/A'}</p>
                                        <p>Email: ${c.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div class="print-box" style="margin-bottom:15px; background-color:#fafafa;">
                                    <h5>INFORMACIÓN LOGÍSTICA DE TRANSPORTE:</h5>
                                    <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                                        <span>Transportadora: <strong>${ultimoRastreo.transportadora || 'Mensajería / Servientrega'}</strong></span>
                                        <span>No. Guía de Rastreo: <strong>${ultimoRastreo.numeroGuia || 'PENDIENTE'}</strong></span>
                                    </div>
                                </div>

                                <h5 style="margin:15px 0 8px 0; font-size:0.85rem; text-transform:uppercase;">CONTENIDO DEL PAQUETE (PRENDAS):</h5>
                                <table class="print-items-table">
                                    <thead>
                                        <tr>
                                            <th>Prenda</th>
                                            <th>Talla</th>
                                            <th>Color</th>
                                            <th>Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemRows}
                                    </tbody>
                                </table>

                                <div style="margin-top:25px; border-top:1px solid #ddd; padding-top:10px; text-align:center; font-size:0.75rem; color:#777;">
                                    Etiqueta generada por el Sistema Logístico Elixir & Flexx. Por favor verificar el empaque sellado antes de entregar a la transportadora.
                                </div>
                            </div>
                        `;
                    } catch (e) {
                        console.error(e);
                        container.innerHTML = `<div class="error-msg">Error al generar la remisión para impresión.</div>`;
                    }
                });
            });
        }

        // Evento Submit de Modal 2 (Formulario de Despacho)
        const formDespacho = document.getElementById('formGestionDespachoLogistico');
        if (formDespacho) {
            formDespacho.addEventListener('submit', async (e) => {
                e.preventDefault();

                const idPedido = document.getElementById('m2IdPedido').value;
                const estado = document.getElementById('m2EstadoSelect').value;
                const transportadora = document.getElementById('m2Transportadora').value;
                const numeroGuia = document.getElementById('m2NumeroGuia').value.trim();
                const descripcion = document.getElementById('m2Notas').value.trim();

                // Validación obligatoria si el estado pasa a 'enviado'
                if (estado === 'enviado') {
                    if (!transportadora) {
                        alert("⚠️ Debes seleccionar una Empresa Transportadora cuando el estado es 'Enviado'.");
                        return;
                    }
                    if (!numeroGuia) {
                        alert("⚠️ Debes ingresar el Número de Guía de Rastreo cuando el estado es 'Enviado'.");
                        return;
                    }
                }

                try {
                    const res = await PedidoService.actualizarDespacho({
                        idPedido,
                        estado,
                        transportadora,
                        numeroGuia,
                        descripcion
                    });

                    if (res.ok) {
                        alert("🎉 ¡Estado logístico y despacho actualizados con éxito! Notificación enviada al cliente.");
                        document.getElementById('modalGestionDespacho').classList.remove('active');
                        
                        // Recargar la lista de pedidos en memoria y refrescar la tabla sin recargar la página
                        const dataActualizada = await PedidoService.listarTodos();
                        listaPedidosOriginal = Array.isArray(dataActualizada) ? dataActualizada : [];
                        renderTablaFiltrada();
                    } else {
                        alert("❌ Error al guardar despacho: " + (res.mensaje || "Ocurrió un error en el servidor."));
                    }
                } catch (err) {
                    console.error("Excepción al actualizar despacho:", err);
                    alert("❌ Error de conexión al actualizar el despacho logístico.");
                }
            });
        }

        // Evento Botón Imprimir Remisión
        const btnEjecutarImp = document.getElementById('btnEjecutarImpresionRemision');
        if (btnEjecutarImp) {
            btnEjecutarImp.addEventListener('click', () => {
                window.print();
            });
        }
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

    // ── 5. GESTIÓN DE PQR Y DEVOLUCIONES ──
    async function renderSoporte() {
        dynamicContent.innerHTML = `<div class="loader">Cargando solicitudes de soporte...</div>`;

        // Pestañas (Tabs) HTML y estructura base
        dynamicContent.innerHTML = `
            <div class="admin-tabs" style="display: flex; gap: 15px; margin-bottom: 25px; border-bottom: 1px solid #29292e; padding-bottom: 10px;">
                <button class="tab-btn active" data-tab="devoluciones" style="background: transparent; border: none; color: #fff; padding: 10px 20px; font-weight: bold; cursor: pointer; border-bottom: 3px solid #04d361;">Solicitudes de Devolución</button>
                <button class="tab-btn" data-tab="contacto" style="background: transparent; border: none; color: #a8a8b3; padding: 10px 20px; font-weight: bold; cursor: pointer;">Mensajes de Contacto</button>
            </div>

            <!-- Contenido Pestaña 1: Devoluciones -->
            <div id="tabContentDevoluciones" class="tab-pane-content" style="display: block;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Solicitante</th>
                            <th>Motivo / Descripción</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="devolucionesTableBody">
                        <tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Contenido Pestaña 2: Contacto -->
            <div id="tabContentContacto" class="tab-pane-content" style="display: none;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Teléfono</th>
                            <th>Comentario</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="contactosTableBody">
                        <tr><td colspan="7" style="text-align:center;">Cargando...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Modal de rechazo / Ver detalle -->
            <div id="soporteModal" class="admin-panel-card" style="display:none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                <h3 id="soporteModalTitle">Acción de Soporte</h3>
                <div id="soporteModalBody" style="margin-top: 15px; font-size: 0.9rem; color: #e1e1e6; line-height: 1.6;"></div>
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="btnSoporteModalSubmit" class="btn-urban">Confirmar</button>
                    <button id="btnSoporteModalClose" class="btn-action">Cerrar</button>
                </div>
            </div>
            <div id="soporteModalOverlay" style="display:none; position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); z-index:999;"></div>
        `;

        // Lógica de Tabs
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.color = '#a8a8b3';
                    t.style.borderBottom = 'none';
                });
                tab.classList.add('active');
                tab.style.color = '#fff';
                tab.style.borderBottom = '3px solid #04d361';

                const targetTab = tab.getAttribute('data-tab');
                if (targetTab === 'devoluciones') {
                    document.getElementById('tabContentDevoluciones').style.display = 'block';
                    document.getElementById('tabContentContacto').style.display = 'none';
                } else {
                    document.getElementById('tabContentDevoluciones').style.display = 'none';
                    document.getElementById('tabContentContacto').style.display = 'block';
                }
            });
        });

        // Cargar tablas dinámicas
        await cargarTablasSoporte();

        async function cargarTablasSoporte() {
            try {
                const [devoluciones, contactos] = await Promise.all([
                    SoporteService.listarDevoluciones(),
                    SoporteService.listarContactos()
                ]);

                // Render Devoluciones
                const devBody = document.getElementById('devolucionesTableBody');
                if (devBody) {
                    devBody.innerHTML = '';
                    if (devoluciones.length === 0) {
                        devBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay solicitudes de devolución registradas.</td></tr>`;
                    } else {
                        devoluciones.forEach(d => {
                            const dateStr = d.fecha ? new Date(d.fecha).toLocaleDateString('es-CO') : 'Reciente';
                            
                            let badgeClass = 'badge success';
                            if (d.estado === 'pendiente') badgeClass = 'badge info';
                            if (d.estado === 'rechazado') badgeClass = 'badge danger';

                            let rowActions = '';
                            if (d.estado === 'pendiente') {
                                rowActions = `
                                    <button class="btn-action btn-aprobar-dev" data-id="${d.idDevolucion}" style="background:#04d361;color:#fff;margin-right:5px;">Aprobar</button>
                                    <button class="btn-action btn-rechazar-dev" data-id="${d.idDevolucion}" style="background:#ff4d4d;color:#fff;margin-right:5px;">Rechazar</button>
                                `;
                            }
                            rowActions += `<button class="btn-action btn-ver-dev" data-id="${d.idDevolucion}">Ver Detalle</button>`;

                            // Muestra de entrada: [Fecha] | [Correo] | [Tipo de Solicitud]
                            devBody.innerHTML += `
                                <tr data-json="${encodeURIComponent(JSON.stringify(d))}">
                                    <td>${dateStr}</td>
                                    <td>
                                        <div style="font-weight:bold;">${d.nombre || 'Cliente'}</div>
                                        <div style="font-size:0.8rem;color:#888;">${d.email || ''}</div>
                                    </td>
                                    <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.motivo}</td>
                                    <td><span class="${badgeClass}">${d.estado.toUpperCase()}</span></td>
                                    <td>${rowActions}</td>
                                </tr>
                            `;
                        });
                    }
                }

                // Render Contactos
                const conBody = document.getElementById('contactosTableBody');
                if (conBody) {
                    conBody.innerHTML = '';
                    if (contactos.length === 0) {
                        conBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay mensajes de contacto registrados.</td></tr>`;
                    } else {
                        contactos.forEach(c => {
                            const dateStr = c.fecha ? new Date(c.fecha).toLocaleDateString('es-CO') : 'Reciente';
                            
                            let badgeClass = 'badge success';
                            if (c.estado === 'pendiente') badgeClass = 'badge info';
                            if (c.estado === 'archivado') badgeClass = 'badge danger';

                            let rowActions = '';
                            if (c.estado === 'pendiente') {
                                rowActions = `
                                    <button class="btn-action btn-responder-con" data-id="${c.idContacto}" style="background:#04d361;color:#fff;margin-right:5px;">Leído</button>
                                    <button class="btn-action btn-archivar-con" data-id="${c.idContacto}" style="background:#777;color:#fff;">Archivar</button>
                                `;
                            } else if (c.estado === 'leido_respondido') {
                                rowActions = `<button class="btn-action btn-archivar-con" data-id="${c.idContacto}" style="background:#777;color:#fff;">Archivar</button>`;
                            } else {
                                rowActions = '<span style="font-size:0.8rem;color:#888;">Archivado</span>';
                            }

                            conBody.innerHTML += `
                                <tr data-json="${encodeURIComponent(JSON.stringify(c))}">
                                    <td>${dateStr}</td>
                                    <td>${c.nombre}</td>
                                    <td>${c.email}</td>
                                    <td>${c.telefono || '-'}</td>
                                    <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.comentario}</td>
                                    <td><span class="${badgeClass}">${c.estado.toUpperCase()}</span></td>
                                    <td>${rowActions}</td>
                                </tr>
                            `;
                        });
                    }
                }

                // Vincular eventos
                configurarAccionesDevoluciones();
                configurarAccionesContactos();

            } catch (err) {
                console.error("Error al cargar tablas de soporte:", err);
            }
        }

        // Modal Helpers
        const modal = document.getElementById('soporteModal');
        const overlay = document.getElementById('soporteModalOverlay');
        const modalTitle = document.getElementById('soporteModalTitle');
        const modalBody = document.getElementById('soporteModalBody');
        const modalSubmit = document.getElementById('btnSoporteModalSubmit');
        const modalClose = document.getElementById('btnSoporteModalClose');

        function abrirModal(title, bodyHtml, onSubmit = null) {
            modalTitle.textContent = title;
            modalBody.innerHTML = bodyHtml;
            modal.style.display = 'block';
            overlay.style.display = 'block';

            if (onSubmit) {
                modalSubmit.style.display = 'block';
                const newSubmit = modalSubmit.cloneNode(true);
                modalSubmit.parentNode.replaceChild(newSubmit, modalSubmit);
                newSubmit.addEventListener('click', async () => {
                    await onSubmit();
                    cerrarModal();
                });
            } else {
                modalSubmit.style.display = 'none';
            }
        }

        function cerrarModal() {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        }

        if (modalClose) modalClose.addEventListener('click', cerrarModal);
        if (overlay) overlay.addEventListener('click', cerrarModal);

        function configurarAccionesDevoluciones() {
            document.querySelectorAll('.btn-aprobar-dev').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm('¿Está seguro de aprobar esta solicitud de devolución?')) {
                        const res = await SoporteService.actualizarEstadoDevolucion(id, 'aprobado');
                        if (res.ok) {
                            alert('Aprobado con éxito.');
                            await cargarTablasSoporte();
                        } else {
                            alert('Error al actualizar estado.');
                        }
                    }
                });
            });

            document.querySelectorAll('.btn-rechazar-dev').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const formHtml = `
                        <p>Escribe el motivo del rechazo para la solicitud de devolución:</p>
                        <textarea id="motivoRechazoInput" rows="4" style="width:100%; background:#19191c; border:1px solid #29292e; color:#fff; padding:10px; box-sizing:border-box;" placeholder="Ej: No cumple con los días límites establecidos..."></textarea>
                    `;
                    abrirModal('Rechazar Solicitud de Devolución', formHtml, async () => {
                        const motivo = document.getElementById('motivoRechazoInput').value.trim();
                        if (!motivo) {
                            alert('Debe especificar un motivo.');
                            return;
                        }
                        const res = await SoporteService.actualizarEstadoDevolucion(id, 'rechazado', motivo);
                        if (res.ok) {
                            alert('Rechazado con éxito.');
                            await cargarTablasSoporte();
                        } else {
                            alert('Error al actualizar estado.');
                        }
                    });
                });
            });

            document.querySelectorAll('.btn-ver-dev').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tr = btn.closest('tr');
                    const d = JSON.parse(decodeURIComponent(tr.getAttribute('data-json')));
                    const detailHtml = `
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <div><strong>Solicitante:</strong> ${d.nombre || 'Cliente'}</div>
                            <div><strong>Correo:</strong> ${d.email || ''}</div>
                            <div><strong>Fecha de Solicitud:</strong> ${d.fecha ? new Date(d.fecha).toLocaleString() : 'Reciente'}</div>
                            <div><strong>Estado:</strong> ${d.estado.toUpperCase()}</div>
                            ${d.motivoRechazo ? `<div><strong>Motivo del Rechazo:</strong> <span style="color:#f75a68;">${d.motivoRechazo}</span></div>` : ''}
                            <hr style="border-color:#29292e;">
                            <div><strong>Detalles e Información:</strong></div>
                            <div style="background:#202024; padding:15px; border-radius:4px; border:1px solid #29292e; white-space:pre-wrap;">${d.motivo}</div>
                        </div>
                    `;
                    abrirModal('Detalle Completo de Solicitud', detailHtml);
                });
            });
        }

        function configurarAccionesContactos() {
            document.querySelectorAll('.btn-responder-con').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const res = await SoporteService.actualizarEstadoContacto(id, 'leido_respondido');
                    if (res.ok) {
                        alert('Mensaje marcado como Leído / Respondido.');
                        await cargarTablasSoporte();
                    } else {
                        alert('Error al actualizar.');
                    }
                });
            });

            document.querySelectorAll('.btn-archivar-con').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const res = await SoporteService.actualizarEstadoContacto(id, 'archivado');
                    if (res.ok) {
                        alert('Mensaje archivado con éxito.');
                        await cargarTablasSoporte();
                    } else {
                        alert('Error al actualizar.');
                    }
                });
            });
        }
    }

    // ── 6. GESTIÓN DE PROVEEDORES (MÓDULO COMPLETO) ──
    async function renderProveedores() {
        dynamicContent.innerHTML = `
            <section id="sec-proveedores">
                <div class="action-bar" style="margin-bottom: 20px;">
                    <button id="btnAbrirFormProveedor" class="btn-urban">＋ Registrar Proveedor</button>
                </div>

                <div id="wrapperFormProveedor" class="admin-panel-card" style="display:none; margin-bottom:20px;">
                    <h3 id="formProveedorTitle">Registrar Nuevo Proveedor</h3>
                    <form id="formRegistrarProveedor" class="admin-grid-form">
                        <input type="hidden" name="idProveedor" id="provId" value="">
                        
                        <div class="input-group">
                            <label>NIT del Proveedor</label>
                            <input type="text" name="nitProveedor" id="provNit" placeholder="Ej: 900123456-1" required>
                            <span class="error-text" id="error-nitProveedor" style="color:#ff4d4d; font-size:0.8rem; display:none; margin-top:4px;"></span>
                        </div>
                        
                        <div class="input-group">
                            <label>Nombre de la Empresa</label>
                            <input type="text" name="nombreEmpresa" id="provEmpresa" placeholder="Ej: Textiles El Camino" required>
                            <span class="error-text" id="error-nombreEmpresa" style="color:#ff4d4d; font-size:0.8rem; display:none; margin-top:4px;"></span>
                        </div>
                        
                        <div class="input-group">
                            <label>Nombre del Contacto</label>
                            <input type="text" name="nombreContacto" id="provContacto" placeholder="Ej: Juan Pérez" required>
                            <span class="error-text" id="error-nombreContacto" style="color:#ff4d4d; font-size:0.8rem; display:none; margin-top:4px;"></span>
                        </div>
                        
                        <div class="input-group">
                            <label>Teléfono</label>
                            <input type="text" name="telefono" id="provTelefono" placeholder="Ej: +57 315 123 4567" required>
                            <span class="error-text" id="error-telefono" style="color:#ff4d4d; font-size:0.8rem; display:none; margin-top:4px;"></span>
                        </div>
                        
                        <div class="input-group">
                            <label>Correo Electrónico</label>
                            <input type="email" name="correo" id="provCorreo" placeholder="Ej: contacto@empresa.com" required>
                            <span class="error-text" id="error-correo" style="color:#ff4d4d; font-size:0.8rem; display:none; margin-top:4px;"></span>
                        </div>
                        
                        <div class="input-group">
                            <label>Dirección</label>
                            <input type="text" name="direccion" id="provDireccion" placeholder="Ej: Calle 45 #12-34" required>
                            <span class="error-text" id="error-direccion" style="color:#ff4d4d; font-size:0.8rem; display:none; margin-top:4px;"></span>
                        </div>
                        
                        <div class="input-group" style="grid-column: span 2;">
                            <label>Categoría de Insumo</label>
                            <select name="categoriaInsumo" id="provInsumo" style="padding: 10px; border-radius: 4px; background: #1f1f23; color: #fff; border: 1px solid #29292e;" required>
                                <option value="">-- Seleccionar --</option>
                                <option value="Telas">Telas</option>
                                <option value="Hilos">Hilos</option>
                                <option value="Empaques">Empaques</option>
                                <option value="Calzado">Calzado</option>
                                <option value="Insumos Varios">Insumos Varios</option>
                            </select>
                            <span class="error-text" id="error-categoriaInsumo" style="color:#ff4d4d; font-size:0.8rem; display:none; margin-top:4px;"></span>
                        </div>
                        
                        <div style="grid-column: span 2; display:flex; gap:10px; margin-top:10px;">
                            <button type="submit" class="btn-urban" id="btnGuardarProveedor">Guardar Proveedor</button>
                            <button type="button" id="btnCancelarProveedor" class="btn-action">Cancelar</button>
                        </div>
                    </form>
                </div>

                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>NIT</th>
                            <th>Empresa</th>
                            <th>Contacto</th>
                            <th>Teléfono / Correo</th>
                            <th>Insumo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="proveedoresTableBody">
                        <tr><td colspan="7" style="text-align:center;">Cargando proveedores...</td></tr>
                    </tbody>
                </table>
            </section>
        `;

        const btnAbrir = document.getElementById('btnAbrirFormProveedor');
        const btnCancelar = document.getElementById('btnCancelarProveedor');
        const wrapper = document.getElementById('wrapperFormProveedor');
        const form = document.getElementById('formRegistrarProveedor');
        const titleEl = document.getElementById('formProveedorTitle');

        if (btnAbrir) {
            btnAbrir.addEventListener('click', () => {
                form.reset();
                document.getElementById('provId').value = '';
                titleEl.textContent = 'Registrar Nuevo Proveedor';
                wrapper.style.display = 'block';
                limpiarTodosLosErrores();
            });
        }

        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                wrapper.style.display = 'none';
                form.reset();
            });
        }

        async function cargarTablasProveedores() {
            const tableBody = document.getElementById('proveedoresTableBody');
            if (!tableBody) return;
            try {
                const proveedores = await ProveedorService.listar();
                let filas = '';
                proveedores.forEach(p => {
                    const statusClass = p.estado === 1 ? 'success' : 'danger';
                    const statusText = p.estado === 1 ? 'ACTIVO' : 'INACTIVO';
                    const toggleText = p.estado === 1 ? 'Desactivar' : 'Activar';

                    filas += `
                        <tr data-json="${encodeURIComponent(JSON.stringify(p))}">
                            <td><strong>${p.nitProveedor}</strong></td>
                            <td>${p.nombreEmpresa}</td>
                            <td>${p.nombreContacto}</td>
                            <td>
                                <div><i class='bx bx-phone'></i> ${p.telefono}</div>
                                <div style="font-size: 0.85rem; color: #a6a6a6;"><i class='bx bx-envelope'></i> ${p.correo}</div>
                            </td>
                            <td><span class="badge info">${p.categoriaInsumo}</span></td>
                            <td><span class="badge ${statusClass}">${statusText}</span></td>
                            <td>
                                <button class="btn-action btn-edit-prov" style="margin-right: 5px;"><i class='bx bx-edit-alt'></i> Editar</button>
                                <button class="btn-action btn-toggle-prov" data-id="${p.idProveedor}" data-estado="${p.estado}">
                                    ${toggleText}
                                </button>
                            </td>
                        </tr>
                    `;
                });

                if (proveedores.length === 0) {
                    filas = `<tr><td colspan="7" style="text-align:center;">No hay proveedores registrados en el sistema.</td></tr>`;
                }

                tableBody.innerHTML = filas;

                document.querySelectorAll('.btn-edit-prov').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const tr = e.target.closest('tr');
                        const data = JSON.parse(decodeURIComponent(tr.getAttribute('data-json')));
                        
                        document.getElementById('provId').value = data.idProveedor;
                        document.getElementById('provNit').value = data.nitProveedor;
                        document.getElementById('provEmpresa').value = data.nombreEmpresa;
                        document.getElementById('provContacto').value = data.nombreContacto;
                        document.getElementById('provTelefono').value = data.telefono;
                        document.getElementById('provCorreo').value = data.correo;
                        document.getElementById('provDireccion').value = data.direccion;
                        document.getElementById('provInsumo').value = data.categoriaInsumo;

                        titleEl.textContent = 'Editar Proveedor';
                        wrapper.style.display = 'block';
                        limpiarTodosLosErrores();
                        wrapper.scrollIntoView({ behavior: 'smooth' });
                    });
                });

                document.querySelectorAll('.btn-toggle-prov').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.target.getAttribute('data-id');
                        const estadoActual = parseInt(e.target.getAttribute('data-estado'));
                        const nuevoEstado = estadoActual === 1 ? 0 : 1;

                        if (estadoActual === 1) {
                            if (!confirm('¿Está seguro de desactivar este proveedor?')) return;
                        }

                        const res = await ProveedorService.cambiarEstado(id, nuevoEstado);
                        if (res.success) {
                            alert('Estado del proveedor actualizado con éxito.');
                            cargarTablasProveedores();
                        } else {
                            alert('Error al cambiar el estado: ' + (res.error || 'Ocurrió un error.'));
                        }
                    });
                });

            } catch (err) {
                console.error("Error al cargar proveedores:", err);
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ff4d4d;">⚠️ Error al cargar proveedores.</td></tr>`;
            }
        }

        function mostrarError(campoId, msg) {
            const span = document.getElementById('error-' + campoId);
            if (span) {
                span.textContent = msg;
                span.style.display = 'block';
            }
        }

        function limpiarError(campoId) {
            const span = document.getElementById('error-' + campoId);
            if (span) {
                span.style.display = 'none';
            }
        }

        function limpiarTodosLosErrores() {
            document.querySelectorAll('.error-text').forEach(span => {
                span.style.display = 'none';
            });
        }

        function validarCampo(input) {
            if (input.type === 'hidden' || input.id === 'provId') {
                return true;
            }
            const id = input.id.replace('prov', '').toLowerCase();
            const val = input.value.trim();

            if (!val) {
                mostrarError(input.name, 'Este campo es obligatorio.');
                return false;
            }

            if (input.type === 'email') {
                const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailReg.test(val)) {
                    mostrarError(input.name, 'Formato de correo inválido.');
                    return false;
                }
            }

            limpiarError(input.name);
            return true;
        }

        form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                validarCampo(input);
            });
            input.addEventListener('change', () => {
                validarCampo(input);
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Enviando formulario de proveedores...");

            // Validación simple
            let formValido = true;
            form.querySelectorAll('input, select').forEach(input => {
                if (input.type !== 'hidden' && input.id !== 'provId') {
                    const val = input.value.trim();
                    if (!val) {
                        mostrarError(input.name, 'Este campo es obligatorio.');
                        formValido = false;
                    } else {
                        limpiarError(input.name);
                    }
                }
            });

            if (!formValido) {
                console.warn("Formulario inválido. Abortando envío.");
                return;
            }

            try {
                const id = document.getElementById('provId').value;
                const payload = {
                    nitProveedor: document.getElementById('provNit').value.trim(),
                    nombreEmpresa: document.getElementById('provEmpresa').value.trim(),
                    nombreContacto: document.getElementById('provContacto').value.trim(),
                    telefono: document.getElementById('provTelefono').value.trim(),
                    correo: document.getElementById('provCorreo').value.trim(),
                    direccion: document.getElementById('provDireccion').value.trim(),
                    categoriaInsumo: document.getElementById('provInsumo').value
                };

                console.log("Payload a enviar:", payload);

                const baseUrl = await getBaseUrl();
                const url = id 
                    ? `${baseUrl}/api/proveedores/${id}`.replace(/([^:]\/)\/+/g, "$1")
                    : `${baseUrl}/api/proveedores`.replace(/([^:]\/)\/+/g, "$1");
                const method = id ? 'PUT' : 'POST';

                console.log(`Realizando petición fetch a URL: ${url} [MÉTODO: ${method}]`);

                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });

                if (!res.ok) {
                    const textError = await res.text();
                    console.error("Error devuelto por el servidor (HTTP Status " + res.status + "):", textError);
                    alert("Error HTTP " + res.status + " del servidor: " + textError);
                    return;
                }

                const json = await res.json();
                console.log("Respuesta del servidor JSON:", json);

                if (json.success) {
                    alert('Proveedor guardado con éxito.');
                    wrapper.style.display = 'none';
                    form.reset();
                    cargarTablasProveedores();
                } else {
                    const errorMsg = json.error || 'Ocurrió un error inesperado al guardar.';
                    console.error('Error lógico en el servidor al guardar proveedor:', errorMsg, json);
                    alert('Error del servidor: ' + errorMsg);
                }
            } catch (error) {
                console.error('Excepción detectada al intentar guardar el proveedor:', error);
                alert('Excepción detectada en JS al intentar guardar el proveedor: ' + error.message);
            }
        });

        cargarTablasProveedores();
    }

    // Cierre de sesión nativo del panel
    if (btnSalir) {
        btnSalir.addEventListener('click', async () => {
            await UsuarioService.logout();
        });
    }
});