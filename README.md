# 🌴 SmartLeave - Modern Enterprise Leave Management System

SmartLeave is a full-featured, enterprise-grade Employee Leave and Time-Off Management platform. Built with **Laravel 11**, **React 18 (TypeScript)**, **MySQL**, **Redis**, and **Docker**, SmartLeave streamlines absence tracking, multi-tier approval workflows, department organization, and HR analytics.

---

## 🚀 Key Features

### 🔐 1. Authentication & Employee Onboarding
- **Role-Based Access Control (RBAC)**: Distinct permissions for `Admin`, `HR Manager`, `Line Manager`, and `Employee`.
- **Invite-Based Onboarding**: Secure signed-URL email invitations for onboarding new team members.
- **Profile & Credential Management**: Avatar upload, password changes, and personal detail updates.

### 📅 2. Leave Request & Entitlement Management
- **Custom Leave Types**: Configure Annual Leave, Sick Leave, Maternity/Paternity, Unpaid Leave, Remote Work, etc., with paid/unpaid rules and annual allowances.
- **Smart Duration Calculation**: Automatic calculation of leave days excluding weekends and official company holidays. Support for half-day requests.
- **Real-Time Entitlement Balances**: Live tracking of available, pending, used, and accrued leave balances per user.
- **Approval Workflows**: Seamless approve/reject workflows with optional rejection reasons and employee cancellation requests.

### 📆 3. Interactive Calendar & Absence Planning
- **Company Holiday Calendar**: Centralized management of public and official company holidays.
- **Team Absence View**: Visual schedule showing who is on leave across departments to prevent coverage overlaps.

### 🏢 4. Department & Organizational Structure
- **Department Management**: Organize employees into departments with assigned Department Heads.
- **Employee Directory**: Detailed profiles, manager assignments, status toggles (active/inactive), and employee hover cards.

### 📊 5. HR Analytics & Reports
- **Dashboard Metrics**: Real-time stats on pending approvals, team availability, leave utilization rates, and monthly trends.
- **CSV Data Export**: Export leave history, balances, and audit records for payroll or HR reporting.

### 🛡️ 6. Security, Audit Logs & System Health
- **Complete Audit Trail**: Log of all critical actions (leave approvals, role changes, settings updates) with timestamps and user details.
- **System Health Diagnostics**: Live health status monitoring for database, cache, redis, and mail services.
- **Multilingual Support (i18n)**: Native multi-language interface supporting English, French, and Arabic/Darija.

---

## 🛠️ Technology Stack

### **Backend**
- **Framework**: Laravel 11 (PHP 8.2+)
- **Authentication**: Laravel Sanctum (Token-based API auth)
- **Database**: MySQL 8.0
- **Caching & Queues**: Redis
- **Mail Testing**: Mailpit

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS / Modern UI Component System
- **Icons**: Lucide React / SVG Icon Set
- **State & i18n**: React Context API (AuthContext, LanguageContext)

### **DevOps & Containerization**
- **Docker Compose**: Containerized multi-service setup (Backend, Frontend, MySQL, Redis, Mailpit).

---

## 📁 Project Structure

```
SmartLeave/
├── backend/                  # Laravel API Application
│   ├── app/                  # Controllers, Models, Services, Middleware
│   ├── config/               # App, Auth, Database, Permission configs
│   ├── database/             # Migrations, Seeders, Factories
│   ├── routes/               # API routes (api.php)
│   └── storage/              # Logs, Cache, App storage
│
├── frontend/                 # React + TypeScript Web App
│   ├── src/
│   │   ├── components/ui/    # Reusable UI library (Button, Modal, Card, DatePicker, etc.)
│   │   ├── context/          # Global Contexts (AuthContext, LanguageContext)
│   │   ├── features/         # Feature Modules (Auth, Dashboard, Leave, Departments, Reports, Settings)
│   │   ├── i18n/             # Translations (EN, FR, AR)
│   │   ├── services/         # API Service Clients
│   │   └── types/            # TypeScript interfaces & definitions
│   └── index.html
│
├── docker/                   # Docker Dockerfiles and Nginx configurations
├── docker-compose.yml        # Docker orchestration configuration
└── README.md                 # Project documentation
```

---

## 🚦 Quick Start with Docker

The easiest way to run SmartLeave locally is using Docker Compose:

### 1. Clone the Repository
```bash
git clone https://github.com/Medox05/SmartLeave.git
cd SmartLeave
```

### 2. Environment Setup
Create the `.env` file for the backend if not already present:
```bash
cp backend/.env.example backend/.env
```

### 3. Launch Services
Start all containers (Backend, Frontend, MySQL, Redis, Mailpit):
```bash
docker-compose up -d --build
```

### 4. Database Setup & Seed Data
Run migrations and initial seeders inside the backend container:
```bash
docker exec -it smartleave_backend php artisan migrate:fresh --seed
```

---

## 🌐 Application URLs

Once running, access the services at:

| Service | URL | Notes |
| :--- | :--- | :--- |
| **Frontend Web App** | `http://localhost:5173` | React Application |
| **Backend API** | `http://localhost:8000/api` | Laravel REST API |
| **Mailpit (Email Sandbox)** | `http://localhost:8025` | Web UI for testing emails |

---

## 🧪 Local Manual Setup (Without Docker)

### Backend Setup:
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Default Admin Credentials (Seeded)

- **Email**: `admin@smartleave.com` (or as defined in `DatabaseSeeder.php`)
- **Password**: `password`

---

## 📜 License

This project is open-source software licensed under the [MIT License](LICENSE).
