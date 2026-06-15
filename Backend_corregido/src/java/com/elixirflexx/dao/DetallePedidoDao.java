package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.DetallePedido;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import java.util.ArrayList;
import java.util.List;

public class DetallePedidoDao {

    public boolean registrarDetalle(
            DetallePedido detalle) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            String sql =
                "INSERT INTO DetallePedidos " +
                "(idPedidos,idVariantes,cantidad," +
                "tallaSnapshot,colorSnapshot," +
                "nombreSnapshot,precioUnitario) " +
                "VALUES (?,?,?,?,?,?,?)";

            ps = con.prepareStatement(sql);

            ps.setInt(1, detalle.getIdPedidos());
            ps.setInt(2, detalle.getIdVariantes());
            ps.setInt(3, detalle.getCantidad());

            ps.setString(4,
                    detalle.getTallaSnapshot());

            ps.setString(5,
                    detalle.getColorSnapshot());

            ps.setString(6,
                    detalle.getNombreSnapshot());

            ps.setDouble(7,
                    detalle.getPrecioUnitario());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {

            System.out.println(
                "Error registrarDetalle: "
                + e.getMessage());

            return false;

        } finally {

            try{ if(ps!=null) ps.close(); }catch(Exception e){}
            try{ if(con!=null) con.close(); }catch(Exception e){}
        }
    }

    public List<DetallePedido> listarPorPedido(
            int idPedido) {

        List<DetallePedido> lista =
                new ArrayList<>();

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                "SELECT * " +
                "FROM DetallePedidos " +
                "WHERE idPedidos = ?";

            ps = con.prepareStatement(sql);

            ps.setInt(1, idPedido);

            rs = ps.executeQuery();

            while(rs.next()) {

                DetallePedido d =
                        new DetallePedido();

                d.setIdDetallePedidos(
                        rs.getInt(
                        "idDetallePedidos"));

                d.setIdPedidos(
                        rs.getInt(
                        "idPedidos"));

                d.setIdVariantes(
                        rs.getInt(
                        "idVariantes"));

                d.setCantidad(
                        rs.getInt(
                        "cantidad"));

                d.setTallaSnapshot(
                        rs.getString(
                        "tallaSnapshot"));

                d.setColorSnapshot(
                        rs.getString(
                        "colorSnapshot"));

                d.setNombreSnapshot(
                        rs.getString(
                        "nombreSnapshot"));

                d.setPrecioUnitario(
                        rs.getDouble(
                        "precioUnitario"));

                lista.add(d);
            }

        } catch(Exception e) {

            System.out.println(
                "Error listarPorPedido: "
                + e.getMessage());

        } finally {

            try{ if(rs!=null) rs.close(); }catch(Exception e){}
            try{ if(ps!=null) ps.close(); }catch(Exception e){}
            try{ if(con!=null) con.close(); }catch(Exception e){}
        }

        return lista;
    }
}