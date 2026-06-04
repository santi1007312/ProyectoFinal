/**
 * admin.js — Elixir and Flexx
 * Panel de administración: CRUD completo de productos conectado al backend Java.
 * Operaciones: Crear, Listar, Editar (inline) y Eliminar productos.
 */
import { ProductoService, CategoriaService } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {

    // ── ELEMENTOS DEL DOM ─────────────────────────────────────────────────────
    const formCrear       = document.getElementById('formCrearProducto');
    const tablaProductos  = document.getElementById('tablaProductos');
    const tbodyProductos  = document.getElementById('tbodyProductos');
    const selectCategoria = document.getElementById('idCategorias');
    const btnRefrescar    = document.getElementById('btnRefrescarProductos');
    const totalCount      = document.getElementById('totalProductos');
    const feedbackEl      = document.getElementById('adminFeedback');

    // Modal de edición
    const modalEditar     = document.getElementById('modalEditarProducto');
    const formEditar      = document.getElementById('formEditarProducto');
    const btnCerrarModal  = document.getElementById('btnCerrarModalEditar');

    let productosCache = [];

    // ── INICIALIZACIÓN ────────────────────────────────────────────────────────
    cargarCategorias();
    cargarProductos();

    // ── CARGAR CATEGORÍAS EN EL SELECT ────────────────────────────────────────
    async function cargarCategorias() {
        if (!selectCategoria) return;
        try {
            const categorias = await CategoriaService.listar();
            categorias.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.idCategorias;
                opt.textContent = cat.nombreCategoria;
                selectCategoria.appendChild(opt);
            });
        } catch {
            // Fallback con categorías fijas si CategoriaController no existe aún
            const fallback = [
                { id: 1, nombre: 'Hoodies' },
                { id: 2, nombre: 'Cargo Pants' },
                { id: 3, nombre: 'Sudaderas' },
                { id: 4, nombre: 'Camisetas' },
                { id: 5, nombre: 'Pantalonetas' }
            ];
            fallback.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.nombre;
                selectCategoria.appendChild(opt);
            });
        }
    }

    // ── LISTAR PRODUCTOS ──────────────────────────────────────────────────────
    async function cargarProductos() {
        if (!tbodyProductos) return;

        tbodyProductos.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Cargando productos...</td></tr>';

        try {
            const productos = await ProductoService.listar();
            productosCache = productos;
            renderizarTabla(productos);
        } catch (err) {
            tbodyProductos.innerHTML = '<tr><td colspan="6" style="color:#c0392b;padding:20px;">Error al cargar productos. Verifique que el servidor Tomcat esté corriendo.</td></tr>';
            console.error(err);
        }
    }

    function renderizarTabla(lista) {
        if (!tbodyProductos) return;
        tbodyProductos.innerHTML = '';

        if (totalCount) totalCount.textContent = lista.length;

        if (lista.length === 0) {
            tbodyProductos.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">No hay productos registrados aún.</td></tr>';
            return;
        }

        lista.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${prod.id}</td>
                <td>${prod.nombre}</td>
                <td>$${Number(prod.precioBase).toLocaleString('es-CO')} COP</td>
                <td>${prod.descuento > 0 ? prod.descuento + '%' : '—'}</td>
                <td>
                    <span class="estado-badge ${prod.esNuevo ? 'badge--nuevo' : ''}">
                        ${prod.esNuevo ? 'NUEVO' : 'REGULAR'}
                    </span>
                </td>
                <td class="acciones-td">
                    <button class="btn-accion btn-editar" data-id="${prod.id}" type="button">✏️ Editar</button>
                    <button class="btn-accion btn-eliminar" data-id="${prod.id}" data-nombre="${prod.nombre}" type="button">🗑️ Eliminar</button>
                </td>
            `;
            tbodyProductos.appendChild(tr);
        });

        // Escuchar clics en los botones de la tabla
        tbodyProductos.addEventListener('click', manejarAccionesTabla, { once: false });
    }

    function manejarAccionesTabla(e) {
        const idStr = e.target.getAttribute('data-id');
        if (!idStr) return;
        const id = parseInt(idStr);

        if (e.target.classList.contains('btn-editar')) {
            const prod = productosCache.find(p => p.id === id);
            if (prod) abrirModalEditar(prod);

        } else if (e.target.classList.contains('btn-eliminar')) {
            const nombre = e.target.getAttribute('data-nombre');
            if (confirm(`⚠️ ¿Eliminar el producto "${nombre}"?\nEsta acción lo desactivará del catálogo.`)) {
                eliminarProducto(id);
            }
        }
    }

    // ── CREAR PRODUCTO ────────────────────────────────────────────────────────
    if (formCrear) {
        formCrear.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datos = {
                nombreProducto: formCrear.querySelector('[id="nombreProducto"]')?.value.trim(),
                descripcion:    formCrear.querySelector('[id="descripcion"]')?.value.trim(),
                precioBase:     formCrear.querySelector('[id="precioBase"]')?.value.trim(),
                idCategorias:   formCrear.querySelector('[id="idCategorias"]')?.value,
                material:       formCrear.querySelector('[id="material"]')?.value.trim() || ''
            };

            if (!datos.nombreProducto || !datos.precioBase || !datos.idCategorias) {
                mostrarFeedback('⚠️ Complete nombre, precio y categoría.', 'warning');
                return;
            }

            const btnSubmit = formCrear.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Guardando...';

            const resultado = await ProductoService.crear(datos);

            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Registrar Producto';

            if (resultado.ok) {
                mostrarFeedback('✅ ¡Producto registrado correctamente en la BD!', 'success');
                formCrear.reset();
                cargarProductos(); // Refrescar tabla
            } else {
                mostrarFeedback('❌ ' + resultado.mensaje, 'error');
            }
        });
    }

    // ── ELIMINAR PRODUCTO ─────────────────────────────────────────────────────
    async function eliminarProducto(id) {
        const resultado = await ProductoService.eliminar(id);
        if (resultado.ok) {
            mostrarFeedback('✅ Producto eliminado del catálogo.', 'success');
            cargarProductos();
        } else {
            mostrarFeedback('❌ ' + resultado.mensaje, 'error');
        }
    }

    // ── MODAL DE EDICIÓN ──────────────────────────────────────────────────────
    function abrirModalEditar(prod) {
        if (!modalEditar || !formEditar) return;

        formEditar.querySelector('[name="idProducto"]').value        = prod.id;
        formEditar.querySelector('[name="nombreProducto"]').value    = prod.nombre;
        formEditar.querySelector('[name="descripcion"]').value       = prod.descripcion || '';
        formEditar.querySelector('[name="precioBase"]').value        = prod.precioBase;
        formEditar.querySelector('[name="porcentajeDescuento"]').value = prod.descuento || 0;
        formEditar.querySelector('[name="idCategorias"]').value      = prod.categoria;

        modalEditar.style.display = 'flex';
    }

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', () => {
            if (modalEditar) modalEditar.style.display = 'none';
        });
    }

    if (modalEditar) {
        modalEditar.addEventListener('click', (e) => {
            if (e.target === modalEditar) modalEditar.style.display = 'none';
        });
    }

    if (formEditar) {
        formEditar.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datos = {
                idProducto:          formEditar.querySelector('[name="idProducto"]').value,
                nombreProducto:      formEditar.querySelector('[name="nombreProducto"]').value.trim(),
                descripcion:         formEditar.querySelector('[name="descripcion"]').value.trim(),
                precioBase:          formEditar.querySelector('[name="precioBase"]').value,
                porcentajeDescuento: formEditar.querySelector('[name="porcentajeDescuento"]').value,
                idCategorias:        formEditar.querySelector('[name="idCategorias"]').value
            };

            const btnGuardar = formEditar.querySelector('button[type="submit"]');
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';

            const resultado = await ProductoService.actualizar(datos);

            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar Cambios';

            if (resultado.ok) {
                if (modalEditar) modalEditar.style.display = 'none';
                mostrarFeedback('✅ Producto actualizado correctamente.', 'success');
                cargarProductos();
            } else {
                mostrarFeedback('❌ ' + resultado.mensaje, 'error');
            }
        });
    }

    // ── BOTÓN REFRESCAR ───────────────────────────────────────────────────────
    if (btnRefrescar) {
        btnRefrescar.addEventListener('click', cargarProductos);
    }

    // ── FEEDBACK VISUAL ───────────────────────────────────────────────────────
    function mostrarFeedback(texto, tipo) {
        if (!feedbackEl) { alert(texto); return; }
        feedbackEl.textContent = texto;
        feedbackEl.className = `admin-feedback admin-feedback--${tipo}`;
        feedbackEl.style.display = 'block';
        setTimeout(() => { feedbackEl.style.display = 'none'; }, 4000);
    }
});