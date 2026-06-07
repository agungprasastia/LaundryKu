# LaundryKu Frontend

Aplikasi mobile laundry online untuk customer, owner laundry, kurir, dan admin. Frontend dibuat dengan React Native Expo, Expo Router, TypeScript, dan terhubung ke LaundryKu API.

## Tech Stack

- React Native + Expo SDK 54
- Expo Router
- TypeScript
- Axios
- Expo SecureStore / localStorage
- Expo Location untuk GPS pickup dan update posisi kurir
- React Native WebView + Leaflet + OpenStreetMap untuk peta tracking

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
EXPO_PUBLIC_ALLOW_MANUAL_COORDS=false
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

## Maps dan Tracking

LaundryKu memakai peta gratis tanpa API key:

- Peta: OpenStreetMap + Leaflet di `react-native-webview`.
- GPS HP: `expo-location`.
- Komponen peta: `components/TrackingMap.tsx`.
- Customer dan owner tracking: polling `GET /orders/:order_id/tracking` setiap 8 detik saat detail order terbuka.
- Courier update lokasi: `PATCH /couriers/me/location` manual atau otomatis setiap 12 detik saat tugas aktif.
- Manual latitude/longitude hanya untuk development jika `EXPO_PUBLIC_ALLOW_MANUAL_COORDS=true`.

Batasan saat ini:

- Belum ada routing jalan/directions realtime seperti Gojek.
- Garis route masih polyline lurus antara kurir dan pickup/laundry.

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
LaundryKu/
├── app/
│   ├── _layout.tsx                 # Root layout, provider, dan Stack Expo Router
│   ├── index.tsx                   # Welcome screen
│   ├── (auth)/                     # Login, register, waiting verification
│   ├── (admin)/                    # Dashboard admin, verifikasi user, pengguna, laporan, profil
│   ├── (customer)/                 # Dashboard customer, layanan, order, tracking, profil
│   ├── (owner)/                    # Dashboard owner, service CRUD, order management, wallet, profil
│   ├── (courier)/                  # Dashboard kurir, tugas, earnings, wallet, profil
│   └── (tabs)/                     # Route bawaan/legacy jika masih dipakai Expo Router
├── components/
│   ├── ProtectedRoute.tsx          # Guard route berdasarkan auth, role, dan verifikasi
│   ├── TrackingMap.tsx             # Peta tracking WebView + Leaflet + OpenStreetMap
│   ├── customer/                   # Komponen khusus customer order detail/tracking
│   ├── owner/                      # Komponen reusable untuk screen owner
│   └── courier/                    # Komponen reusable untuk screen courier
├── constants/
│   ├── colors.ts                   # Warna aplikasi dan warna per role
│   ├── orderStatus.ts              # Mapping status order, label, warna, timeline
│   └── __tests__/                  # Test helper constants
├── contexts/
│   └── AuthContext.tsx             # Session, user, token, login, register, logout
├── hooks/
│   ├── use-color-scheme.ts
│   └── use-color-scheme.web.ts
├── services/
│   ├── api.ts                      # Axios client, token injection, 401 handler
│   ├── authService.ts
│   ├── adminService.ts
│   ├── serviceService.ts
│   ├── orderService.ts
│   ├── paymentService.ts
│   ├── walletService.ts
│   ├── courierService.ts
│   ├── ownerService.ts
│   └── notificationService.ts
├── types/
│   ├── api.ts                      # Bentuk response umum API
│   ├── user.ts                     # User, role, auth payload
│   ├── order.ts                    # Order, tracking, courier task
│   ├── service.ts                  # Laundry service DTO
│   ├── payment.ts                  # Invoice dan payment DTO
│   ├── wallet.ts                   # Wallet, transaction, withdrawal DTO
│   └── notification.ts             # Notification DTO
├── utils/
│   ├── AlertProvider.tsx           # Modal alert untuk web
│   ├── crossAlert.ts               # Alert native/web
│   ├── getErrorMessage.ts          # Parser pesan error API/Axios
│   └── __tests__/                  # Test helper utils
├── assets/                         # Font dan gambar
├── package.json                    # Script dan dependency frontend
├── tsconfig.json                   # TypeScript config app
├── tsconfig.spec.json              # TypeScript config Jest
├── jest.config.js                  # Konfigurasi Jest
├── .env.example                    # Template env public Expo
└── README.md
```

## Frontend Architecture

Frontend LaundryKu disusun dengan routing berdasarkan role, session terpusat, API service layer, dan tipe data utama menggunakan TypeScript.

### Routing dan Role Guard

- `app/_layout.tsx` adalah root layout. File ini memasang `AlertProvider`, `AuthProvider`, theme React Navigation, dan Expo Router `Stack`.
- Route dipisah dengan Expo Router group:
  - `(auth)` untuk login, register, dan waiting verification.
  - `(admin)` untuk dashboard admin, verifikasi, pengguna, laporan, dan profil.
  - `(customer)` untuk layanan, order, tracking, payment, notifikasi, dan profil.
  - `(owner)` untuk layanan laundry, order management, wallet, dan profil mitra.
  - `(courier)` untuk tugas pickup/delivery, update lokasi, earnings, wallet, dan profil kurir.
- `components/ProtectedRoute.tsx` menjadi role guard. User yang belum login diarahkan ke login, user dengan role salah diarahkan ke dashboard role masing-masing.
- Owner dan courier yang belum diverifikasi diarahkan ke waiting verification atau melihat verification gate, sehingga screen utama tidak memanggil endpoint protected berulang.

### Session dan Token

- `contexts/AuthContext.tsx` mengelola login, register, logout, refresh profile, load session, dan update profile.
- `services/api.ts` menyimpan token di in-memory cache agar langsung tersedia setelah login.
- Di native, token disimpan di SecureStore. Di web, token disimpan di localStorage sebagai fallback platform.
- Axios interceptor otomatis menambahkan `Authorization: Bearer <token>`.
- Response `401` ditangani terpusat lewat callback ke `AuthContext`, lalu session lokal dibersihkan.

### API Integration

- Semua request frontend masuk lewat `services/*Service.ts`; screen tidak memanggil Axios langsung.
- `services/api.ts` adalah satu-satunya Axios client dan membaca base URL dari `EXPO_PUBLIC_API_URL`.
- Setiap domain punya service sendiri, misalnya `authService`, `orderService`, `paymentService`, `walletService`, `courierService`, `ownerService`, `adminService`, dan `notificationService`.
- Payload dan response utama memakai DTO di folder `types/` agar kontrak data lebih mudah dijelaskan dan dicek TypeScript.

### UI Helper dan Domain Helper

- `constants/colors.ts` menyimpan warna utama dan warna per role.
- `constants/orderStatus.ts` menyimpan urutan 9 status order, label Indonesia, warna badge, dan helper timeline.
- `utils/getErrorMessage.ts` menyederhanakan error Axios/backend menjadi pesan yang aman ditampilkan ke user.
- `utils/crossAlert.ts` dan `utils/AlertProvider.tsx` membuat alert tetap jalan di native dan web.
- `components/TrackingMap.tsx` memakai WebView + Leaflet + OpenStreetMap, sehingga tracking map tidak membutuhkan Google Maps API key.
- Komponen helper owner/courier/customer yang bukan route ditempatkan di `components/`, bukan di dalam `app/`, agar tidak dibaca sebagai route oleh Expo Router.

## Implementasi Utama

| Area | Implementasi |
| --- | --- |
| Routing | Expo Router group dipisah berdasarkan role. |
| Auth | Session dikelola terpusat di `AuthContext`. |
| Token | Token native memakai SecureStore, web memakai localStorage fallback. |
| Route Guard | `ProtectedRoute` menjaga akses berdasarkan login, role, dan status verifikasi. |
| API Layer | Semua API call dipusatkan di `services/*Service.ts`. |
| Type Safety | TypeScript strict aktif; DTO utama ada di `types/`. |
| Error Handling | Error helper dan cross-platform alert dipakai untuk pesan user-facing. |
| Status Mapping | Status order memakai helper terpusat di `constants/orderStatus.ts`. |
| Map/Tracking | GPS memakai `expo-location`; peta memakai OpenStreetMap, bukan Google Maps API. |
| Payment Development | Dummy payment dikontrol env `EXPO_PUBLIC_USE_DUMMY_PAYMENT`. |
| Quality Check | Tersedia `npm run lint`, `npm run typecheck`, dan `npm test -- --runInBand`. |
| Testing | Jest mencakup helper murni seperti order status dan error message. |

Catatan:

- Google login/register sengaja tetap **Coming Soon** karena backend belum menyediakan OAuth.
- Input koordinat manual hanya aktif jika `EXPO_PUBLIC_ALLOW_MANUAL_COORDS=true`; user normal memakai GPS.
- `.env` lokal tidak boleh dikomit; gunakan `.env.example` sebagai template public env.

## Catatan MVP

Project ini masih berada pada tahap MVP. Struktur utama sudah mencakup role-based routing, context untuk auth, service layer untuk API, DTO TypeScript, helper error, dan command quality check.

Pengembangan lanjutan yang bisa dilakukan:

- Memecah beberapa screen besar menjadi komponen dan custom hook yang lebih kecil.
- Menambah cakupan testing untuk flow UI dan integrasi antar screen.
- Menambahkan Error Boundary, crash reporting, offline cache, API retry/backoff, dan runtime DTO validation jika aplikasi dikembangkan lebih lanjut.
- Menambahkan OAuth Google setelah backend menyediakan endpoint dan konfigurasi OAuth.

## Struktur Modular Baru

- Shared error parsing ada di `utils/getErrorMessage.ts` dan menerima `unknown` error/AxiosError.
- Test helper murni ada di `constants/__tests__/` dan `utils/__tests__/`.
- Customer order detail memakai komponen `components/customer/StatusTimeline.tsx` dan `components/customer/TrackingSection.tsx`.
- DTO wallet/earnings/tracking diperketat agar mengurangi `any/as any` tanpa mengubah endpoint backend.

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

- `GET /couriers/me/tasks`
- `GET /couriers/me/tasks/history`
- `PATCH /couriers/tasks/:assignment_id/status`
- `PATCH /couriers/me/location`
- `GET /couriers/me/earnings`
- Wallet dan notifications memakai endpoint shared:
  - `GET /wallets/me`
  - `GET /wallets/me/transactions`
  - `POST /wallets/me/withdraw`
  - `GET /wallets/me/withdrawals`
  - `GET /notifications`
  - `PATCH /notifications/:notification_id/read`

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
10. Tap order untuk melihat detail, peta tracking kurir, status timeline, invoice, dan payment.
11. Jika dummy payment aktif, tap **Bayar Sekarang**, lalu **Simulasi Payment Success**.
12. Jika order sudah `DELIVERED`, tap **Konfirmasi Selesai**.
13. Jika kurir sudah update lokasi, tunggu ±8 detik dan pastikan marker **Kurir** berubah di peta.
14. Buka profil untuk melihat notifikasi dan logout.

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
10. Tap order dan pastikan peta menampilkan **Lokasi Pickup**, **Kurir** jika tersedia, dan **Laundry** jika koordinat owner tersedia.
11. Jika kurir update lokasi, tunggu ±8 detik dan pastikan posisi kurir berubah.
12. Lakukan aksi sesuai status:
    - `WAITING_OWNER_CONFIRMATION` → **Konfirmasi Order**
    - `CONFIRMED` → **Assign Kurir**
    - `LAUNDRY_PICKED` → **Input Berat Laundry**
    - `PROCESSING` → **Selesai Diproses / Siap Diantar**
    - `READY_FOR_DELIVERY` → **Aktifkan Delivery**
13. Buka **Wallet**.
14. Cek available balance, pending balance, transaksi, withdrawal history.
15. Submit withdraw via bank atau e-wallet.
16. Buka **Profil**.
17. Cek data profile, notifikasi, mark read, lalu logout.

## Cara Test Courier Flow

### Courier Belum Verified

1. Login sebagai courier belum verified.
2. App menampilkan waiting verification atau pesan fitur belum aktif.
3. Screen courier tidak memanggil endpoint courier/wallet yang berpotensi 403 berulang.

### Courier Verified

1. Register courier.
2. Login admin.
3. Admin verify courier.
4. Login courier.
5. Buka **Beranda** dan pastikan summary active task, earnings, available balance, pending balance tampil.
6. Jika belum ada task, pastikan empty state tampil.
7. Login owner dan assign courier ke order.
8. Login courier lagi.
9. Buka **Tugas**.
10. Lihat active task dan task history.
11. Tap task untuk membuka detail.
12. Jalankan action pickup:
    - `PICKUP_ON_THE_WAY`
    - `LAUNDRY_PICKED`
13. Owner input weight dan customer payment jika dibutuhkan flow.
14. Owner activate delivery.
15. Courier jalankan action delivery:
    - `DELIVERY_ON_THE_WAY`
    - `DELIVERED`
    - `DONE`
16. Tap **Update Lokasi Sekarang** untuk mengirim GPS sekali via `expo-location`.
17. Tap **Aktifkan Auto Update Lokasi** untuk update otomatis setiap 12 detik.
18. Tap **Matikan Update Lokasi** untuk menghentikan interval.
19. Buka **Pendapatan** dan cek total/month/today/completed task.
20. Buka **Wallet** dan request withdraw via bank atau e-wallet.
21. Buka **Profil**, cek notifications, mark read, lalu logout.

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



