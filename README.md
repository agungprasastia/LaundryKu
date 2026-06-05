# LaundryKu Frontend

Aplikasi mobile laundry online dengan fitur pickup, tracking real-time, dan delivery. Dibangun dengan React Native Expo dan terhubung ke backend LaundryKu API.

## Tech Stack

- **React Native** (Expo SDK 54)
- **Expo Router** (file-based routing)
- **TypeScript**
- **Axios** (HTTP client)
- **Expo SecureStore** (token storage di native) / **localStorage** (web)

## Instalasi

```bash
# Clone & masuk ke folder
cd LaundryKu

# Install dependencies
npm install
```

## Konfigurasi Environment

Buat file `.env` di root project:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_USE_DUMMY_PAYMENT=true
```

### Pengaturan API URL per Platform

| Platform | `EXPO_PUBLIC_API_URL` | Keterangan |
|---|---|---|
| Web browser | `http://localhost:3000` | Default, langsung ke backend |
| Android Emulator | `http://10.0.2.2:3000` | `10.0.2.2` = alias localhost di emulator |
| HP Fisik (WiFi) | `http://192.168.x.x:3000` | Ganti dengan IP laptop di jaringan lokal |
| iOS Simulator | `http://localhost:3000` | Sama seperti web |

> **Catatan:** Backend LaundryKu API harus sudah berjalan di port 3000 sebelum menjalankan frontend.

## Menjalankan Aplikasi

```bash
# Start Expo dev server
npx expo start

# Atau langsung ke platform tertentu:
npx expo start --web        # Buka di browser
npx expo start --android    # Buka di Android emulator/device
```

## Role & Akun Login

Aplikasi mendukung 4 role user:

| Role | Deskripsi | Akses Setelah Login |
|---|---|---|
| **Admin** | Administrator platform | Dashboard, verifikasi user, analytics |
| **Customer** | Pelanggan laundry | Pesan layanan, tracking order |
| **Owner** | Mitra pemilik laundry | Kelola layanan & pesanan, wallet |
| **Courier** | Kurir pengantaran | Kelola tugas pickup & delivery, wallet |

### Akun Default (setelah seed)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@laundryku.com` | `admin123` |

### Register

- **Customer**: langsung bisa login setelah register
- **Owner / Courier**: harus **diverifikasi admin** dulu sebelum bisa menggunakan fitur utama. Sebelum verified, akan melihat halaman "Menunggu Verifikasi".

## Cara Test Auth (Phase 1–6)

### 1. Register Customer
1. Buka app → Welcome Screen → tap "Daftar"
2. Isi nama, email, password (min 6 karakter), confirm password
3. Pilih role "Pelanggan" → centang terms → tap "Daftar"
4. Alert "Registrasi Berhasil" → redirect ke login

### 2. Register Owner/Courier
1. Sama seperti di atas, tapi pilih role "Mitra Laundry" atau "Kurir"
2. Alert: "Akun harus diverifikasi admin"

### 3. Login
1. Masukkan email + password
2. Tap "Masuk"
3. Redirect otomatis berdasarkan role:
   - Admin → `/(admin)/beranda`
   - Customer → `/(customer)/beranda`
   - Owner (verified) → `/(owner)/beranda`
   - Owner/Courier (belum verified) → `/(auth)/waiting-verification`

### 4. Admin Verify User
1. Login sebagai admin
2. Tab "Verifikasi" → lihat daftar pending owner/courier
3. Tap "Verifikasi" → konfirmasi → alert sukses

### 5. Logout
1. Tab "Profil" → tap "Keluar" → konfirmasi
2. Token dihapus, redirect ke login

## Fitur yang Sudah Terhubung ke Backend

### Auth & Session
- ✅ Login (`POST /auth/login`)
- ✅ Register semua role (`POST /auth/register`)
- ✅ Get Profile (`GET /auth/profile`)
- ✅ Logout (`POST /auth/logout`)
- ✅ Token tersimpan (SecureStore / localStorage)
- ✅ Auto-load session saat app dibuka
- ✅ 401 auto-logout

### Protected Routes
- ✅ Role-based routing (admin, customer, owner, courier)
- ✅ Redirect jika role salah
- ✅ Owner/courier verification check → waiting screen

### Admin
- ✅ Dashboard metrics (`GET /admin/dashboard/metrics`)
- ✅ Pending users list (`GET /admin/users/pending`)
- ✅ Verify user (`PATCH /admin/users/:id/verify`)
- ✅ Analytics / laporan (`GET /admin/analytics`)
- ✅ Profil admin + logout

### API Services (siap pakai, belum semua terhubung ke UI)
- ✅ Service CRUD (`/services/*`)
- ✅ Order CRUD (`/orders/*`)
- ✅ Courier tasks & earnings (`/couriers/*`)
- ✅ Payment & invoice (`/payments/*`)
- ✅ Wallet & withdraw (`/wallets/*`)
- ✅ Notifications (`/notifications/*`)
- ✅ Owner orders & reports (`/owner/*`)

## Fitur Placeholder (Phase 7–9)

| Phase | Scope | Status |
|---|---|---|
| Phase 7 | Customer: layanan, pesanan, tracking, payment | 📋 Placeholder |
| Phase 8 | Owner: CRUD services, kelola orders, wallet | 📋 Placeholder |
| Phase 9 | Courier: tasks, earnings, wallet | 📋 Placeholder |

## Catatan Development

### Dummy Payment
`EXPO_PUBLIC_USE_DUMMY_PAYMENT=true` di `.env` akan menampilkan tombol "Simulasi Payment Success" di halaman pembayaran (Phase 7). **Jangan gunakan di production.** Set ke `false` untuk menyembunykan tombol simulasi.

### Google Login
Tombol "Masuk dengan Google" saat ini menampilkan alert "Coming Soon". Backend belum mendukung OAuth — hanya email/password.

### Struktur Folder
```
app/
├── index.tsx                 # Welcome Screen
├── _layout.tsx               # Root layout + AuthProvider
├── (auth)/
│   ├── login.tsx             # Login (connected)
│   ├── register.tsx          # Register (connected)
│   └── waiting-verification.tsx
├── (admin)/                  # Admin screens (connected)
├── (customer)/               # Customer screens (placeholder)
├── (owner)/                  # Owner screens (placeholder)
├── (courier)/                # Courier screens (placeholder)
└── (tabs)/                   # Default Expo tabs (tidak dipakai)
services/                     # API service modules
types/                        # TypeScript interfaces
contexts/                     # AuthContext
components/                   # ProtectedRoute
constants/                    # Colors, order status
```
