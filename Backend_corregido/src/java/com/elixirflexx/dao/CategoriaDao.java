package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.Categoria;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import java.util.ArrayList;
import java.util.List;

public class CategoriaDao {

    public List<Categoria> listarCategorias() {

        List<Categoria> lista = new ArrayList<>();

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "SELECT * " +
                    "FROM Categorias " +
                    "WHERE activo = TRUE " +
                    "ORDER BY nombreCategoria";

            ps = con.prepareStatement(sql);

            rs = ps.executeQuery();

            while (rs.next()) {

                Categoria cat = new Categoria();

                cat.setIdCategorias(
                        rs.getInt("idCategorias"));

                cat.setNombreCategoria(
                        rs.getString("nombreCategoria"));

                cat.setDescripcion(
                        rs.getString("descripcion"));

                cat.setActivo(
                        rs.getBoolean("activo"));

                lista.add(cat);
            }

        } catch (Exception e) {

            System.out.println(
                    "Error listarCategorias: "
                    + e.getMessage());

        } finally {

            try { if(rs!=null) rs.close(); } catch(Exception e){}
            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }

        return lista;
    }

    public Categoria obtenerPorId(int idCategorias) {

        Categoria cat = null;

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "SELECT * " +
                    "FROM Categorias " +
                    "WHERE idCategorias = ?";

            ps = con.prepareStatement(sql);

            ps.setInt(1, idCategorias);

            rs = ps.executeQuery();

            if(rs.next()) {

                cat = new Categoria();

                cat.setIdCategorias(
                        rs.getInt("idCategorias"));

                cat.setNombreCategoria(
                        rs.getString("nombreCategoria"));

                cat.setDescripcion(
                        rs.getString("descripcion"));

                cat.setActivo(
                        rs.getBoolean("activo"));
            }

        } catch (Exception e) {

            System.out.println(
                    "Error obtenerPorId: "
                    + e.getMessage());

        } finally {

            try { if(rs!=null) rs.close(); } catch(Exception e){}
            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }

        return cat;
    }

    public boolean registrarCategoria(Categoria categoria) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "INSERT INTO Categorias " +
                    "(nombreCategoria,descripcion,activo) " +
                    "VALUES (?,?,TRUE)";

            ps = con.prepareStatement(sql);

            ps.setString(
                    1,
                    categoria.getNombreCategoria());

            ps.setString(
                    2,
                    categoria.getDescripcion());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {

            System.out.println(
                    "Error registrarCategoria: "
                    + e.getMessage());

            return false;

        } finally {

            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }
    }
}