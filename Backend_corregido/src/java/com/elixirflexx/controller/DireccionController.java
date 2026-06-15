package com.elixirflexx.controller;

import com.elixirflexx.dao.DireccionDao;
import com.elixirflexx.model.Direcciones;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/DireccionController")
public class DireccionController extends HttpServlet {

    public final DireccionDao dao = new DireccionDao();

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion = request.getParameter("accion");

        PrintWriter out = response.getWriter();

        try {

            if ("listar".equals(accion)) {

                int idUsuarios = Integer.parseInt(
                        request.getParameter("idUsuarios"));

                List<Direcciones> lista =
                        dao.listarPorUsuario(idUsuarios);

                out.write(listaAJson(lista));
            }

            else {

                response.setStatus(
                        HttpServletResponse.SC_BAD_REQUEST);

                out.write(
                        "{\"error\":\"Accion no valida\"}");
            }

        } catch (Exception e) {

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

            out.write(
                    "{\"error\":\"" +
                    escaparJson(e.getMessage()) +
                    "\"}");
        }
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws IOException {

        request.setCharacterEncoding("UTF-8");

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion = request.getParameter("accion");

        PrintWriter out = response.getWriter();

        try {

            if ("crear".equals(accion)) {

                Direcciones direccion = new Direcciones();

                direccion.setIdUsuarios(
                        Integer.parseInt(
                                request.getParameter(
                                        "idUsuarios")));

                direccion.setAlias(
                        request.getParameter("alias"));

                direccion.setCalle(
                        request.getParameter("calle"));

                direccion.setCiudad(
                        request.getParameter("ciudad"));

                direccion.setDepartamento(
                        request.getParameter(
                                "departamento"));

                direccion.setBarrio(
                        request.getParameter("barrio"));

                direccion.setCodigoPostal(
                        request.getParameter(
                                "codigoPostal"));

                direccion.setIndicaciones(
                        request.getParameter(
                                "indicaciones"));

                direccion.setEsPredeterminada(
                        Boolean.parseBoolean(
                                request.getParameter(
                                        "esPredeterminada")));

                boolean ok =
                        dao.registrarDireccion(
                                direccion);

                out.write(
                        "{\"success\":" +
                        ok +
                        "}");
            }

            else {

                response.setStatus(
                        HttpServletResponse.SC_BAD_REQUEST);

                out.write(
                        "{\"error\":\"Accion no valida\"}");
            }

        } catch (Exception e) {

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

            out.write(
                    "{\"error\":\"" +
                    escaparJson(e.getMessage()) +
                    "\"}");
        }
    }

    private String listaAJson(
            List<Direcciones> lista) {

        StringBuilder sb = new StringBuilder("[");

        for (int i = 0; i < lista.size(); i++) {

            sb.append(
                    direccionAJson(
                            lista.get(i)));

            if (i < lista.size() - 1) {
                sb.append(",");
            }
        }

        sb.append("]");

        return sb.toString();
    }

    private String direccionAJson(
            Direcciones d) {

        return String.format(
                "{\"idDirecciones\":%d,"
              + "\"idUsuarios\":%d,"
              + "\"alias\":\"%s\","
              + "\"calle\":\"%s\","
              + "\"ciudad\":\"%s\","
              + "\"departamento\":\"%s\","
              + "\"barrio\":\"%s\","
              + "\"codigoPostal\":\"%s\","
              + "\"indicaciones\":\"%s\","
              + "\"esPredeterminada\":%b}",

                d.getIdDirecciones(),
                d.getIdUsuarios(),
                escaparJson(d.getAlias()),
                escaparJson(d.getCalle()),
                escaparJson(d.getCiudad()),
                escaparJson(d.getDepartamento()),
                escaparJson(d.getBarrio()),
                escaparJson(d.getCodigoPostal()),
                escaparJson(d.getIndicaciones()),
                d.isEsPredeterminada()
        );
    }

    private String escaparJson(String texto) {

        if (texto == null) {
            return "";
        }

        return texto
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}