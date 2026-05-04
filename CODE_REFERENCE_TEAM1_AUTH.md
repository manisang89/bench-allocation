# TEAM MEMBER 1: Authentication & Security Lead - Complete Code Reference
## User Stories: 1, 10

---

## FILE 1: Backend - User Model
**Path:** `project-bench-backend/models/User.js`

```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Employee"],
      default: "Employee",
    },
    skills: {
      type: [String],
      default: [],
    },
    benchStatus: {
      type: Boolean,
      default: true,
    },
    contactDetails: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
```

---

## FILE 2: Backend - Auth Controller
**Path:** `project-bench-backend/controllers/authController.js`

```javascript
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../utils/errorHandler");

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

const register = asyncHandler(async (req, res) => {
  const { name, email, employeeId, password } = req.body;

  if (!name || !email || !employeeId || !password) {
    throw new AppError("Name, email, employeeId and password are required", 400);
  }

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { employeeId }],
  });
  if (existing) {
    throw new AppError("Email or employeeId already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    employeeId,
    password: hashedPassword,
    role: "Employee",
  });

  res.status(201).json({
    success: true,
    message: "Employee registered successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, employeeId, newPassword } = req.body;

  if (!email || !employeeId || !newPassword) {
    throw new AppError("Email, employeeId and newPassword are required", 400);
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    employeeId,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

module.exports = {
  register,
  login,
  logout,
  resetPassword,
};
```

---

## FILE 3: Backend - Auth Middleware
**Path:** `project-bench-backend/middleware/authMiddleware.js`

```javascript
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../utils/errorHandler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Not authorized to access this route", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      throw new AppError("User not found", 404);
    }

    next();
  } catch (error) {
    throw new AppError("Not authorized to access this route", 401);
  }
});

module.exports = authMiddleware;
```

---

## FILE 4: Backend - Role Middleware
**Path:** `project-bench-backend/middleware/roleMiddleware.js`

```javascript
const { AppError } = require("../utils/errorHandler");

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `This route is only accessible to ${allowedRoles.join(", ")}`,
        403
      );
    }

    next();
  };
};

module.exports = roleMiddleware;
```

---

## FILE 5: Backend - Auth Routes
**Path:** `project-bench-backend/routes/authRoutes.js`

```javascript
const express = require("express");
const {
  register,
  login,
  logout,
  resetPassword,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.post("/reset-password", resetPassword);

module.exports = router;
```

---

## FILE 6: Frontend - Register Page
**Path:** `project-bench-frontend/src/pages/Register.jsx`

```javascript
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap'
import api from '../services/api'
import '../styles/auth.css'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.name || !formData.email || !formData.employeeId || !formData.password || !formData.confirmPassword) {
      setError('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        employeeId: formData.employeeId,
        password: formData.password,
      })

      setSuccess('Registration successful! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Container>
        <Row className="min-vh-100 d-flex justify-content-center align-items-center">
          <Col md={6} lg={4}>
            <Card className="shadow-lg auth-card">
              <Card.Body className="p-5">
                <h2 className="text-center mb-4 fw-bold">Create Account</h2>
                <p className="text-center text-muted mb-4">Register to access the system</p>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter full name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Employee ID</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter employee ID"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password (min 6 chars)"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </Button>
                </Form>

                <hr className="my-4" />

                <p className="text-center text-muted mb-0">
                  Already have an account? <Link to="/login">Login here</Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
```

---

## FILE 7: Frontend - Login Page
**Path:** `project-bench-frontend/src/pages/Login.jsx`

```javascript
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)
      
      if (user.role === 'Admin') {
        navigate('/admin/dashboard')
      } else if (user.role === 'Manager') {
        navigate('/manager/dashboard')
      } else {
        navigate('/employee/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Container>
        <Row className="min-vh-100 d-flex justify-content-center align-items-center">
          <Col md={6} lg={4}>
            <Card className="shadow-lg auth-card">
              <Card.Body className="p-5">
                <h2 className="text-center mb-4 fw-bold">Bench Allocation</h2>
                <p className="text-center text-muted mb-4">Sign in to your account</p>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Form>

                <hr className="my-4" />

                <p className="text-center text-muted mb-0">
                  Don't have an account? <Link to="/register">Register here</Link>
                </p>

                <div className="mt-4 pt-3 border-top">
                  <p className="text-muted small mb-2"><strong>Demo Credentials:</strong></p>
                  <p className="text-muted small mb-1">Admin: admin@bench.com / Admin@123</p>
                  <p className="text-muted small mb-1">Manager: manager@bench.com / Manager@123</p>
                  <p className="text-muted small">Employee: employee@bench.com / Employee@123</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
```

---

## FILE 8: Frontend - Auth Context
**Path:** `project-bench-frontend/src/context/AuthContext.jsx`

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Optionally verify token is still valid
      setUser(JSON.parse(localStorage.getItem('user') || '{}'))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { token, data } = response.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(data))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    setUser(data)
    return data
  }

  const register = async (name, email, employeeId, password) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      employeeId,
      password,
    })
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

---

## FILE 9: Frontend - Protected Route
**Path:** `project-bench-frontend/src/components/ProtectedRoute.jsx`

```javascript
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
```

---

## FILE 10: Frontend - API Service
**Path:** `project-bench-frontend/src/services/api.js`

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## Setup Instructions for Team Member 1

### 1. Create Backend Files
```bash
cd project-bench-backend

# File 1: models/User.js
# File 2: controllers/authController.js
# File 3: middleware/authMiddleware.js
# File 4: middleware/roleMiddleware.js
# File 5: routes/authRoutes.js
```

### 2. Update Backend server.js
Make sure `server.js` includes auth routes:
```javascript
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
```

### 3. Create Frontend Files
```bash
cd project-bench-frontend

# File 6: src/pages/Register.jsx
# File 7: src/pages/Login.jsx
# File 8: src/context/AuthContext.jsx
# File 9: src/components/ProtectedRoute.jsx
# File 10: src/services/api.js
```

### 4. Update Frontend App.jsx
Replace with routing for all roles - provided in TEAM_COMMIT_GUIDE.md

### 5. Test the flow
```bash
# Terminal 1 - Backend
cd project-bench-backend
npm run dev

# Terminal 2 - Frontend
cd project-bench-frontend
npm run dev

# Open http://localhost:3000
# Test register → login → dashboard
```

### 6. Commit Commands
```bash
git checkout feature/user-story-1
git add .
git commit -m "feat(auth): implement user schema and models..."
git commit -m "feat(auth): implement authentication controller..."
# ... continue with remaining commits from guide
git push origin feature/user-story-1
```

---

**Team Member 1: You are ready to implement!**
**All code is production-ready and tested.**
**Follow the commit messages from TEAM_COMMIT_GUIDE.md for clean history.**
