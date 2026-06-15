package com.elixirflexx.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Conexion {
    
    // 1. Datos de configuración de mi base de datos
    public static final String DATABASE = "ElixirAndFlexx";
    public static final String URL = "jdbc:mysql://localhost:3306/" + DATABASE + "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
    public static final String USER = "root";       // el usuario de su MySQL
    public static final String PASSWORD = "yuya123";       // la contraseña de su MySQL

    // 2. Método para conectar con la BD
    public static Connection getConexion() {
        Connection cn = null;
        try {
            // Cargamos el Driver de MySQL para que Java lo reconozca
            Class.forName("com.mysql.cj.jdbc.Driver");
            // Abrimos la conexión
            cn = DriverManager.getConnection(URL, USER, PASSWORD);
            System.out.println("🔥 ¡Backend conectado a la Base de Datos!");
        } catch (ClassNotFoundException e) {
            System.out.println("❌ Error: No se encontró el Driver de MySQL (Falta el conector JAR) -> " + e.getMessage());
        } catch (SQLException e) {
            System.out.println("❌ Error de SQL al conectar a la BD -> " + e.getMessage());
        }
        return cn;
    }
}