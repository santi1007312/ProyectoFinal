/**
 * admin.js — Elixir and Flexx
 * Panel de Administración Completo (Dashboard, Productos, Ventas, Usuarios, Cupones).
 */
import { UsuarioService, ProductoService, PedidoService, CategoriaService, SoporteService, VarianteService, ProveedorService, getBaseUrl, OrdenCompraService } from '../services/api.js';

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

            const stockS = getStockPorTalla(p.variantes, 'S');
            const stockM = getStockPorTalla(p.variantes, 'M');
            const stockL = getStockPorTalla(p.variantes, 'L');
            const stockXL = getStockPorTalla(p.variantes, 'XL');
            const totalStock = stockS + stockM + stockL + stockXL;

            // Formatear desglose con colores para stock agotado
            const formatStock = (talla, cant) => {
                if (cant === 0) return `<span class="stock-out-badge">${talla}: 0</span>`;
                return `${talla}: ${cant}`;
            };

            const desgloseHtml = `${formatStock('S', stockS)} | ${formatStock('M', stockM)} | ${formatStock('L', stockL)} | ${formatStock('XL', stockXL)}`;

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
            <div class="action-bar">
                <button id="btnAbrirFormProducto" class="btn-urban">＋ Agregar Nueva Prenda</button>
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
                        <select name="categoria">
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
                        <div class="size-stock-container">
                            <div class="size-stock-item">
                                <label>Talla S</label>
                                <input type="number" name="stock_S" min="0" value="0">
                                <span class="error-msg"></span>
                            </div>
                            <div class="size-stock-item">
                                <label>Talla M</label>
                                <input type="number" name="stock_M" min="0" value="0">
                                <span class="error-msg"></span>
                            </div>
                            <div class="size-stock-item">
                                <label>Talla L</label>
                                <input type="number" name="stock_L" min="0" value="0">
                                <span class="error-msg"></span>
                            </div>
                            <div class="size-stock-item">
                                <label>Talla XL</label>
                                <input type="number" name="stock_XL" min="0" value="0">
                                <span class="error-msg"></span>
                            </div>
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

            <table class="admin-table">
                <thead>
                    <tr><th>ID</th><th>Prenda</th><th>Categoría</th><th>Precio</th><th>Stock Total</th><th>Acciones</th></tr>
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
            ['nombre', 'precio', 'descripcion', 'imagen', 'stock_S', 'stock_M', 'stock_L', 'stock_XL'].forEach(name => limpiarError(name));
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

        ['stock_S', 'stock_M', 'stock_L', 'stock_XL'].forEach(name => {
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
                form.querySelector('[name="stock_S"]').value = 0;
                form.querySelector('[name="stock_M"]').value = 0;
                form.querySelector('[name="stock_L"]').value = 0;
                form.querySelector('[name="stock_XL"]').value = 0;
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

                const stockS = getStockPorTalla(p.variantes, 'S');
                const stockM = getStockPorTalla(p.variantes, 'M');
                const stockL = getStockPorTalla(p.variantes, 'L');
                const stockXL = getStockPorTalla(p.variantes, 'XL');

                form.querySelector('[name="stock_S"]').value = stockS;
                form.querySelector('[name="stock_M"]').value = stockM;
                form.querySelector('[name="stock_L"]').value = stockL;
                form.querySelector('[name="stock_XL"]').value = stockXL;
                
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
            ['stock_S', 'stock_M', 'stock_L', 'stock_XL'].forEach(stockField => {
                const val = parseInt(form.querySelector(`[name="${stockField}"]`).value);
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
            
            // Adjuntar stocks
            formData.append('stock_S', stockS);
            formData.append('stock_M', stockM);
            formData.append('stock_L', stockL);
            formData.append('stock_XL', stockXL);
            
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
            <div class="admin-tabs" style="display: flex; gap: 15px; margin-bottom: 25px; border-bottom: 1px solid #29292e; padding-bottom: 10px;">
                <button class="tab-btn-prov active" data-tab-prov="listado" style="background: transparent; border: none; color: #fff; padding: 10px 20px; font-weight: bold; cursor: pointer; border-bottom: 3px solid #04d361;">Directorio de Proveedores</button>
                <button class="tab-btn-prov" data-tab-prov="realizar-pedido" style="background: transparent; border: none; color: #a8a8b3; padding: 10px 20px; font-weight: bold; cursor: pointer;">Realizar Pedido de Mercancía</button>
                <button class="tab-btn-prov" data-tab-prov="historial" style="background: transparent; border: none; color: #a8a8b3; padding: 10px 20px; font-weight: bold; cursor: pointer;">Historial de Pedidos</button>
            </div>

            <!-- Sub-tab 1: Directorio -->
            <div id="subContentListado" class="sub-tab-content" style="display: block;">
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
            </div>

            <!-- Sub-tab 2: Realizar Pedido -->
            <div id="subContentRealizarPedido" class="sub-tab-content" style="display: none;">
                <div class="admin-panel-card">
                    <h3>Realizar Pedido de Mercancía a Proveedor</h3>
                    <form id="formRealizarPedido" class="admin-grid-form" style="margin-top: 15px;">
                        <div class="input-group">
                            <label>Proveedor</label>
                            <select name="idProveedor" id="pedidoProveedor" style="padding: 10px; border-radius: 4px; background: #1f1f23; color: #fff; border: 1px solid #29292e;" required>
                                <option value="">-- Seleccione Proveedor --</option>
                            </select>
                        </div>
                        
                        <div class="input-group">
                            <label>Producto a Abastecer</label>
                            <select id="pedidoProducto" style="padding: 10px; border-radius: 4px; background: #1f1f23; color: #fff; border: 1px solid #29292e;" required>
                                <option value="">-- Seleccione Producto --</option>
                            </select>
                        </div>

                        <div class="input-group" id="costoUnitarioGroup" style="display: none;">
                            <label>Costo Unitario por Prenda ($COP)</label>
                            <input type="number" id="pedidoCosto" min="0" placeholder="Ej: 25000" style="padding: 10px; border-radius: 4px; background: #1f1f23; color: #fff; border: 1px solid #29292e;">
                        </div>

                        <div class="input-group" id="pedidoVariantesContainer" style="grid-column: span 2; display: none;">
                            <label style="font-weight: bold; margin-bottom: 10px; display: block; color: #04d361;">Cantidades por Talla/Color</label>
                            <div id="variantesStockInputs" class="size-stock-container" style="display: flex; gap: 15px; flex-wrap: wrap;">
                                <!-- JS inyectará los inputs aquí -->
                            </div>
                        </div>

                        <div style="grid-column: span 2; display: flex; gap: 10px; margin-top: 15px;">
                            <button type="submit" class="btn-urban" id="btnEnviarPedido" style="background: #04d361; color: #fff; border: none;">Enviar Pedido</button>
                            <button type="button" class="btn-action" id="btnResetPedido">Limpiar Formulario</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Sub-tab 3: Historial de Pedidos -->
            <div id="subContentHistorial" class="sub-tab-content" style="display: none;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID Pedido</th>
                            <th>Proveedor</th>
                            <th>Fecha</th>
                            <th>Total ($COP)</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="historialPedidosTableBody">
                        <tr><td colspan="6" style="text-align:center;">Cargando historial de pedidos...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        // ── VARIABLES PARA PROVEEDORES ──
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

                const baseUrl = await getBaseUrl();
                const url = id 
                    ? `${baseUrl}/api/proveedores/${id}`.replace(/([^:]\/)\/+/g, "$1")
                    : `${baseUrl}/api/proveedores`.replace(/([^:]\/)\/+/g, "$1");
                const method = id ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });

                if (!res.ok) {
                    const textError = await res.text();
                    alert("Error HTTP " + res.status + " del servidor: " + textError);
                    return;
                }

                const json = await res.json();
                if (json.success) {
                    alert('Proveedor guardado con éxito.');
                    wrapper.style.display = 'none';
                    form.reset();
                    cargarTablasProveedores();
                } else {
                    alert('Error del servidor: ' + (json.error || 'Ocurrió un error inesperado al guardar.'));
                }
            } catch (error) {
                console.error(error);
                alert('Excepción detectada en JS al intentar guardar el proveedor: ' + error.message);
            }
        });

        // ── CONTROL DE SUB-PESTAÑAS DE PROVEEDORES ──
        function cambiarSubPestanaProv(pestana) {
            document.querySelectorAll('.tab-btn-prov').forEach(btn => {
                btn.classList.remove('active');
                btn.style.color = '#a8a8b3';
                btn.style.borderBottom = 'none';
                
                if (btn.getAttribute('data-tab-prov') === pestana) {
                    btn.classList.add('active');
                    btn.style.color = '#fff';
                    btn.style.borderBottom = '3px solid #04d361';
                }
            });

            document.querySelectorAll('.sub-tab-content').forEach(div => {
                div.style.display = 'none';
            });

            if (pestana === 'listado') {
                document.getElementById('subContentListado').style.display = 'block';
                cargarTablasProveedores();
            } else if (pestana === 'realizar-pedido') {
                document.getElementById('subContentRealizarPedido').style.display = 'block';
                cargarSelectsPedido();
            } else if (pestana === 'historial') {
                document.getElementById('subContentHistorial').style.display = 'block';
                cargarHistorialPedidos();
            }
        }

        document.querySelectorAll('.tab-btn-prov').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab-prov');
                cambiarSubPestanaProv(tab);
            });
        });

        // ── FORMULARIO Y LÓGICA DE PEDIDOS DE MERCANCÍA ──
        async function cargarSelectsPedido() {
            const selectProv = document.getElementById('pedidoProveedor');
            const selectProd = document.getElementById('pedidoProducto');
            if (!selectProv || !selectProd) return;

            selectProv.innerHTML = '<option value="">Cargando proveedores...</option>';
            selectProd.innerHTML = '<option value="">Cargando productos...</option>';

            try {
                const [proveedores, productos] = await Promise.all([
                    ProveedorService.listar().catch(() => []),
                    ProductoService.listar().catch(() => [])
                ]);

                // Poblar proveedores activos
                selectProv.innerHTML = '<option value="">-- Seleccione Proveedor --</option>' +
                    proveedores.filter(p => p.estado === 1).map(p => `<option value="${p.idProveedor}">${p.nombreEmpresa}</option>`).join('');

                // Poblar productos
                selectProd.innerHTML = '<option value="">-- Seleccione Producto --</option>' +
                    productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');

            } catch (err) {
                console.error("Error al cargar selectores de pedido:", err);
                selectProv.innerHTML = '<option value="">Error al cargar</option>';
                selectProd.innerHTML = '<option value="">Error al cargar</option>';
            }
        }

        const selectProd = document.getElementById('pedidoProducto');
        if (selectProd) {
            selectProd.addEventListener('change', async (e) => {
                const idProducto = e.target.value;
                const container = document.getElementById('pedidoVariantesContainer');
                const inputsDiv = document.getElementById('variantesStockInputs');
                const costGroup = document.getElementById('costoUnitarioGroup');
                
                if (!idProducto) {
                    container.style.display = 'none';
                    costGroup.style.display = 'none';
                    return;
                }
                
                inputsDiv.innerHTML = '<div class="loader">Cargando variantes de tallas...</div>';
                container.style.display = 'block';
                costGroup.style.display = 'block';
                
                try {
                    const variants = await VarianteService.listarPorProducto(idProducto).catch(() => []);
                    const tallasInteres = ['S', 'M', 'L', 'XL'];
                    const filtered = variants.filter(v => tallasInteres.includes(v.talla));
                    
                    if (filtered.length === 0) {
                        inputsDiv.innerHTML = '<div style="color: #ff4d4d; padding: 10px;">Este producto no tiene variantes registradas de tallas S, M, L o XL.</div>';
                    } else {
                        inputsDiv.innerHTML = filtered.map(v => `
                            <div class="size-stock-item" style="flex: 1; min-width: 140px; margin-bottom: 10px;">
                                <label style="font-weight: 500; font-size: 0.85rem; display:block; margin-bottom: 5px;">Talla ${v.talla} (${v.color})</label>
                                <input type="number" class="cant-talla-input" name="cant_${v.idVariantes}" data-id-variante="${v.idVariantes}" min="0" value="0" style="padding: 10px; border-radius: 4px; background: #19191c; color: #fff; border: 1px solid #29292e; width: 100%;">
                            </div>
                        `).join('');
                    }
                } catch (err) {
                    console.error(err);
                    inputsDiv.innerHTML = '<div style="color: #ff4d4d;">Error al cargar variantes.</div>';
                }
            });
        }

        const formPedido = document.getElementById('formRealizarPedido');
        if (formPedido) {
            formPedido.addEventListener('submit', async (e) => {
                e.preventDefault();
                const idProveedor = document.getElementById('pedidoProveedor').value;
                const costoUnitario = parseFloat(document.getElementById('pedidoCosto').value) || 0;
                
                if (!idProveedor) {
                    alert('Por favor seleccione un proveedor.');
                    return;
                }
                if (costoUnitario <= 0) {
                    alert('Por favor ingrese un costo unitario válido (mayor a 0).');
                    return;
                }
                
                const inputs = formPedido.querySelectorAll('.cant-talla-input');
                const items = [];
                let totalCantidad = 0;
                
                inputs.forEach(input => {
                    const idVar = parseInt(input.getAttribute('data-id-variante'));
                    const cant = parseInt(input.value) || 0;
                    if (cant > 0) {
                        items.push({ idVariantes: idVar, cantidad: cant, costoUnitario: costoUnitario });
                        totalCantidad += cant;
                    }
                });
                
                if (items.length === 0 || totalCantidad === 0) {
                    alert('Debe pedir al menos 1 prenda en alguna talla.');
                    return;
                }
                
                const itemsStr = items.map(item => `${item.idVariantes}:${item.cantidad}:${item.costoUnitario}`).join('|');
                const subtotal = totalCantidad * costoUnitario;
                
                const payload = {
                    idProveedor: idProveedor,
                    subtotal: subtotal,
                    items: itemsStr
                };
                
                try {
                    const result = await OrdenCompraService.crear(payload);
                    if (result.success) {
                        alert('🎉 Pedido de mercancía enviado correctamente al proveedor en estado Pendiente.');
                        formPedido.reset();
                        document.getElementById('pedidoVariantesContainer').style.display = 'none';
                        document.getElementById('costoUnitarioGroup').style.display = 'none';
                        cambiarSubPestanaProv('historial');
                    } else {
                        alert('Error al enviar el pedido: ' + (result.error || 'Ocurrió un error.'));
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error de conexión al enviar el pedido.');
                }
            });

            const btnReset = document.getElementById('btnResetPedido');
            if (btnReset) {
                btnReset.addEventListener('click', () => {
                    formPedido.reset();
                    document.getElementById('pedidoVariantesContainer').style.display = 'none';
                    document.getElementById('costoUnitarioGroup').style.display = 'none';
                });
            }
        }

        // ── LOGICA DE RECEPCION Y HISTORIAL DE PEDIDOS ──
        async function cargarHistorialPedidos() {
            const tableBody = document.getElementById('historialPedidosTableBody');
            if (!tableBody) return;
            
            try {
                const ordenes = await OrdenCompraService.listar();
                let filas = '';
                
                ordenes.forEach(o => {
                    const totalFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(o.subtotal);
                    const dateStr = o.fechaPedido ? new Date(o.fechaPedido).toLocaleDateString('es-CO') + ' ' + new Date(o.fechaPedido).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'Reciente';
                    
                    let badgeClass = 'badge info'; // Pendiente
                    if (o.estadoOrden === 'Recibido') badgeClass = 'badge success';
                    
                    let accionBtn = '';
                    if (o.estadoOrden === 'Pendiente') {
                        accionBtn = `<button class="btn-action btn-recibir-pedido" data-id="${o.idOrdenCompra}" style="background: #04d361; color: #fff; border:none;"><i class='bx bx-check-double'></i> Marcar como Recibido</button>`;
                    } else {
                        accionBtn = `<span style="font-size:0.85rem; color:#888;">Entregado & Stock Sumado</span>`;
                    }
                    
                    filas += `
                        <tr>
                            <td><strong>OC-${o.idOrdenCompra}</strong></td>
                            <td>${o.nombreProveedor}</td>
                            <td>${dateStr}</td>
                            <td>${totalFormatted}</td>
                            <td><span class="${badgeClass}">${o.estadoOrden.toUpperCase()}</span></td>
                            <td>${accionBtn}</td>
                        </tr>
                    `;
                });
                
                if (ordenes.length === 0) {
                    filas = `<tr><td colspan="6" style="text-align:center;">No hay pedidos de mercancía registrados.</td></tr>`;
                }
                
                tableBody.innerHTML = filas;
                
                document.querySelectorAll('.btn-recibir-pedido').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = btn.getAttribute('data-id');
                        if (confirm(`¿Confirma que ha recibido la mercancía de la orden OC-${id}? Esto sumará automáticamente las unidades al stock y registrará el ingreso en el Kárdex.`)) {
                            btn.disabled = true;
                            btn.textContent = 'Procesando...';
                            
                            try {
                                const result = await OrdenCompraService.marcarRecibido(id);
                                if (result.success) {
                                    alert('🎉 Inventario actualizado con éxito. El estado de la orden es ahora Recibido.');
                                    cargarHistorialPedidos();
                                } else {
                                    alert('Error al marcar como recibido: ' + (result.error || 'Ocurrió un error.'));
                                    btn.disabled = false;
                                    btn.textContent = 'Marcar como Recibido';
                                }
                            } catch (err) {
                                console.error(err);
                                alert('Error de conexión.');
                                btn.disabled = false;
                                btn.textContent = 'Marcar como Recibido';
                            }
                        }
                    });
                });
                
            } catch (err) {
                console.error(err);
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ff4d4d;">⚠️ Error al cargar el historial.</td></tr>`;
            }
        }

        // Cargar directorio de proveedores por defecto
        cargarTablasProveedores();
    }

    // Cierre de sesión nativo del panel
    if (btnSalir) {
        btnSalir.addEventListener('click', async () => {
            await UsuarioService.logout();
        });
    }
});