package com.elixirflexx.controller;

import com.elixirflexx.dao.ImagenProductoDao;
import com.elixirflexx.model.ImagenProducto;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/ImagenProductoController")
public class ImagenProductoController
        extends HttpServlet {

    private final ImagenProductoDao dao =
            new ImagenProductoDao();

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");

        String accion =
                request.getParameter("accion");

        PrintWriter out =
                response.getWriter();

        if ("listar".equals(accion)) {

            int idProducto =
                    Integer.parseInt(
                            request.getParameter(
                                    "idProducto"));

            List<ImagenProducto> lista =
                    dao.listarPorProducto(
                            idProducto);

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

        if ("crear".equals(accion)) {

            ImagenProducto img =
                    new ImagenProducto();

            img.setIdProducto(
                    Integer.parseInt(
                            request.getParameter(
                                    "idProducto")));

            img.setUrlImagen(
                    request.getParameter(
                            "urlImagen"));

            img.setAltText(
                    request.getParameter(
                            "altText"));

            img.setEsPrincipal(
                    Boolean.parseBoolean(
                            request.getParameter(
                                    "esPrincipal")));

            img.setOrden(
                    Integer.parseInt(
                            request.getParameter(
                                    "orden")));

            boolean ok =
                    dao.registrarImagen(img);

            out.write(
                    "{\"success\":" + ok + "}");
        }

        else if ("eliminar".equals(accion)) {

            int idImagen =
                    Integer.parseInt(
                            request.getParameter(
                                    "idImagen"));

            boolean ok =
                    dao.eliminarImagen(idImagen);

            out.write(
                    "{\"success\":" + ok + "}");
        }
    }

    private String listaAJson(
            List<ImagenProducto> lista) {

        StringBuilder sb =
                new StringBuilder("[");

        for(int i=0;i<lista.size();i++) {

            ImagenProducto img =
                    lista.get(i);

            sb.append(
                    "{"
                    + "\"idImagen\":"
                    + img.getIdImagen()
                    + ","

                    + "\"idProducto\":"
                    + img.getIdProducto()
                    + ","

                    + "\"urlImagen\":\""
                    + img.getUrlImagen()
                    + "\","

                    + "\"altText\":\""
                    + img.getAltText()
                    + "\","

                    + "\"esPrincipal\":"
                    + img.isEsPrincipal()
                    + ","

                    + "\"orden\":"
                    + img.getOrden()

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