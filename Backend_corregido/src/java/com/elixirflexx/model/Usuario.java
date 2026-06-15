package com.elixirflexx.model;

import java.sql.Timestamp;

public class Usuario {

    private int idUsuarios;
    private String nombre;
    private String apellido;
    private int edad;
    private String email;

    private String contraseña;

    private String telefono;
    private String fotoPerfil;
    private int idRol;
    private String estado;
    private boolean emailVerificado;
    private String tokenVerificacion;
    private Timestamp fechaRegistro;

    public Usuario() {}

    public int getIdUsuarios() { return idUsuarios; }
    public void setIdUsuarios(int idUsuarios) { this.idUsuarios = idUsuarios; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public int getEdad() { return edad; }
    public void setEdad(int edad) { this.edad = edad; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    // ── Sin ñ ──────────────────────────────────────────────────────────────
    public String getContraseña() { return contraseña; }
    public void setContraseña(String contraseña) { this.contraseña = contraseña; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getFotoPerfil() { return fotoPerfil; }
    public void setFotoPerfil(String fotoPerfil) { this.fotoPerfil = fotoPerfil; }

    public int getIdRol() { return idRol; }
    public void setIdRol(int idRol) { this.idRol = idRol; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public boolean isEmailVerificado() { return emailVerificado; }
    public void setEmailVerificado(boolean emailVerificado) { this.emailVerificado = emailVerificado; }

    public String getTokenVerificacion() { return tokenVerificacion; }
    public void setTokenVerificacion(String tokenVerificacion) { this.tokenVerificacion = tokenVerificacion; }

    public Timestamp getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(Timestamp fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    public String getNombreCompleto() { return nombre + " " + apellido; }

    // idRol 2 = administrador, 1 = cliente (ver Roles en el SQL)
    public boolean esAdmin()    { return idRol == 2; }
    public boolean esCliente()  { return idRol == 1; }
}
