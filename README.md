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
| **Customer** | Pelanggan laundry | Pesan layanan, tracking order, pembayaran |
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

## Cara Test Customer Flow (Phase 7)

### 1. Login sebagai Customer
1. Register customer baru atau gunakan akun customer yang sudah ada
2. Login → masuk ke **Beranda Customer**

### 2. Beranda
- Melihat greeting "Halo, [nama]"
- Melihat 3 layanan teratas dari backend
- Melihat 3 pesanan terbaru (atau empty state jika belum ada)
- Melihat badge jumlah notifikasi belum dibaca
- Quick action: Lihat Layanan, Pesanan Saya, Notifikasi, Profil

### 3. Lihat Layanan
1. Tab **Layanan** → daftar layanan aktif dari `GET /services`
2. Harga customer per kg ditampilkan (`price_per_kg_customer`), **bukan** `price_per_kg_owner`
3. Tap card → lihat detail layanan

### 4. Buat Pesanan
1. Di layanan → tap "Pesan Sekarang"
2. Isi form:
   - Alamat pickup
   - Latitude (-90 s/d 90) & Longitude (-180 s/d 180)
   - Jadwal pickup (format: `YYYY-MM-DD HH:mm:ss`)
3. Tap "Buat Pesanan" → `POST /orders`
4. Alert sukses dengan Order ID → bisa langsung ke tab Pesanan

### 5. Lihat Pesanan
1. Tab **Pesanan** → toggle Aktif / Riwayat
2. Tap order card → detail order modal
3. Lihat:
   - Info order (ID, layanan, status, alamat, berat, total, kurir)
   - Tracking timeline 9 tahap
   - Invoice & pembayaran (jika invoice_id tersedia)

### 6. Pembayaran
1. Di detail order → jika invoice tersedia & status "unpaid"
2. Tap "Bayar Sekarang" → `POST /payments` (method: e_wallet)
3. Jika `EXPO_PUBLIC_USE_DUMMY_PAYMENT=true`:
   - Setelah "Bayar Sekarang", `payment_id` disimpan dari response `POST /payments`
   - Muncul tombol "Simulasi Payment Success"
   - Tap → `POST /payments/callback` dengan body `{ payment_id: "PAY...", status: "success" }`
   - Invoice otomatis terbayar

### 7. Konfirmasi Selesai
1. Jika status order = `DELIVERED`
2. Muncul tombol "Konfirmasi Selesai"
3. Tap → `PATCH /orders/:order_id/complete`
4. Status berubah menjadi `COMPLETED`

### 8. Notifikasi
1. Tab **Profil** → section Notifikasi
2. Daftar notifikasi dari `GET /notifications`
3. Notifikasi unread ditandai dengan border biru
4. Tap "Tandai Dibaca" → `PATCH /notifications/:notification_id/read`

### 9. Logout
1. Tab **Profil** → scroll ke bawah → "Keluar"
2. Konfirmasi → token dihapus → redirect ke login

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

### Customer (Phase 7)
- ✅ Beranda: greeting, top services, recent orders, unread notif count
- ✅ Daftar layanan aktif (`GET /services`)
- ✅ Detail layanan (`GET /services/:service_id`)
- ✅ Create order (`POST /orders`)
- ✅ Active orders (`GET /orders/my-orders`)
- ✅ Order history (`GET /orders/my-orders/history`)
- ✅ Order detail (`GET /orders/:order_id`)
- ✅ Order tracking timeline (`GET /orders/:order_id/tracking`)
- ✅ Invoice (`GET /payments/invoice/:invoice_id`)
- ✅ Create payment (`POST /payments`)
- ✅ Dummy payment callback (`POST /payments/callback`)
- ✅ Complete order (`PATCH /orders/:order_id/complete`)
- ✅ Notifications list (`GET /notifications`)
- ✅ Mark notification read (`PATCH /notifications/:notification_id/read`)
- ✅ Customer profile + logout

### API Services (siap pakai, belum semua terhubung ke UI)
- ✅ Service CRUD (`/services/*`)
- ✅ Order CRUD (`/orders/*`)
- ✅ Courier tasks & earnings (`/couriers/*`)
- ✅ Payment & invoice (`/payments/*`)
- ✅ Wallet & withdraw (`/wallets/*`)
- ✅ Notifications (`/notifications/*`)
- ✅ Owner orders & reports (`/owner/*`)

## Fitur Placeholder (Phase 8–9)

| Phase | Scope | Status |
|---|---|---|
| Phase 8 | Owner: CRUD services, kelola orders, wallet | 📋 Placeholder |
| Phase 9 | Courier: tasks, earnings, wallet | 📋 Placeholder |

## Catatan Development

### Dummy Payment
`EXPO_PUBLIC_USE_DUMMY_PAYMENT=true` di `.env` akan menampilkan tombol "Simulasi Payment Success" di halaman detail order customer. **Jangan gunakan di production.** Set ke `false` untuk menyembunyikan tombol simulasi.

Alur dummy payment:
1. Customer tap "Bayar Sekarang" → `POST /payments` → response berisi `payment_id`
2. `payment_id` disimpan di state frontend
3. Tombol "Simulasi Payment Success" muncul (hanya jika `payment_id` sudah tersedia)
4. Tap → `POST /payments/callback` dengan body: `{ payment_id: "PAY...", status: "success" }`
5. Backend memproses callback → invoice jadi `paid`, order status naik ke `PROCESSING`

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
├── (customer)/
│   ├── _layout.tsx           # Tab navigation + ProtectedRoute
│   ├── beranda.tsx           # Beranda (connected Phase 7)
│   ├── services.tsx          # Layanan + create order (connected Phase 7)
│   ├── orders.tsx            # Pesanan + detail/tracking/payment (connected Phase 7)
│   └── profile.tsx           # Profil + notifikasi (connected Phase 7)
├── (owner)/                  # Owner screens (placeholder)
├── (courier)/                # Courier screens (placeholder)
└── (tabs)/                   # Default Expo tabs (tidak dipakai)
services/                     # API service modules
types/                        # TypeScript interfaces
contexts/                     # AuthContext
components/                   # ProtectedRoute
constants/                    # Colors, order status
```
