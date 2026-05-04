# TEAM MEMBER 5: Integration & Testing Lead - Complete Configuration & Testing Guide
## Role: Environment Setup, Testing, Integration Coordination

---

## FILE 1: Backend Environment Configuration
**Path:** `project-bench-backend/.env`

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bench-allocation
# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bench-allocation

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

**Important:** Change `JWT_SECRET` in production to a strong, random value.

---

## FILE 2: Frontend Environment Configuration
**Path:** `project-bench-frontend/.env.development`

```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Bench Allocation System
```

---

## FILE 3: Frontend Environment Configuration (Production)
**Path:** `project-bench-frontend/.env.production`

```
VITE_API_URL=https://your-api-domain.com/api
VITE_APP_NAME=Bench Allocation System
```

---

## FILE 4: Database Seeding Script (Already Exists)
**Path:** `project-bench-backend/scripts/seedData.js`

**Verify the script includes:**
```javascript
// Should create:
// - 1 Admin user
// - 5 Manager users
// - 44 Employee users (mixed bench/assigned)
// - 36 Projects
// - 42 Allocation Requests
// - Demo allocations to show system in action

const seedData = async () => {
  // Clears existing data
  // Creates test users with roles
  // Creates projects
  // Creates requests and allocations
};
```

---

## Integration Testing Checklist

### Phase 1: Setup Verification (Day 1)

```bash
# 1. Verify MongoDB connection
mongosh --eval "db.version()"
# Expected: Outputs MongoDB version

# 2. Install dependencies
cd project-bench-backend
npm install
cd ../project-bench-frontend
npm install

# 3. Create .env files
# Backend: PORT=5000, JWT_SECRET, MONGODB_URI
# Frontend: VITE_API_URL=http://localhost:5000/api

# 4. Verify packages installed
cd project-bench-backend
npm list | grep -E "express|mongoose|jsonwebtoken|bcryptjs"
```

### Phase 2: Individual Story Testing (Daily)

**After Each Team Push:**

```bash
# 1. Checkout their branch
git checkout feature/user-story-X

# 2. Run their specific tests
npm run seed  # Refresh database

# 3. Start backend
npm run dev

# 4. In new terminal, start frontend
npm run dev

# 5. Test their acceptance criteria
# (Use TEST_MATRIX below)

# 6. Check for errors in console
# 7. Verify API responses with Postman/curl
```

---

## Complete Test Matrix

### User Story 1 & 10: Authentication
```
✓ POST /api/auth/register
  - Valid data: User created, returns user object
  - Empty fields: Error "required"
  - Duplicate email: Error "already exists"
  - Duplicate ID: Error "already exists"

✓ POST /api/auth/login
  - Valid credentials: Returns token + user data
  - Wrong password: Error "Invalid credentials"
  - Non-existent email: Error "Invalid credentials"
  - Empty fields: Error "required"

✓ Protected Routes
  - No token: 401 Unauthorized
  - Invalid token: 401 Unauthorized
  - Valid token: 200 Success
  - Wrong role: 403 Forbidden
```

### User Story 2, 3, 4: Employee Features
```
✓ GET /api/employee/profile
  - Returns logged-in user profile
  - Password not included

✓ PUT /api/employee/update
  - Update skills: Array saved to database
  - Update contact: String saved
  - Empty skills: Error "must be array"
  - Changes visible on next GET

✓ PATCH /api/employee/status
  - Set "Bench": benchStatus = true
  - Set "Assigned": benchStatus = false
  - Invalid status: Error "must be Bench or Assigned"
  - Status persists in database

✓ GET /api/employee/project
  - No allocation: Error "No assigned project"
  - With allocation: Returns project details
  - Includes: name, description, skills, duration
```

### User Story 5 & 6: Admin Features
```
✓ GET /api/admin/stats
  - Returns counters for:
    - totalEmployees
    - benchEmployees
    - totalProjects
    - pendingRequests
    - activeAllocations

✓ POST /api/admin/projects
  - Valid data: Project created
  - Empty field: Error "required"
  - Empty skills: Error "non-empty array"
  - Project appears in GET all

✓ GET /api/admin/projects/all
  - Returns all projects sorted by date
  - Includes all fields

✓ GET /api/admin/bench-list
  - Returns only employees with benchStatus=true
  - Includes: name, email, skills, employeeId
  - No password included
```

### User Story 7, 8, 9: Manager Features
```
✓ GET /api/manager/search
  - No params: All bench employees
  - skills=React,Node: Employees with ALL skills
  - q=John: Search by name
  - q=E001: Search by employee ID
  - No matches: Empty array

✓ POST /api/request/create
  - Valid data: Request created with Pending status
  - Unavailable employee: Error "Cannot assign"
  - Missing fields: Error "required"
  - Duplicate assignment: Error

✓ PATCH /api/request/action/:id
  - Admin only: Non-admin gets 403
  - Approve: Allocation created, employee.benchStatus = false
  - Reject: Request status = Rejected
  - Already processed: Error "already processed"

✓ GET /api/manager/my-team
  - Returns allocated employees
  - Includes: employee, project, allocation date
  - Only active allocations (releaseDate = null)
```

---

## End-to-End Test Scenarios

### Scenario 1: Complete Allocation Flow
```
1. Employee registers & logs in
2. Employee sets skills: ["React", "Node.js"]
3. Employee marks status: "Bench"
4. Admin creates project: Requires ["React", "Node.js"]
5. Manager searches: skills="React,Node.js"
6. Manager finds the employee
7. Manager creates allocation request
8. Admin approves request
9. Employee status auto-updates to "Assigned"
10. Employee views assigned project
11. Manager sees employee in "My Team"
12. Admin dashboard shows: -1 bench, +1 allocated
```

**Commands to test:**
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
npm run dev

# Manual Steps:
# 1. Register at http://localhost:3000/register
# 2. Login, update profile with skills
# 3. Open http://localhost:3000/admin/dashboard
#    - Create project with matching skills
# 4. Logout, login as manager
# 5. Search employees by skill
# 6. Create allocation request
# 7. Logout, login as admin
# 8. Approve request
# 9. Logout, login as employee
# 10. Verify status changed and project visible
```

### Scenario 2: Error Handling
```
1. Register with missing fields → Validation error shown
2. Login with wrong password → "Invalid credentials" error
3. Try to access admin dashboard as employee → 403 redirect
4. Try to assign non-bench employee → Error message
5. Try to approve already-approved request → Error
```

---

## Database Seeding Verification

### After running `npm run seed`:

```bash
# Connect to MongoDB
mongosh

# Switch to database
use bench-allocation

# Verify collections
show collections
# Should show: users, projects, requests, allocations

# Count documents
db.users.countDocuments()           # Should be ~50
db.projects.countDocuments()        # Should be ~36
db.requests.countDocuments()        # Should be ~42
db.allocations.countDocuments()     # Should be ~36

# Verify roles distribution
db.users.countDocuments({role: "Admin"})        # Should be 1
db.users.countDocuments({role: "Manager"})      # Should be 5
db.users.countDocuments({role: "Employee"})     # Should be ~44

# Verify bench status
db.users.countDocuments({benchStatus: true})    # Bench employees
db.users.countDocuments({benchStatus: false})   # Assigned employees

# Verify demo users exist
db.users.findOne({email: "admin@bench.com"})
db.users.findOne({email: "manager@bench.com"})
db.users.findOne({email: "employee@bench.com"})
```

---

## Complete Test Matrix

### Initialize Repository (First Time)
```bash
git init
git add .
git commit -m "initial: bench-allocation system v1.0 with all features"
```

### Create Feature Branches
```bash
# For each team member
git branch feature/user-story-1
git branch feature/user-story-2
...
git branch feature/user-story-10

# Push all branches
git push --all origin
```

### Branch Protection Rules (if using GitHub/GitLab)
```
- Require PR review: 1 approval
- Require status checks: All CI/CD tests pass
- Require up-to-date branch before merge
- Dismiss stale PR approvals
- Require commit signature: Optional but recommended
```

### Merge to Main
```bash
# After PR approved:
git checkout main
git pull origin main
git merge feature/user-story-1
git push origin main

# Delete merged branch
git branch -d feature/user-story-1
git push origin --delete feature/user-story-1
```

---

## Daily Integration Procedure

```bash
#!/bin/bash
# Daily integration test script

echo "Starting daily integration test..."

# 1. Pull latest
git pull origin main

# 2. Fresh install
rm -rf node_modules package-lock.json
npm install

# 3. Seed database
npm run seed

# 4. Start services (background)
npm run dev &
BACKEND_PID=$!

cd ../project-bench-frontend
npm run dev &
FRONTEND_PID=$!

# 5. Wait for services to start
sleep 10

# 6. Run integration tests (add test file later)
npm run test:integration

# 7. Cleanup
kill $BACKEND_PID $FRONTEND_PID

echo "Integration test complete!"
```

---

## Troubleshooting Guide

### MongoDB Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:27017

Solution:
# Make sure MongoDB is running
mongosh  # Should connect successfully

# Or use MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bench-allocation
```

### JWT Token Errors
```
Error: jwt malformed

Solution:
# JWT_SECRET must be set in .env
# Token must be included as: Authorization: Bearer <token>
# Check token hasn't expired (JWT_EXPIRES_IN setting)
```

### CORS Issues
```
Error: Access to XMLHttpRequest blocked by CORS policy

Solution:
# In server.js, ensure CORS is configured:
app.use(cors());

# Or restrict to frontend URL:
app.use(cors({ origin: process.env.CORS_ORIGIN }));
```

### Database Seeding Fails
```
Error: Duplicate key error

Solution:
# Clear existing data first
db.users.deleteMany({})
db.projects.deleteMany({})
db.requests.deleteMany({})
db.allocations.deleteMany({})

# Then run seed again
npm run seed
```

---

## Team 5 Responsibilities Checklist

```
[ ] Environment setup & configuration
[ ] Database initialization & seeding
[ ] All .env files created and configured
[ ] Git repository initialized with branches
[ ] Initial commit with project scaffold

Daily During Development:
[ ] Monitor branch PRs
[ ] Run integration tests after each merge
[ ] Verify database integrity
[ ] Check error logs
[ ] Coordinate team on blockers

Before Final Push:
[ ] All tests passing
[ ] Code review complete
[ ] Performance tested
[ ] All user stories working
[ ] Documentation updated

BONUS (After core features complete):
[ ] Create public homepage landing page
[ ] Add HomePage.jsx component
[ ] Add homepage.css stylesheet
[ ] Update App.jsx with homepage route
[ ] Test navigation and responsive design
```

---

**Team Member 5: You are the testing and integration coordinator!**
**Ensure smooth testing and coordination for all teams.**
**Use this guide to coordinate, test, and verify the system works correctly.**

Your responsibilities ensure all 10 user stories work together seamlessly.
