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

    // SI ESTÁS EN TOMCAT
    if (port !== '5500') {
        // window.location.pathname suele ser: "/NombreProyecto/frontend/views/login.html"
        // Al separar por '/' el primer elemento válido [1] es el Context Path (tu proyecto)
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        
        let ctx = '';
        // Si el primer segmento NO es frontend, significa que es el nombre de tu proyecto en Tomcat
        if (pathSegments.length > 0 && pathSegments[0] !== 'frontend') {
            ctx = '/' + pathSegments[0];
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
            const res = await fetch(`${cand}/ProductoController?accion=listar`, { method: 'GET'}) ;       
            if (res.status !== 404) {
                const cleanCand = cand.replace(/\/$/, "")
                sessionStorage.setItem('detected_base_url', cleanCand);
                return cleanCand;
            }
        } catch (e) {
            // Si hay error de conexión, ignoramos y seguimos
        }
    }

    // Fallback por defecto si nada responde
    const defaultUrl = `${protocol}//${hostname}:8080/Backend_de_los_backend`;
    return defaultUrl;
}

// ─── HELPERS CORREGIDOS ──────────────────────────────────────────────────────
async function post(servlet, params) {
    const body = new URLSearchParams(params);
    const baseUrl = await getBaseUrl();
    
    // Quitamos posibles barras repetidas en la URL
    const url = `${baseUrl}/${servlet}`.replace(/([^:]\/)\/+/g, "$1");
    
    const res = await fetch(url, {
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
    
    // Estructuración limpia de la URL de consulta
    const urlBaseCompleta = `${baseUrl}/${servlet}`.replace(/([^:]\/)\/+/g, "$1");
    const urlFinal = `${urlBaseCompleta}${query ? '?' + query : ''}`;
    
    const res = await fetch(urlFinal, {
        method: 'GET',
        credentials: 'include'
    });
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return res.json();
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
export const UsuarioService = {

    /**
     * Inicia sesión.
     * Devuelve { ok: true, esAdmin: bool } o { ok: false, error: string }
     */
    /**
     * Inicia sesión de manera segura controlando respuestas de error (401, 500, etc.)
     */
    async login(email, password) {
        try {
            const baseUrl = await getBaseUrl(); 
            const response = await fetch(`${baseUrl}/UsuarioController`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    'accion': 'login',
                    'email': email.trim(),
                    'password': password
                })
            });
            
            // Si el servidor responde con error (401, 400, etc.) manejamos los datos adecuadamente
            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    return { ok: false, esAdmin: false, error: errorData.error || "Credenciales incorrectas" };
                } catch (e) {
                    // Si el JSON viene vacío o dañado por el error HTTP
                    if (response.status === 401) {
                        return { ok: false, esAdmin: false, error: "Correo o contraseña incorrectos." };
                    }
                    return { ok: false, esAdmin: false, error: `Error en el servidor (Código: ${response.status})` };
                }
            }
            
            // Si la respuesta fue exitosa (status 200)
            const data = await response.json();
            return { ok: data.success, esAdmin: data.esAdmin, error: data.error };

        } catch (error) {
            console.error("Error capturado en login service:", error);
            return { ok: false, error: "Error de conexión con el servidor" };
        }
    },

    /**
     * Registra un nuevo cliente.
     * Usa el helper 'post' que ya incluye la baseUrl y el Content-Type correcto.
     */
    async registrar(datos) {
        try {
            // Aseguramos que la acción sea 'registro' para que entre al else-if de Java
            const payload = { 
                accion: 'registro', 
                nombre: datos.nombre,
                apellido: datos.apellido,
                edad: datos.edad,
                telefono: datos.telefono,
                email: datos.email,     // 👈 Forzamos a que se llame 'email' como pide tu Java
                password: datos.password // 👈 Forzamos a que se llame 'password' como pide tu Java
            };

            // El helper 'post' ya concatena la URL base automáticamente
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
     * Actualiza el perfil del usuario (nombre y apellido).
     */
    async actualizarPerfil(nombre, apellido, email = '') {
        try {
            const res = await post('UsuarioController', { accion: 'actualizarPerfil', nombre, apellido, email });
            const data = await res.json();
            return { ok: data.success === true || data.status === 'success', error: data.error };
        } catch (err) {
            return { ok: false, error: 'Error de conexión con el servidor.' };
        }
    },

    /**
     * Cierra sesión en todos los dispositivos.
     */
    async logoutGlobal() {
        try {
            CarritoService.limpiarLocal();
            const res = await post('UsuarioController', { accion: 'logoutGlobal' });
            const data = await res.json();
            return { ok: data.success === true, error: data.error };
        } catch (err) {
            CarritoService.limpiarLocal();
            return { ok: false, error: 'Error de conexión con el servidor.' };
        }
    },

    /**
     * Cierra sesión del servidor y redirige al login.
     */
    async logout() {
        try {
            CarritoService.limpiarLocal();
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

    async crearConForm(formData) {
        try {
            const baseUrl = await getBaseUrl();
            const url = `${baseUrl}/ProductoController`.replace(/([^:]\/)\/+/g, "$1");
            formData.append('accion', 'crear');
            const res = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje || json.status, idProducto: json.idProducto };
        } catch (err) {
            console.error(err);
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
    },

    async listarInactivos() {
        return get('ProductoController', { accion: 'inactivos' });
    },

    async reactivar(id) {
        try {
            const baseUrl = await getBaseUrl();
            const url = `${baseUrl}/ProductoController?accion=reactivar&idProducto=${id}`.replace(/([^:]\/)\/+/g, "$1");
            const res = await fetch(url, {
                method: 'PUT',
                credentials: 'include'
            });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

    async actualizarConForm(formData) {
        try {
            const baseUrl = await getBaseUrl();
            const url = `${baseUrl}/ProductoController`.replace(/([^:]\/)\/+/g, "$1");
            formData.append('accion', 'actualizar');
            const res = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje };
        } catch (err) {
            console.error(err);
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    }
};

// ─── DIRECCIONES ──────────────────────────────────────────────────────────────
export const DireccionService = {
    async listar(idUsuarios = '') {
        return get('DireccionController', { accion: 'listar', idUsuarios });
    },
    async crear(datos) {
        try {
            const res = await post('DireccionController', { accion: 'crear', ...datos });
            const json = await res.json();
            return { ok: json.success === true, mensaje: json.mensaje };
        } catch (err) {
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
        const existente = carrito.findIndex(i => (i.idVariante && i.idVariante === idVariante) || (i.id === itemLocal.id && i.talla === itemLocal.talla && i.color === itemLocal.color));

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

    async eliminar(index) {
        const carrito = CarritoService.obtenerLocal();
        let itemEliminado = null;

        if (index >= 0 && index < carrito.length) {
            itemEliminado = carrito.splice(index, 1)[0];
        }

        if (carrito.length === 0) {
            CarritoService.limpiarLocal();
        } else {
            CarritoService.guardarLocal(carrito);
        }

        try {
            if (itemEliminado && itemEliminado.idCarrito) {
                await post('CarritoController', { accion: 'eliminar', idCarrito: itemEliminado.idCarrito });
            }
        } catch {
            // ignorar error de red al eliminar en servidor
        }

        return carrito;
    },

    async vaciar() {
        CarritoService.limpiarLocal();
        try {
            await post('CarritoController', { accion: 'vaciar' });
        } catch {
            // ignorar error de red
        }
    },

    obtenerLocal() {
        try {
            const raw = localStorage.getItem('elixir_cart');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    guardarLocal(carrito) {
        if (!carrito || !Array.isArray(carrito) || carrito.length === 0) {
            CarritoService.limpiarLocal();
        } else {
            localStorage.setItem('elixir_cart', JSON.stringify(carrito));
        }
    },

    limpiarLocal() {
        localStorage.removeItem('elixir_cart');
    }
};

// ─── PEDIDOS ──────────────────────────────────────────────────────────────────
export const PedidoService = {

    async listarMisPedidos() {
        try {
            return await get('PedidoController', { accion: 'misPedidos' });
        } catch (e) {
            return await get('PedidoController', { accion: 'listarMisPedidos' });
        }
    },

    async listarTodos() {
        return get('PedidoController', { accion: 'listarTodos' });
    },

    async obtenerMetricas() {
        return get('PedidoController', { accion: 'obtenerMetricas' });
    },

    async obtenerDetalleCompleto(idPedido) {
        return get('PedidoController', { accion: 'obtenerDetalleCompleto', idPedido });
    },

    async obtenerHistorialRastreo(idPedido) {
        return get('PedidoController', { accion: 'obtenerHistorialRastreo', idPedido });
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
    },

    async actualizarDespacho(datos) {
        try {
            const res = await post('PedidoController', { accion: 'actualizarDespacho', ...datos });
            const json = await res.json();
            return { ok: json.status === 'success', mensaje: json.mensaje || json.error };
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    }
};

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────
export const CategoriaService = {

    async listar() {
        return get('CategoriaController', { accion: 'listar' });
    }
};

// ─── SOPORTE Y PQR ────────────────────────────────────────────────────────────
export const SoporteService = {

    async crearDevolucion(datos) {
        try {
            const res = await post('SoporteController', { accion: 'crearDevolucion', ...datos });
            return await res.json();
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

    async crearContacto(datos) {
        try {
            const res = await post('SoporteController', { accion: 'crearContacto', ...datos });
            return await res.json();
        } catch {
            return { ok: false, mensaje: 'Error de conexión.' };
        }
    },

    async listarDevoluciones() {
        return get('SoporteController', { accion: 'listarDevoluciones' });
    },

    async listarContactos() {
        return get('SoporteController', { accion: 'listarContactos' });
    },

    async actualizarEstadoDevolucion(idDevolucion, estado, motivoRechazo) {
        try {
            const res = await post('SoporteController', { 
                accion: 'actualizarEstadoDevolucion', 
                idDevolucion, 
                estado, 
                motivoRechazo: motivoRechazo || '' 
            });
            return await res.json();
        } catch {
            return { ok: false };
        }
    },

    async actualizarEstadoContacto(idContacto, estado) {
        try {
            const res = await post('SoporteController', { 
                accion: 'actualizarEstadoContacto', 
                idContacto, 
                estado 
            });
            return await res.json();
        } catch {
            return { ok: false };
        }
    }
};

// ─── PROVEEDORES ──────────────────────────────────────────────────────────────
export const ProveedorService = {
    async listar() {
        const baseUrl = await getBaseUrl();
        const res = await fetch(`${baseUrl}/api/proveedores`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },

    async crear(datos) {
        const baseUrl = await getBaseUrl();
        const res = await fetch(`${baseUrl}/api/proveedores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos),
            credentials: 'include'
        });
        return res.json();
    },

    async actualizar(id, datos) {
        const baseUrl = await getBaseUrl();
        const res = await fetch(`${baseUrl}/api/proveedores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos),
            credentials: 'include'
        });
        return res.json();
    },

    async cambiarEstado(id, nuevoEstado) {
        const baseUrl = await getBaseUrl();
        const res = await fetch(`${baseUrl}/api/proveedores/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado }),
            credentials: 'include'
        });
        return res.json();
    }
};