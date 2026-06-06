# LaundryKu Frontend

Aplikasi mobile laundry online untuk customer, owner laundry, kurir, dan admin. Frontend dibuat dengan React Native Expo, Expo Router, TypeScript, dan terhubung ke LaundryKu API.

## Tech Stack

- React Native + Expo SDK 54
- Expo Router
- TypeScript
- Axios
- Expo SecureStore / localStorage
- Expo Location untuk GPS pickup

## Instalasi

```bash
cd LaundryKu
npm install
```

## Environment

Buat file `.env` di root project:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_USE_DUMMY_PAYMENT=true
```

| Platform         | `EXPO_PUBLIC_API_URL`     | Catatan                  |
| ---------------- | ------------------------- | ------------------------ |
| Web browser      | `http://localhost:3000`   | Backend lokal            |
| Android emulator | `http://10.0.2.2:3000`    | Alias localhost emulator |
| HP fisik WiFi    | `http://192.168.x.x:3000` | Ganti dengan IP laptop   |
| iOS simulator    | `http://localhost:3000`   | Sama seperti web         |

Backend LaundryKu API harus berjalan sebelum frontend dipakai.

## Menjalankan App

```bash
npx expo start
npx expo start --web
npx expo start --android
```

## Role dan Routing

| Role     | Akses                                                           |
| -------- | --------------------------------------------------------------- |
| Admin    | Dashboard, verifikasi user, laporan                             |
| Customer | Layanan, order, tracking, invoice/payment, profil               |
| Owner    | Dashboard owner, service CRUD, order management, wallet, profil |
| Courier  | Tugas pickup/delivery, earnings, wallet, profil                 |

Owner dan courier wajib diverifikasi admin sebelum memakai fitur utama. Jika belum verified, user diarahkan ke halaman waiting verification atau melihat pesan fitur belum aktif.

## Akun Seed

| Role  | Email                 | Password   |
| ----- | --------------------- | ---------- |
| Admin | `admin@laundryku.com` | `admin123` |

## Struktur Folder Utama

```text
app/
├── index.tsx
├── _layout.tsx
├── (auth)/
├── (admin)/
├── (customer)/
├── (owner)/
├── (courier)/
└── (tabs)/
components/
contexts/
constants/
services/
types/
utils/
```

## Fitur Backend yang Sudah Terhubung

### Auth dan Session

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/profile`
- `PATCH /auth/profile`
- `POST /auth/logout`
- Token storage SecureStore/localStorage
- Auto-load session
- Auto-logout saat 401
- ProtectedRoute berbasis role

### Admin

- `GET /admin/dashboard/metrics`
- `GET /admin/users/pending`
- `PATCH /admin/users/:id/verify`
- `GET /admin/analytics`

### Customer

- `GET /services`
- `GET /services/:service_id`
- `POST /orders`
- `GET /orders/my-orders`
- `GET /orders/my-orders/history`
- `GET /orders/:order_id`
- `GET /orders/:order_id/tracking`
- `GET /payments/invoice/:invoice_id`
- `POST /payments`
- `POST /payments/callback` untuk dummy payment
- `PATCH /orders/:order_id/complete`
- `GET /notifications`
- `PATCH /notifications/:notification_id/read`

### Owner

- `GET /owner/reports/summary`
- `GET /owner/orders`
- `GET /services`
- `POST /services`
- `PATCH /services/:service_id`
- `DELETE /services/:service_id`
- `GET /orders/:order_id`
- `PATCH /orders/:order_id/status`
- `POST /orders/:order_id/assign-courier`
- `PATCH /orders/:order_id/weight`
- `PATCH /orders/:order_id/activate-delivery`
- `GET /orders/:order_id/tracking`
- `GET /couriers/available`
- `GET /wallets/me`
- `GET /wallets/me/transactions`
- `POST /wallets/me/withdraw`
- `GET /wallets/me/withdrawals`
- `GET /notifications`
- `PATCH /notifications/:notification_id/read`

### Courier

Service layer untuk courier sudah tersedia. UI courier masih tahap berikutnya bila belum disambungkan penuh.

## Cara Test Auth

### Register Customer

1. Buka Welcome Screen.
2. Tap **Daftar**.
3. Isi nama, email, password, confirm password.
4. Pilih role **Pelanggan**.
5. Tap **Daftar**.
6. Setelah sukses, login sebagai customer.

### Register Owner atau Courier

1. Register seperti customer.
2. Pilih role **Mitra Laundry** atau **Kurir**.
3. Akun masuk status pending verification.
4. Admin harus verifikasi sebelum fitur utama aktif.

### Admin Verify User

1. Login sebagai admin.
2. Buka tab **Verifikasi**.
3. Pilih pending owner/courier.
4. Tap **Verifikasi**.

## Cara Test Customer Flow

1. Login sebagai customer.
2. Buka tab **Layanan**.
3. Pilih layanan aktif dari backend.
4. Tap **Pesan Sekarang**.
5. Isi alamat pickup.
6. Tap **Gunakan Lokasi Saya Saat Ini** untuk mengambil GPS via `expo-location`.
7. Isi jadwal pickup.
8. Submit order.
9. Buka tab **Pesanan**.
10. Tap order untuk melihat detail, status timeline, tracking, invoice, dan payment.
11. Jika dummy payment aktif, tap **Bayar Sekarang**, lalu **Simulasi Payment Success**.
12. Jika order sudah `DELIVERED`, tap **Konfirmasi Selesai**.
13. Buka profil untuk melihat notifikasi dan logout.

Catatan GPS:

- Customer tidak perlu input latitude/longitude manual.
- Backend menghitung jarak dengan Haversine dari koordinat customer dan owner.
- Tidak menggunakan Google Maps API.

## Cara Test Owner Flow

### Owner Belum Verified

1. Login sebagai owner belum verified.
2. App menampilkan waiting verification atau pesan fitur belum aktif.
3. Screen owner tidak memanggil endpoint owner yang berpotensi 403 berulang.

### Owner Verified

1. Login sebagai owner verified.
2. Buka **Beranda**.
3. Pastikan dashboard menampilkan summary, balance, order aktif, dan order terbaru.
4. Buka **Layanan**.
5. Create service dengan:
   - `service_id`
   - `name`
   - `description`
   - `price_per_kg_owner`
6. Edit service dan pastikan harga customer ter-refresh dari backend.
7. Nonaktifkan layanan melalui tombol **Nonaktifkan Layanan**.
8. Customer membuat order dari service owner.
9. Buka **Pesanan** sebagai owner.
10. Tap order dan lakukan aksi sesuai status:
    - `WAITING_OWNER_CONFIRMATION` → **Konfirmasi Order**
    - `CONFIRMED` → **Assign Kurir**
    - `LAUNDRY_PICKED` → **Input Berat Laundry**
    - `PROCESSING` → **Selesai Diproses / Siap Diantar**
    - `READY_FOR_DELIVERY` → **Aktifkan Delivery**
11. Buka **Wallet**.
12. Cek available balance, pending balance, transaksi, withdrawal history.
13. Submit withdraw via bank atau e-wallet.
14. Buka **Profil**.
15. Cek data profile, notifikasi, mark read, lalu logout.

## Dummy Payment

Jika `EXPO_PUBLIC_USE_DUMMY_PAYMENT=true`, customer order detail menampilkan tombol simulasi payment.

Alur:

1. Customer tap **Bayar Sekarang**.
2. Frontend memanggil `POST /payments`.
3. Response menyimpan `payment_id`.
4. Tombol **Simulasi Payment Success** muncul.
5. Tap tombol tersebut untuk memanggil `POST /payments/callback`.
6. Backend mengubah invoice menjadi paid dan order lanjut ke `PROCESSING`.

Jangan aktifkan dummy payment di production.

## Status Order

Timeline order memakai 9 status:

1. `WAITING_OWNER_CONFIRMATION`
2. `CONFIRMED`
3. `PICKUP_ON_THE_WAY`
4. `LAUNDRY_PICKED`
5. `PROCESSING`
6. `READY_FOR_DELIVERY`
7. `DELIVERY_ON_THE_WAY`
8. `DELIVERED`
9. `COMPLETED`

Label dan warna badge memakai helper di `constants/orderStatus.ts`.

## Catatan Development

- Design system warna ada di `constants/colors.ts`.
- API client dan token handling ada di `services/api.ts`.
- Auth state ada di `contexts/AuthContext.tsx`.
- Role guard ada di `components/ProtectedRoute.tsx`.
- Semua request UI sebaiknya lewat service layer di `services/`.
