package com.elixirflexx.dao;

import com.elixirflexx.config.Conexion;
import com.elixirflexx.model.Usuario;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import java.util.ArrayList;
import java.util.List;

public class UsuarioDao {

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    public Usuario login(String email, String contraseña) {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            con = Conexion.getConexion();
            // Comparación en texto plano (columna password en BD)
            String sql = "SELECT * FROM Usuarios WHERE email = ? AND password = ?";
            ps = con.prepareStatement(sql);
            ps.setString(1, email);
            ps.setString(2, contraseña);
            rs = ps.executeQuery();
            if (rs.next()) {
                return mapearUsuario(rs);
            }
        } catch (Exception e) {
            System.err.println("Error en login DAO: " + e.getMessage());
            e.printStackTrace();
        } finally {
            cerrar(rs, ps, con);
        }
        return null;
    }

    // ── REGISTRO ──────────────────────────────────────────────────────────────
    public boolean registrarUsuario(Usuario usuario) {
        Connection con = null;
        PreparedStatement ps = null;
        try {
            con = Conexion.getConexion();

            // NOTA: la columna se llama "password" (renombrada en alter_table.sql / fix_contraseñas.sql)
            String sql =
                "INSERT INTO Usuarios " +
                "(nombre, apellido, edad, email, password, " +
                "telefono, fotoPerfil, idRol, estado, " +
                "emailVerificado, tokenVerificacion) " +
                "VALUES (?,?,?,?,?,?,?,?,?,?,?)";

            ps = con.prepareStatement(sql);
            ps.setString(1, usuario.getNombre());
            ps.setString(2, usuario.getApellido());
            ps.setInt(3, usuario.getEdad());
            ps.setString(4, usuario.getEmail());
            ps.setString(5, usuario.getContraseña());
            ps.setString(6, usuario.getTelefono());
            ps.setString(7, usuario.getFotoPerfil());
            
            // Si el rol es menor o igual a 0, ponemos por defecto 1 (cliente) para evitar violación de FK
            int rolId = usuario.getIdRol();
            if (rolId <= 0) {
                rolId = 1;
            }
            ps.setInt(8, rolId);
            
            // Si el estado es nulo o vacío, asignamos "activo"
            String estado = usuario.getEstado();
            if (estado == null || estado.isBlank()) {
                estado = "activo";
            }
            ps.setString(9, estado);
            
            ps.setBoolean(10, usuario.isEmailVerificado());
            ps.setString(11, usuario.getTokenVerificacion());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            System.err.println("❌ Error registrarUsuario en DAO: " + e.getMessage());
            e.printStackTrace();
            return false;
        } finally {
            cerrar(ps, con);
        }
    }

    // ── OBTENER POR ID ────────────────────────────────────────────────────────
    public Usuario obtenerPorId(int idUsuarios) {

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            con = Conexion.getConexion();
            String sql = "SELECT * FROM Usuarios WHERE idUsuarios = ?";
            ps = con.prepareStatement(sql);
            ps.setInt(1, idUsuarios);
            rs = ps.executeQuery();

            if (rs.next()) return mapearUsuario(rs);

        } catch (Exception e) {
            System.out.println("Error obtenerPorId: " + e.getMessage());
        } finally {
            cerrar(rs, ps, con);
        }
        return null;
    }

    // ── OBTENER POR EMAIL ─────────────────────────────────────────────────────
    public Usuario obtenerPorEmail(String email) {

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            con = Conexion.getConexion();
            String sql = "SELECT * FROM Usuarios WHERE email = ?";
            ps = con.prepareStatement(sql);
            ps.setString(1, email);
            rs = ps.executeQuery();

            if (rs.next()) return mapearUsuario(rs);

        } catch (Exception e) {
            System.out.println("Error obtenerPorEmail: " + e.getMessage());
        } finally {
            cerrar(rs, ps, con);
        }
        return null;
    }

    // ── LISTAR TODOS ──────────────────────────────────────────────────────────
    public List<Usuario> listarUsuarios() {

        List<Usuario> lista = new ArrayList<>();

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            con = Conexion.getConexion();
            String sql = "SELECT * FROM Usuarios ORDER BY fechaRegistro DESC";
            ps = con.prepareStatement(sql);
            rs = ps.executeQuery();

            while (rs.next()) {
                lista.add(mapearUsuario(rs));
            }

        } catch (Exception e) {
            System.out.println("Error listarUsuarios: " + e.getMessage());
        } finally {
            cerrar(rs, ps, con);
        }
        return lista;
    }

    // ── CAMBIAR ESTADO ────────────────────────────────────────────────────────
    public boolean cambiarEstado(int idUsuarios, String estado) {

        Connection con = null;
        PreparedStatement ps = null;

        try {
            con = Conexion.getConexion();
            String sql = "UPDATE Usuarios SET estado = ? WHERE idUsuarios = ?";
            ps = con.prepareStatement(sql);
            ps.setString(1, estado);
            ps.setInt(2, idUsuarios);
            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            System.out.println("Error cambiarEstado: " + e.getMessage());
            return false;
        } finally {
            cerrar(ps, con);
        }
    }

    // ── MAPPER ────────────────────────────────────────────────────────────────
    private Usuario mapearUsuario(ResultSet rs) throws Exception {

        Usuario u = new Usuario();

        u.setIdUsuarios(rs.getInt("idUsuarios"));
        u.setNombre(rs.getString("nombre"));
        u.setApellido(rs.getString("apellido"));
        u.setEdad(rs.getInt("edad"));
        u.setEmail(rs.getString("email"));

        // La columna en BD se llama "password" (renombrada en alter_table.sql)
        u.setContraseña(rs.getString("password"));

        u.setTelefono(rs.getString("telefono"));
        u.setFotoPerfil(rs.getString("fotoPerfil"));
        u.setIdRol(rs.getInt("idRol"));
        u.setEstado(rs.getString("estado"));
        u.setEmailVerificado(rs.getBoolean("emailVerificado"));
        u.setTokenVerificacion(rs.getString("tokenVerificacion"));
        u.setFechaRegistro(rs.getTimestamp("fechaRegistro"));

        return u;
    }

    // ── HELPERS CLOSE ─────────────────────────────────────────────────────────
    private void cerrar(PreparedStatement ps, Connection con) {
        try { if (ps  != null) ps.close();  } catch (Exception e) {}
        try { if (con != null) con.close(); } catch (Exception e) {}
    }

    private void cerrar(ResultSet rs, PreparedStatement ps, Connection con) {
        try { if (rs  != null) rs.close();  } catch (Exception e) {}
        cerrar(ps, con);
    }
}
