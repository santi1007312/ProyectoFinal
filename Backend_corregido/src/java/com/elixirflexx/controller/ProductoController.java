package com.elixirflexx.controller;

import com.elixirflexx.dao.ProductoDao;
import com.elixirflexx.model.Producto;
import com.elixirflexx.model.Usuario;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet(name = "ProductoController", urlPatterns = {"/ProductoController"})
public class ProductoController extends HttpServlet {

    private final ProductoDao productoDao = new ProductoDao();

    private void setCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin != null && (origin.contains("localhost:5500") || origin.contains("127.0.0.1:5500"))) {
            response.setHeader("Access-Control-Allow-Origin", origin);
        } else {
            response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
        }
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    // ════════════════════════════════════════════════════════════════
    // GET — Público: listar, lanzamientos, detalle
    // ════════════════════════════════════════════════════════════════
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion = request.getParameter("accion");
        PrintWriter out = null;

        try {
            out = response.getWriter();

            switch (accion != null ? accion : "") {

                case "listar":
                    String q = request.getParameter("q");
                    List<Producto> todos;
                    if (q != null && !q.isBlank()) {
                        todos = productoDao.buscarProductos(q);
                    } else {
                        todos = productoDao.listarProductos();
                    }
                    out.write(productosAJson(todos));
                    break;

                case "lanzamientos":
                    List<Producto> ultimos = productoDao.listarLanzamientos();
                    out.write(productosAJson(ultimos));
                    break;

                case "detalle":
                    String idParam = request.getParameter("id");
                    if (idParam == null || idParam.isBlank()) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.write("{\"error\":\"Falta el parametro id\"}");
                        return;
                    }
                    try {
                        Producto prod = productoDao.obtenerPorId(Integer.parseInt(idParam));
                        if (prod != null) {
                            out.write(productoAJson(prod));
                        } else {
                            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                            out.write("{\"error\":\"Producto no encontrado\"}");
                        }
                    } catch (NumberFormatException e) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.write("{\"error\":\"ID no valido\"}");
                    }
                    break;

                case "buscar":
                    String qBuscar = request.getParameter("q");
                    if (qBuscar == null) qBuscar = "";
                    com.elixirflexx.dao.BusquedaDao busquedaDao = new com.elixirflexx.dao.BusquedaDao();
                    List<java.util.Map<String, Object>> productosEncontrados = busquedaDao.buscarProductos(qBuscar);
                    List<java.util.Map<String, Object>> categoriasEncontradas = busquedaDao.buscarCategorias(qBuscar);
                    out.write(busquedaAJson(productosEncontrados, categoriasEncontradas));
                    break;

                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.write("{\"error\":\"Accion no reconocida\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            if (out != null) {
                out.write("{\"error\":\"" + esc(e.getMessage()) + "\"}");
            }
        } finally {
            if (out != null) {
                out.flush();
                out.close();
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    // POST — Solo admins: crear, actualizar, eliminar
    // ════════════════════════════════════════════════════════════════
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = null;

        try {
            out = response.getWriter();

            // Solo admins pueden modificar productos
            HttpSession session = request.getSession(false);
            Usuario usuario = (session != null) ? (Usuario) session.getAttribute("usuarioLogueado") : null;
            if (usuario == null || (usuario.getIdRol() != 2 && usuario.getIdRol() != 3)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                out.write("{\"status\":\"error\",\"mensaje\":\"Sin permisos de administrador\"}");
                return;
            }

            String accion = request.getParameter("accion");

            switch (accion != null ? accion : "") {
                case "crear":
                    procesarCrear(request, response, out);
                    break;
                case "actualizar":
                    procesarActualizar(request, response, out);
                    break;
                case "eliminar":
                    procesarEliminar(request, response, out);
                    break;
                default:
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.write("{\"status\":\"error\",\"mensaje\":\"Accion no reconocida\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            if (out != null) {
                out.write("{\"status\":\"error\",\"mensaje\":\"" + esc(e.getMessage()) + "\"}");
            }
        } finally {
            if (out != null) {
                out.flush();
                out.close();
            }
        }
    }

    // ── CREAR ─────────────────────────────────────────────────────────────────
    private void procesarCrear(HttpServletRequest req, HttpServletResponse res, PrintWriter out)
            throws IOException {
        try {
            String nombre      = req.getParameter("nombreProducto");
            String descripcion = req.getParameter("descripcion");
            String catStr      = req.getParameter("idCategorias");
            String precioStr   = req.getParameter("precioBase");
            String material    = req.getParameter("material");

            if (nombre == null || nombre.isBlank() || precioStr == null || catStr == null) {
                res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"status\":\"error\",\"mensaje\":\"Faltan campos obligatorios\"}");
                return;
            }

            Producto nuevo = new Producto();
            nuevo.setNombreProducto(nombre.trim());
            nuevo.setDescripcion(descripcion != null ? descripcion.trim() : "");
            nuevo.setPrecioBase(Double.parseDouble(precioStr));
            nuevo.setPorcentajeDescuento(0);
            nuevo.setIdCategorias(Integer.parseInt(catStr));
            nuevo.setMaterial(material != null ? material.trim() : "");
            nuevo.setOrigen("Bucaramanga, Colombia");
            nuevo.setInstruccionesLavado("");
            nuevo.setPeso(0);
            nuevo.setEsNuevo(true);
            nuevo.setEsDestacado(false);
            nuevo.setActivo(true);
            nuevo.setSlug(
                nombre.toLowerCase().trim()
                    .replace(" ", "-")
                    .replaceAll("[áä]", "a").replaceAll("[éë]", "e")
                    .replaceAll("[íï]", "i").replaceAll("[óö]", "o")
                    .replaceAll("[úü]", "u").replaceAll("[^a-z0-9\\-]", "")
            );

            boolean ok = productoDao.registrarProducto(nuevo);
            if (ok) {
                out.write("{\"status\":\"success\",\"mensaje\":\"Prenda registrada correctamente\"}");
            } else {
                res.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.write("{\"status\":\"error\",\"mensaje\":\"No se pudo insertar en la BD\"}");
            }
        } catch (NumberFormatException e) {
            res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"status\":\"error\",\"mensaje\":\"Formato numerico invalido\"}");
        }
    }

    // ── ACTUALIZAR ────────────────────────────────────────────────────────────
    private void procesarActualizar(HttpServletRequest req, HttpServletResponse res, PrintWriter out)
            throws IOException {
        try {
            int id = Integer.parseInt(req.getParameter("idProducto"));
            Producto prod = productoDao.obtenerPorId(id);

            if (prod == null) {
                res.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.write("{\"status\":\"error\",\"mensaje\":\"Producto no encontrado\"}");
                return;
            }

            String nombre = req.getParameter("nombreProducto");
            if (nombre != null && !nombre.isBlank()) {
                prod.setNombreProducto(nombre.trim());
                prod.setSlug(nombre.toLowerCase().trim().replace(" ", "-").replaceAll("[^a-z0-9\\-]", ""));
            }
            String desc = req.getParameter("descripcion");
            if (desc != null) prod.setDescripcion(desc.trim());

            String precio = req.getParameter("precioBase");
            if (precio != null && !precio.isBlank()) prod.setPrecioBase(Double.parseDouble(precio));

            String dcto = req.getParameter("porcentajeDescuento");
            if (dcto != null && !dcto.isBlank()) prod.setPorcentajeDescuento(Integer.parseInt(dcto));

            String cat = req.getParameter("idCategorias");
            if (cat != null && !cat.isBlank()) prod.setIdCategorias(Integer.parseInt(cat));

            boolean ok = productoDao.actualizarProducto(prod);
            if (ok) {
                out.write("{\"status\":\"success\",\"mensaje\":\"Producto actualizado\"}");
            } else {
                res.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.write("{\"status\":\"error\",\"mensaje\":\"No se pudo actualizar\"}");
            }
        } catch (NumberFormatException e) {
            res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"status\":\"error\",\"mensaje\":\"Formato invalido\"}");
        }
    }

    // ── ELIMINAR (soft delete) ────────────────────────────────────────────────
    private void procesarEliminar(HttpServletRequest req, HttpServletResponse res, PrintWriter out)
            throws IOException {
        try {
            int id = Integer.parseInt(req.getParameter("idProducto"));
            boolean ok = productoDao.desactivarProducto(id);

            if (ok) {
                out.write("{\"status\":\"success\",\"mensaje\":\"Producto desactivado del catalogo\"}");
            } else {
                res.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.write("{\"status\":\"error\",\"mensaje\":\"No se pudo eliminar\"}");
            }
        } catch (NumberFormatException e) {
            res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"status\":\"error\",\"mensaje\":\"ID invalido\"}");
        }
    }

    // ── HELPERS JSON ──────────────────────────────────────────────────────────
    private String productosAJson(List<Producto> lista) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < lista.size(); i++) {
            sb.append(productoAJson(lista.get(i)));
            if (i < lista.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    private String productoAJson(Producto p) {
        return String.format(
            "{\"id\":%d,"
            + "\"nombre\":\"%s\","
            + "\"slug\":\"%s\","
            + "\"descripcion\":\"%s\","
            + "\"precioBase\":%.2f,"
            + "\"precioFinal\":%.2f,"
            + "\"descuento\":%d,"
            + "\"esNuevo\":%b,"
            + "\"esDestacado\":%b,"
            + "\"categoria\":%d,"
            + "\"material\":\"%s\","
            + "\"origen\":\"%s\"}",
            p.getIdProducto(),
            esc(p.getNombreProducto()),
            esc(p.getSlug()),
            esc(p.getDescripcion()),
            p.getPrecioBase(),
            p.getPrecioFinal(),
            p.getPorcentajeDescuento(),
            p.isEsNuevo(),
            p.isEsDestacado(),
            p.getIdCategorias(),
            esc(p.getMaterial()),
            esc(p.getOrigen())
        );
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }

    private String busquedaAJson(List<java.util.Map<String, Object>> productos, List<java.util.Map<String, Object>> categorias) {
        StringBuilder sb = new StringBuilder("{");
        
        sb.append("\"productos\":[");
        for (int i = 0; i < productos.size(); i++) {
            java.util.Map<String, Object> p = productos.get(i);
            sb.append(String.format(
                "{\"id\":%d,\"nombre\":\"%s\",\"precio\":%.2f,\"imagen\":\"%s\"}",
                (Integer) p.get("id"),
                esc((String) p.get("nombre")),
                (Double) p.get("precio"),
                esc((String) p.get("imagen"))
            ));
            if (i < productos.size() - 1) sb.append(",");
        }
        sb.append("],");

        sb.append("\"categorias\":[");
        for (int i = 0; i < categorias.size(); i++) {
            java.util.Map<String, Object> c = categorias.get(i);
            sb.append(String.format(
                "{\"id\":%d,\"nombre\":\"%s\"}",
                (Integer) c.get("id"),
                esc((String) c.get("nombre"))
            ));
            if (i < categorias.size() - 1) sb.append(",");
        }
        sb.append("]");

        sb.append("}");
        return sb.toString();
    }
}
