# Auth System

Tak-çalıştır Node.js authentication modülü.

## Amaç

Bu proje, herhangi bir Node.js projesine kolayca entegre edilebilen, MongoDB tabanlı, JWT destekli bir auth sistemi oluşturmak için hazırlanmıştır.

Arayüz içermez. Sadece backend auth yapısı sağlar.

## Roadmap

### V1 - Temel Auth

- [ ] Setup wizard
- [ ] MongoDB bağlantı ayarı
- [ ] İlk admin kullanıcı oluşturma
- [ ] Register endpoint
- [ ] Login endpoint
- [ ] Logout endpoint
- [ ] Me endpoint
- [ ] Access token
- [ ] Refresh token
- [ ] Şifre hashleme
- [ ] Auth middleware
- [ ] Role middleware
- [ ] Admin / User rol yapısı

### V2 - Güvenlik

- [ ] Şifre değiştirme
- [ ] Şifre değişince eski tokenları geçersiz yapma
- [ ] Tüm cihazlardan çıkış
- [ ] Session yönetimi
- [ ] Login deneme limiti
- [ ] Pasif kullanıcı engelleme
- [ ] Refresh token rotation

### V3 - Gelişmiş Özellikler

- [ ] Şifre sıfırlama
- [ ] E-posta doğrulama
- [ ] Telefon alanı desteği
- [ ] Kullanıcı listeleme
- [ ] Kullanıcı rol değiştirme
- [ ] Kullanıcı aktif/pasif yapma

### V4 - Entegrasyon

- [ ] Paket gibi kullanılabilir yapı
- [ ] Express router export
- [ ] Middleware export
- [ ] Örnek kullanım dosyası
- [ ] Dokümantasyon
- [ ] GitHub üzerinden kurulum

## Hedef Kullanım

```js
const auth = require("./auth-system");

app.use("/auth", auth.router);

app.get("/profile", auth.requireAuth, (req, res) => {
  res.json(req.user);
});