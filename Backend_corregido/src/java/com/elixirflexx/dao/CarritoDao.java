package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.Carrito;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CarritoDao {

    // Método para agregar un producto al carrito
    public boolean agregarAlCarrito(Carrito item) {
        Connection con = null;
        PreparedStatement psBuscar = null;
        PreparedStatement psAccion = null;
        ResultSet rs = null;
        boolean exito = false;

        try {
            con = Conexion.getConexion();
            if (con == null) return false;

            // 1. Verificar si el usuario ya tiene esa variante exacta en su carrito
            String sqlBuscar = "SELECT idCarrito, cantidad FROM Carrito WHERE idUsuarios = ? AND idVariantes = ?";
            psBuscar = con.prepareStatement(sqlBuscar);
            psBuscar.setInt(1, item.getIdUsuarios());
            psBuscar.setInt(2, item.getIdVariantes());
            rs = psBuscar.executeQuery();

            if (rs.next()) {
                // Si ya existe, le sumamos la nueva cantidad a la que ya tenía
                int idCarritoExistente = rs.getInt("idCarrito");
                int nuevaCantidad = rs.getInt("cantidad") + item.getCantidad();

                String sqlUpdate = "UPDATE Carrito SET cantidad = ? WHERE idCarrito = ?";
                psAccion = con.prepareStatement(sqlUpdate);
                psAccion.setInt(1, nuevaCantidad);
                psAccion.setInt(2, idCarritoExistente);
            } else {
                // Si no existe, lo insertamos desde cero
                String sqlInsert = "INSERT INTO Carrito (idUsuarios, idVariantes, cantidad) VALUES (?, ?, ?)";
                psAccion = con.prepareStatement(sqlInsert);
                psAccion.setInt(1, item.getIdUsuarios());
                psAccion.setInt(2, item.getIdVariantes());
                psAccion.setInt(3, item.getCantidad());
            }

            int filas = psAccion.executeUpdate();
            if (filas > 0) exito = true;

        } catch (SQLException e) {
            System.out.println("❌ Error en CarritoDao.agregarAlCarrito: " + e.getMessage());
        } finally {
            try { if (rs != null) rs.close(); } catch (Exception e) {}
            try { if (psBuscar != null) psBuscar.close(); } catch (Exception e) {}
            try { if (psAccion != null) psAccion.close(); } catch (Exception e) {}
            try { if (con != null) con.close(); } catch (Exception e) {}
        }
        return exito;
    }

    // Método para eliminar un artículo del carrito
    public boolean eliminarDelCarrito(int idCarrito) {
        Connection con = null;
        PreparedStatement ps = null;
        boolean exito = false;

        try {
            con = Conexion.getConexion();
            if (con == null) return false;

            String sql = "DELETE FROM Carrito WHERE idCarrito = ?";
            ps = con.prepareStatement(sql);
            ps.setInt(1, idCarrito);

            int filas = ps.executeUpdate();
            if (filas > 0) exito = true;

        } catch (SQLException e) {
            System.out.println("❌ Error en CarritoDao.eliminarDelCarrito: " + e.getMessage());
        } finally {
            try { if (ps != null) ps.close(); } catch (Exception e) {}
            try { if (con != null) con.close(); } catch (Exception e) {}
        }
        return exito;
    }
    
    public List<Carrito> listarCarritoUsuario(int idUsuario) {

        List<Carrito> lista = new ArrayList<>();

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "SELECT * FROM Carrito " +
                    "WHERE idUsuarios = ?";

            ps = con.prepareStatement(sql);
            ps.setInt(1, idUsuario);

            rs = ps.executeQuery();

            while(rs.next()) {

                Carrito item = new Carrito();

                item.setIdCarrito(
                        rs.getInt("idCarrito"));

                item.setIdUsuarios(
                        rs.getInt("idUsuarios"));

                item.setIdVariantes(
                        rs.getInt("idVariantes"));

                item.setCantidad(
                        rs.getInt("cantidad"));

                lista.add(item);
            }

        } catch(Exception e) {

            System.out.println(
                    "Error listarCarritoUsuario: "
                    + e.getMessage());

        } finally {

            try { if(rs!=null) rs.close(); } catch(Exception e){}
            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }

        return lista;
    }
    
    public boolean actualizarCantidad(
        int idCarrito,
        int cantidad) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "UPDATE Carrito " +
                    "SET cantidad = ? " +
                    "WHERE idCarrito = ?";

            ps = con.prepareStatement(sql);

            ps.setInt(1, cantidad);
            ps.setInt(2, idCarrito);

            return ps.executeUpdate() > 0;

        } catch(Exception e) {

            System.out.println(
                    "Error actualizarCantidad: "
                    + e.getMessage());

            return false;

        } finally {

            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }
    }
    
    public boolean vaciarCarrito(int idUsuario) {

        Connection con = null;
        PreparedStatement ps = null;

        try {

            con = Conexion.getConexion();

            String sql =
                    "DELETE FROM Carrito " +
                    "WHERE idUsuarios = ?";

            ps = con.prepareStatement(sql);

            ps.setInt(1, idUsuario);

            return ps.executeUpdate() > 0;

        } catch(Exception e) {

            System.out.println(
                    "Error vaciarCarrito: "
                    + e.getMessage());

            return false;

        } finally {

            try { if(ps!=null) ps.close(); } catch(Exception e){}
            try { if(con!=null) con.close(); } catch(Exception e){}
        }
    }
}