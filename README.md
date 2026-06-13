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

✅ Request Validation

✅ MongoDB Injection Protection

✅ Security Headers

✅ HttpOnly Refresh Cookie

✅ Rate Limit

✅ Login Attempt Lock

✅ Brute-force Protection

✅ User Listing

✅ User Management

✅ Email Templates

✅ Email Verification

✅ Verification Email Resend

---

## Installation

## Gereksinimler

* Node.js 18+
* MongoDB Atlas veya MongoDB Server
* NPM

---

## Paketleri Kur

```bash
npm install auth-system
```

---

## Setup Wizard

Setup wizard gerekli .env dosyasını otomatik oluşturur.
Secret değerleri otomatik üretilir.
Admin kullanıcı setup sırasında oluşturulur.

```bash
npx auth-system-setup
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

dosyası otomatik oluşturulur.

## Usage

```bash
npm install auth-system
npx auth-system-setup
npx auth-system-start
```

## Start Server

```bash
npx auth-system-start
```

Default URL:
http://localhost:4000

---

# Authentication

Login işlemi sonrasında dönen `accessToken`, korumalı endpointlerde aşağıdaki şekilde gönderilmelidir:

```http
Authorization: Bearer ACCESS_TOKEN
```

Notlar:

* Refresh token güvenlik amacıyla HttpOnly Cookie içerisinde saklanır.
* Frontend uygulamaları yalnızca access token ile çalışmalıdır.
* Refresh token yalnızca refresh endpointi tarafından kullanılır ve JavaScript tarafından erişilemez.
 
---

# Authorization

Korumalı endpointlerde access token gönderilmelidir:

```http
Authorization: Bearer ACCESS_TOKEN
```

Kullanıcı bilgileri ve roller aşağıdaki endpoint üzerinden alınabilir:

GET /me

---

# Endpointler

## Register

Yeni kullanıcı oluşturur.

```http
POST /register
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

Kayıt sonrasında kullanıcıya doğrulama e-postası gönderilir.

---

## Login

Kullanıcı girişi yapar.

```http
POST /login
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
- email veya username

olabilir.

Response:

```json
{
  "user": {},
  "accessToken": "...",
  "sessionId": "..."
}
```

Not:

Refresh token response body içerisinde döndürülmez.

Refresh token HttpOnly Cookie olarak saklanır.

Login endpointinde IP bazlı rate limit ve kullanıcı bazlı hatalı giriş kilidi uygulanır.

Varsayılan davranış:

- 15 dakika içinde 10 login isteği IP bazlı limite takılır.
- 5 hatalı şifre denemesinde kullanıcı hesabı 15 dakika kilitlenir.

---

## Current User

Giriş yapan kullanıcıyı döndürür.

```http
GET /me
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

---

## Logout

Mevcut cihazdaki oturumu kapatır.

```http
POST /logout
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
POST /logout-all
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
GET /sessions
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
DELETE /sessions/:id
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Örnek:

```http
DELETE /sessions/6a2929be92cbfcb62846fc1f
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

Refresh token HttpOnly Cookie üzerinden otomatik gönderilir.

```http
POST /refresh
```

Cookie gönderimi desteklemeyen istemciler için refreshToken body üzerinden de gönderilebilir.

Sonuç:

```json
{
  "accessToken": "...",
  "sessionId": "..."
}
```

Not:

* Refresh token rotation kullanılır.
* Eski refresh token tekrar kullanılamaz.

---

# Email Verification

## Verify Email

Kullanıcının e-posta adresini doğrular.

```http
GET /verify-email?token=TOKEN
```

Response:

```json
{
  "success": true,
  "code": "AUTH_EMAIL_VERIFIED",
  "data": {
    "user": {}
  }
}
```

Notlar:

* Verify token tek kullanımlıktır.
* Verify token hashlenmiş olarak veritabanında saklanır.
* Varsayılan geçerlilik süresi 30 dakikadır.
* Süresi dolan tokenlar MongoDB TTL index ile otomatik temizlenir.

## Resend Verification Email

Doğrulama mailini tekrar gönderir.

```http
POST /resend-verification
```

Body:

```json
{
  "email": "test@test.com"
}
```

Response:

```json
{
  "success": true,
  "code": "AUTH_VERIFICATION_EMAIL_SENT",
  "data": {}
}
```

Notlar:

* Sadece doğrulanmamış hesaplar için çalışır.
* Yeni token oluşturulduğunda eski kullanılmamış tokenlar iptal edilir.
* Kullanıcı zaten doğrulanmışsa AUTH_EMAIL_ALREADY_VERIFIED döner.

---

## Change Password

Şifre değiştirir.

```http
POST /change-password
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

## Update User Roles

Kullanıcının rollerini günceller.

Yetki:

- Giriş yapmış olmalıdır.
- admin rolüne sahip olmalıdır.

```http
PATCH /admin/users/:id/roles
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Body:

```json
{
  "roles": ["admin", "manager"]
}
```

Response:

```json
{
  "success": true,
  "code": "AUTH_USER_ROLE_UPDATED",
  "data": {
    "user": {
      "id": "...",
      "roles": [
        "admin",
        "manager"
      ]
    }
  }
}
```

Notlar:

* Role isimleri auth sistemi tarafından sınırlandırılmaz.
* Roller uygulama ihtiyaçlarına göre tanımlanabilir.
* Gönderilen roles dizisi kullanıcının yeni rol listesi olarak kaydedilir.
* Mevcut roller üzerine ekleme yapılmaz.
* Bir rolü kaldırmak için yeni role listesi gönderilmelidir.
* Rol değişikliği sonrasında kullanıcının aktif sessionları sonlandırılır.
* Rol değişikliği sonrasında kullanıcı yeniden giriş yapmak zorundadır.

---

## List Users

Tüm kullanıcıları listeler.

Yetki:

- Giriş yapmış olmalıdır.
- admin rolüne sahip olmalıdır.

```http
GET /admin/users
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Query Parametreleri:

```txt
page
limit
search
```

Örnek:

```http
GET /admin/users?page=1&limit=20
```

Arama:

```http
GET /admin/users?search=test
```

Response:

```json
{
  "success": true,
  "code": "AUTH_USERS_LIST_SUCCESS",
  "data": {
    "users": [
      {
        "id": "...",
        "username": "testuser",
        "email": "test@test.com",
        "phone": "5551112233",
        "roles": [
          "user"
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

Notlar:

* Bu endpoint yalnızca admin kullanıcılar tarafından kullanılabilir.
* Normal kullanıcılar tüm kullanıcı listesini göremez.
* Normal kullanıcılar yalnızca kendi bilgilerine `GET /me` endpointi üzerinden erişebilir.
* `search` parametresi username, email ve phone alanlarında arama yapar.

---

## Get User Detail

Belirli bir kullanıcının detay bilgilerini getirir.

Yetki:

- Giriş yapmış olmalıdır.
- admin rolüne sahip olmalıdır.

```http
GET /admin/users/:id
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Response:

```json
{
  "success": true,
  "code": "AUTH_USER_DETAIL_SUCCESS",
  "data": {
    "user": {
      "id": "...",
      "username": "testuser",
      "email": "test@test.com",
      "phone": "5551112233",
      "roles": ["user"]
    }
  }
}
```

---

## Update User

Kullanıcının profil bilgilerini günceller.

Yetki:

- Giriş yapmış olmalıdır.
- admin rolüne sahip olmalıdır.

```http
PATCH /admin/users/:id
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Body:

```json
{
  "username": "newusername",
  "email": "newmail@test.com",
  "phone": "5559998877"
}
```

Response:

```json
{
  "success": true,
  "code": "AUTH_USER_UPDATED"
}
```

Notlar:

* Kullanıcının email adresi değiştirilebilir.
* Kullanıcının username değeri değiştirilebilir.
* Kullanıcının telefon bilgisi değiştirilebilir.
* Email ve username alanları benzersiz olmalıdır.
* Güncelleme sonrasında kullanıcının aktif sessionları sonlandırılır.

---

## Update User Status

Kullanıcıyı aktif veya pasif duruma getirir.

Yetki:

- Giriş yapmış olmalıdır.
- admin rolüne sahip olmalıdır.

```http
PATCH /admin/users/:id/status
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Body:

```json
{
  "isActive": false
}
```

Response:

```json
{
  "success": true,
  "code": "AUTH_USER_STATUS_UPDATED"
}
```

Notlar:

* isActive=true → kullanıcı aktif olur.
* isActive=false → kullanıcı pasif olur.
* Pasif yapılan kullanıcı giriş yapamaz.
* Pasif yapılan kullanıcının aktif sessionları sonlandırılır.

---

## Reset User Password

Bir kullanıcının şifresini admin tarafından sıfırlar.

Yetki:

- Giriş yapmış olmalıdır.
- admin rolüne sahip olmalıdır.

```http
PATCH /admin/users/:id/password
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Body:

```json
{
  "newPassword": "123456789"
}
```

Response:

```json
{
  "success": true,
  "code": "AUTH_USER_PASSWORD_UPDATED"
}
```

Notlar:

* Admin mevcut şifreyi bilmek zorunda değildir.
* Şifre sıfırlandıktan sonra kullanıcının tüm aktif sessionları sonlandırılır.
* Kullanıcı yeniden giriş yapmak zorundadır.

---

## Update My Profile

Giriş yapan kullanıcının kendi profil bilgilerini günceller.

```http
PATCH /me
```

Header:

```http
Authorization: Bearer ACCESS_TOKEN
```

Body:

```json
{
  "username": "newusername",
  "email": "newmail@test.com",
  "phone": "5551112233"
}
```

Response:

```json
{
  "success": true,
  "code": "AUTH_PROFILE_UPDATED"
}
```

Notlar:

* Kullanıcı yalnızca kendi profilini güncelleyebilir.
* Kullanıcı rol değiştiremez.
* Kullanıcı aktiflik durumunu değiştiremez.
* Email ve username alanları benzersiz olmalıdır.
* Güncelleme sonrasında aktif sessionlar sonlandırılır ve yeniden giriş yapılması gerekir.

---

# Session Yönetimi

## Mevcut cihazdan çıkış

```http
POST /logout
```

---

## Tüm cihazlardan çıkış

```http
POST /logout-all
```

---

## Belirli cihazdan çıkış

```http
DELETE /sessions/:id
```

---

## Aktif cihazları listeleme

```http
GET /sessions
```

---

# Response Format

Başarılı cevap:

```json
{
  "success": true,
  "code": "AUTH_LOGIN_SUCCESS",
  "data": {
    "user": {},
    "accessToken": "...",
    "sessionId": "..."
  }
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

# Rate Limit & Login Lock

Auth endpointleri rate limit koruması ile çalışır.

Varsayılan limitler:

```txt
/*       -> 15 dakikada 100 istek
/login   -> 15 dakikada 10 istek
```

Login güvenliği:

```txt
5 hatalı şifre denemesi
↓
Hesap 15 dakika kilitlenir
↓
AUTH_ACCOUNT_LOCKED döner
```

Örnek rate limit hatası:

```json
{
  "success": false,
  "code": "AUTH_LOGIN_RATE_LIMIT_EXCEEDED",
  "errors": []
}
```

Örnek hesap kilidi hatası:

```json
{
  "success": false,
  "code": "AUTH_ACCOUNT_LOCKED",
  "errors": []
}
```

---

# Validation & Security Middleware

Bu auth sistemi gelen request body verilerini endpoint seviyesinde doğrular.

Kullanılan güvenlik katmanları:

* `zod` ile request body validation
* Zod schema validation ile NoSQL/Mongo injection koruması
* `express-mongo-sanitize` ile MongoDB injection koruması
* `helmet` ile temel HTTP security headerları

Örnek validation hatası:

```json
{
  "success": false,
  "code": "AUTH_VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

Not:

Bu sistem frontend validation yerine geçmez. Frontend tarafında da kullanıcı deneyimi için ayrıca validation yapılmalıdır. Backend validation her zaman zorunlu güvenlik katmanı olarak çalışır.

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

failedLoginAttempts
lockUntil
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
* Request Validation (Zod)
* MongoDB Injection Protection
* Security Headers (Helmet)
* HttpOnly Refresh Cookie
* Rate Limit
* Login Attempt Lock
* Brute-force Protection
* Admin Protected User Management
* Email Verification
* Verification Email Resend
* Single-use Verification Tokens
* Token Expiration
* Token Hashing

---

# Roadmap

## Güvenlik

* [x] Refresh token rotation
* [x] Session yönetimi
* [x] Şifre değiştirme
* [x] Tüm cihazlardan çıkış
* [x] Request validation
* [x] MongoDB injection koruması
* [x] Security headers
* [x] HttpOnly Refresh Cookie
* [x] Login deneme limiti
* [x] Brute-force koruması
* [x] Email verification
* [x] Verification email resend

* [ ] Forgot password
* [ ] Reset password

## Yetkilendirme

* [x] Role management
* [x] User management
* [ ] Permission middleware
* [ ] Advanced role management

## Paketleme

* [x] NPM package
* [ ] Complete documentation
* [ ] Example projects
* [ ] One-command installation

---

# Production Notes

Production ortamında aşağıdaki ayarlar önerilir:

```env
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=none
```

Notlar:

* Production ortamında HTTPS kullanılmalıdır.
* AUTH_COOKIE_SECURE=true kullanıldığında HTTPS gereklidir.
* JWT secret ve refresh secret değerleri setup sırasında otomatik üretilir ve .env dosyasına yazılır.
* Refresh token HttpOnly Cookie içerisinde tutulur.
* Varsayılan rate limit değerlerinin değiştirilmemesi önerilir.
* JWT secret ve refresh secret değerleri hiçbir zaman source code içerisine yazılmamalıdır.

---

# Lisans

MIT License
