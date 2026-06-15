package com.elixirflexx.model;

public class DetallePedido {

    private int idDetallePedidos;

    private int idPedidos;

    private int idVariantes;

    private int cantidad;

    private String tallaSnapshot;

    private String colorSnapshot;

    private String nombreSnapshot;

    private double precioUnitario;

    public DetallePedido() {
    }

    public int getIdDetallePedidos() {
        return idDetallePedidos;
    }

    public void setIdDetallePedidos(int idDetallePedidos) {
        this.idDetallePedidos = idDetallePedidos;
    }

    public int getIdPedidos() {
        return idPedidos;
    }

    public void setIdPedidos(int idPedidos) {
        this.idPedidos = idPedidos;
    }

    public int getIdVariantes() {
        return idVariantes;
    }

    public void setIdVariantes(int idVariantes) {
        this.idVariantes = idVariantes;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public String getTallaSnapshot() {
        return tallaSnapshot;
    }

    public void setTallaSnapshot(String tallaSnapshot) {
        this.tallaSnapshot = tallaSnapshot;
    }

    public String getColorSnapshot() {
        return colorSnapshot;
    }

    public void setColorSnapshot(String colorSnapshot) {
        this.colorSnapshot = colorSnapshot;
    }

    public String getNombreSnapshot() {
        return nombreSnapshot;
    }

    public void setNombreSnapshot(String nombreSnapshot) {
        this.nombreSnapshot = nombreSnapshot;
    }

    public double getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(double precioUnitario) {
        this.precioUnitario = precioUnitario;
    }
}