import React from 'react'
import { Container, Navbar, Nav, Dropdown } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import routeLogger from '../utils/routeLogger'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    routeLogger.log('/', 'logout', { user: user?.email, role: user?.role })
    logout()
    navigate('/', { replace: true })
  }

  return (
    <Navbar expand="lg" sticky="top" className="navbar">
      <Container>
        <Navbar.Brand href="/dashboard" className="text-white">
          <i className="bi bi-briefcase"></i> Bench Allocation
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Dropdown className="ms-auto">
              <Dropdown.Toggle variant="light" id="dropdown-basic" className="d-flex align-items-center">
                <i className="bi bi-person-circle me-2"></i>
                {user?.name || 'User'} ({user?.role})
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item disabled>{user?.email}</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <i className="bi bi-box-arrow-right me-2"></i>Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
