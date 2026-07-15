package com.i2i.cryptopal.controller;

import com.i2i.cryptopal.dto.RegisterRequest;
import com.i2i.cryptopal.dto.RegisterResponse;
import com.i2i.cryptopal.model.User;
import com.i2i.cryptopal.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController  // rest apı denetleyicisi,  metotlardan dönen veriler otomatik json formatında olmalı demek
@RequestMapping("/api/auth")  // ön ek olıuşturma
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Frontend'in CORS engeline takılmasını engellemek iiçin
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
}
