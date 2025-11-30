# WealthFlow - Complete LLM Context & Project Documentation

## 🎯 Project Overview

**WealthFlow** is a comprehensive personal finance management application that helps users track loans, investments, monthly income/expenses, and provides smart financial insights.

**Live App:** https://wealthflow-bhtvileluq-uc.a.run.app  
**GitHub Repo:** https://github.com/veeresh08/FinanceTracker  
**Tech Stack:** React (Vite) + TypeScript + Node.js + Express + SQLite + Cloud Run

---

## 📁 Project Structure

```
loan-tracker/
├── client/                          # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── LoginPage.tsx       # Auth (username/password, OTP, Google)
│   │   │   ├── Navbar.tsx          # Navigation bar
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── ImprovedDashboard.tsx   # Main dashboard with analytics
│   │   │   ├── LoansPage.tsx       # Comprehensive loan tracking
│   │   │   ├── LoanDetails.tsx     # Individual loan details
│   │   │   ├── InvestmentsPage.tsx # Investment portfolio (SIP, ESPP, etc.)
│   │   │   ├── ImprovedMonthlyTracker.tsx  # Monthly income/expense tracking
│   │   │   ├── ProfilePage.tsx     # User profile management
│   │   │   └── SetupForm.tsx       # Initial user setup
│   │   ├── api.ts                  # API client (axios)
│   │   ├── types.ts                # TypeScript interfaces
│   │   ├── UserContext.tsx         # User context provider
│   │   ├── utils.ts                # Utility functions
│   │   ├── App.tsx                 # Main app component
│   │   └── main.tsx                # Entry point
│   ├── package.json
│   └── vite.config.ts
├── server/                          # Node.js backend (Express + SQLite)
│   ├── server.ts                   # Main server file with all APIs
│   ├── database.ts                 # Database initialization
│   └── auth.ts                     # Authentication helpers
├── Dockerfile                       # Docker configuration for Cloud Run
├── docker-compose.yml              # Local development with Docker
├── cloudbuild.yaml                 # CI/CD configuration for Google Cloud Build
├── package.json                    # Backend dependencies
└── PROJECT_CONTEXT.md              # This file (LLM context)
```

---

## 🗄️ Database Schema

### SQLite Database: `loan-tracker.db`

#### **auth_users** - User authentication
- id, username, email, phone, password_hash, google_id
- auth_method (password/otp/google), otp, otp_expires_at
- is_verified, last_login, created_at, updated_at

#### **user_profile** - User financial profile
- id, auth_user_id (FK), user_name, currency (default: INR)
- monthly_salary, other_income, total_income
- created_at, updated_at

#### **loans** - User loans
- id, user_id (FK), loan_name, loan_type (personal/home/car/education/credit_card)
- principal_amount, interest_rate, loan_term_months
- start_date, monthly_payment, remaining_balance, total_interest
- status (active/completed/closed), created_at, updated_at

#### **investments** - Investment portfolio
- id, user_id (FK), name, type (espp/sip/mutual_fund/stocks/fd/ppf/nps)
- principal, monthly_contribution, expected_return_rate
- start_date, tenure_months, current_value, status
- ESPP fields: purchase_price, current_stock_price, discount_percent, shares_per_month, vesting_months, lookback_months
- created_at, updated_at

#### **monthly_records** - Monthly financial tracking
- id, user_id (FK), month, year
- salary, other_income, total_income
- total_loan_payment, other_expenses, savings
- investments, emergency_fund, credit_card
- rent, food, transport, utilities, entertainment
- notes, created_at

#### **extra_payments** - Extra loan payments
- id, loan_id (FK), payment_date, amount, notes, created_at

#### **monthly_expenses** - Detailed expenses
- id, user_id (FK), month, year, category, amount, description, created_at

---

## 🚀 Key Features

### 1. **Authentication (3 Methods)**
- Username/Password registration & login
- Phone OTP authentication
- Google OAuth Sign-In

### 2. **Loan Management**
- Add/Edit/Delete loans
- Accurate **bank-level amortization** calculations
- Current installment tracking (#22/72 format)
- This month's EMI breakdown (Principal vs Interest)
- **Outstanding balance** (matches bank statements)
- **Preclosure analysis** (with 4% penalty calculation)
- **Savings calculation** (continue EMIs vs close today)
- **Full amortization schedule** (month-by-month table)
- **Extra payment calculator** (see impact of prepayments)
- **Smart loan closure recommendations** (priority ranking)
- **Import/Export** loans (JSON/CSV format)
- Visual progress tracking

### 3. **Investment Portfolio**
- Track multiple investment types (SIP, ESPP, Mutual Funds, PPF, NPS, etc.)
- **ESPP-specific tracking** (purchase price, discount%, vesting)
- Monthly SIP projections
- Future value calculations
- Investment growth charts
- **Import/Export** investments (JSON/CSV)

### 4. **Monthly Tracking**
- Income tracking (salary + other income)
- Expense categories (rent, food, transport, utilities, entertainment)
- Automatic loan payment calculations
- Savings tracking
- Emergency fund monitoring
- Credit card expenses

### 5. **Dashboard Analytics**
- Total loans summary
- Debt-to-income ratio
- Available income after loans
- Smart financial recommendations
- Loan prioritization
- Debt-free timeline

---

## 🧮 Loan Calculation Formulas

### 1. **Monthly EMI**
```
EMI = P × r × (1 + r)^n / [(1 + r)^n - 1]
Where: P = Principal, r = Monthly rate (Annual/12/100), n = Months
```

### 2. **Amortization (Month-by-Month)**
```
For each month:
  Interest Payment = Outstanding Balance × Monthly Rate
  Principal Payment = EMI - Interest Payment
  New Outstanding = Outstanding - Principal Payment
```

### 3. **Current Installment**
```
Months Elapsed = (Today's Date - Start Date) in months
Current Installment = Months Elapsed + 1
```

### 4. **Outstanding Principal**
```
Calculate month-by-month amortization
Outstanding = Balance after current installment
```

### 5. **Preclosure Calculation**
```
Preclosure Charge = Outstanding × 4%
Total Preclosure = Outstanding + Preclosure Charge
Remaining EMIs Cost = Remaining Months × Monthly EMI
Savings = Remaining EMIs Cost - Total Preclosure
```

### 6. **Extra Payment Impact**
```
New Outstanding = Current Outstanding - Extra Amount
New Tenure = log(EMI / (EMI - New Outstanding × r)) / log(1 + r)
Months Saved = Current Remaining - New Tenure
Total Savings = Months Saved × EMI
```

### 7. **Priority Score**
```
Priority Score = (Interest Rate × 10) + (Savings / 10000)
Higher score = Close first
```

---

## 🔌 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login with username/password
- POST `/api/auth/request-otp` - Request OTP for phone
- POST `/api/auth/verify-otp` - Verify OTP and login
- POST `/api/auth/google` - Google OAuth login
- GET `/api/auth/status` - Check authentication status
- POST `/api/auth/logout` - Logout user

### User Profile
- GET `/api/users` - Get all users
- GET `/api/profile?user_id=X` - Get user profile
- POST `/api/profile` - Create user profile
- PUT `/api/profile/:id` - Update user profile

### Loans
- GET `/api/loans?user_id=X` - Get user's loans
- POST `/api/loans` - Create new loan
- GET `/api/loans/:id` - Get specific loan
- PUT `/api/loans/:id` - Update loan
- DELETE `/api/loans/:id` - Delete loan
- GET `/api/loans/:id/schedule` - Get amortization schedule
- POST `/api/loans/export` - Export loans (JSON/CSV)
- POST `/api/loans/import` - Import loans (JSON/CSV)

### Investments
- GET `/api/investments?user_id=X` - Get investments
- POST `/api/investments` - Create investment
- PUT `/api/investments/:id` - Update investment
- DELETE `/api/investments/:id` - Delete investment
- POST `/api/investments/export` - Export investments
- POST `/api/investments/import` - Import investments

### Monthly Records
- GET `/api/monthly-records?user_id=X` - Get monthly records
- POST `/api/monthly-records` - Create monthly record
- PUT `/api/monthly-records/:id` - Update record
- DELETE `/api/monthly-records/:id` - Delete record

### Dashboard
- GET `/api/dashboard/analytics?user_id=X` - Get dashboard analytics

### Expenses
- GET `/api/expenses?month=X&year=Y` - Get expenses
- POST `/api/expenses` - Create expense
- PUT `/api/expenses/:id` - Update expense
- DELETE `/api/expenses/:id` - Delete expense

### Extra Payments
- GET `/api/extra-payments?loan_id=X` - Get extra payments
- POST `/api/extra-payments` - Create extra payment
- DELETE `/api/extra-payments/:id` - Delete extra payment

---

## 🐳 Deployment (Cloud Run)

### Docker Configuration
- **Base Image:** `node:18-alpine`
- **Port:** 3001
- **Build:** Multi-stage build (client + server)
- **Production:** Serves both frontend and backend

### CI/CD Pipeline (cloudbuild.yaml)
1. Build Docker image
2. Push to Artifact Registry
3. Deploy to Cloud Run
4. **Auto-triggers** on push to `main` branch

### Cloud Run Configuration
- **Service Name:** wealthflow
- **Region:** us-central1
- **Memory:** 1GB
- **CPU:** 1 core
- **Max Instances:** 10
- **Port:** 3001

### Database Persistence Solution
**Problem:** SQLite data lost on container restart

**Solution:** Google Cloud Storage backup
- Database backed up to GCS bucket periodically
- Downloaded on container startup
- Uploaded on shutdown/periodic intervals
- No need for Cloud SQL!

---

## 🎨 UI/UX Highlights

### Design System
- **Color Scheme:** Blue, Purple, Green, Orange gradients
- **Framework:** Tailwind CSS
- **Charts:** Recharts library
- **Icons:** Emoji-based icons
- **Responsive:** Mobile-friendly design

### Key UI Components
1. **Login Page:** Modern gradient design with 3 auth options
2. **Dashboard:** Cards with analytics and recommendations
3. **Loans Page:** 
   - Table view with progress bars
   - Detailed amortization schedule (expandable)
   - Preclosure analysis cards
   - Smart recommendations section
   - Extra payment calculator
   - Formula explanation (collapsible)
4. **Investments Page:** Investment cards with projections
5. **Monthly Tracker:** Calendar-style expense tracking

---

## 💡 Smart Features

### 1. **Loan Recommendations**
- Automatically ranks loans by priority
- Shows which loan to close first (🏆 badge)
- Clear EMI savings calculations
- Step-by-step debt-free strategy

### 2. **Financial Insights**
- Debt-to-income ratio analysis
- Available income calculations
- Emergency fund recommendations
- Interest savings projections

### 3. **Extra Payment Calculator**
- Shows impact of different prepayment amounts
- Calculates months saved
- Displays net benefit
- Helps decide if prepayment is worth it

### 4. **Import/Export**
- Backup data to JSON/CSV
- Transfer data between accounts
- Share with financial advisors
- Migrate data easily

---

## 🔧 Local Development

### Start Backend:
```bash
cd loan-tracker
npm install
npm run server  # Runs on http://localhost:3001
```

### Start Frontend:
```bash
cd loan-tracker/client
npm install
npm run dev  # Runs on http://localhost:5173
```

### Build for Production:
```bash
# Build frontend
cd client && npm run build

# Build Docker image
docker build -t wealthflow .

# Run container
docker run -p 3001:3001 wealthflow
```

---

## 🚀 CI/CD Setup

### Prerequisites
- Google Cloud Project: horizontal-data-435605-b9
- Cloud Run service: wealthflow
- GitHub repo: veeresh08/FinanceTracker

### Setup Steps
1. Connect GitHub repo to Cloud Build
2. Create build trigger
3. Configure service account permissions
4. Push to main branch → Auto-deploy

### Commands
```bash
# Create trigger
gcloud builds triggers create github \
    --name="wealthflow-deploy" \
    --service-account="projects/horizontal-data-435605-b9/serviceAccounts/325113757905-compute@developer.gserviceaccount.com" \
    --repo-owner="veeresh08" \
    --repo-name="FinanceTracker" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild.yaml"

# View builds
gcloud builds list --limit=5

# View Cloud Run logs
gcloud run services logs read wealthflow --region=us-central1
```

---

## 📊 Database Backup Strategy (Cloud Run)

### Problem
SQLite database stored in container filesystem gets deleted when container restarts.

### Solution: Google Cloud Storage
```javascript
// On startup: Download database from GCS
// During runtime: Periodic backups to GCS
// On shutdown: Final backup to GCS
```

**Implementation in server.ts:**
1. Check if database exists in GCS bucket
2. Download if exists, else create new
3. Backup every hour to GCS
4. Backup on process.exit/SIGTERM

**GCS Bucket:** `wealthflow-db-backup`

---

## 🎓 Key Learning Points

### 1. **Accurate Amortization**
- Use proper EMI formula (not simple division)
- Calculate interest on reducing balance
- Match bank's amortization schedule exactly

### 2. **Financial Insights**
- Preclosure is beneficial if savings > 0
- Prioritize high-interest loans first
- Extra payments save significant interest

### 3. **User Experience**
- Show current installment number
- Display this month's breakdown
- Visual progress indicators
- Clear savings calculations

### 4. **Data Persistence**
- SQLite good for single-user apps
- GCS for Cloud Run persistence
- Regular backups essential
- Import/Export for data portability

---

## 🐛 Common Issues & Solutions

### Issue: Database not persisting in Cloud Run
**Solution:** Implement GCS backup/restore strategy

### Issue: CORS errors
**Solution:** Proper CORS config in server.ts with credentials: true

### Issue: Build trigger fails
**Solution:** Ensure GitHub repo connected and service account has proper roles

### Issue: Port conflicts locally
**Solution:** Kill processes: `lsof -ti:3001 | xargs kill -9`

---

## 📈 Future Enhancements

1. **Multiple Currencies:** Support USD, EUR, etc.
2. **Expense Categories:** Customizable categories
3. **Budget Planning:** Set monthly budgets
4. **Bill Reminders:** Email/SMS reminders for EMIs
5. **Tax Calculations:** Income tax projections
6. **Goal Tracking:** Financial goals progress
7. **Reports:** PDF reports generation
8. **Multi-user:** Family accounts

---

## 🔐 Security

- **Password Hashing:** bcrypt with 10 salt rounds
- **Session Management:** express-session with SQLite store
- **Google OAuth:** OAuth2Client verification
- **OTP:** 6-digit OTP with 10-minute expiry
- **SQL Injection:** Prepared statements
- **XSS Protection:** React default escaping

---

## 📞 Important URLs

- **Live App:** https://wealthflow-bhtvileluq-uc.a.run.app
- **GitHub:** https://github.com/veeresh08/FinanceTracker
- **Cloud Build:** https://console.cloud.google.com/cloud-build/builds?project=horizontal-data-435605-b9
- **Cloud Run:** https://console.cloud.google.com/run?project=horizontal-data-435605-b9

---

## 📝 LLM Instructions

When helping with this project:

1. **Always use accurate financial formulas** - Match bank calculations exactly
2. **Maintain TypeScript types** - Update types.ts when adding features
3. **Follow existing patterns** - API routes, component structure, styling
4. **Test calculations** - Verify amortization matches bank statements
5. **Consider user experience** - Clear labels, helpful tooltips, visual feedback
6. **Handle errors gracefully** - User-friendly error messages
7. **Optimize performance** - Use database indexes, memoization
8. **Document new features** - Update this file when adding functionality

---

## 🎯 Project Goals

**Mission:** Help users make smart financial decisions through accurate tracking and insightful recommendations.

**Key Principles:**
- **Accuracy:** Match bank calculations exactly
- **Clarity:** Make complex finances easy to understand
- **Actionable:** Provide specific recommendations
- **Secure:** Protect user financial data
- **Fast:** Responsive UI, optimized queries

---

**Last Updated:** 2024-11-30  
**Version:** 2.0  
**Maintainer:** Veeresh (jveereshnaik@gmail.com)

---

## 🎊 Current Status

✅ Authentication (3 methods)  
✅ Loan tracking with bank-level accuracy  
✅ Investment portfolio management  
✅ Monthly income/expense tracking  
✅ Smart recommendations  
✅ Import/Export functionality  
✅ Extra payment calculator  
✅ Full amortization schedule  
✅ CI/CD pipeline  
✅ Cloud Run deployment  
🔄 Database persistence (implementing GCS backup)  

**The app is production-ready and feature-complete!** 🚀

