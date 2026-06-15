package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.Direcciones;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DireccionDao {

    public List<Direcciones> listarPorUsuario(int idUsuarios) {

        List<Direcciones> lista = new ArrayList<>();

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "SELECT * FROM Direcciones " +
                    "WHERE idUsuarios = ? " +
                    "ORDER BY esPredeterminada DESC";

            ps = con.prepareStatement(sql);
            ps.setInt(1, idUsuarios);

            rs = ps.executeQuery();

            while(rs.next()) {

                Direcciones d = new Direcciones();

                d.setIdDirecciones(rs.getInt("idDirecciones"));
                d.setIdUsuarios(rs.getInt("idUsuarios"));
                d.setAlias(rs.getString("alias"));
                d.setCalle(rs.getString("calle"));
                d.setCiudad(rs.getString("ciudad"));
                d.setDepartamento(rs.getString("departamento"));
                d.setBarrio(rs.getString("barrio"));
                d.setCodigoPostal(rs.getString("codigoPostal"));
                d.setIndicaciones(rs.getString("indicaciones"));
                d.setEsPredeterminada(rs.getBoolean("esPredeterminada"));

                lista.add(d);
            }

        } catch(Exception e) {

            System.out.println("Error listarPorUsuario: " + e.getMessage());

        } finally {

            try { if(rs!=null) rs.close(); } catch(Exception e){}
            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }

        return lista;
    }

    public Direcciones obtenerPorId(int idDirecciones) {

        Direcciones d = null;

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "SELECT * FROM Direcciones " +
                    "WHERE idDirecciones = ?";

            ps = con.prepareStatement(sql);
            ps.setInt(1, idDirecciones);

            rs = ps.executeQuery();

            if(rs.next()) {

                d = new Direcciones();

                d.setIdDirecciones(rs.getInt("idDirecciones"));
                d.setIdUsuarios(rs.getInt("idUsuarios"));
                d.setAlias(rs.getString("alias"));
                d.setCalle(rs.getString("calle"));
                d.setCiudad(rs.getString("ciudad"));
                d.setDepartamento(rs.getString("departamento"));
                d.setBarrio(rs.getString("barrio"));
                d.setCodigoPostal(rs.getString("codigoPostal"));
                d.setIndicaciones(rs.getString("indicaciones"));
                d.setEsPredeterminada(rs.getBoolean("esPredeterminada"));
            }

        } catch(Exception e) {

            System.out.println("Error obtenerPorId: " + e.getMessage());

        } finally {

            try { if(rs!=null) rs.close(); } catch(Exception e){}
            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }

        return d;
    }

    public boolean registrarDireccion(Direcciones d) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            if(d.isEsPredeterminada()) {

                String reset =
                        "UPDATE Direcciones " +
                        "SET esPredeterminada = FALSE " +
                        "WHERE idUsuarios = ?";

                PreparedStatement psReset =
                        con.prepareStatement(reset);

                psReset.setInt(1, d.getIdUsuarios());
                psReset.executeUpdate();
                psReset.close();
            }

            String sql =
                    "INSERT INTO Direcciones " +
                    "(idUsuarios,alias,calle,ciudad,departamento,barrio,codigoPostal,indicaciones,esPredeterminada) " +
                    "VALUES (?,?,?,?,?,?,?,?,?)";

            ps = con.prepareStatement(sql);

            ps.setInt(1, d.getIdUsuarios());
            ps.setString(2, d.getAlias());
            ps.setString(3, d.getCalle());
            ps.setString(4, d.getCiudad());
            ps.setString(5, d.getDepartamento());
            ps.setString(6, d.getBarrio());
            ps.setString(7, d.getCodigoPostal());
            ps.setString(8, d.getIndicaciones());
            ps.setBoolean(9, d.isEsPredeterminada());

            return ps.executeUpdate() > 0;

        } catch(Exception e) {

            System.out.println("Error registrarDireccion: " + e.getMessage());
            return false;

        } finally {

            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }
    }
}