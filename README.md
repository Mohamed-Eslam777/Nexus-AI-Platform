# 🚀 Nexus AI | Production-Grade Data Annotation Platform

> **An advanced, full-stack platform built for the modern AI economy, featuring real-time communication, intelligent task management, and a seamless Dark UI.**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0.1-green)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-black)](https://socket.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [Credits](#credits)

---

## 🎯 Overview

Nexus AI is a sophisticated, production-ready data annotation platform designed to streamline the workflow between administrators and contributors. The platform leverages AI-powered automation, real-time communication, and gamification to create an efficient, engaging work environment.

### Core Concept

The platform enables:
- **Administrators** to create, manage, and review data annotation projects
- **Contributors** to submit high-quality annotations with AI-assisted quality checks
- **Automated triage** that intelligently routes submissions based on quality scores
- **Real-time notifications** for instant feedback and updates
- **Performance tracking** with a tiered gamification system

---

## ✨ Key Features

### 🤖 AI-Powered Triage System
- **Automated Quality Scoring**: AI simulates quality assessment (50-100% range)
- **Smart Status Assignment**: 
  - Auto-Approve (≥98%): Instant approval for exceptional submissions
  - Auto-Reject (<70%): Immediate rejection for low-quality work
  - Human Review (70-97%): Manual review for borderline cases
- **Scheduled Auto-Approval**: High-quality pending submissions (≥90%) automatically approved after 3 days
- **Consistency Warnings**: Detects contradictions between AI scores and content quality

### 🏆 Tiered Gamification System
- **Four-Tier Ranking**: Bronze → Silver → Gold → Elite
- **Performance Metrics**: 
  - Approval Rate calculation
  - Total/Approved submissions tracking
  - Automatic tier upgrades based on performance
- **Visual Tier Badges**: Displayed on Profile and Dashboard pages

### 📊 Advanced Admin Tools
- **Bulk Review Operations**: Approve/reject multiple submissions simultaneously
- **Real-Time Dashboard**: Comprehensive statistics and metrics
- **User Management**: Paginated user list with search and filtering
- **AI Instruction Generation**: Automated project instruction generation
- **Audit Logging**: Complete trail of all admin actions

### 🔔 Real-Time Notifications
- **Socket.io Integration**: Instant notifications via WebSocket
- **Personalized Rooms**: Each user receives notifications in their private room
- **Toast Notifications**: Immediate visual feedback for all events
- **Notification History**: Track and manage all received notifications

### 🌍 Internationalization (i18n)
- **Full RTL/LTR Support**: Seamless Arabic (RTL) and English (LTR) support
- **Language Context**: Global language management with Local Storage persistence
- **Dynamic Text Direction**: Automatic UI adaptation based on selected language
- **Professional Translations**: High-quality Arabic translations for all admin content

### 🔐 Security & Authentication
- **JWT-Based Auth**: Secure token-based authentication
- **Role-Based Access Control**: Admin/User/Freelancer role separation
- **Password Reset Flow**: Secure forgot/reset password functionality
- **Protected Routes**: Frontend route protection with middleware
- **Password Hashing**: bcryptjs for secure password storage

### 🎨 Modern UI/UX
- **Dark Theme**: Sleek, modern dark interface with glassmorphism effects
- **Framer Motion**: Smooth animations and transitions throughout
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Skeleton Loaders**: Enhanced loading UX with skeleton screens
- **Responsive Design**: Fully responsive across all devices

### 🧪 Code Quality
- **Jest & Supertest**: Comprehensive backend testing with MongoDB Memory Server
- **Centralized API Layer**: DRY principle with dedicated `api.js` service
- **Error Handling**: Detailed error logging and user-friendly error messages
- **Validation**: Robust input validation on both frontend and backend

### 💼 Additional Features
- **Wallet System**: Track earnings, request payouts, view transaction history
- **Analytics Dashboard**: Performance metrics and earnings visualization
- **Application System**: User onboarding with technical assessments
- **Project Management**: Create, edit, and manage annotation projects
- **Task Submission**: Submit completed tasks with AI quality checks

### 🎯 Task Repetition & Submission Limits
- **User Repetition Control (`isRepeatable`)**: 
  - Admins can set tasks as **'One-time'** (hides from user after first completed submission) or **'Repeatable'** (infinitely repeatable)
  - One-time tasks automatically disappear from the user's dashboard after they complete one submission
  - Repeatable tasks remain available for unlimited submissions
- **Aggregate Submission Cap (`maxTotalSubmissions`)**: 
  - Admins can set a total submission limit for the entire project (e.g., 1000 tasks)
  - Projects are automatically hidden from all users once the limit is reached
  - Submissions are blocked when the project reaches its maximum capacity
  - Optional field (null = no limit)

### 📊 Advanced Analytics Dashboard (Role-Based)
- **Role-Based Views:** The analytics page is dynamic and shows different data based on user role (Admin vs. Freelancer)
- **Admin View (Project Performance):**
  - **KPI Cards:** Overall stats (Total Payout, Total Approved, Overall Approval Rate, Total Projects)
  - **Bar Chart:** Top 10 Projects ranked by total payout using Chart.js
  - **Detailed Table:** Full performance metrics for every project (submissions, approval rates, earnings)
- **Admin View (Top Performers):**
  - **Top 10 Freelancers:** A ranked table showing top freelancers by earnings, including their tier, approval rate, and total approved/rejected tasks
  - **Comprehensive Metrics:** Name, email, tier badge, submission counts, and total earnings
- **Freelancer View (Personal Performance):**
  - **KPI Cards:** Personal stats (My Tier, Total Earnings, Approval Rate, Pending Earnings)
  - **Doughnut Chart:** A visual breakdown of personal submissions (Approved, Rejected, Pending) using Chart.js
  - **Performance Summary:** Detailed table showing all personal submission metrics

---

## 🛠 Tech Stack

### Frontend
- **React 18.2.0** - UI library
- **React Router DOM 6.20.1** - Client-side routing
- **Framer Motion 12.23.24** - Animation library
- **Tailwind CSS 3.4.18** - Utility-first CSS framework
- **Axios 1.6.2** - HTTP client
- **Socket.io Client 4.8.1** - Real-time WebSocket communication
- **i18next 25.6.0** - Internationalization framework
- **React Toastify 11.0.5** - Toast notifications
- **JWT Decode 4.0.0** - Token decoding

### Backend
- **Node.js** (≥18.0.0) - Runtime environment
- **Express.js 4.19.2** - Web framework
- **MongoDB 8.0.1** (Mongoose) - Database & ODM
- **Socket.io 4.8.1** - Real-time server
- **JWT 9.0.2** - Authentication tokens
- **bcryptjs 2.4.3** - Password hashing
- **cors 2.8.5** - Cross-origin resource sharing

### Testing
- **Jest 29.7.0** - Testing framework
- **Supertest 6.3.4** - HTTP assertion library
- **MongoDB Memory Server 10.3.0** - In-memory MongoDB for testing

### Development Tools
- **Concurrently 8.2.1** - Run multiple commands simultaneously
- **Nodemon 3.0.1** - Auto-restart server on changes
- **CRACO 7.1.0** - Create React App Configuration Override

---

## 📁 Project Structure

```
nexus-ai/
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── Navbar.js
│   │   │   ├── Footer.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── SkeletonLoader.jsx
│   │   ├── context/       # React Context providers
│   │   │   ├── LanguageContext.js
│   │   │   └── SocketContext.js
│   │   ├── i18n/          # Internationalization files
│   │   │   ├── en.json
│   │   │   ├── ar.json
│   │   │   └── i18n.js
│   │   ├── pages/         # Page components
│   │   │   ├── DashboardPage.js
│   │   │   ├── AdminPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── WalletPage.js
│   │   │   ├── Analytics.jsx
│   │   │   └── ... (other pages)
│   │   ├── services/      # API service layer
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
│
├── server/                 # Node.js Backend Application
│   ├── controllers/       # Business logic controllers
│   │   ├── admin.controller.js
│   │   └── user.controller.js
│   ├── middleware/        # Express middleware
│   │   └── auth.middleware.js
│   ├── models/            # Mongoose models
│   │   ├── User.model.js
│   │   ├── Project.model.js
│   │   ├── Submission.model.js
│   │   ├── PayoutRequest.model.js
│   │   └── AuditLog.model.js
│   ├── routes/            # API routes
│   │   ├── auth.routes.js
│   │   ├── project.routes.js
│   │   ├── user.routes.js
│   │   ├── wallet.routes.js
│   │   └── admin.routes.js
│   ├── socket.js          # Socket.io initialization
│   ├── utils/             # Utility functions
│   │   └── logger.js
│   ├── tests/             # Test files
│   │   ├── setup.js
│   │   └── projects.test.js
│   ├── server.js          # Main server file
│   └── .env               # Environment variables (create this)
│
├── package.json           # Root package.json
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** ≥18.0.0
- **MongoDB** (local installation or MongoDB Atlas connection string)
- **npm** or **yarn**

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd nexus-ai
```

### Step 2: Install Root Dependencies

```bash
npm install
```

### Step 3: Install Client Dependencies

```bash
npm run client:install
# OR
cd client && npm install && cd ..
```

### Step 4: Install Server Dependencies

Server dependencies are installed via the root `npm install`. No additional step needed.

### Step 5: Environment Configuration

#### Backend Environment Variables

Create a `.env` file in the `server/` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/nexus-ai
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nexus-ai

# JWT Secret Key
JWT_SECRET=your_super_secret_key_for_mohamed_dataannotation_2025

# Server Port
PORT=5000

# Frontend URL (for CORS and Socket.io)
FRONTEND_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

#### Frontend Environment Variables (Optional)

Create a `.env` file in the `client/` directory if you need to override defaults:

```env
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## ▶️ Running the Application

### Development Mode (Recommended)

Run both frontend and backend concurrently:

```bash
npm run dev
```

This command will:
- Start the backend server on `http://localhost:5000`
- Start the frontend development server on `http://localhost:3000`
- Enable hot-reload for both servers

### Separate Execution

#### Backend Only

```bash
npm run server
# OR
cd server && node server.js
```

#### Frontend Only

```bash
npm run client
# OR
cd client && npm start
```

### Production Build

```bash
# Build the frontend
cd client && npm run build

# Start production server
npm start
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests in CI Mode

```bash
npm run test:ci
```

### Test Coverage

The test suite includes:
- **Project Update Security Tests**: Admin vs. non-admin access validation
- **AI Auto-Triage Logic Tests**: Verify correct status assignment based on AI scores
- **MongoDB Memory Server**: Isolated test database for fast, clean tests

---

## 📡 API Documentation

### Authentication Routes

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password with token
- `GET /api/auth/analytics` - Get personal performance stats for the logged-in user (tier, earnings, approval rate, submission counts)

### Project Routes

- `GET /api/projects` - Get available projects (filtered by `isRepeatable` logic, `maxTotalSubmissions` cap, and user's `skillDomain`)
- `GET /api/projects/all` - Get all projects (Admin only)
- `POST /api/projects` - Create new project (Admin only). Accepts `isRepeatable` (boolean) and `maxTotalSubmissions` (number or null) in request body
- `PUT /api/projects/:id` - Update project (Admin only). Accepts `isRepeatable` (boolean) and `maxTotalSubmissions` (number or null) for updates
- `POST /api/projects/:id/submit` - Submit completed task. Blocks submission if `maxTotalSubmissions` limit is reached
- `GET /api/projects/stats` - Get admin statistics (Admin only)
- `GET /api/projects/submissions/pending` - Get pending submissions (Admin only)
- `PUT /api/projects/submissions/:id/review` - Review submission (Admin only)
- `PUT /api/projects/submissions/bulk-review` - Bulk review submissions (Admin only)

### Admin Routes

- `GET /api/admin/analytics/project-performance` - Get aggregated performance stats for all projects (Admin only)
- `GET /api/admin/analytics/freelancer-performance` - Get top 10 freelancers ranked by earnings (Admin only)

### User Routes

- `PUT /api/users/profile/update` - Update user profile
- `GET /api/users/admin/all` - Get all users with pagination (Admin only)
- `PUT /api/users/admin/update/:id` - Update user role/status (Admin only)
- `DELETE /api/users/admin/clean-db` - Clean database (Admin only, for testing)

### Wallet Routes

- `GET /api/wallet/available-balance` - Get available balance
- `GET /api/wallet/pending-review-balance` - Get pending review balance
- `POST /api/wallet/request-payout` - Request payout
- `GET /api/wallet/admin/pending-requests` - Get pending payout requests (Admin only)
- `PUT /api/wallet/admin/review/:id` - Review payout request (Admin only)

---

## 📸 Screenshots

### Dashboard View
![Dashboard](https://via.placeholder.com/800x400/1e293b/ffffff?text=Dashboard+View)
*Clean, modern dashboard showing available projects with tier badges*

### Admin Panel
![Admin Dashboard](https://via.placeholder.com/800x400/1e293b/ffffff?text=Admin+Dashboard)
*Comprehensive admin interface with statistics, submission review, and bulk operations*

### Dark UI Theme
![Dark UI](https://via.placeholder.com/800x400/1e293b/ffffff?text=Dark+UI+Theme)
*Sleek glassmorphism design with smooth animations*

---

## 🔧 Key Configuration Files

### Backend Configuration
- `server/server.js` - Main server entry point
- `server/socket.js` - Socket.io initialization
- `server/middleware/auth.middleware.js` - Authentication middleware

### Frontend Configuration
- `client/src/App.js` - Main React component with routing
- `client/src/services/api.js` - Centralized API service
- `client/src/context/SocketContext.js` - Socket.io client context
- `client/tailwind.config.js` - Tailwind CSS configuration

---

## 🎯 Feature Highlights

### AI Auto-Triage Flow
1. User submits a task
2. AI generates quality score (50-100%)
3. System automatically assigns status:
   - **≥98%**: Auto-Approved
   - **<70%**: Auto-Rejected
   - **70-97%**: Pending (Human Review)
4. High-quality pending (≥90%) scheduled for auto-approval after 3 days

### Gamification System
- **Bronze**: Default tier (<70% approval rate)
- **Silver**: 70-84% approval rate
- **Gold**: 85-94% approval rate
- **Elite**: ≥95% approval rate

### Real-Time Notifications
- Instant alerts for submission approval/rejection
- Payout completion notifications
- Socket.io-based WebSocket communication
- Personalized notification rooms per user

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Credits

**Designed & Built by [Mohamed Eslam](https://www.linkedin.com/in/mohamed-eslam)**

### Contact & Links

- **LinkedIn**: [Mohamed Eslam](https://www.linkedin.com/in/mohamed-eslam)
- **Project Repository**: [GitHub Repository](https://github.com/yourusername/nexus-ai)

---

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by the need for efficient data annotation workflows
- Designed with user experience and developer experience in mind

---

## 📊 Project Statistics

- **Frontend Components**: 15+ pages and components
- **Backend Routes**: 20+ API endpoints
- **Database Models**: 5 Mongoose schemas
- **Test Coverage**: Critical security and business logic tests
- **Languages Supported**: English (LTR), Arabic (RTL)
- **Real-Time Features**: Socket.io integration with personalized rooms

---

## 🚧 Roadmap

Future enhancements planned:
- [ ] Email notifications integration
- [ ] Advanced analytics and reporting
- [ ] Mobile app support
- [ ] Payment gateway integration
- [ ] Enhanced AI scoring algorithms
- [ ] Multi-language expansion

---

**Made with ❤️ by  Mohamed  Eslam**

*Last Updated: 2025*





