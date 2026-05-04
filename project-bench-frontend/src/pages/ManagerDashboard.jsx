import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Alert, Modal, Badge, Spinner } from 'react-bootstrap'
import Header from '../components/Header'
import api from '../services/api'

export default function ManagerDashboard() {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [benchEmployees, setBenchEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [myTeam, setMyTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [justification, setJustification] = useState('')
  const [searchSkills, setSearchSkills] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [dashRes, empRes, projRes, teamRes] = await Promise.all([
        api.get('/manager/dashboard'),
        api.get('/manager/search'),
        api.get('/manager/projects'),
        api.get('/manager/my-team')
      ])

      setDashboardStats(dashRes.data.data)
      setBenchEmployees(empRes.data.data)
      setProjects(projRes.data.data)
      setMyTeam(teamRes.data.data)
    } catch (err) {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchBySkills = async () => {
    if (!searchSkills.trim()) {
      await fetchData()
      return
    }

    try {
      const response = await api.get(`/manager/search?skills=${searchSkills}`)
      setBenchEmployees(response.data.data)
    } catch (err) {
      setError('Search failed')
    }
  }

  const handleCreateRequest = async () => {
    if (!selectedEmployee || !selectedProject || !justification.trim()) {
      setError('Please fill all fields')
      return
    }

    try {
      setLoading(true)
      await api.post('/manager/request/create', {
        employeeId: selectedEmployee,
        projectId: selectedProject,
        justification
      })
      
      setSuccess('Request created successfully')
      setShowRequestModal(false)
      setSelectedEmployee(null)
      setSelectedProject(null)
      setJustification('')
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Request creation failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <Container className="d-flex justify-content-center align-items-center min-vh-100">
          <Spinner animation="border" variant="primary" />
        </Container>
      </>
    )
  }

  return (
    <>
      <Header />
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="page-header">
              <h1>Manager Dashboard</h1>
            </div>
          </Col>
        </Row>

        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <div className="stat-card">
              <div className="stat-value">{dashboardStats?.pendingRequests}</div>
              <p className="stat-label">Pending Requests</p>
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="stat-card">
              <div className="stat-value">{dashboardStats?.approvedRequests}</div>
              <p className="stat-label">Approved Requests</p>
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="stat-card">
              <div className="stat-value">{dashboardStats?.rejectedRequests}</div>
              <p className="stat-label">Rejected Requests</p>
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="stat-card">
              <div className="stat-value">{myTeam?.length || 0}</div>
              <p className="stat-label">Team Members</p>
            </div>
          </Col>
        </Row>

        {/* Navigation Tabs */}
        <Row className="mb-4">
          <Col>
            <div className="btn-group w-100" role="group">
              <Button
                variant={activeTab === 'dashboard' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'bench' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('bench')}
              >
                Bench Employees
              </Button>
              <Button
                variant={activeTab === 'team' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('team')}
              >
                My Team
              </Button>
            </div>
          </Col>
        </Row>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <Row>
            <Col lg={8}>
              <Card>
                <Card.Body>
                  <h5 className="card-title mb-3">Resource Request Overview</h5>
                  <p className="text-muted">
                    Manage resource requests and allocations. Search for available employees by skills
                    and create requests for assignments.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowRequestModal(true)}
                    className="mt-3"
                  >
                    Create New Request
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Bench Employees Tab */}
        {activeTab === 'bench' && (
          <Row>
            <Col lg={12} className="mb-4">
              <Card>
                <Card.Body>
                  <h5 className="card-title mb-3">Search Bench Employees</h5>
                  <div className="d-flex gap-2">
                    <Form.Control
                      placeholder="Search by skills (e.g., React,Node)"
                      value={searchSkills}
                      onChange={(e) => setSearchSkills(e.target.value)}
                    />
                    <Button variant="primary" onClick={handleSearchBySkills}>
                      Search
                    </Button>
                    <Button variant="outline-secondary" onClick={() => {
                      setSearchSkills('')
                      fetchData()
                    }}>
                      Clear
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={12}>
              <Card>
                <Card.Body>
                  <h5 className="card-title mb-3">Available Employees ({benchEmployees.length})</h5>
                  {benchEmployees.length > 0 ? (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Employee ID</th>
                          <th>Skills</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {benchEmployees.map((emp) => (
                          <tr key={emp._id}>
                            <td>{emp.name}</td>
                            <td>{emp.email}</td>
                            <td>{emp.employeeId}</td>
                            <td>
                              {emp.skills.map((skill) => (
                                <Badge key={skill} bg="info" className="me-1">
                                  {skill}
                                </Badge>
                              ))}
                            </td>
                            <td>
                              <Button
                                variant="sm"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployee(emp._id)
                                  setShowRequestModal(true)
                                }}
                              >
                                Request
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted">No employees available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* My Team Tab */}
        {activeTab === 'team' && (
          <Row>
            <Col lg={12}>
              <Card>
                <Card.Body>
                  <h5 className="card-title mb-3">My Team ({myTeam.length})</h5>
                  {myTeam.length > 0 ? (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Email</th>
                          <th>Project</th>
                          <th>Allocated Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myTeam.map((alloc) => (
                          <tr key={alloc._id}>
                            <td>{alloc.employeeId?.name}</td>
                            <td>{alloc.employeeId?.email}</td>
                            <td>{alloc.projectId?.projectName}</td>
                            <td>{new Date(alloc.allocationDate).toLocaleDateString()}</td>
                            <td><Badge bg="success">Active</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted">No team members assigned yet</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Request Modal */}
        <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Create Resource Request</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Employee</Form.Label>
                <Form.Select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Select Employee</option>
                  {benchEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Project</Form.Label>
                <Form.Select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Select Project</option>
                  {projects.map((proj) => (
                    <option key={proj._id} value={proj._id}>
                      {proj.projectName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Justification</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Why this employee is suitable for the project"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRequest}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Request'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  )
}
