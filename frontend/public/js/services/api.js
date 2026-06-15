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
// ─── BASE URL CORREGIDA DINÁMICAMENTE ─────────────────────────────────────────
export async function getBaseUrl() {
    let url = sessionStorage.getItem('detected_base_url');
    if (url) return url;

    const { protocol, hostname, port } = window.location;
    
    // Si estás visualizando desde Tomcat directamente
    if (port !== '5500') {
        const parts = window.location.pathname.split('/').filter(Boolean);
        let ctx = '';
        const idx = parts.indexOf('frontend');
        if (idx > 0) {
            ctx = '/' + parts.slice(0, idx).join('/');
        } else if (parts.length > 0 && parts[0] !== 'frontend') {
            ctx = '/' + parts[0];
        }
        url = `${protocol}//${hostname}:${port}${ctx}`;
        sessionStorage.setItem('detected_base_url', url);
        return url;
    }

    // Si estás visualizando desde Live Server (puerto 5500), probamos los posibles contextos de Tomcat
    const candidates = [
        `${protocol}//${hostname}:8080/ElixirAndFlexx`,
        `${protocol}//${hostname}:8080/Backend_de_los_backend`,
        `${protocol}//${hostname}:8080`
    ];

    for (const cand of candidates) {
        try {
            // Hacemos una consulta rápida y ligera para validar cuál contexto de Tomcat responde
            const res = await fetch(`${cand}/ProductoController?accion=listar`);
            if (res.status !== 404) {
                sessionStorage.setItem('detected_base_url', cand);
                return cand;
            }
        } catch (e) {
            // Si hay error de conexión, ignoramos y seguimos
        }
    }

    // Fallback por defecto si nada responde
    const defaultUrl = `${protocol}//${hostname}:8080/ElixirAndFlexx`;
    return defaultUrl;
}

// ─── HELPERS CORREGIDOS ──────────────────────────────────────────────────────
async function post(servlet, params) {
    const body = new URLSearchParams(params);
    const baseUrl = await getBaseUrl();
    const res = await fetch(`${baseUrl}/${servlet}`, {
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
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/${servlet}${query ? '?' + query : ''}`;
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
     */
    // Así debería verse la lógica de su fetch dentro de api.js para coincidir con su login.js
    async login(email, contraseña) {
        try {
            const response = await fetch('/UsuarioController', {
                method: 'POST',
                body: new URLSearchParams({
                    'accion': 'login',
                    'email': email,
                    'contraseña': contraseña
                })
            });
            const data = await response.json();
            // Si el servlet mandó success:true, retornamos ok:true junto con el rol
            return { ok: data.success, esAdmin: data.esAdmin, error: data.error };
        } catch (error) {
            return { ok: false, error: "Error de conexión con el servidor" };
        }
    },

    /**
     * Registra un nuevo cliente.
     * Devuelve { ok: boolean, error?: string }
     */
    async registrar(datos) {
        try {
            // Enviamos accion: 'registro' y ambas claves de contraseña
            const payload = { 
                accion: 'registro', 
                ...datos,
                contrasena: datos.contraseña
            };

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
