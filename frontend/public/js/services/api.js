/**
 * api.js — Elixir and Flexx
 * Capa centralizada de servicios: todas las llamadas fetch() al backend Java van aquí.
 * Cada vista importa solo lo que necesita desde este archivo.
 */

// ─── BASE URL ────────────────────────────────────────────────────────────────
// Calcula la raíz del proyecto automáticamente desde cualquier vista en /views/
const BASE = (() => {
    const path = window.location.pathname;
    // Si estamos en /views/algoPagina.html, subimos un nivel
    if (path.includes('/views/')) {
        return '../';
    }
    return '';
})();

// ─── HELPER GENÉRICO ─────────────────────────────────────────────────────────
async function post(servlet, params) {
    const body = new URLSearchParams(params);
    const res = await fetch(`${BASE}${servlet}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });
    return res;
}

async function get(servlet, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE}${servlet}${query ? '?' + query : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
export const UsuarioService = {

    /**
     * Inicia sesión. Devuelve { ok: true, esAdmin: bool } o { ok: false, error: string }
     */
    async login(email, contrasena) {
        try {
            const res = await post('UsuarioController', { accion: 'login', email, contrasena });
            if (res.redirected) {
                const url = res.url;
                const esAdmin = url.includes('interfazAdmin');
                return { ok: true, esAdmin, url };
            }
            return { ok: false, error: 'Credenciales incorrectas o error en el servidor.' };
        } catch {
            return { ok: false, error: 'No se pudo conectar con el servidor.' };
        }
    },

    /**
     * Registra un nuevo cliente.
     */
    async registrar(datos) {
        try {
            const res = await post('UsuarioController', { accion: 'registrar', ...datos });
            if (res.redirected && res.url.includes('login')) {
                return { ok: true };
            }
            return { ok: false, error: 'No se pudo completar el registro.' };
        } catch {
            return { ok: false, error: 'Error de conexión con el servidor.' };
        }
    },

    /**
     * Obtiene los datos del perfil del usuario en sesión.
     */
    async obtenerPerfil() {
        return get('UsuarioController', { accion: 'obtenerPerfil' });
    },

    /**
     * Envía solicitud de recuperación de contraseña.
     */
    async recuperarContrasena(emailRecuperar) {
        try {
            const res = await post('UsuarioController', { accion: 'recuperar', emailRecuperar });
            if (res.redirected && res.url.includes('recuperacion=enviado')) {
                return { ok: true };
            }
            return { ok: false, error: 'Correo no encontrado en el sistema.' };
        } catch {
            return { ok: false, error: 'Error de conexión.' };
        }
    },

    /**
     * Cierra sesión.
     */
    async logout() {
        try {
            await post('UsuarioController', { accion: 'logout' });
            window.location.href = `${BASE}frontend/views/login.html`;
        } catch {
            window.location.href = `${BASE}frontend/views/login.html`;
        }
    }
};

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────
export const ProductoService = {

    /**
     * Lista todos los productos activos del catálogo.
     * @returns {Promise<Array>}
     */
    async listar() {
        return get('ProductoController', { accion: 'listar' });
    },

    /**
     * Trae los últimos 3 lanzamientos para el home.
     * @returns {Promise<Array>}
     */
    async lanzamientos() {
        return get('ProductoController', { accion: 'lanzamientos' });
    },

    /**
     * Obtiene el detalle de un producto por su ID.
     * @param {number} id
     * @returns {Promise<Object>}
     */
    async detalle(id) {
        return get('ProductoController', { accion: 'detalle', id });
    },

    /**
     * Crea un producto nuevo (admin).
     * @param {Object} datos - nombreProducto, descripcion, precioBase, idCategorias, material
     * @returns {Promise<{ok: boolean, mensaje: string}>}
     */
    async crear(datos) {
        try {
            const res = await post('ProductoController', { accion: 'crear', ...datos });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje || json.status };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

    /**
     * Elimina (desactiva) un producto por ID (admin).
     * @param {number} id
     */
    async eliminar(id) {
        try {
            const res = await post('ProductoController', { accion: 'eliminar', idProducto: id });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

    /**
     * Actualiza los datos de un producto (admin).
     * @param {Object} datos - idProducto + campos a actualizar
     */
    async actualizar(datos) {
        try {
            const res = await post('ProductoController', { accion: 'actualizar', ...datos });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    }
};

// ─── VARIANTES ────────────────────────────────────────────────────────────────
export const VarianteService = {

    /**
     * Lista las variantes (talla/color/stock) de un producto.
     * @param {number} idProducto
     */
    async listarPorProducto(idProducto) {
        return get('VarianteProductoController', { accion: 'listar', idProducto });
    },

    /**
     * Crea una variante nueva para un producto (admin).
     */
    async crear(datos) {
        try {
            const res = await post('VarianteProductoController', { accion: 'crear', ...datos });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    }
};

// ─── CARRITO ──────────────────────────────────────────────────────────────────
export const CarritoService = {

    /**
     * Agrega un ítem al carrito (backend + localStorage).
     */
    async agregar(idVariante, cantidad, itemLocal) {
        // 1. Persistimos en localStorage para respuesta inmediata en UI
        const carrito = CarritoService.obtenerLocal();
        const existente = carrito.findIndex(i =>
            i.idVariante === idVariante
        );
        if (existente !== -1) {
            carrito[existente].cantidad += cantidad;
        } else {
            carrito.push({ idVariante, cantidad, ...itemLocal });
        }
        CarritoService.guardarLocal(carrito);

        // 2. Sincronizamos con el backend (sesión del servidor)
        try {
            await post('CarritoController', { accion: 'agregar', idVariante, cantidad });
        } catch {
            console.warn('No se pudo sincronizar el carrito con el servidor.');
        }

        return carrito;
    },

    obtenerLocal() {
        return JSON.parse(localStorage.getItem('elixir_cart')) || [];
    },

    guardarLocal(carrito) {
        localStorage.setItem('elixir_cart', JSON.stringify(carrito));
    },

    limpiarLocal() {
        localStorage.removeItem('elixir_cart');
    }
};

// ─── PEDIDOS ──────────────────────────────────────────────────────────────────
export const PedidoService = {

    /**
     * Lista los pedidos del usuario en sesión.
     */
    async listarMisPedidos() {
        return get('PedidoController', { accion: 'listarMisPedidos' });
    },

    /**
     * Crea un pedido nuevo a partir del carrito.
     * @param {number} total
     * @param {string} direccionEnvio
     */
    async crear(total, direccionEnvio) {
        try {
            const res = await post('PedidoController', { accion: 'crearPedido', total, direccionEnvio });
            const json = await res.json();
            return { ok: json.status === 'success', idPedido: json.idPedido, mensaje: json.mensaje };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

    /**
     * Actualiza el estado de un pedido (admin).
     * @param {number} idPedido
     * @param {string} estado - 'pendiente' | 'enviado' | 'entregado' | 'cancelado'
     */
    async actualizarEstado(idPedido, estado) {
        try {
            const res = await post('PedidoController', { accion: 'actualizarEstado', idPedido, estado });
            const json = await res.json();
            return { ok: json.status === 'success' };
        } catch {
            return { ok: false };
        }
    }
};

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────
export const CategoriaService = {

    /**
     * Lista todas las categorías activas.
     */
    async listar() {
        return get('CategoriaController', { accion: 'listar' });
    }
};
