package com.i2i.cryptopal.controller;

import com.i2i.cryptopal.dto.LoginRequest;
import com.i2i.cryptopal.dto.LoginResponse;
import com.i2i.cryptopal.dto.RegisterRequest;
import com.i2i.cryptopal.dto.RegisterResponse;
import com.i2i.cryptopal.model.User;
import com.i2i.cryptopal.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController  // rest apı denetleyicisi,  metotlardan dönen veriler otomatik json formatında olmalı demek
@RequestMapping("/api/auth")  // ön ek olıuşturma
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    // Kullanıcı kayıt endpoint'i. @Valid anotasyonu ile request içindeki kuralları tetikliyoruz.
    @PostMapping("/register")  // kayıt işlemleri HTTP POST isteğiyle ççalışacağını söler
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.registerUser(request.getUsername(), request.getPassword());
        
        RegisterResponse response = new RegisterResponse(
                user.getId(),
                user.getUsername(),
                user.getBalance(),
                "Kullanıcı başarıyla kaydedildi. Başlangıç bakiyesi tanımlandı."
        );
        // 201 created kodu dödürme kayıt başarılı
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }


    // Kullanıcı giriş isteğini HTTP POST ile karşılıyoruz
    // Gelen verileri doğrula şifreyi kontrol et ve Redise token kaydet
    // Kullanıcının güncel bakiyesini arayüzde göstermek için veritabanından çekiyoruz
    // Giriş başarılı olunca 200 OK koduyla token ve kullanıcı bilgilerini dönüyoruz

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        String token = userService.loginUser(request.getUsername(), request.getPassword());
        User user = userService.getUserByUsername(request.getUsername());

        LoginResponse response = new LoginResponse(
                token,
                user.getId(), // Giris yapan kullanicinin ID bilgisini ekledim (Ferhat)
                user.getUsername(),
                user.getBalance(),
                "Giriş başarılı. Oturum Redis üzerinde başlatıldı."
        );

        return ResponseEntity.ok(response);
    }

    // Header dan Authorization bilgisini çekiyoruz
    //Eğer token gönderilmişse ve formatı doğruysa
    //Servise gidip bu tokeni Redisten siliyoruz

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {

        String authHeader = request.getHeader("Authorization");


        if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {

            String token = authHeader.substring(7).trim();

            userService.logoutUser(token);
        }

        return ResponseEntity.ok(Map.of("message", "Çıkış başarılı. Oturum sonlandırıldı."));
    }

}
