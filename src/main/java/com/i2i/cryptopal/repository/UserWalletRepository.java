package com.i2i.cryptopal.repository;

import com.i2i.cryptopal.model.User;
import com.i2i.cryptopal.model.UserWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserWalletRepository extends JpaRepository<UserWallet, Long> {
    
    // Bir kullanıcının sahip olduğu tüm cüzdanları listelemek için
    List<UserWallet> findByUser(User user);
    
    // Bir kullanıcının belirli bir varlıktaki cüzdanını bulmak için (Örn: Emirin BTC cüzdanı)
    Optional<UserWallet> findByUserAndAssetName(User user, String assetName);
}
