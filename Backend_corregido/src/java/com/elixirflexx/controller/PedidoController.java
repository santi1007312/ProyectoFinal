package com.elixirflexx.controller;

import com.elixirflexx.dao.PedidoDao;
import com.elixirflexx.model.Pedido;
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

@WebServlet(name = "PedidoController", urlPatterns = {"/PedidoController"})
public class PedidoController extends HttpServlet {

    private final PedidoDao pedidoDao = new PedidoDao();

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

    // GET: Listar pedidos del cliente logueado, de la tienda (admin), o metricas (admin)
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        Usuario usuario = (session != null) ? (Usuario) session.getAttribute("usuarioLogueado") : null;

        if (usuario == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Debe iniciar sesion\"}");
            return;
        }

        String accion = request.getParameter("accion");
        PrintWriter out = null;

        try {
            out = response.getWriter();

            if ("listarMisPedidos".equals(accion)) {
                List<Pedido> pedidos = pedidoDao.listarPorUsuario(usuario.getIdUsuarios());
                out.write(pedidosAJson(pedidos));

            } else if ("listarTodos".equals(accion)) {
                // Solo admin
                if (usuario.getIdRol() != 2 && usuario.getIdRol() != 3) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    out.write("{\"error\":\"Sin permisos de administrador\"}");
                    return;
                }
                List<Pedido> pedidos = pedidoDao.listarTodos();
                out.write(pedidosAJson(pedidos));

            } else if ("obtenerMetricas".equals(accion)) {
                // Solo admin
                if (usuario.getIdRol() != 2 && usuario.getIdRol() != 3) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    out.write("{\"error\":\"Sin permisos de administrador\"}");
                    return;
                }
                String metricasJson = pedidoDao.obtenerMetricas();
                out.write(metricasJson);

            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"error\":\"Accion no reconocida\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            if (out != null) {
                out.write("{\"error\":\"" + e.getMessage() + "\"}");
            }
        } finally {
            if (out != null) {
                out.flush();
                out.close();
            }
        }
    }

    // POST: Crear pedido o actualizar estado (admin)
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        Usuario usuario = (session != null) ? (Usuario) session.getAttribute("usuarioLogueado") : null;

        if (usuario == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Debe iniciar sesion\"}");
            return;
        }

        String accion = request.getParameter("accion");
        PrintWriter out = null;

        try {
            out = response.getWriter();

            if ("crearPedido".equals(accion)) {
                double total = Double.parseDouble(request.getParameter("total"));
                String direccion = request.getParameter("direccionEnvio");

                Pedido nuevoPedido = new Pedido();
                nuevoPedido.setIdUsuarios(usuario.getIdUsuarios());
                nuevoPedido.setTotal(total);
                nuevoPedido.setDireccionEnvio(direccion != null ? direccion : "");

                int idGenerado = pedidoDao.crearPedido(nuevoPedido);

                if (idGenerado > 0) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.write("{\"status\":\"success\",\"idPedido\":" + idGenerado + "}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.write("{\"status\":\"error\",\"mensaje\":\"No se pudo crear el pedido\"}");
                }

            } else if ("actualizarEstado".equals(accion)) {
                // Solo admins pueden cambiar el estado
                if (usuario.getIdRol() != 2 && usuario.getIdRol() != 3) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    out.write("{\"error\":\"Sin permisos de administrador\"}");
                    return;
                }
                int idPedido = Integer.parseInt(request.getParameter("idPedido"));
                String nuevoEstado = request.getParameter("estado");
                boolean exito = pedidoDao.actualizarEstado(idPedido, nuevoEstado);

                if (exito) {
                    out.write("{\"status\":\"success\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.write("{\"status\":\"error\",\"mensaje\":\"No se actualizo el estado\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"error\":\"Accion no reconocida\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            if (out != null) {
                out.write("{\"status\":\"error\",\"mensaje\":\"" + e.getMessage() + "\"}");
            }
        } finally {
            if (out != null) {
                out.flush();
                out.close();
            }
        }
    }

    // Helper JSON
    private String pedidosAJson(List<Pedido> lista) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < lista.size(); i++) {
            Pedido p = lista.get(i);
            sb.append(String.format(
                "{\"idPedido\":%d,\"total\":%.2f,\"estado\":\"%s\",\"fecha\":\"%s\",\"direccion\":\"%s\"}",
                p.getIdPedido(), p.getTotal(),
                p.getEstado() != null ? p.getEstado() : "",
                p.getFechaPedido() != null ? p.getFechaPedido().toString() : "",
                p.getDireccionEnvio() != null ? p.getDireccionEnvio().replace("\"", "\\\"") : ""
            ));
            if (i < lista.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
}
