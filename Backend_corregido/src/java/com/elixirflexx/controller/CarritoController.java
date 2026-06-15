package com.elixirflexx.controller;

import com.elixirflexx.dao.CarritoDao;
import com.elixirflexx.model.Carrito;
import com.elixirflexx.model.Usuario;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.List;

@WebServlet(name = "CarritoController", urlPatterns = {"/CarritoController"})
public class CarritoController extends HttpServlet {

    private final CarritoDao carritoDao = new CarritoDao();

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

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Verificar sesión activa
        HttpSession session = request.getSession(false);
        Usuario usuario = (session != null) ? (Usuario) session.getAttribute("usuarioLogueado") : null;

        if (usuario == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Debe iniciar sesion\"}");
            return;
        }

        String accion = request.getParameter("accion");

        if ("agregar".equals(accion)) {
            try {
                int idVariante = Integer.parseInt(request.getParameter("idVariante"));
                int cantidad   = Integer.parseInt(request.getParameter("cantidad"));

                Carrito item = new Carrito();
                item.setIdUsuarios(usuario.getIdUsuarios());
                item.setIdVariantes(idVariante);
                item.setCantidad(cantidad);

                boolean exito = carritoDao.agregarAlCarrito(item);

                if (exito) {
                    response.getWriter().write("{\"status\":\"success\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    response.getWriter().write("{\"status\":\"error\",\"mensaje\":\"No se pudo agregar al carrito\"}");
                }
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"status\":\"error\",\"mensaje\":\"Datos invalidos\"}");
        }

        } else if ("eliminar".equals(accion)) {
            try {
                int idCarrito = Integer.parseInt(request.getParameter("idCarrito"));
                boolean exito = carritoDao.eliminarDelCarrito(idCarrito);

                if (exito) {
                    response.getWriter().write("{\"status\":\"success\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    response.getWriter().write("{\"status\":\"error\",\"mensaje\":\"No se pudo eliminar\"}");
                }
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"status\":\"error\",\"mensaje\":\"ID invalido\"}");
            }

        } else if ("actualizarCantidad".equals(accion)) {

            int idCarrito =
                    Integer.parseInt(
                            request.getParameter(
                                    "idCarrito"));

            int cantidad =
                    Integer.parseInt(
                            request.getParameter(
                                    "cantidad"));

            boolean ok =
                    carritoDao.actualizarCantidad(
                            idCarrito,
                            cantidad);

            response.getWriter().write(
                    "{\"success\":" + ok + "}");
        }
        
        else if ("vaciar".equals(accion)) {

            boolean ok =
                    carritoDao.vaciarCarrito(
                            usuario.getIdUsuarios());

            response.getWriter().write(
                    "{\"success\":" + ok + "}");
        }
        
        else {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"Accion no reconocida\"}");
        }
    }


    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session =
                request.getSession(false);

        Usuario usuario =
                (session != null)
                ? (Usuario) session.getAttribute(
                        "usuarioLogueado")
                : null;

        if(usuario == null) {

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED);

            response.getWriter().write(
                    "{\"error\":\"Debe iniciar sesion\"}");

            return;
        }

        String accion =
                request.getParameter("accion");

        if("listar".equals(accion)) {

            List<Carrito> lista =
                    carritoDao.listarCarritoUsuario(
                            usuario.getIdUsuarios());

            response.getWriter().write(
                    listaAJson(lista));
        }
    }
    
    public String listaAJson(
            List<Carrito> lista) {

        StringBuilder sb =
                new StringBuilder("[");

        for(int i=0;i<lista.size();i++) {

            Carrito c = lista.get(i);

            sb.append(
                    "{"
                    + "\"idCarrito\":"
                    + c.getIdCarrito()
                    + ","

                    + "\"idVariantes\":"
                    + c.getIdVariantes()
                    + ","

                    + "\"cantidad\":"
                    + c.getCantidad()

                    + "}"
            );

            if(i < lista.size()-1) {
                sb.append(",");
            }
        }

        sb.append("]");

        return sb.toString();
    }
}
