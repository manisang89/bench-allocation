import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import errorLogger from '../utils/errorLogger'
import routeLogger from '../utils/routeLogger'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const { register } = useAuth()
  const navigate = useNavigate()

  // Validation regex patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const employeeIdRegex = /^[A-Z0-9]+$/

  // Real-time name validation
  const validateName = (value) => {
    const errors = {}
    if (!value) {
      errors.name = 'Full name is required'
    } else if (value.length < 3) {
      errors.name = 'Name must be at least 3 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(value)) {
      errors.name = 'Name can only contain letters and spaces'
    }
    return errors
  }

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

  // Real-time employee ID validation
  const validateEmployeeId = (value) => {
    const errors = {}
    if (!value) {
      errors.employeeId = 'Employee ID is required'
    } else if (value.length < 3) {
      errors.employeeId = 'Employee ID must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9]+$/.test(value)) {
      errors.employeeId = 'Employee ID can only contain letters and numbers'
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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(value)) {
      errors.password = 'Password must contain uppercase, lowercase, and numbers'
    }
    return errors
  }

  // Real-time confirm password validation
  const validateConfirmPassword = (value) => {
    const errors = {}
    if (!value) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (value !== password) {
      errors.confirmPassword = 'Passwords do not match'
    }
    return errors
  }

  // Handle field changes
  const handleNameChange = (e) => {
    const value = e.target.value
    setName(value)
    const errors = validateName(value)
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      if (Object.keys(errors).length > 0) {
        newErrors.name = errors.name
      } else {
        delete newErrors.name
      }
      return newErrors
    })
  }

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

  const handleEmployeeIdChange = (e) => {
    const value = e.target.value
    setEmployeeId(value)
    const errors = validateEmployeeId(value)
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      if (Object.keys(errors).length > 0) {
        newErrors.employeeId = errors.employeeId
      } else {
        delete newErrors.employeeId
      }
      return newErrors
    })
  }

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
      // Also revalidate confirm password if it's filled
      if (confirmPassword) {
        const confirmErrors = value !== confirmPassword ? { confirmPassword: 'Passwords do not match' } : {}
        if (Object.keys(confirmErrors).length > 0) {
          newErrors.confirmPassword = confirmErrors.confirmPassword
        } else {
          delete newErrors.confirmPassword
        }
      }
      return newErrors
    })
  }

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value
    setConfirmPassword(value)
    const errors = validateConfirmPassword(value)
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      if (Object.keys(errors).length > 0) {
        newErrors.confirmPassword = errors.confirmPassword
      } else {
        delete newErrors.confirmPassword
      }
      return newErrors
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate all fields before submit
    const nameErrors = validateName(name)
    const emailErrors = validateEmail(email)
    const employeeIdErrors = validateEmployeeId(employeeId)
    const passwordErrors = validatePassword(password)
    const confirmPasswordErrors = validateConfirmPassword(confirmPassword)

    const allErrors = { ...nameErrors, ...emailErrors, ...employeeIdErrors, ...passwordErrors, ...confirmPasswordErrors }

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors)
      errorLogger.warn('Registration validation failed', null)
      return
    }

    setLoading(true)

    try {
      errorLogger.info(`Registration attempt for email: ${email}`)
      await register(name, email, employeeId, password)
      setSuccess('Registration successful! Redirecting to login...')
      errorLogger.info(`Registration successful for email: ${email}`)
      routeLogger.log('/login', 'redirect', { from: '/register', reason: 'successful-registration' })
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed'
      setError(errorMessage)
      errorLogger.error('Registration failed', err)
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

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter full name"
                      value={name}
                      onChange={handleNameChange}
                      isInvalid={!!fieldErrors.name}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.name}
                    </Form.Control.Feedback>
                  </Form.Group>

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
                    <Form.Label>Employee ID</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter employee ID (e.g., EMP001)"
                      value={employeeId}
                      onChange={handleEmployeeIdChange}
                      isInvalid={!!fieldErrors.employeeId}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.employeeId}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Min 6 chars, uppercase, lowercase, number"
                      value={password}
                      onChange={handlePasswordChange}
                      isInvalid={!!fieldErrors.password}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      isInvalid={!!fieldErrors.confirmPassword}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2"
                    disabled={loading || Object.keys(fieldErrors).length > 0}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </Button>
                </Form>

                <hr className="my-4" />

                <p className="text-center text-muted mb-0">
                  Already have an account? <Link to="/login">Sign in</Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
