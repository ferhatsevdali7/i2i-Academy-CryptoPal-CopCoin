package com.i2i.cryptopal.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "user_wallets") // Veritabanındaki tablo ile eşleştiriyoruz
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Id'nin otomatik artacağını belirtiyoruz
    private Long id;

    // Her cüzdan bir kullanıcıya aittir (İlişkisel Veritabanı Bağlantısı)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "asset_name", nullable = false, length = 10)
    private String assetName; // Örn: BTC, ETH, TRY

    @Column(name = "amount", nullable = false)
    private BigDecimal amount; // Hassas finansal veri için BigDecimal kullandık
}