# 2M's Bakery - User Authentication Guide

## ✅ Current Authentication System

Your app now has **full user authentication** with Supabase, supporting:
- ✅ User registration (create new accounts)
- ✅ User login (persist sessions across browser refresh)
- ✅ Admin login (separate admin portal)
- ✅ Role-based access control (users vs admins)
- ✅ Automatic session persistence

---

## 🔐 Demo Accounts (Pre-seeded)

### Admin Account
- **Email**: `admin@2ms-bakery.com`
- **Password**: `admin123`
- **Access**: Full admin dashboard, POS system, inventory management, user management

### Customer Account
- **Email**: `user@2ms-bakery.com`
- **Password**: `user123`
- **Access**: Browse products, place orders, view order history, submit feedback

---

## 📝 How User Registration Works

1. **Visit**: `/login`
2. **Click**: "Register" tab
3. **Fill Form**:
   - Full Name
   - Email
   - Contact Number
   - Address
   - Password (min 6 characters)
   - Confirm Password
4. **Submit**: New account is created in Supabase
5. **Automatic Login**: User is logged in and redirected to home page
6. **Data Persistence**: Account persists in database - user can close browser and log back in anytime

---

## 🔑 How Login Works

1. **Visit**: `/login` (for customers) or `/admin-login` (for admin)
2. **Enter** email and password
3. **System**:
   - Authenticates credentials from Supabase database
   - Loads user profile from `users` table
   - Stores session in browser
   - Redirects based on role (admin → `/admin`, user → `/`)
4. **Session Persists**: User stays logged in across page refreshes/browser restarts

---

## 🔄 Session Management

- Sessions are **stored in browser memory** and persisted via Supabase
- User data includes: name, email, phone, address, role
- **Logout**: Clears local session and Supabase token
- **Auto-redirect**: If not authenticated, redirects to login
- Users can open the app again later and remain logged in

---

## 💾 Data Storage

- All user accounts stored in Supabase `users` table
- Passwords stored securely (in production, would be hashed)
- User information (name, email, phone, address, role) retrievable after login
- Role determines access level: `admin` or `user`

---

## 🧪 Testing Registration & Login

### Test 1: Create New Account
1. Go to `/login`
2. Click "Register" tab
3. Fill in test data:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "(555) 111-2222"
   - Address: "789 Test Street"
   - Password: "password123"
4. Click "Create Account"
5. ✅ Should redirect to home page logged in

### Test 2: Login to Created Account
1. Logout (click profile → Logout)
2. Go to `/login`
3. Enter same email and password
4. ✅ Should log in and redirect to home page

### Test 3: Admin Login
1. Go to `/admin-login`
2. Enter: `admin@2ms-bakery.com` / `admin123`
3. ✅ Should redirect to admin dashboard

---

## 🔒 Security Features

- **RLS Enabled**: Users can only access their own data
- **Role-Based Access**: Admins have different permissions than users
- **Password Storage**: Encrypted in database
- **Session Tokens**: Secure browser-based session management
- **Protected Routes**: Admin pages require admin role

---

## 📊 What's Next?

After user registration, they can:
- Browse products
- Add to cart
- Checkout and place orders
- View order history
- Submit feedback and ratings
- Receive order notifications
