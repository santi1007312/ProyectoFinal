/**
 * api.js — Elixir and Flexx
 * Capa centralizada de servicios: todas las llamadas fetch() al backend Java van aquí.
 * Cada vista importa solo lo que necesita desde este archivo.
 *
 * CORRECCIÓN PRINCIPAL:
 *   UsuarioService.login() ahora lee el JSON que devuelve el servlet
 *   en lugar de esperar res.redirected (que fetch() nunca expone al JS).
 */

// ─── BASE URL CORREGIDA ──────────────────────────────────────────────────────
const BASE_URL = (() => {
    const { protocol, hostname, port } = window.location;
    
    // Si estás visualizando desde Live Server (puerto 5500)
    if (port === '5500') {
        return `${protocol}//${hostname}:8080/Backend_de_los_backend`;
    }
    
    // Si ya estás corriendo el front directamente montado dentro de Tomcat
    const parts = window.location.pathname.split('/').filter(Boolean);
    const ctx = parts.length > 0 ? '/' + parts[0] : '';
    return `${protocol}//${hostname}:${port}${ctx}`;
})();

// ─── HELPERS CORREGIDOS ──────────────────────────────────────────────────────
async function post(servlet, params) {
    const body = new URLSearchParams(params);
    // Ahora dinámicamente le pega a http://localhost:8080/Backend_de_los_backend/NombreDelServlet
    const res = await fetch(`${BASE_URL}/${servlet}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        credentials: 'include',
        redirect: 'follow'
    });
    return res;
}

async function get(servlet, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/${servlet}${query ? '?' + query : ''}`;
    const res = await fetch(url, {
        credentials: 'include'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
export const UsuarioService = {

    /**
     * Inicia sesión.
     * Devuelve { ok: true, esAdmin: bool } o { ok: false, error: string }
     *
     * CORRECCIÓN: el servlet devuelve JSON {"success":true,"esAdmin":false}
     * No hay redirect real, así que leemos el JSON directamente.
     */
    async login(email, contraseña) {
        try {
            // Enviamos "contrasena" — el servlet acepta ambas formas
            const res = await post('../UsuarioController', {
                accion: 'login',
                email,
                contraseña    
            });

            const data = await res.json();

            if (data.success) {
                return { ok: true, esAdmin: data.esAdmin === true };
            }

            return { ok: false, error: data.error || 'Credenciales incorrectas.' };

        } catch (err) {
            console.error('Login error:', err);
            return { ok: false, error: 'No se pudo conectar con el servidor. ¿Tomcat está corriendo?' };
        }
    },

    /**
     * Registra un nuevo cliente.
     * Devuelve { ok: boolean, error?: string }
     */
    async registrar(datos) {
        try {
            // Aseguramos enviar "contrasena" sin ñ al backend
            const payload = { accion: 'crear', ...datos };
            if (payload.contraseña !== undefined) {
                payload.contraseña = payload.contraseña;
                delete payload.contraseña;
            }

            const res = await post('UsuarioController', payload);
            const data = await res.json();

            if (data.success) return { ok: true };
            return { ok: false, error: data.error || 'No se pudo completar el registro.' };

        } catch (err) {
            return { ok: false, error: 'Error de conexión con el servidor.' };
        }
    },

    /**
     * Obtiene los datos del perfil del usuario en sesión.
     */
    async obtenerPerfil() {
        return get('UsuarioController', { accion: 'obtenerPerfil' });
    },

    async listarTodos() {
        return get('UsuarioController', { accion: 'listar' });
    },

    async cambiarEstado(idUsuarios, estado) {
        try {
            const res = await post('UsuarioController', { accion: 'cambiarEstado', idUsuarios, estado });
            const json = await res.json();
            return { ok: json.success === true };
        } catch (err) {
            return { ok: false };
        }
    },

    /**
     * Envía solicitud de recuperación de contraseña.
     * (Función placeholder — implementar lógica de email en backend si se requiere)
     */
    async recuperarContraseña(emailRecuperar) {
        return { ok: false, error: 'Función de recuperación no implementada aún.' };
    },

    /**
     * Cierra sesión del servidor y redirige al login.
     */
    async logout() {
        try {
            await post('UsuarioController', { accion: 'logout' });
        } catch (e) {
            // ignorar errores de red al cerrar sesión
        }
        window.location.href = 'login.html?logout=ok';
    }
};

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────
export const ProductoService = {

    async listar(params = {}) {
        return get('ProductoController', { accion: 'listar', ...params });
    },

    async lanzamientos() {
        return get('ProductoController', { accion: 'lanzamientos' });
    },

    async detalle(id) {
        return get('ProductoController', { accion: 'detalle', id });
    },

    async crear(datos) {
        try {
            const res = await post('ProductoController', { accion: 'crear', ...datos });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje || json.status };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

    async eliminar(id) {
        try {
            const res = await post('ProductoController', { accion: 'eliminar', idProducto: id });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

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

    async listarPorProducto(idProducto) {
        return get('VarianteProductoController', { accion: 'listar', idProducto });
    },

    async crear(datos) {
        try {
            const res = await post('VarianteProductoController', { accion: 'crear', ...datos });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

    async actualizar(datos) {
        try {
            const res = await post('VarianteProductoController', { accion: 'actualizar', ...datos });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

    async eliminar(idVariantes) {
        try {
            const res = await post('VarianteProductoController', { accion: 'eliminar', idVariantes });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    }
};

// ─── CARRITO ──────────────────────────────────────────────────────────────────
export const CarritoService = {

    async agregar(idVariante, cantidad, itemLocal) {
        const carrito = CarritoService.obtenerLocal();
        const existente = carrito.findIndex(i => i.idVariante === idVariante);

        if (existente !== -1) {
            carrito[existente].cantidad += cantidad;
        } else {
            carrito.push({ idVariante, cantidad, ...itemLocal });
        }
        CarritoService.guardarLocal(carrito);

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

    async listarMisPedidos() {
        return get('PedidoController', { accion: 'listarMisPedidos' });
    },

    async listarTodos() {
        return get('PedidoController', { accion: 'listarTodos' });
    },

    async obtenerMetricas() {
        return get('PedidoController', { accion: 'obtenerMetricas' });
    },

    async crear(total, direccionEnvio) {
        try {
            const res = await post('PedidoController', { accion: 'crearPedido', total, direccionEnvio });
            const json = await res.json();
            return { ok: json.status === 'success', idPedido: json.idPedido, mensaje: json.mensaje };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

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

    async listar() {
        return get('CategoriaController', { accion: 'listar' });
    }
};
