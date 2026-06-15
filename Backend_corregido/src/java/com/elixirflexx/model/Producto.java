package com.elixirflexx.model;

import java.sql.Timestamp;

public class Producto {

    private int idProducto;
    private String nombreProducto;
    private String slug;
    private String descripcion;

    private double precioBase;
    private int porcentajeDescuento;

    private boolean esNuevo;
    private boolean esDestacado;

    private int idCategorias;

    private String origen;
    private String material;
    private String instruccionesLavado;

    private double peso;

    private boolean activo;

    private int totalVentas;

    private Timestamp fechaCreacion;

    public Producto() {
    }

    public int getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(int idProducto) {
        this.idProducto = idProducto;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public double getPrecioBase() {
        return precioBase;
    }

    public void setPrecioBase(double precioBase) {
        this.precioBase = precioBase;
    }

    public int getPorcentajeDescuento() {
        return porcentajeDescuento;
    }

    public void setPorcentajeDescuento(int porcentajeDescuento) {
        this.porcentajeDescuento = porcentajeDescuento;
    }

    public boolean isEsNuevo() {
        return esNuevo;
    }

    public void setEsNuevo(boolean esNuevo) {
        this.esNuevo = esNuevo;
    }

    public boolean isEsDestacado() {
        return esDestacado;
    }

    public void setEsDestacado(boolean esDestacado) {
        this.esDestacado = esDestacado;
    }

    public int getIdCategorias() {
        return idCategorias;
    }

    public void setIdCategorias(int idCategorias) {
        this.idCategorias = idCategorias;
    }

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
    }

    public String getMaterial() {
        return material;
    }

    public void setMaterial(String material) {
        this.material = material;
    }

    public String getInstruccionesLavado() {
        return instruccionesLavado;
    }

    public void setInstruccionesLavado(String instruccionesLavado) {
        this.instruccionesLavado = instruccionesLavado;
    }

    public double getPeso() {
        return peso;
    }

    public void setPeso(double peso) {
        this.peso = peso;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public int getTotalVentas() {
        return totalVentas;
    }

    public void setTotalVentas(int totalVentas) {
        this.totalVentas = totalVentas;
    }

    public Timestamp getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(Timestamp fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
    
    public double getPrecioFinal() {
        return precioBase - (precioBase * porcentajeDescuento / 100.0);
    }
}