# Auth System

Tak-çalıştır Node.js + MongoDB Authentication System.

JWT, Refresh Token, Session Management ve Role-Based Authorization desteği ile gelen bağımsız auth modülü.

Frontend içermez. Sadece backend authentication ve authorization altyapısı sağlar.

---

# Özellikler

✅ MongoDB desteği

✅ JWT Authentication

✅ Refresh Token Rotation

✅ Session Tracking

✅ Register

✅ Login

✅ Logout

✅ Logout All Devices

✅ Single Session Logout

✅ Change Password

✅ Role Based Authorization

✅ Setup Wizard

✅ Token Versioning

✅ Response Code System

---

# Kurulum

## Gereksinimler

* Node.js 18+
* MongoDB Atlas veya MongoDB Server
* NPM

---

## Repoyu Klonla

```bash
git clone https://github.com/maoderki/auth-system.git
cd auth-system
```

---

## Paketleri Kur

```bash
npm install
```

---

## Setup Wizard Çalıştır

```bash
node setup.js
```

Kurulum sırasında aşağıdaki bilgiler sorulur:

* MongoDB URI
* Admin kullanıcı adı
* Admin e-posta adresi
* Admin şifresi
* Login yöntemi
* Public registration ayarı

Kurulum tamamlandıktan sonra:

```txt
.env
.installed
```

dosyaları otomatik oluşturulur.

---

# Express'e Bağlama

```js
const express = require("express");
const auth = require("./auth-system");

const app = express();

app.use(express.json());

app.use("/auth", auth.router);
```

---

# Authentication

Login işlemi sonrasında dönen `accessToken`, korumalı endpointlerde aşağıdaki şekilde gönderilmelidir:

```http
Authorization: Bearer ACCESS_TOKEN
```

---

# Auth Middleware Kullanımı

Sadece giriş yapmış kullanıcılar erişebilir.

```js
app.get(
  "/profile",
  auth.requireAuth,
  (req, res) => {
    res.json(req.user);
  }
);
```

---

# Role Middleware Kullanımı

Belirli role sahip kullanıcılar erişebilir.

```js
app.get(
  "/admin",
  auth.requireAuth,
  auth.requireRole("admin"),
  (req, res) => {
    res.json({
      message: "Admin erişimi başarılı"
    });
  }
);
```

Birden fazla role izin vermek:

```js
app.get(
  "/support",
  auth.requireAuth,
  auth.requireRole("admin", "support"),
  controller
);
```

---

# Endpointler

## Register

Yeni kullanıcı oluşturur.

```http
POST /auth/register
```

Body:

```json
{
  "username": "testuser",
  "email": "test@test.com",
  "phone": "5551112233",
  "password": "12345678"
}
```

---

## Login

Kullanıcı girişi yapar.

```http
POST /auth/login
```

Body:

```json
{
  "identifier": "testuser",
  "password": "12345678",
  "deviceId": "macbook-pro-1",
  "deviceName": "MacBook Pro Chrome"
}
```

Not:

identifier alanı setup sırasında seçilen login yöntemine göre:

- username
- email

olabilir.

Response:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "sessionId": "..."
}
```

---

## Current User

Giriş yapan kullanıcıyı döndürür.

```http
GET /auth/me
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

---

## Logout

Mevcut cihazdaki oturumu kapatır.

```http
POST /auth/logout
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Sonuç:

- Sadece mevcut cihaz logout edilir.
- Diğer cihazlar etkilenmez.

---

## Logout All Devices

Tüm aktif cihazların oturumunu kapatır.

```http
POST /auth/logout-all
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Sonuç:

- Tüm sessionlar pasif hale getirilir.
- Tüm cihazlar yeniden giriş yapmak zorunda kalır.

---

## Active Sessions

Kullanıcının aktif cihazlarını listeler.

```http
GET /auth/sessions
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Örnek çıktı:

```json
{
  "sessions": [
    {
      "id": "6a2929be92cbfcb62846fc1f",
      "deviceName": "MacBook Pro Chrome",
      "isCurrent": true
    }
  ]
}
```

---

## Logout Single Session

Belirli bir cihazın oturumunu kapatır.

```http
DELETE /auth/sessions/:id
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Örnek:

```http
DELETE /auth/sessions/6a2929be92cbfcb62846fc1f
```

Sonuç:

- Sadece ilgili cihaz logout edilir.
- Diğer aktif cihazlar etkilenmez.

Kullanım senaryoları:

* Tanınmayan cihazı kapatma
* Eski cihazları temizleme
* Güvenlik amaçlı uzaktan oturum sonlandırma

---

## Refresh Token

Yeni access token üretir.

```http
POST /auth/refresh
```

Body:

```json
{
  "refreshToken": "..."
}
```

Sonuç:

```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

Not:

* Refresh token rotation kullanılır.
* Eski refresh token tekrar kullanılamaz.

---

## Change Password

Şifre değiştirir.

```http
POST /auth/change-password
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Body:

```json
{
  "currentPassword": "12345678",
  "newPassword": "123456789"
}
```

Sonuç:

- Şifre güncellenir.
- Token version artırılır.
- Tüm aktif sessionlar sonlandırılır.

---

# Session Yönetimi

## Mevcut cihazdan çıkış

```http
POST /auth/logout
```

---

## Tüm cihazlardan çıkış

```http
POST /auth/logout-all
```

---

## Belirli cihazdan çıkış

```http
DELETE /auth/sessions/:id
```

---

## Aktif cihazları listeleme

```http
GET /auth/sessions
```

---

# Response Format

Başarılı cevap:

```json
{
  "success": true,
  "code": "AUTH_LOGIN_SUCCESS",
  "data": {}
}
```

Hatalı cevap:

```json
{
  "success": false,
  "code": "AUTH_INVALID_CREDENTIALS",
  "errors": []
}
```

---

# Kullanıcı Modeli

Varsayılan kullanıcı alanları:

```txt
username
email
phone
roles
permissions
passwordHash

isActive
isEmailVerified

lastLoginAt
lastSeenAt
passwordChangedAt

tokenVersion

createdAt
updatedAt
```

---

# Session Modeli

Varsayılan session alanları:

```txt
userId

deviceId
deviceName

userAgent
ipAddress

refreshTokenHash
accessTokenJti

isActive

lastSeenAt
loggedOutAt
expiresAt

createdAt
updatedAt
```

---

# Güvenlik Özellikleri

* JWT Authentication
* Refresh Token Rotation
* Session Tracking
* Token Versioning
* Password Hashing (bcrypt)
* Session Based Logout
* Logout All Devices
* Single Device Logout
* Password Change Session Invalidation

---

# Roadmap

## Güvenlik

* [ ] Login deneme limiti
* [ ] Brute-force koruması
* [ ] Password reset
* [ ] Email verification

## Yetkilendirme

* [ ] Permission middleware
* [ ] Advanced role management

## Paketleme

* [ ] NPM package
* [ ] Complete documentation
* [ ] Example projects
* [ ] One-command installation

---

# Lisans

MIT License
