package com.elixirflexx.controller;

import com.elixirflexx.dao.CategoriaDao;
import com.elixirflexx.model.Categoria;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/CategoriaController")
public class CategoriaController extends HttpServlet {

    private final CategoriaDao dao = new CategoriaDao();

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
                List<Categoria> lista = dao.listarCategorias();
                out.write(listaAJson(lista));
            }
            else if ("detalle".equals(accion)) {
                int idCategorias = Integer.parseInt(request.getParameter("idCategorias"));
                Categoria cat = dao.obtenerPorId(idCategorias);
                if (cat != null) {
                    out.write(categoriaAJson(cat));
                }
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

            if ("crear".equals(accion)) {
                Categoria categoria = new Categoria();
                categoria.setNombreCategoria(request.getParameter("nombreCategoria"));
                categoria.setDescripcion(request.getParameter("descripcion"));

                boolean ok = dao.registrarCategoria(categoria);
                out.write("{\"success\":" + ok + "}");
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

    private String listaAJson(List<Categoria> lista) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < lista.size(); i++) {
            sb.append(categoriaAJson(lista.get(i)));
            if (i < lista.size() - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    private String categoriaAJson(Categoria c) {
        return String.format(
                "{\"idCategorias\":%d,"
              + "\"nombreCategoria\":\"%s\","
              + "\"descripcion\":\"%s\"}",
                c.getIdCategorias(),
                escaparJson(c.getNombreCategoria()),
                escaparJson(c.getDescripcion())
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