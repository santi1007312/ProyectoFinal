package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.Pedido;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class PedidoDao {

    // Crear un pedido nuevo (cuando el cliente confirma el carrito)
    public int crearPedido(Pedido pedido) {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        int idGenerado = -1;

        try {
            con = Conexion.getConexion();
            if (con == null) return -1;

            String sql = "INSERT INTO Pedidos (idUsuarios, total, estado, fechaPedido, direccionEnvio) "
                       + "VALUES (?, ?, 'pendiente', NOW(), ?)";
            ps = con.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS);
            ps.setInt(1, pedido.getIdUsuarios());
            ps.setDouble(2, pedido.getTotal());
            ps.setString(3, pedido.getDireccionEnvio());

            int filas = ps.executeUpdate();
            if (filas > 0) {
                rs = ps.getGeneratedKeys();
                if (rs.next()) {
                    idGenerado = rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            System.out.println("❌ Error al crear pedido: " + e.getMessage());
        } finally {
            try { if (rs != null) rs.close(); } catch (Exception e) {}
            try { if (ps != null) ps.close(); } catch (Exception e) {}
            try { if (con != null) con.close(); } catch (Exception e) {}
        }
        return idGenerado;
    }

    // Listar pedidos de un cliente específico
    public List<Pedido> listarPorUsuario(int idUsuarios) {
        List<Pedido> lista = new ArrayList<>();
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            con = Conexion.getConexion();
            if (con == null) return lista;

            String sql = "SELECT * FROM Pedidos WHERE idUsuarios = ? ORDER BY fechaPedido DESC";
            ps = con.prepareStatement(sql);
            ps.setInt(1, idUsuarios);
            rs = ps.executeQuery();

            while (rs.next()) {
                Pedido p = new Pedido();
                p.setIdPedido(rs.getInt("idPedido"));
                p.setIdUsuarios(rs.getInt("idUsuarios"));
                p.setTotal(rs.getDouble("total"));
                p.setEstado(rs.getString("estado"));
                p.setFechaPedido(rs.getTimestamp("fechaPedido"));
                p.setDireccionEnvio(rs.getString("direccionEnvio"));
                lista.add(p);
            }
        } catch (SQLException e) {
            System.out.println("❌ Error al listar pedidos: " + e.getMessage());
        } finally {
            try { if (rs != null) rs.close(); } catch (Exception e) {}
            try { if (ps != null) ps.close(); } catch (Exception e) {}
            try { if (con != null) con.close(); } catch (Exception e) {}
        }
        return lista;
    }

    // Actualizar estado de un pedido (para el admin: pendiente → enviado → entregado)
    public boolean actualizarEstado(int idPedido, String nuevoEstado) {
        Connection con = null;
        PreparedStatement ps = null;

        try {
            con = Conexion.getConexion();
            if (con == null) return false;

            String sql = "UPDATE Pedidos SET estado = ? WHERE idPedido = ?";
            ps = con.prepareStatement(sql);
            ps.setString(1, nuevoEstado);
            ps.setInt(2, idPedido);

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.out.println("❌ Error al actualizar estado del pedido: " + e.getMessage());
            return false;
        } finally {
            try { if (ps != null) ps.close(); } catch (Exception e) {}
            try { if (con != null) con.close(); } catch (Exception e) {}
        }
    }

    // Listar todos los pedidos de la tienda (para el admin)
    public List<Pedido> listarTodos() {
        List<Pedido> lista = new ArrayList<>();
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            con = Conexion.getConexion();
            if (con == null) return lista;

            String sql = "SELECT * FROM Pedidos ORDER BY fechaPedido DESC";
            ps = con.prepareStatement(sql);
            rs = ps.executeQuery();

            while (rs.next()) {
                Pedido p = new Pedido();
                p.setIdPedido(rs.getInt("idPedido"));
                p.setIdUsuarios(rs.getInt("idUsuarios"));
                p.setTotal(rs.getDouble("total"));
                p.setEstado(rs.getString("estado"));
                p.setFechaPedido(rs.getTimestamp("fechaPedido"));
                p.setDireccionEnvio(rs.getString("direccionEnvio"));
                lista.add(p);
            }
        } catch (SQLException e) {
            System.out.println("❌ Error al listar todos los pedidos: " + e.getMessage());
        } finally {
            try { if (rs != null) rs.close(); } catch (Exception e) {}
            try { if (ps != null) ps.close(); } catch (Exception e) {}
            try { if (con != null) con.close(); } catch (Exception e) {}
        }
        return lista;
    }

    // Obtener metricas basicas del negocio
    public String obtenerMetricas() {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        double ingresosTotales = 0;
        int totalPedidos = 0;
        int totalUsuarios = 0;
        int totalProductos = 0;

        try {
            con = Conexion.getConexion();
            if (con != null) {
                // Ingresos totales
                String sqlIngresos = "SELECT SUM(total) as total, COUNT(*) as count FROM Pedidos";
                ps = con.prepareStatement(sqlIngresos);
                rs = ps.executeQuery();
                if (rs.next()) {
                    ingresosTotales = rs.getDouble("total");
                    totalPedidos = rs.getInt("count");
                }
                rs.close();
                ps.close();

                // Total usuarios
                String sqlUsuarios = "SELECT COUNT(*) as count FROM Usuarios";
                ps = con.prepareStatement(sqlUsuarios);
                rs = ps.executeQuery();
                if (rs.next()) {
                    totalUsuarios = rs.getInt("count");
                }
                rs.close();
                ps.close();

                // Total productos
                String sqlProductos = "SELECT COUNT(*) as count FROM Productos WHERE activo = TRUE";
                ps = con.prepareStatement(sqlProductos);
                rs = ps.executeQuery();
                if (rs.next()) {
                    totalProductos = rs.getInt("count");
                }
            }
        } catch (SQLException e) {
            System.out.println("❌ Error al obtener metricas: " + e.getMessage());
        } finally {
            try { if (rs != null) rs.close(); } catch (Exception e) {}
            try { if (ps != null) ps.close(); } catch (Exception e) {}
            try { if (con != null) con.close(); } catch (Exception e) {}
        }

        return String.format(
            "{\"ingresosTotales\":%.2f,\"totalPedidos\":%d,\"totalUsuarios\":%d,\"totalProductos\":%d}",
            ingresosTotales, totalPedidos, totalUsuarios, totalProductos
        );
    }
}
