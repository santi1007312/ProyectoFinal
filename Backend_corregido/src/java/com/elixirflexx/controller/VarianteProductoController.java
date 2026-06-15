package com.elixirflexx.controller;

import com.elixirflexx.dao.VarianteProductoDao;
import com.elixirflexx.model.VarianteProducto;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet(name = "VarianteProductoController",
            urlPatterns = {"/VarianteProductoController"})
public class VarianteProductoController extends HttpServlet {

    private final VarianteProductoDao varianteDao =
            new VarianteProductoDao();

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
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion = request.getParameter("accion");
        PrintWriter out = null;

        try {
            out = response.getWriter();

            if ("listar".equals(accion)) {
                int idProducto = Integer.parseInt(request.getParameter("idProducto"));
                List<VarianteProducto> lista = varianteDao.listarPorProducto(idProducto);
                out.write(listaAJson(lista));

            } else if ("detalle".equals(accion)) {
                int idVariantes = Integer.parseInt(request.getParameter("idVariantes"));
                VarianteProducto variante = varianteDao.obtenerPorId(idVariantes);

                if (variante != null) {
                    out.write(varianteAJson(variante));
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.write("{\"error\":\"Variante no encontrada\"}");
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
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String accion = request.getParameter("accion");
        PrintWriter out = null;

        try {
            out = response.getWriter();

            if ("crear".equals(accion)) {
                VarianteProducto variante = new VarianteProducto();
                variante.setIdProducto(Integer.parseInt(request.getParameter("idProducto")));
                variante.setTalla(request.getParameter("talla"));
                variante.setColor(request.getParameter("color"));
                variante.setStock(Integer.parseInt(request.getParameter("stock")));
                variante.setSku(request.getParameter("sku"));
                variante.setStockMinimo(Integer.parseInt(request.getParameter("stockMinimo")));

                boolean guardado = varianteDao.registrarVariante(variante);
                if (guardado) {
                    out.write("{\"status\":\"success\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.write("{\"status\":\"error\",\"mensaje\":\"No se pudo registrar la variante\"}");
                }

            } else if ("actualizarStock".equals(accion)) {
                int idVariantes = Integer.parseInt(request.getParameter("idVariantes"));
                int stock = Integer.parseInt(request.getParameter("stock"));

                boolean actualizado = varianteDao.actualizarStock(idVariantes, stock);
                if (actualizado) {
                    out.write("{\"status\":\"success\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.write("{\"status\":\"error\",\"mensaje\":\"No se pudo actualizar el stock\"}");
                }

            } else if ("actualizar".equals(accion)) {
                VarianteProducto v = new VarianteProducto();
                v.setIdVariantes(Integer.parseInt(request.getParameter("idVariantes")));
                v.setTalla(request.getParameter("talla"));
                v.setColor(request.getParameter("color"));
                v.setStock(Integer.parseInt(request.getParameter("stock")));
                v.setSku(request.getParameter("sku"));
                v.setStockMinimo(Integer.parseInt(request.getParameter("stockMinimo")));

                boolean ok = varianteDao.actualizarVariante(v);
                if (ok) {
                    out.write("{\"status\":\"success\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.write("{\"status\":\"error\",\"mensaje\":\"No se pudo actualizar la variante\"}");
                }

            } else if ("eliminar".equals(accion)) {
                int idVariantes = Integer.parseInt(request.getParameter("idVariantes"));
                boolean ok = varianteDao.eliminarVariante(idVariantes);
                if (ok) {
                    out.write("{\"status\":\"success\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.write("{\"status\":\"error\",\"mensaje\":\"No se pudo eliminar la variante\"}");
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

    private String listaAJson(List<VarianteProducto> lista) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < lista.size(); i++) {
            sb.append(varianteAJson(lista.get(i)));
            if (i < lista.size() - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    private String varianteAJson(VarianteProducto v) {
        return String.format(
                "{\"idVariantes\":%d,"
              + "\"idProducto\":%d,"
              + "\"talla\":\"%s\","
              + "\"color\":\"%s\","
              + "\"stock\":%d,"
              + "\"sku\":\"%s\","
              + "\"stockMinimo\":%d}",
                v.getIdVariantes(),
                v.getIdProducto(),
                escaparJson(v.getTalla()),
                escaparJson(v.getColor()),
                v.getStock(),
                escaparJson(v.getSku()),
                v.getStockMinimo()
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