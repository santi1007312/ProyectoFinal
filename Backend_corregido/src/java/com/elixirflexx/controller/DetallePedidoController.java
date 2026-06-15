package com.elixirflexx.controller;

import com.elixirflexx.dao.DetallePedidoDao;
import com.elixirflexx.model.DetallePedido;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.util.List;

@WebServlet("/DetallePedidoController")
public class DetallePedidoController
        extends HttpServlet {

    private final DetallePedidoDao dao =
            new DetallePedidoDao();

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws IOException {

        response.setContentType(
                "application/json");

        String accion =
                request.getParameter(
                        "accion");

        if("listar".equals(accion)) {

            int idPedido =
                    Integer.parseInt(
                    request.getParameter(
                    "idPedido"));

            List<DetallePedido> lista =
                    dao.listarPorPedido(
                            idPedido);

            response.getWriter().write(
                    listaAJson(lista));
        }
    }

    private String listaAJson(
            List<DetallePedido> lista) {

        StringBuilder sb =
                new StringBuilder("[");

        for(int i=0;i<lista.size();i++) {

            DetallePedido d =
                    lista.get(i);

            sb.append(
                "{"
                + "\"idDetallePedidos\":"
                + d.getIdDetallePedidos()
                + ","

                + "\"idVariantes\":"
                + d.getIdVariantes()
                + ","

                + "\"cantidad\":"
                + d.getCantidad()
                + ","

                + "\"tallaSnapshot\":\""
                + d.getTallaSnapshot()
                + "\","

                + "\"colorSnapshot\":\""
                + d.getColorSnapshot()
                + "\","

                + "\"nombreSnapshot\":\""
                + d.getNombreSnapshot()
                + "\","

                + "\"precioUnitario\":"
                + d.getPrecioUnitario()

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