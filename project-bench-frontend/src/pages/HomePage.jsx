import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/homepage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'Admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'Manager') {
        navigate('/manager/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="homepage">
      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Navigation Bar */}
          <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <a className="navbar-brand" href="/">
            📊 Bench Allocation System
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button
                  className="btn btn-outline-light"
                  onClick={() => navigate('/login')}
                >
                  Login
                </button>
              </li>
              <li className="nav-item ms-2">
                <button
                  className="btn btn-light"
                  onClick={() => navigate('/register')}
                >
                  Register
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container text-center">
          <h1 className="hero-title">Welcome to Bench Allocation System</h1>
          <p className="hero-subtitle">
            Efficiently manage employee allocations across projects
          </p>
          <div className="hero-buttons">
            <button
              className="btn btn-primary btn-lg me-3"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button
              className="btn btn-outline-primary btn-lg"
              onClick={() => navigate('/register')}
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <div className="row g-4">
            {/* Feature 1 */}
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h3>Employee Management</h3>
                <p>
                  Manage employee skills, profiles, and bench status efficiently
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">📋</div>
                <h3>Project Allocation</h3>
                <p>
                  Allocate employees to projects based on required skills
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">✅</div>
                <h3>Request Workflow</h3>
                <p>
                  Streamlined approval process for allocation requests
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">🔐</div>
                <h3>Role-Based Access</h3>
                <p>
                  Three-tier system: Admin, Manager, and Employee roles
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Dashboard Analytics</h3>
                <p>
                  Real-time insights into allocations and bench status
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>Skill-Based Search</h3>
                <p>
                  Find employees by skills and availability instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Overview Section */}
      <section className="roles-section bg-light">
        <div className="container">
          <h2 className="section-title">System Roles</h2>
          <div className="row g-4">
            {/* Admin Role */}
            <div className="col-md-4">
              <div className="role-card">
                <h3>👨‍💼 Admin</h3>
                <ul className="role-features">
                  <li>View system statistics</li>
                  <li>Create and manage projects</li>
                  <li>Monitor bench employees</li>
                  <li>Oversee all allocations</li>
                </ul>
              </div>
            </div>

            {/* Manager Role */}
            <div className="col-md-4">
              <div className="role-card">
                <h3>👨‍💻 Manager</h3>
                <ul className="role-features">
                  <li>Search employees by skills</li>
                  <li>Create allocation requests</li>
                  <li>Manage team assignments</li>
                  <li>Track request approvals</li>
                </ul>
              </div>
            </div>

            {/* Employee Role */}
            <div className="col-md-4">
              <div className="role-card">
                <h3>👤 Employee</h3>
                <ul className="role-features">
                  <li>Update personal profile</li>
                  <li>Manage skills and experience</li>
                  <li>Track bench/assigned status</li>
                  <li>View project assignments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Section */}
      <section className="demo-section">
        <div className="container">
          <h2 className="section-title">Demo Credentials</h2>
          <p className="text-center mb-4">
            Try the system with these pre-seeded accounts
          </p>
          <div className="row g-4">
            {/* Admin Demo */}
            <div className="col-md-4">
              <div className="demo-card">
                <h4>Admin Account</h4>
                <div className="demo-content">
                  <p>
                    <strong>Email:</strong>
                    <br />
                    <code>admin@bench.com</code>
                  </p>
                  <p>
                    <strong>Password:</strong>
                    <br />
                    <code>Admin@123</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Manager Demo */}
            <div className="col-md-4">
              <div className="demo-card">
                <h4>Manager Account</h4>
                <div className="demo-content">
                  <p>
                    <strong>Email:</strong>
                    <br />
                    <code>manager@bench.com</code>
                  </p>
                  <p>
                    <strong>Password:</strong>
                    <br />
                    <code>Manager@123</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Employee Demo */}
            <div className="col-md-4">
              <div className="demo-card">
                <h4>Employee Account</h4>
                <div className="demo-content">
                  <p>
                    <strong>Email:</strong>
                    <br />
                    <code>employee@bench.com</code>
                  </p>
                  <p>
                    <strong>Password:</strong>
                    <br />
                    <code>Employee@123</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section bg-primary">
        <div className="container text-center text-white">
          <h2>Ready to Get Started?</h2>
          <p className="mb-4">
            Join our bench allocation system and optimize resource management
          </p>
          <button
            className="btn btn-light btn-lg"
            onClick={() => navigate('/register')}
          >
            Sign Up Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer bg-dark text-white text-center py-4">
        <div className="container">
          <p>&copy; 2026 Bench Allocation System. All rights reserved.</p>
          <p className="text-muted small">
            Built with React, Node.js, and MongoDB
          </p>
        </div>
      </footer>
        </>
      )}
    </div>
  );
};

export default HomePage;
