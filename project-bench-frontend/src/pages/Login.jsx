import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import errorLogger from '../utils/errorLogger'
import routeLogger from '../utils/routeLogger'
import '../styles/auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const { login, user } = useAuth()
  const navigate = useNavigate()

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Real-time email validation
  const validateEmail = (value) => {
    const errors = {}
    if (!value) {
      errors.email = 'Email is required'
    } else if (!emailRegex.test(value)) {
      errors.email = 'Please enter a valid email address'
    }
    return errors
  }

  // Real-time password validation
  const validatePassword = (value) => {
    const errors = {}
    if (!value) {
      errors.password = 'Password is required'
    } else if (value.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    return errors
  }

  // Handle email change with validation
  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    const errors = validateEmail(value)
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      if (Object.keys(errors).length > 0) {
        newErrors.email = errors.email
      } else {
        delete newErrors.email
      }
      return newErrors
    })
  }

  // Handle password change with validation
  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)
    const errors = validatePassword(value)
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      if (Object.keys(errors).length > 0) {
        newErrors.password = errors.password
      } else {
        delete newErrors.password
      }
      return newErrors
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate fields before submit
    const emailErrors = validateEmail(email)
    const passwordErrors = validatePassword(password)
    
    if (Object.keys(emailErrors).length > 0 || Object.keys(passwordErrors).length > 0) {
      setFieldErrors({ ...emailErrors, ...passwordErrors })
      errorLogger.warn('Login validation failed', null)
      return
    }

    setLoading(true)

    try {
      errorLogger.info(`Login attempt for email: ${email}`)
      const user = await login(email, password)
      
      errorLogger.info(`Login successful for user: ${user.email} (${user.role})`)
      routeLogger.logUserNavigation(
        user.role === 'Admin' ? '/admin/dashboard' : 
        user.role === 'Manager' ? '/manager/dashboard' : 
        '/employee/dashboard',
        user.role,
        'login-redirect'
      )
      
      if (user.role === 'Admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (user.role === 'Manager') {
        navigate('/manager/dashboard', { replace: true })
      } else {
        navigate('/employee/dashboard', { replace: true })
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed'
      setError(errorMessage)
      errorLogger.error('Login failed', err)
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
                      onChange={handleEmailChange}
                      isInvalid={!!fieldErrors.email}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={handlePasswordChange}
                      isInvalid={!!fieldErrors.password}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.password}
                    </Form.Control.Feedback>
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
