package com.elixirflexx.model;

import java.sql.Timestamp;

public class MovimientoInventario {

    private int idMovimiento;

    private int idVariantes;

    private String tipoMovimiento;

    private int cantidad;

    private int stockAntes;

    private int stockDespues;

    private String motivo;

    private Integer idUsuarios;

    private Timestamp fecha;

    public MovimientoInventario() {
    }

    public int getIdMovimiento() {
        return idMovimiento;
    }

    public void setIdMovimiento(int idMovimiento) {
        this.idMovimiento = idMovimiento;
    }

    public int getIdVariantes() {
        return idVariantes;
    }

    public void setIdVariantes(int idVariantes) {
        this.idVariantes = idVariantes;
    }

    public String getTipoMovimiento() {
        return tipoMovimiento;
    }

    public void setTipoMovimiento(String tipoMovimiento) {
        this.tipoMovimiento = tipoMovimiento;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public int getStockAntes() {
        return stockAntes;
    }

    public void setStockAntes(int stockAntes) {
        this.stockAntes = stockAntes;
    }

    public int getStockDespues() {
        return stockDespues;
    }

    public void setStockDespues(int stockDespues) {
        this.stockDespues = stockDespues;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Integer getIdUsuarios() {
        return idUsuarios;
    }

    public void setIdUsuarios(Integer idUsuarios) {
        this.idUsuarios = idUsuarios;
    }

    public Timestamp getFecha() {
        return fecha;
    }

    public void setFecha(Timestamp fecha) {
        this.fecha = fecha;
    }
}