package com.elixirflexx.model;

import java.sql.Timestamp;

public class Pedido {
    private int idPedido;
    private int idUsuarios;
    private double total;
    private String estado;        // pendiente, enviado, entregado, cancelado
    private Timestamp fechaPedido;
    private String direccionEnvio;

    public Pedido() {}

    public int getIdPedido() { return idPedido; }
    public void setIdPedido(int idPedido) { this.idPedido = idPedido; }

    public int getIdUsuarios() { return idUsuarios; }
    public void setIdUsuarios(int idUsuarios) { this.idUsuarios = idUsuarios; }

    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Timestamp getFechaPedido() { return fechaPedido; }
    public void setFechaPedido(Timestamp fechaPedido) { this.fechaPedido = fechaPedido; }

    public String getDireccionEnvio() { return direccionEnvio; }
    public void setDireccionEnvio(String direccionEnvio) { this.direccionEnvio = direccionEnvio; }
}
