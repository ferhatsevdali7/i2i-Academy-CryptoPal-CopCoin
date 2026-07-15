package com.i2i.cryptopal.service;

import com.i2i.cryptopal.model.User;
import com.i2i.cryptopal.model.UserWallet;
import com.i2i.cryptopal.repository.UserRepository;
import com.i2i.cryptopal.repository.UserWalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // Emir'in veritabanina OneToOne iliskiyle usdt_balance, btc_balance, eth_balance
    // kolunlarını eklemesi üzerine yeni kadolan kullnıcının cüzdanını otomatik oluşturmak için ekledim
    private final UserWalletRepository userWalletRepository; 
    
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    @Transactional // ACID kurallari gereği Kullanici kaydolurken cüzdan kaydi da basarili olmak zorundadir
    public User registerUser(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Bu kullanıcı adı zaten alınmış!");
        }

        // 5000 ile 15000 arasinda rastgele baslangic bakiyesi uretimi
        double minBalance = 5000.0;
        double maxBalance = 15000.0;
        double randomBalanceValue = minBalance + (maxBalance - minBalance) * random.nextDouble();
        
        BigDecimal startingBalance = BigDecimal.valueOf(randomBalanceValue)
                .setScale(2, RoundingMode.HALF_UP);

        String hashedPassword = passwordEncoder.encode(password);

        // 1. Kullanici Tablosuna Kayit
        User newUser = User.builder()
                .username(username)
                .password(hashedPassword)
                .balance(startingBalance)
                .build();
        User savedUser = userRepository.save(newUser);

        // uyuşmazlığı çözmek adına yeni kayit olan kullanicinin cüzdaninda başlangic bakiyesini
        // hizalamak ve Cüzdan Bulunamadı hatasinı önlemek için ilk cüzdan satiırı yaratılıyor
        UserWallet wallet = new UserWallet();
        wallet.setUser(savedUser);
        wallet.setUsdtBalance(startingBalance); // Baslangic nakitini cüzdanin usdt balance alanina da yaziyor
        wallet.setBtcBalance(BigDecimal.ZERO);
        wallet.setEthBalance(BigDecimal.ZERO);
        userWalletRepository.save(wallet);

        return savedUser;
    }
}
