package com.elixirflexx.model;

public class VarianteProducto {

    private int idVariantes;
    private int idProducto;

    private String talla;
    private String color;

    private int stock;

    private String sku;

    private int stockMinimo;

    public VarianteProducto() {
    }

    public int getIdVariantes() {
        return idVariantes;
    }

    public void setIdVariantes(int idVariantes) {
        this.idVariantes = idVariantes;
    }

    public int getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(int idProducto) {
        this.idProducto = idProducto;
    }

    public String getTalla() {
        return talla;
    }

    public void setTalla(String talla) {
        this.talla = talla;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public int getStockMinimo() {
        return stockMinimo;
    }

    public void setStockMinimo(int stockMinimo) {
        this.stockMinimo = stockMinimo;
    }
}