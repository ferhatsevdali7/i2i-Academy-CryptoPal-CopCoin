package com.i2i.cryptopal.controller;

import com.i2i.cryptopal.dto.ChangePasswordRequest;
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
// @CrossOrigin(origins = "*") buradaydı, CorsConfig.java'daki merkezi CorsFilter ile
// cakisip tarayicida CORS hatasi verdigi icin kaldirildi (Ege)
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
                user.getId(), // dashboard uclarinin (wallet/trade) ihtiyac duydugu userId artik burada donuyor (Ege)
                token,
                user.getUsername(),
                user.getBalance(),
                "Giriş başarılı."
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

    // Sifre degistirme ucu: kullanici hesap panelinden eski sifresini dogrulayip yenisini belirliyor (Ege)
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request, HttpServletRequest httpRequest) {
        Long authenticatedUserId = (Long) httpRequest.getAttribute("authenticatedUserId");

        userService.changePassword(authenticatedUserId, request.getCurrentPassword(), request.getNewPassword());

        return ResponseEntity.ok(Map.of("message", "Sifre basariyla guncellendi."));
    }

    // Hesap silme ucu: kullanici sifresini tekrar girerek onay veriyor (Ege)
    @PostMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(@RequestBody Map<String, String> body, HttpServletRequest httpRequest) {
        Long authenticatedUserId = (Long) httpRequest.getAttribute("authenticatedUserId");
        String password = body.get("password");

        userService.deleteAccount(authenticatedUserId, password);

        // hesap silinince Redis'teki oturumu da temizliyoruz, token bosta kalmasin (Ege)
        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
            userService.logoutUser(authHeader.substring(7).trim());
        }

        return ResponseEntity.ok(Map.of("message", "Hesap kalici olarak silindi."));
    }

}