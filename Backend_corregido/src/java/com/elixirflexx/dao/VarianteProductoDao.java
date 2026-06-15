package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.VarianteProducto;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

public class VarianteProductoDao {

    /**
     * LISTAR TODAS LAS VARIANTES DE UN PRODUCTO
     */
    public List<VarianteProducto> listarPorProducto(int idProducto) {

        List<VarianteProducto> lista = new ArrayList<>();

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "SELECT * FROM VariantesProducto " +
                    "WHERE idProducto = ? " +
                    "ORDER BY talla";

            ps = con.prepareStatement(sql);
            ps.setInt(1, idProducto);

            rs = ps.executeQuery();

            while (rs.next()) {

                VarianteProducto variante = new VarianteProducto();

                variante.setIdVariantes(rs.getInt("idVariantes"));
                variante.setIdProducto(rs.getInt("idProducto"));
                variante.setTalla(rs.getString("talla"));
                variante.setColor(rs.getString("color"));
                variante.setStock(rs.getInt("stock"));
                variante.setSku(rs.getString("sku"));
                variante.setStockMinimo(rs.getInt("stockMinimo"));

                lista.add(variante);
            }

        } catch (Exception e) {

            System.out.println("Error listarPorProducto: " + e.getMessage());

        } finally {

            try { if(rs != null) rs.close(); } catch(Exception e){}
            try { if(ps != null) ps.close(); } catch(Exception e){}
            try { if(con != null) con.close(); } catch(Exception e){}

        }

        return lista;
    }

    /**
     * REGISTRAR VARIANTE
     */
    public boolean registrarVariante(VarianteProducto variante) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "INSERT INTO VariantesProducto " +
                    "(idProducto,talla,color,stock,sku,stockMinimo) " +
                    "VALUES (?,?,?,?,?,?)";

            ps = con.prepareStatement(sql);

            ps.setInt(1, variante.getIdProducto());
            ps.setString(2, variante.getTalla());
            ps.setString(3, variante.getColor());
            ps.setInt(4, variante.getStock());
            ps.setString(5, variante.getSku());
            ps.setInt(6, variante.getStockMinimo());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {

            System.out.println("Error registrarVariante: " + e.getMessage());
            return false;

        } finally {

            try { if(ps != null) ps.close(); } catch(Exception e){}
            try { if(con != null) con.close(); } catch(Exception e){}

        }
    }

    /**
     * ACTUALIZAR STOCK
     */
    public boolean actualizarStock(int idVariante, int nuevoStock) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "UPDATE VariantesProducto " +
                    "SET stock = ? " +
                    "WHERE idVariantes = ?";

            ps = con.prepareStatement(sql);

            ps.setInt(1, nuevoStock);
            ps.setInt(2, idVariante);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {

            System.out.println("Error actualizarStock: " + e.getMessage());
            return false;

        } finally {

            try { if(ps != null) ps.close(); } catch(Exception e){}
            try { if(con != null) con.close(); } catch(Exception e){}

        }
    }

    /**
     * OBTENER UNA VARIANTE POR ID
     */
    public VarianteProducto obtenerPorId(int idVariante) {

        VarianteProducto variante = null;

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "SELECT * FROM VariantesProducto " +
                    "WHERE idVariantes = ?";

            ps = con.prepareStatement(sql);
            ps.setInt(1, idVariante);

            rs = ps.executeQuery();

            if (rs.next()) {

                variante = new VarianteProducto();

                variante.setIdVariantes(rs.getInt("idVariantes"));
                variante.setIdProducto(rs.getInt("idProducto"));
                variante.setTalla(rs.getString("talla"));
                variante.setColor(rs.getString("color"));
                variante.setStock(rs.getInt("stock"));
                variante.setSku(rs.getString("sku"));
                variante.setStockMinimo(rs.getInt("stockMinimo"));
            }

        } catch (Exception e) {

            System.out.println("Error obtenerPorId: " + e.getMessage());

        } finally {

            try { if(rs != null) rs.close(); } catch(Exception e){}
            try { if(ps != null) ps.close(); } catch(Exception e){}
            try { if(con != null) con.close(); } catch(Exception e){}

        }

        return variante;
    }
    
    public boolean eliminarVariante(int idVariantes) {

    Connection con = null;
    PreparedStatement ps = null;

    try {

        con = Conexion.getConexion();

        String sql =
                "DELETE FROM VariantesProducto " +
                "WHERE idVariantes = ?";

        ps = con.prepareStatement(sql);

        ps.setInt(1, idVariantes);

        return ps.executeUpdate() > 0;

    } catch (Exception e) {

        System.out.println(
                "Error eliminarVariante: "
                + e.getMessage());

        return false;

    } finally {

        try { if(ps != null) ps.close(); } catch(Exception e){}
        try { if(con != null) con.close(); } catch(Exception e){}
    }
}

    public boolean actualizarVariante(VarianteProducto v) {
        Connection con = null;
        PreparedStatement ps = null;

        try {
            con = Conexion.getConexion();
            String sql = "UPDATE VariantesProducto SET talla = ?, color = ?, stock = ?, sku = ?, stockMinimo = ? WHERE idVariantes = ?";
            ps = con.prepareStatement(sql);
            ps.setString(1, v.getTalla());
            ps.setString(2, v.getColor());
            ps.setInt(3, v.getStock());
            ps.setString(4, v.getSku());
            ps.setInt(5, v.getStockMinimo());
            ps.setInt(6, v.getIdVariantes());

            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            System.out.println("Error actualizarVariante: " + e.getMessage());
            return false;
        } finally {
            try { if (ps != null) ps.close(); } catch (Exception e) {}
            try { if (con != null) con.close(); } catch (Exception e) {}
        }
    }
}