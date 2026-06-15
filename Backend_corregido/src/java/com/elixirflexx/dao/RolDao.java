package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.Rol;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import java.util.ArrayList;
import java.util.List;

public class RolDao {

    public List<Rol> listarRoles() {

        List<Rol> lista = new ArrayList<>();

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "SELECT * " +
                    "FROM Roles " +
                    "ORDER BY nombreRol";

            ps = con.prepareStatement(sql);

            rs = ps.executeQuery();

            while(rs.next()) {

                Rol rol = new Rol();

                rol.setIdRol(
                        rs.getInt("idRol"));

                rol.setNombreRol(
                        rs.getString("nombreRol"));

                rol.setDescripcion(
                        rs.getString("descripcion"));

                lista.add(rol);
            }

        } catch(Exception e) {

            System.out.println(
                    "Error listarRoles: "
                    + e.getMessage());

        } finally {

            try { if(rs!=null) rs.close(); } catch(Exception e){}
            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }

        return lista;
    }

    public Rol obtenerPorId(int idRol) {

        Rol rol = null;

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "SELECT * " +
                    "FROM Roles " +
                    "WHERE idRol = ?";

            ps = con.prepareStatement(sql);

            ps.setInt(1, idRol);

            rs = ps.executeQuery();

            if(rs.next()) {

                rol = new Rol();

                rol.setIdRol(
                        rs.getInt("idRol"));

                rol.setNombreRol(
                        rs.getString("nombreRol"));

                rol.setDescripcion(
                        rs.getString("descripcion"));
            }

        } catch(Exception e) {

            System.out.println(
                    "Error obtenerPorId: "
                    + e.getMessage());

        } finally {

            try { if(rs!=null) rs.close(); } catch(Exception e){}
            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }

        return rol;
    }

    public boolean registrarRol(Rol rol) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "INSERT INTO Roles " +
                    "(nombreRol, descripcion) " +
                    "VALUES (?, ?)";

            ps = con.prepareStatement(sql);

            ps.setString(
                    1,
                    rol.getNombreRol());

            ps.setString(
                    2,
                    rol.getDescripcion());

            return ps.executeUpdate() > 0;

        } catch(Exception e) {

            System.out.println(
                    "Error registrarRol: "
                    + e.getMessage());

            return false;

        } finally {

            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }
    }
}