package com.i2i.cryptopal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnore; // YENİ EKLEME: Döngüyü kıran kütüphane

@Entity
@Table(name = "user_wallets")
@Getter
@Setter
public class UserWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore // SİHİRLİ DOKUNUŞ: Swagger ve Jackson'ın sonsuz döngüye girmesini %100 engeller!
    private User user;

    @Column(name = "usdt_balance")
    private BigDecimal usdtBalance;

    @Column(name = "btc_balance")
    private BigDecimal btcBalance;

    @Column(name = "eth_balance")
    private BigDecimal ethBalance;

    // --- LOMBOK BLOKAJINI AŞMAK İÇİN ELLE EKLENEN GARANTİ METOTLAR --- -emir 

    public BigDecimal getUsdtBalance() {
        return usdtBalance;
    }

    public void setUsdtBalance(BigDecimal usdtBalance) {
        this.usdtBalance = usdtBalance;
    }

    public BigDecimal getBtcBalance() {
        return btcBalance;
    }

    public void setBtcBalance(BigDecimal btcBalance) {
        this.btcBalance = btcBalance;
    }

    public BigDecimal getEthBalance() {
        return ethBalance;
    }

    public void setEthBalance(BigDecimal ethBalance) {
      //  this.btcBalance = ethBalance; // Küçük bir düzeltme: Yanlışlıkla ethBalance yerine btcBalance atanmış olabilir, doğrusu setEthBalance içinde ethBalance olmalı
        this.ethBalance=ethBalance;  // kanka yukardaki yorumu sen mi  yazdın bilmiyorum ama doğrusu bu olmalı düzenlersin burayı (Ferhat)
    }
}