package com.elixirflexx.model;

public class Carrito {
    private int idCarrito;
    private int idUsuarios;
    private int idVariantes; // Recuerde que añadimos variantes (talla/color)
    private int cantidad;

    public Carrito() {}

    // Getters y Setters respetando su estilo estándar
    public int getIdCarrito() { return idCarrito; }
    public void setIdCarrito(int idCarrito) { this.idCarrito = idCarrito; }

    public int getIdUsuarios() { return idUsuarios; }
    public void setIdUsuarios(int idUsuarios) { this.idUsuarios = idUsuarios; }

    public int getIdVariantes() { return idVariantes; }
    public void setIdVariantes(int idVariantes) { this.idVariantes = idVariantes; }

    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
}