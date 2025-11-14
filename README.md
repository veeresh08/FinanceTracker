# 💰 WealthFlow - Premium Financial Tracker

<div align="center">

![WealthFlow Logo](https://img.shields.io/badge/WealthFlow-Financial%20Management-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMiA3TDEyIDEyTDIyIDdMMTIgMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yIDEyTDEyIDE3TDIyIDEyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMiAxN0wxMiAyMkwyMiAxNyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+)

**Your Complete Wealth Management Solution**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

[🚀 Live Demo](#) | [📖 Documentation](#features) | [🐛 Report Bug](https://github.com/veeresh08/FinanceTracker/issues)

</div>

---

## ✨ Features

### 🏦 **Comprehensive Financial Management**

- **💰 Loan Tracking**
  - Track multiple loans (Personal, Home, Car, Education)
  - Real-time EMI calculator
  - Payoff date predictions
  - Interest vs Principal breakdown
  - What-if prepayment scenarios
  - Visual progress indicators

- **📈 Investment Portfolio**
  - ESPP (Employee Stock Purchase Plans) tracking
  - SIP (Systematic Investment Plans)
  - Mutual Funds, Stocks, FD, PPF, NPS
  - Auto-calculated returns
  - Future value projections
  - Portfolio diversification insights

- **📅 Monthly Expense Tracker**
  - 12+ expense categories
  - Auto-populated income & obligations
  - Visual breakdowns with charts
  - Savings calculator
  - Emergency fund tracking

- **📊 Smart Dashboard**
  - Real-time analytics
  - AI-powered recommendations
  - Debt-to-income ratio tracking
  - Financial health score
  - Interactive charts & visualizations

- **🔐 Secure Authentication**
  - Google Sign-In integration
  - Username/Password authentication
  - OTP-based login
  - Multi-user support

### 🎨 **Premium UI/UX**

- **Modern Glassmorphism Design**
- **Smooth Animations & Transitions**
- **Fully Mobile Responsive**
- **Dark Mode Support** (coming soon)
- **Accessibility Compliant**
- **Professional Color Scheme**
- **Premium Fonts (Inter & Poppins)**

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/veeresh08/FinanceTracker.git
cd FinanceTracker

# Install dependencies
npm install

# Start the backend server
npm run server

# In a new terminal, start the frontend
cd client
npm install
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

---

## 📁 Project Structure

```
FinanceTracker/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # React Components
│   │   │   ├── Home.tsx          # Landing Page
│   │   │   ├── Dashboard.tsx     # Analytics Dashboard
│   │   │   ├── LoansPage.tsx     # Loan Management
│   │   │   ├── InvestmentsPage.tsx  # Investment Tracking
│   │   │   ├── MonthlyTracker.tsx   # Expense Tracking
│   │   │   └── ProfilePage.tsx      # User Profile
│   │   ├── api.ts         # API Client
│   │   ├── types.ts       # TypeScript Interfaces
│   │   ├── App.tsx        # Main App Component
│   │   └── index.css      # Premium Design System (1500+ lines)
│   ├── package.json
│   └── vite.config.ts
│
├── server/                # Node.js Backend
│   ├── server.ts          # Express Server
│   └── database.db        # SQLite Database
│
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS** - Premium Styling
- **Recharts** - Data Visualization
- **Vite** - Build Tool
- **Axios** - HTTP Client

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **SQLite** - Database
- **TypeScript** - Type Safety
- **Passport.js** - Authentication

---

## 📱 Screenshots

### Home Dashboard
> Premium welcome screen with financial overview

### Loan Management
> Track multiple loans with visual progress indicators

### Investment Portfolio
> Comprehensive investment tracking with projections

### Monthly Tracker
> Detailed expense tracking with auto-calculations

---

## 🎯 Key Features Explained

### 1. **Smart Loan Tracking**
- Automatically calculates EMI, interest, and payoff dates
- Visual progress bars showing loan completion
- Prepayment calculator ("What-if" scenarios)
- Amortization schedule visualization

### 2. **Advanced Investment Tracking**
- **ESPP Calculator:** Tracks stock purchases with discounts, vesting, and lookback periods
- **SIP Projections:** Future value calculator with expected returns
- **Portfolio Analysis:** Diversification and allocation insights
- **Auto-integration:** Investment data flows to monthly tracker

### 3. **Intelligent Monthly Tracker**
- **Auto-population:** Salary, loan obligations, and investments pre-filled
- **Category Tracking:** Food, Rent, Transportation, Entertainment, etc.
- **Visual Breakdown:** Income flow with interactive charts
- **Net Savings:** Automatic calculation of disposable income

### 4. **AI-Powered Recommendations**
- Debt optimization suggestions
- Savings opportunities
- Investment advice
- Financial health alerts

---

## 🔒 Security Features

- ✅ Secure password hashing (bcrypt)
- ✅ JWT-based session management
- ✅ Google OAuth 2.0 integration
- ✅ OTP verification
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration

---

## 📊 Database Schema

### Tables
- `user_profile` - User information and settings
- `auth_users` - Authentication credentials
- `loans` - Loan records with calculations
- `investments` - Investment portfolio data
- `monthly_records` - Monthly expense tracking
- `payment_history` - Transaction logs

---

## 🎨 Design System

### Color Palette
- **Primary:** Blue (#3b82f6)
- **Success:** Green (#10b981)
- **Warning:** Yellow (#f59e0b)
- **Danger:** Red (#ef4444)
- **Purple:** (#8b5cf6)

### Typography
- **Display:** Poppins (Headings)
- **Body:** Inter (Content)

### Components
- 50+ Reusable Components
- Consistent spacing & sizing
- Accessibility-first design
- Mobile-optimized layouts

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
vercel deploy
```

### Backend (Heroku/Railway)
```bash
git push heroku main
```

### Database Migration
- SQLite for development
- PostgreSQL for production (recommended)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Veeresh Naik**
- GitHub: [@veeresh08](https://github.com/veeresh08)
- Email: jveereshnaik@gmail.com

---

## 🙏 Acknowledgments

- Inspired by modern financial platforms like Mint, YNAB, and Personal Capital
- UI/UX influenced by Google Material Design and Apple's Human Interface Guidelines
- Icons from Heroicons
- Fonts from Google Fonts

---

## 📈 Roadmap

- [ ] **Budget Planner** with alerts
- [ ] **Bill Reminders** and payment tracking
- [ ] **Net Worth Tracker** (Assets - Liabilities)
- [ ] **Tax Planning** tools
- [ ] **Goal Tracker** with milestones
- [ ] **Mobile App** (React Native)
- [ ] **Dark Mode**
- [ ] **Multi-currency** support
- [ ] **Data Export** (PDF, Excel)
- [ ] **Bank Integration** (via Plaid API)

---

## 💡 Usage Tips

### For Best Results:
1. **Update regularly** - Keep your financial data current
2. **Set realistic goals** - Use the debt-free calculator
3. **Track investments** - Monitor your portfolio growth
4. **Review monthly** - Check your expense patterns
5. **Use recommendations** - Follow AI suggestions

---

## 🐛 Known Issues

- None currently! Report bugs [here](https://github.com/veeresh08/FinanceTracker/issues)

---

## 📞 Support

Having issues? Need help?
- 📧 Email: jveereshnaik@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/veeresh08/FinanceTracker/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/veeresh08/FinanceTracker/discussions)

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ by Veeresh Naik

[⬆ Back to Top](#-wealthflow---premium-financial-tracker)

</div>
