package com.i2i.cryptopal.service;

import com.i2i.cryptopal.model.User;
import com.i2i.cryptopal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Random;

@Service   // bizim iş mantığımızı yürüten sınıf bu der ve belleğe almasını ister
@RequiredArgsConstructor  // Lanbok kütüphanesi ürünüdür private ve final gibi değişkenlere koruyucu constructor üretir
public class UserService {

    private final UserRepository userRepository;   // uygulama çalışırken yanlışlıkla değiştirilmemesi için final kullandım
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    // kullanıcı daha önce veritabanına kayıtlımıydı sorgusu ve önlemi
    public User registerUser(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Bu kullanıcı adı zaten alınmış!");
        }

        // 5000 ile 15000 arasinda rastgele baslangic bakiyesi uretimi
        double minBalance = 5000.0;
        double maxBalance = 15000.0;
        double randomBalanceValue = minBalance + (maxBalance - minBalance) * random.nextDouble();
        
        BigDecimal startingBalance = BigDecimal.valueOf(randomBalanceValue)
                .setScale(2, RoundingMode.HALF_UP); // saayıı yuvarlamak için bunu kullandım

        String hashedPassword = passwordEncoder.encode(password);  // sifreyi karmasık bir hash koduna çevirme işlemi


        User newUser = User.builder()
                .username(username)
                .password(hashedPassword)
                .balance(startingBalance)
                .build();

        return userRepository.save(newUser);
    }
}
