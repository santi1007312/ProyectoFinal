package com.elixirflexx.controller;

import com.elixirflexx.dao.UsuarioDao;
import com.elixirflexx.model.Usuario;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/UsuarioController")
public class UsuarioController extends HttpServlet {

    private final UsuarioDao dao = new UsuarioDao();

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
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        setCorsHeaders(request, response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion = request.getParameter("accion");
        PrintWriter out = null;

        try {
            out = response.getWriter();

            if ("listar".equals(accion)) {
                List<Usuario> lista = dao.listarUsuarios();
                out.write(listaAJson(lista));

            } else if ("detalle".equals(accion)) {
                int idUsuarios = Integer.parseInt(request.getParameter("idUsuarios"));
                Usuario usuario = dao.obtenerPorId(idUsuarios);

                if (usuario != null) {
                    out.write(usuarioAJson(usuario));
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.write("{\"error\":\"Usuario no encontrado\"}");
                }

            } else if ("obtenerPerfil".equals(accion)) {
                HttpSession session = request.getSession(false);
                if (session != null && session.getAttribute("usuarioLogueado") != null) {
                    Usuario u = (Usuario) session.getAttribute("usuarioLogueado");
                    out.write(usuarioAJson(u));
                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    out.write("{\"error\":\"No hay sesion activa\"}");
                }

            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"error\":\"Accion no valida\"}");
            }

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            if (out != null) {
                out.write("{\"error\":\"" + escaparJson(e.getMessage()) + "\"}");
            }
        } finally {
            if (out != null) {
                out.flush();
                out.close();
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        setCorsHeaders(request, response);
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion = request.getParameter("accion");
        PrintWriter out = null;

        try {
            out = response.getWriter();

            // ── LOGIN ─────────────────────────────────────────────────────────
            if ("login".equals(accion)) {
                String email = request.getParameter("email");
                String contraseña = request.getParameter("contraseña");
                if (contraseña == null) {
                    contraseña = request.getParameter("contrasena");
                }

                if (email == null || contraseña == null
                        || email.isBlank() || contraseña.isBlank()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.write("{\"success\":false,\"error\":\"Campos incompletos\"}");
                    return;
                }

                Usuario usuario = dao.login(email.trim(), contraseña);

                if (usuario != null) {
                    if (!"activo".equals(usuario.getEstado())) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        out.write("{\"success\":false,\"error\":\"Cuenta suspendida o baneada\"}");
                        return;
                    }

                    // Guardar sesión
                    HttpSession session = request.getSession();
                    session.setAttribute("usuarioLogueado", usuario);
                    session.setAttribute("idRol", usuario.getIdRol());

                    // idRol == 2 || idRol == 3 → administrador
                    boolean esAdmin = (usuario.getIdRol() == 2 || usuario.getIdRol() == 3);
                    out.write("{\"success\":true,\"esAdmin\":" + esAdmin + "}");

                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    out.write("{\"success\":false,\"error\":\"Correo o contraseña incorrectos\"}");
                }

            // ── REGISTRO ──────────────────────────────────────────────────────
            } else if ("crear".equals(accion) || "registrar".equals(accion) || "registro".equals(accion)) {

                Usuario usuario = new Usuario();
                usuario.setNombre(request.getParameter("nombre"));
                usuario.setApellido(nvl(request.getParameter("apellido")));

                String edadStr = request.getParameter("edad");
                usuario.setEdad((edadStr != null && !edadStr.isBlank())
                        ? Integer.parseInt(edadStr) : 0);

                usuario.setEmail(request.getParameter("email"));

                String pass = request.getParameter("contraseña");
                if (pass == null) pass = request.getParameter("contrasena");
                usuario.setContraseña(pass);

                usuario.setTelefono(nvl(request.getParameter("telefono")));
                usuario.setFotoPerfil("");
                usuario.setIdRol(1);        // cliente por defecto
                usuario.setEstado("activo");
                usuario.setEmailVerificado(true);
                usuario.setTokenVerificacion(null);

                boolean ok = dao.registrarUsuario(usuario);
                out.write("{\"success\":" + ok + "}");

            // ── LOGOUT ────────────────────────────────────────────────────────
            } else if ("logout".equals(accion)) {
                HttpSession session = request.getSession(false);
                if (session != null) session.invalidate();
                out.write("{\"success\":true}");

            // ── CAMBIAR ESTADO (ADMIN) ─────────────────────────────────────────
            } else if ("cambiarEstado".equals(accion)) {
                HttpSession session = request.getSession(false);
                Usuario loggedUser = (session != null) ? (Usuario) session.getAttribute("usuarioLogueado") : null;
                if (loggedUser == null || (loggedUser.getIdRol() != 2 && loggedUser.getIdRol() != 3)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    out.write("{\"error\":\"Sin permisos de administrador\"}");
                    return;
                }
                int idUsuarios = Integer.parseInt(request.getParameter("idUsuarios"));
                String nuevoEstado = request.getParameter("estado");
                boolean ok = dao.cambiarEstado(idUsuarios, nuevoEstado);
                out.write("{\"success\":" + ok + "}");

            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"error\":\"Accion no valida\"}");
            }

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            if (out != null) {
                out.write("{\"error\":\"" + escaparJson(e.getMessage()) + "\"}");
            }
        } finally {
            if (out != null) {
                out.flush();
                out.close();
            }
        }
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    private String listaAJson(List<Usuario> lista) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < lista.size(); i++) {
            sb.append(usuarioAJson(lista.get(i)));
            if (i < lista.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    private String usuarioAJson(Usuario u) {
        return String.format(
                "{"
              + "\"idUsuarios\":%d,"
              + "\"nombre\":\"%s\","
              + "\"apellido\":\"%s\","
              + "\"edad\":%d,"
              + "\"email\":\"%s\","
              + "\"telefono\":\"%s\","
              + "\"fotoPerfil\":\"%s\","
              + "\"idRol\":%d,"
              + "\"estado\":\"%s\","
              + "\"emailVerificado\":%s"
              + "}",
                u.getIdUsuarios(),
                escaparJson(u.getNombre()),
                escaparJson(u.getApellido()),
                u.getEdad(),
                escaparJson(u.getEmail()),
                escaparJson(u.getTelefono()),
                escaparJson(u.getFotoPerfil()),
                u.getIdRol(),
                escaparJson(u.getEstado()),
                u.isEmailVerificado()
        );
    }

    private String escaparJson(String texto) {
        if (texto == null) return "";
        return texto.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String nvl(String s) {
        return s != null ? s : "";
    }
}
