package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.Producto;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ProductoDao {

    // ════════════════════════════════════════════════════════════════
    // HELPER PRIVADO: mapea una fila del ResultSet a un objeto Producto
    // listarLanzamientos y obtenerPorId.
    // ════════════════════════════════════════════════════════════════
    private Producto mapearProducto(ResultSet rs) throws SQLException {
        Producto p = new Producto();
        p.setIdProducto(rs.getInt("idProducto"));
        p.setNombreProducto(rs.getString("nombreProducto"));
        p.setSlug(rs.getString("slug"));
        p.setDescripcion(rs.getString("descripcion"));
        p.setPrecioBase(rs.getDouble("precioBase"));
        p.setPorcentajeDescuento(rs.getInt("porcentajeDescuento"));
        p.setEsNuevo(rs.getBoolean("esNuevo"));
        p.setEsDestacado(rs.getBoolean("esDestacado"));
        p.setIdCategorias(rs.getInt("idCategorias"));
        p.setOrigen(rs.getString("origen"));
        p.setMaterial(rs.getString("material"));
        p.setInstruccionesLavado(rs.getString("instruccionesLavado"));
        p.setPeso(rs.getDouble("peso"));
        p.setActivo(rs.getBoolean("activo"));
        p.setTotalVentas(rs.getInt("totalVentas"));
        p.setFechaCreacion(rs.getTimestamp("fechaCreacion"));
        return p;
    }

    // ── LISTAR TODOS LOS PRODUCTOS ACTIVOS ───────────────────────────────────
    public List<Producto> listarProductos() {
        List<Producto> lista = new ArrayList<>();
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(
                 "SELECT * FROM Productos WHERE activo = TRUE ORDER BY fechaCreacion DESC")) {

            ResultSet rs = ps.executeQuery();
            while (rs.next()) lista.add(mapearProducto(rs));

        } catch (SQLException e) {
            System.out.println("❌ Error listarProductos: " + e.getMessage());
        }
        return lista;
    }

    // ── LISTAR ÚLTIMOS 3 LANZAMIENTOS ────────────────────────────────────────
    public List<Producto> listarLanzamientos() {
        List<Producto> lista = new ArrayList<>();
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(
                 "SELECT * FROM Productos WHERE activo = TRUE ORDER BY fechaCreacion DESC LIMIT 3")) {

            ResultSet rs = ps.executeQuery();
            while (rs.next()) lista.add(mapearProducto(rs));

        } catch (SQLException e) {
            System.out.println("❌ Error listarLanzamientos: " + e.getMessage());
        }
        return lista;
    }

    // ── OBTENER PRODUCTO POR ID ───────────────────────────────────────────────
    public Producto obtenerPorId(int id) {
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(
                 "SELECT * FROM Productos WHERE idProducto = ? AND activo = TRUE")) {

            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapearProducto(rs);

        } catch (SQLException e) {
            System.out.println("❌ Error obtenerPorId: " + e.getMessage());
        }
        return null;
    }

    // ── REGISTRAR PRODUCTO NUEVO ──────────────────────────────────────────────
    public boolean registrarProducto(Producto p) {
        String sql =
            "INSERT INTO Productos " +
            "(nombreProducto, slug, descripcion, precioBase, porcentajeDescuento, " +
            "esNuevo, esDestacado, idCategorias, origen, material, instruccionesLavado, peso, activo) " +
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";

        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1,  p.getNombreProducto());
            ps.setString(2,  p.getSlug());
            ps.setString(3,  p.getDescripcion());
            ps.setDouble(4,  p.getPrecioBase());
            ps.setInt(5,     p.getPorcentajeDescuento());
            ps.setBoolean(6, p.isEsNuevo());
            ps.setBoolean(7, p.isEsDestacado());
            ps.setInt(8,     p.getIdCategorias());
            ps.setString(9,  p.getOrigen());
            ps.setString(10, p.getMaterial());
            ps.setString(11, p.getInstruccionesLavado());
            ps.setDouble(12, p.getPeso());
            ps.setBoolean(13, true);

            boolean ok = ps.executeUpdate() > 0;
            if (ok) System.out.println("✅ Producto registrado: " + p.getNombreProducto());
            return ok;

        } catch (SQLException e) {
            System.out.println("❌ Error registrarProducto: " + e.getMessage());
            return false;
        }
    }

    // ── ACTUALIZAR PRODUCTO (para la acción 'actualizar' del admin) ───────────
    public boolean actualizarProducto(Producto p) {
        String sql =
            "UPDATE Productos SET " +
            "nombreProducto=?, slug=?, descripcion=?, precioBase=?, " +
            "porcentajeDescuento=?, idCategorias=? " +
            "WHERE idProducto=?";

        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, p.getNombreProducto());
            ps.setString(2, p.getSlug());
            ps.setString(3, p.getDescripcion());
            ps.setDouble(4, p.getPrecioBase());
            ps.setInt(5,    p.getPorcentajeDescuento());
            ps.setInt(6,    p.getIdCategorias());
            ps.setInt(7,    p.getIdProducto());

            boolean ok = ps.executeUpdate() > 0;
            if (ok) System.out.println("✅ Producto actualizado: ID " + p.getIdProducto());
            return ok;

        } catch (SQLException e) {
            System.out.println("❌ Error actualizarProducto: " + e.getMessage());
            return false;
        }
    }

    // ── DESACTIVAR PRODUCTO (soft delete — no borra de la BD) ─────────────────
    public boolean desactivarProducto(int id) {
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(
                 "UPDATE Productos SET activo = FALSE WHERE idProducto = ?")) {

            ps.setInt(1, id);
            boolean ok = ps.executeUpdate() > 0;
            if (ok) System.out.println("✅ Producto desactivado: ID " + id);
            return ok;

        } catch (SQLException e) {
            System.out.println("❌ Error desactivarProducto: " + e.getMessage());
            return false;
        }
    }

    // ── BUSCAR PRODUCTOS POR NOMBRE, DESCRIPCIÓN O CATEGORÍA ───────────────────
    public List<Producto> buscarProductos(String query) {
        List<Producto> lista = new ArrayList<>();
        String sql = "SELECT p.* FROM Productos p " +
                     "LEFT JOIN Categorias c ON p.idCategorias = c.idCategorias " +
                     "WHERE p.activo = TRUE AND (" +
                     "p.nombreProducto LIKE ? OR " +
                     "p.descripcion LIKE ? OR " +
                     "c.nombreCategoria LIKE ?) " +
                     "ORDER BY p.fechaCreacion DESC";
        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {

            String likeQuery = "%" + query.trim() + "%";
            ps.setString(1, likeQuery);
            ps.setString(2, likeQuery);
            ps.setString(3, likeQuery);

            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                lista.add(mapearProducto(rs));
            }

        } catch (SQLException e) {
            System.out.println("❌ Error buscarProductos: " + e.getMessage());
        }
        return lista;
    }
}
