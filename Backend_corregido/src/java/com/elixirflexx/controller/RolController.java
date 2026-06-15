package com.elixirflexx.controller;

import com.elixirflexx.dao.RolDao;
import com.elixirflexx.model.Rol;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/RolController")
public class RolController extends HttpServlet {

    private final RolDao dao =
            new RolDao();

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion =
                request.getParameter("accion");

        PrintWriter out =
                response.getWriter();

        if("listar".equals(accion)) {

            List<Rol> lista =
                    dao.listarRoles();

            out.write(listaAJson(lista));
        }

        else if("detalle".equals(accion)) {

            int idRol =
                    Integer.parseInt(
                            request.getParameter("idRol"));

            Rol rol =
                    dao.obtenerPorId(idRol);

            if(rol != null) {

                out.write(
                        rolAJson(rol));
            }
        }
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws IOException {

        String accion =
                request.getParameter("accion");

        PrintWriter out =
                response.getWriter();

        if("crear".equals(accion)) {

            Rol rol = new Rol();

            rol.setNombreRol(
                    request.getParameter(
                            "nombreRol"));

            rol.setDescripcion(
                    request.getParameter(
                            "descripcion"));

            boolean ok =
                    dao.registrarRol(rol);

            out.write(
                    "{\"success\":"
                    + ok +
                    "}");
        }
    }

    private String listaAJson(
            List<Rol> lista) {

        StringBuilder sb =
                new StringBuilder("[");

        for(int i=0;i<lista.size();i++) {

            sb.append(
                    rolAJson(
                            lista.get(i)));

            if(i < lista.size()-1) {
                sb.append(",");
            }
        }

        sb.append("]");

        return sb.toString();
    }

    private String rolAJson(
            Rol r) {

        return String.format(
                "{\"idRol\":%d,"
              + "\"nombreRol\":\"%s\","
              + "\"descripcion\":\"%s\"}",

                r.getIdRol(),
                escaparJson(
                        r.getNombreRol()),
                escaparJson(
                        r.getDescripcion())
        );
    }

    private String escaparJson(
            String texto) {

        if(texto == null) {
            return "";
        }

        return texto
                .replace("\\","\\\\")
                .replace("\"","\\\"");
    }
}