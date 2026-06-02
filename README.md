# 🚀 SwiftWheels – Fleet Management System

A full-stack Fleet Management System built with **React** (frontend) and **Node.js/Express** (backend) connected to **MySQL** (`swift_db`).

---

## 📁 Project Structure

```
yves/
├── swift_db.sql          ← MySQL database setup
├── backend/              ← Node.js + Express REST API
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js
│       ├── vehicles.js
│       ├── drivers.js
│       ├── trips.js
│       ├── fuel.js
│       ├── maintenance.js
│       ├── users.js
│       └── reports.js
└── frontend/             ← React application
    └── src/
        ├── pages/        ← Dashboard, Vehicles, Drivers, Trips, Fuel, Maintenance, Users, Reports
        └── components/   ← Layout, Table, Modal, PageHeader
```

---

## ⚙️ Setup Instructions

### 1. Database
```sql
-- In MySQL / phpMyAdmin, run:
swift_db.sql
```

### 2. Backend
```bash
cd backend
npm install
# Edit .env if needed (DB credentials)
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

---

## 🔐 Default Login
| Username | Password  | Role          |
|----------|-----------|---------------|
| admin    | password  | Administrator |

---

## 📦 Modules
| Module       | Description                              |
|--------------|------------------------------------------|
| Dashboard    | Live stats and charts overview           |
| Vehicles     | Register, edit, delete fleet vehicles    |
| Drivers      | Manage driver records                    |
| Trips        | Record trips and update mileage          |
| Fuel         | Track fuel purchases and costs           |
| Maintenance  | Schedule and track vehicle servicing     |
| Users        | Manage system users and roles            |
| Reports      | Charts and tables for all modules        |

---

**Created By Yves Ty**
