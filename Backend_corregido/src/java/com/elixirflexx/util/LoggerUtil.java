package com.elixirflexx.util;

import java.util.logging.*;

public class LoggerUtil {
    
    private static final Logger logger = Logger.getLogger(LoggerUtil.class.getName());
    
    static {
        try {
            FileHandler fileHandler = new FileHandler("backend.log", true);
            fileHandler.setFormatter(new SimpleFormatter());
            fileHandler.setLevel(Level.ALL);
            logger.addHandler(fileHandler);
            
            ConsoleHandler consoleHandler = new ConsoleHandler();
            consoleHandler.setLevel(Level.INFO);
            logger.addHandler(consoleHandler);
            
            logger.setLevel(Level.ALL);
        } catch (Exception e) {
            System.err.println("Error al inicializar logger: " + e.getMessage());
        }
    }
    
    public static Logger getLogger(Class<?> clazz) {
        return Logger.getLogger(clazz.getName());
    }
}
