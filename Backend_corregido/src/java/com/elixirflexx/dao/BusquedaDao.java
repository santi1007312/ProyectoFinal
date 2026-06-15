package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BusquedaDao {

    /**
     * Busca productos en la base de datos que coincidan con el término en nombre o descripción.
     * Recupera también la URL de la imagen principal.
     */
    public List<Map<String, Object>> buscarProductos(String termino) {
        List<Map<String, Object>> resultados = new ArrayList<>();
        
        // Query que busca en Productos activos que coincidan en nombreProducto o descripcion.
        // Además, obtiene la url de la imagen principal del producto de la tabla ImagenesProducto.
        String sql = 
            "SELECT p.idProducto, p.nombreProducto, p.precioBase, p.porcentajeDescuento, " +
            "  (SELECT urlImagen FROM ImagenesProducto ip WHERE ip.idProducto = p.idProducto AND ip.esPrincipal = TRUE LIMIT 1) AS imagen " +
            "FROM Productos p " +
            "WHERE p.activo = TRUE AND (p.nombreProducto LIKE ? OR p.descripcion LIKE ?)";

        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {

            String queryStr = "%" + termino.trim() + "%";
            ps.setString(1, queryStr);
            ps.setString(2, queryStr);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rs.getInt("idProducto"));
                    map.put("nombre", rs.getString("nombreProducto"));
                    
                    double precioBase = rs.getDouble("precioBase");
                    int dcto = rs.getInt("porcentajeDescuento");
                    double precioFinal = precioBase - (precioBase * dcto / 100.0);
                    
                    map.put("precio", precioFinal);
                    
                    String img = rs.getString("imagen");
                    map.put("imagen", img != null ? img : "");
                    
                    resultados.add(map);
                }
            }
        } catch (SQLException e) {
            System.err.println("❌ Error buscarProductos en BusquedaDao: " + e.getMessage());
            e.printStackTrace();
        }
        return resultados;
    }

    /**
     * Busca categorías en la base de datos que coincidan con el término en su nombre.
     */
    public List<Map<String, Object>> buscarCategorias(String termino) {
        List<Map<String, Object>> resultados = new ArrayList<>();
        
        // Query que busca categorías activas que coincidan en nombreCategoria
        String sql = 
            "SELECT idCategorias, nombreCategoria " +
            "FROM Categorias " +
            "WHERE activa = TRUE AND nombreCategoria LIKE ?";

        try (Connection con = Conexion.getConexion();
             PreparedStatement ps = con.prepareStatement(sql)) {

            String queryStr = "%" + termino.trim() + "%";
            ps.setString(1, queryStr);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rs.getInt("idCategorias"));
                    map.put("nombre", rs.getString("nombreCategoria"));
                    resultados.add(map);
                }
            }
        } catch (SQLException e) {
            System.err.println("❌ Error buscarCategorias en BusquedaDao: " + e.getMessage());
            e.printStackTrace();
        }
        return resultados;
    }
}
