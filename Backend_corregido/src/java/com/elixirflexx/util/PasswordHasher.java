package com.elixirflexx.util;

import java.security.SecureRandom;
import java.util.Base64;

public class PasswordHasher {

    private static final int SALT_LENGTH = 16;
    private static final int ITERATIONS = 10000;
    private static final int KEY_LENGTH = 256;

    public static String hashPassword(String password) {
        try {
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[SALT_LENGTH];
            random.nextBytes(salt);
            
            javax.crypto.SecretKeyFactory factory = javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            javax.crypto.spec.PBEKeySpec spec = new javax.crypto.spec.PBEKeySpec(
                password.toCharArray(), 
                salt, 
                ITERATIONS, 
                KEY_LENGTH
            );
            byte[] hash = factory.generateSecret(spec).getEncoded();
            
            return Base64.getEncoder().encodeToString(salt) + ":" + 
                   Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error al hashear contraseña", e);
        }
    }

    public static boolean verifyPassword(String password, String storedHash) {
        try {
            String[] parts = storedHash.split(":");
            if (parts.length != 2) return false;
            
            byte[] salt = Base64.getDecoder().decode(parts[0]);
            byte[] storedHashBytes = Base64.getDecoder().decode(parts[1]);
            
            javax.crypto.SecretKeyFactory factory = javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            javax.crypto.spec.PBEKeySpec spec = new javax.crypto.spec.PBEKeySpec(
                password.toCharArray(), 
                salt, 
                ITERATIONS, 
                KEY_LENGTH
            );
            byte[] testHash = factory.generateSecret(spec).getEncoded();
            
            return java.security.MessageDigest.isEqual(storedHashBytes, testHash);
        } catch (Exception e) {
            return false;
        }
    }
}
