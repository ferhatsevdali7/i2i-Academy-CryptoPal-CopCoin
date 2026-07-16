package com.i2i.cryptopal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

// kullanıc adı ve şifre girdisi doğru oldupunda
// backenten frontende gönderilecek olan onay ve bilgi paketi
// güvenlik zafiyeti oluşmasın diye şifrelenmiş şifreyi burda tutmuyoruz  (Ferhat)
@Data
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String username;
    private BigDecimal balance;
    private String message;
}
