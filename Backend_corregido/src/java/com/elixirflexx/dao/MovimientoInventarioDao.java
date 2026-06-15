package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.MovimientoInventario;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import java.util.ArrayList;
import java.util.List;

public class MovimientoInventarioDao {

    public boolean registrarMovimiento(
            MovimientoInventario movimiento) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            String sql =
                "INSERT INTO MovimientosInventario " +
                "(idVariantes,tipoMovimiento,cantidad," +
                "stockAntes,stockDespues,motivo,idUsuarios) " +
                "VALUES (?,?,?,?,?,?,?)";

            ps = con.prepareStatement(sql);

            ps.setInt(1, movimiento.getIdVariantes());
            ps.setString(2, movimiento.getTipoMovimiento());
            ps.setInt(3, movimiento.getCantidad());
            ps.setInt(4, movimiento.getStockAntes());
            ps.setInt(5, movimiento.getStockDespues());
            ps.setString(6, movimiento.getMotivo());

            if(movimiento.getIdUsuarios() == null) {
                ps.setNull(7, java.sql.Types.INTEGER);
            } else {
                ps.setInt(7, movimiento.getIdUsuarios());
            }

            return ps.executeUpdate() > 0;

        } catch(Exception e) {

            System.out.println(
                "Error registrarMovimiento: "
                + e.getMessage());

            return false;

        } finally {

            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }
    }

    public List<MovimientoInventario>
    listarPorVariante(int idVariantes) {

        List<MovimientoInventario> lista =
                new ArrayList<>();

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                "SELECT * FROM MovimientosInventario " +
                "WHERE idVariantes = ? " +
                "ORDER BY fecha DESC";

            ps = con.prepareStatement(sql);

            ps.setInt(1, idVariantes);

            rs = ps.executeQuery();

            while(rs.next()) {

                MovimientoInventario mov =
                        new MovimientoInventario();

                mov.setIdMovimiento(
                        rs.getInt("idMovimiento"));

                mov.setIdVariantes(
                        rs.getInt("idVariantes"));

                mov.setTipoMovimiento(
                        rs.getString("tipoMovimiento"));

                mov.setCantidad(
                        rs.getInt("cantidad"));

                mov.setStockAntes(
                        rs.getInt("stockAntes"));

                mov.setStockDespues(
                        rs.getInt("stockDespues"));

                mov.setMotivo(
                        rs.getString("motivo"));

                mov.setIdUsuarios(
                        rs.getInt("idUsuarios"));

                mov.setFecha(
                        rs.getTimestamp("fecha"));

                lista.add(mov);
            }

        } catch(Exception e) {

            System.out.println(
                "Error listarPorVariante: "
                + e.getMessage());

        } finally {

            try { if(rs!=null) rs.close(); } catch(Exception e){}
            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }

        return lista;
    }
}