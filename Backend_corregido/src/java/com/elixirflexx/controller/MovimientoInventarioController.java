package com.elixirflexx.controller;

import com.elixirflexx.dao.MovimientoInventarioDao;
import com.elixirflexx.model.MovimientoInventario;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/MovimientoInventarioController")
public class MovimientoInventarioController
        extends HttpServlet {

    private final MovimientoInventarioDao dao =
            new MovimientoInventarioDao();

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

            int idVariantes =
                    Integer.parseInt(
                            request.getParameter(
                                    "idVariantes"));

            List<MovimientoInventario> lista =
                    dao.listarPorVariante(
                            idVariantes);

            out.write(listaAJson(lista));
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

            MovimientoInventario mov =
                    new MovimientoInventario();

            mov.setIdVariantes(
                    Integer.parseInt(
                            request.getParameter(
                                    "idVariantes")));

            mov.setTipoMovimiento(
                    request.getParameter(
                            "tipoMovimiento"));

            mov.setCantidad(
                    Integer.parseInt(
                            request.getParameter(
                                    "cantidad")));

            mov.setStockAntes(
                    Integer.parseInt(
                            request.getParameter(
                                    "stockAntes")));

            mov.setStockDespues(
                    Integer.parseInt(
                            request.getParameter(
                                    "stockDespues")));

            mov.setMotivo(
                    request.getParameter(
                            "motivo"));

            String usuario =
                    request.getParameter(
                            "idUsuarios");

            if(usuario != null &&
               !usuario.isEmpty()) {

                mov.setIdUsuarios(
                        Integer.parseInt(usuario));
            }

            boolean ok =
                    dao.registrarMovimiento(
                            mov);

            out.write(
                    "{\"success\":" + ok + "}");
        }
    }

    private String listaAJson(
            List<MovimientoInventario> lista) {

        StringBuilder sb =
                new StringBuilder("[");

        for(int i=0;i<lista.size();i++) {

            sb.append(
                    movimientoAJson(
                            lista.get(i)));

            if(i < lista.size()-1) {
                sb.append(",");
            }
        }

        sb.append("]");

        return sb.toString();
    }

    private String movimientoAJson(
            MovimientoInventario m) {

        return String.format(
                "{\"idMovimiento\":%d,"
              + "\"idVariantes\":%d,"
              + "\"tipoMovimiento\":\"%s\","
              + "\"cantidad\":%d,"
              + "\"stockAntes\":%d,"
              + "\"stockDespues\":%d,"
              + "\"motivo\":\"%s\","
              + "\"idUsuarios\":%d,"
              + "\"fecha\":\"%s\"}",

                m.getIdMovimiento(),
                m.getIdVariantes(),
                m.getTipoMovimiento(),
                m.getCantidad(),
                m.getStockAntes(),
                m.getStockDespues(),
                m.getMotivo(),
                m.getIdUsuarios() == null ? 0 : m.getIdUsuarios(),
                m.getFecha()
        );
    }
}