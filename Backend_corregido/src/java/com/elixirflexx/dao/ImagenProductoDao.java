package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.ImagenProducto;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import java.util.ArrayList;
import java.util.List;

public class ImagenProductoDao {

    public List<ImagenProducto> listarPorProducto(int idProducto) {

        List<ImagenProducto> lista = new ArrayList<>();

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                "SELECT * FROM ImagenesProducto " +
                "WHERE idProducto = ? " +
                "ORDER BY esPrincipal DESC, orden ASC";

            ps = con.prepareStatement(sql);

            ps.setInt(1, idProducto);

            rs = ps.executeQuery();

            while (rs.next()) {

                ImagenProducto img =
                        new ImagenProducto();

                img.setIdImagen(
                        rs.getInt("idImagen"));

                img.setIdProducto(
                        rs.getInt("idProducto"));

                img.setUrlImagen(
                        rs.getString("urlImagen"));

                img.setAltText(
                        rs.getString("altText"));

                img.setEsPrincipal(
                        rs.getBoolean("esPrincipal"));

                img.setOrden(
                        rs.getInt("orden"));

                lista.add(img);
            }

        } catch (Exception e) {

            System.out.println(
                    "Error listarPorProducto: "
                    + e.getMessage());

        } finally {

            try { if(rs!=null) rs.close(); } catch(Exception e){}
            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }

        return lista;
    }

    public boolean registrarImagen(
            ImagenProducto imagen) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            String sql =
                "INSERT INTO ImagenesProducto " +
                "(idProducto,urlImagen,altText,esPrincipal,orden) " +
                "VALUES (?,?,?,?,?)";

            ps = con.prepareStatement(sql);

            ps.setInt(1, imagen.getIdProducto());
            ps.setString(2, imagen.getUrlImagen());
            ps.setString(3, imagen.getAltText());
            ps.setBoolean(4, imagen.isEsPrincipal());
            ps.setInt(5, imagen.getOrden());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {

            System.out.println(
                    "Error registrarImagen: "
                    + e.getMessage());

            return false;

        } finally {

            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }
    }

    public boolean eliminarImagen(int idImagen) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "DELETE FROM ImagenesProducto " +
                    "WHERE idImagen = ?";

            ps = con.prepareStatement(sql);

            ps.setInt(1, idImagen);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {

            System.out.println(
                    "Error eliminarImagen: "
                    + e.getMessage());

            return false;

        } finally {

            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }
    }
}