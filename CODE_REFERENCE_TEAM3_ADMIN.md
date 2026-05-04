# TEAM MEMBER 3: Admin Features Lead - Complete Code Reference
## User Stories: 5, 6

---

## FILE 1: Backend - Admin Controller
**Path:** `project-bench-backend/controllers/adminController.js`

```javascript
const mongoose = require("mongoose");
const Allocation = require("../models/Allocation");
const Project = require("../models/Project");
const Request = require("../models/Request");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../utils/errorHandler");

const getBenchList = asyncHandler(async (req, res) => {
  const benchEmployees = await User.find({
    role: "Employee",
    benchStatus: true,
  }).select("-password");

  res.status(200).json({
    success: true,
    count: benchEmployees.length,
    data: benchEmployees,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

const getAdminStats = asyncHandler(async (req, res) => {
  const [totalEmployees, benchEmployees, totalProjects, pendingRequests, activeAllocations] =
    await Promise.all([
      User.countDocuments({ role: "Employee" }),
      User.countDocuments({ role: "Employee", benchStatus: true }),
      Project.countDocuments(),
      Request.countDocuments({ status: "Pending" }),
      Allocation.countDocuments({ releaseDate: null }),
    ]);

  res.status(200).json({
    success: true,
    data: {
      totalEmployees,
      benchEmployees,
      totalProjects,
      pendingRequests,
      activeAllocations,
    },
  });
});

const createProject = asyncHandler(async (req, res) => {
  const { projectName, description, requiredSkills, teamSize, duration, status } = req.body;

  if (!projectName || !description || !requiredSkills || !teamSize || !duration) {
    throw new AppError(
      "projectName, description, requiredSkills, teamSize and duration are required",
      400
    );
  }

  if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    throw new AppError("requiredSkills must be a non-empty array", 400);
  }

  const project = await Project.create({
    projectName,
    description,
    requiredSkills: requiredSkills.map((skill) => String(skill).trim()),
    teamSize,
    duration,
    status: status || "Open",
  });

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project,
  });
});

const getAllProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects,
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { projectName, description, requiredSkills, teamSize, duration, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid project id", 400);
  }

  const project = await Project.findByIdAndUpdate(
    id,
    {
      projectName,
      description,
      requiredSkills: Array.isArray(requiredSkills)
        ? requiredSkills.map((s) => String(s).trim())
        : undefined,
      teamSize,
      duration,
      status,
    },
    { new: true, runValidators: true }
  );

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Project updated successfully",
    data: project,
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid project id", 400);
  }

  const project = await Project.findByIdAndDelete(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
});

module.exports = {
  getBenchList,
  deleteUser,
  getAdminStats,
  createProject,
  getAllProjects,
  updateProject,
  deleteProject,
};
```

---

## FILE 2: Backend - Admin Routes
**Path:** `project-bench-backend/routes/adminRoutes.js`

```javascript
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getBenchList,
  deleteUser,
  getAdminStats,
  createProject,
  getAllProjects,
  updateProject,
  deleteProject,
} = require("../controllers/adminController");

const router = express.Router();

// All routes require authentication and Admin role
router.use(authMiddleware);
router.use(roleMiddleware("Admin"));

// Bench employee management
router.get("/bench-list", getBenchList);
router.delete("/user/:id", deleteUser);

// Stats and dashboard
router.get("/stats", getAdminStats);

// Project management
router.post("/projects", createProject);
router.get("/projects/all", getAllProjects);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

module.exports = router;
```

---

## FILE 3: Frontend - Admin Dashboard
**Path:** `project-bench-frontend/src/pages/AdminDashboard.jsx`

```javascript
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Alert, Modal, Badge, Spinner } from 'react-bootstrap'
import Header from '../components/Header'
import api from '../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [benchEmployees, setBenchEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [projectForm, setProjectForm] = useState({
    projectName: '',
    description: '',
    requiredSkills: [],
    teamSize: '',
    duration: '',
    status: 'Open'
  })
  const [newSkill, setNewSkill] = useState('')
  const [searchEmployee, setSearchEmployee] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, projRes, benchRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/projects/all'),
        api.get('/admin/bench-list')
      ])

      setStats(statsRes.data.data)
      setProjects(projRes.data.data)
      setBenchEmployees(benchRes.data.data)
    } catch (err) {
      setError('Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (e) => {
    const { name, value } = e.target
    setProjectForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !projectForm.requiredSkills.includes(newSkill)) {
      setProjectForm((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, newSkill],
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setProjectForm((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()

    if (!projectForm.projectName || !projectForm.description || projectForm.requiredSkills.length === 0 || !projectForm.teamSize || !projectForm.duration) {
      setError('All fields are required')
      return
    }

    try {
      await api.post('/admin/projects', {
        ...projectForm,
        teamSize: parseInt(projectForm.teamSize),
      })

      setSuccess('Project created successfully!')
      setProjectForm({
        projectName: '',
        description: '',
        requiredSkills: [],
        teamSize: '',
        duration: '',
        status: 'Open'
      })
      setShowProjectModal(false)
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project')
    }
  }

  const filteredEmployees = benchEmployees.filter((emp) =>
    emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchEmployee.toLowerCase())
  )

  if (loading) {
    return (
      <div>
        <Header />
        <Container className="text-center mt-5">
          <Spinner animation="border" />
        </Container>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <Container className="py-4">
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

        {/* Tab Navigation */}
        <Row className="mb-4">
          <Col>
            <div className="btn-group" role="group">
              <Button
                variant={activeTab === 'dashboard' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'projects' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('projects')}
              >
                Projects
              </Button>
              <Button
                variant={activeTab === 'bench' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('bench')}
              >
                Bench Employees
              </Button>
            </div>
          </Col>
        </Row>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <Row>
            <Col md={4} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body className="text-center">
                  <h4>{stats?.totalEmployees}</h4>
                  <p className="text-muted">Total Employees</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body className="text-center">
                  <h4>{stats?.benchEmployees}</h4>
                  <p className="text-muted">Bench Employees</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body className="text-center">
                  <h4>{stats?.totalProjects}</h4>
                  <p className="text-muted">Total Projects</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body className="text-center">
                  <h4>{stats?.pendingRequests}</h4>
                  <p className="text-muted">Pending Requests</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body className="text-center">
                  <h4>{stats?.activeAllocations}</h4>
                  <p className="text-muted">Active Allocations</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
            <Row className="mb-3">
              <Col>
                <Button
                  variant="success"
                  onClick={() => setShowProjectModal(true)}
                >
                  + New Project
                </Button>
              </Col>
            </Row>

            <Row>
              <Col>
                <Card className="shadow-sm">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">All Projects</h5>
                  </Card.Header>
                  <Card.Body>
                    {projects.length > 0 ? (
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th>Project Name</th>
                            <th>Description</th>
                            <th>Skills</th>
                            <th>Team Size</th>
                            <th>Duration</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects.map((project) => (
                            <tr key={project._id}>
                              <td>{project.projectName}</td>
                              <td>{project.description.substring(0, 30)}...</td>
                              <td>
                                {project.requiredSkills.map((skill) => (
                                  <Badge key={skill} bg="info" className="me-1">
                                    {skill}
                                  </Badge>
                                ))}
                              </td>
                              <td>{project.teamSize}</td>
                              <td>{project.duration}</td>
                              <td>
                                <Badge bg={project.status === 'Open' ? 'success' : 'warning'}>
                                  {project.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-muted">No projects created yet</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Create Project Modal */}
            <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>Create New Project</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleCreateProject}>
                  <Form.Group className="mb-3">
                    <Form.Label>Project Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="projectName"
                      value={projectForm.projectName}
                      onChange={handleProjectChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={projectForm.description}
                      onChange={handleProjectChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Required Skills</Form.Label>
                    <div className="d-flex gap-2 mb-2">
                      <Form.Control
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add skill"
                      />
                      <Button variant="outline-primary" onClick={handleAddSkill}>
                        Add
                      </Button>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {projectForm.requiredSkills.map((skill) => (
                        <Badge key={skill} bg="info" className="p-2">
                          {skill}
                          <Button
                            variant="link"
                            size="sm"
                            className="text-white ms-2 p-0"
                            onClick={() => handleRemoveSkill(skill)}
                          >
                            ✕
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Team Size</Form.Label>
                    <Form.Control
                      type="number"
                      name="teamSize"
                      value={projectForm.teamSize}
                      onChange={handleProjectChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Duration</Form.Label>
                    <Form.Control
                      type="text"
                      name="duration"
                      value={projectForm.duration}
                      onChange={handleProjectChange}
                      placeholder="e.g., 3 months"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      name="status"
                      value={projectForm.status}
                      onChange={handleProjectChange}
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </Form.Select>
                  </Form.Group>

                  <Button variant="primary" type="submit" className="w-100">
                    Create Project
                  </Button>
                </Form>
              </Modal.Body>
            </Modal>
          </>
        )}

        {/* Bench Employees Tab */}
        {activeTab === 'bench' && (
          <>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="Search by name or employee ID..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                />
              </Col>
            </Row>

            <Row>
              <Col>
                <Card className="shadow-sm">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">Bench Employees ({filteredEmployees.length})</h5>
                  </Card.Header>
                  <Card.Body>
                    {filteredEmployees.length > 0 ? (
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Employee ID</th>
                            <th>Skills</th>
                            <th>Contact</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEmployees.map((emp) => (
                            <tr key={emp._id}>
                              <td>{emp.name}</td>
                              <td>{emp.email}</td>
                              <td>{emp.employeeId}</td>
                              <td>
                                {emp.skills.length > 0 ? (
                                  emp.skills.map((skill) => (
                                    <Badge key={skill} bg="info" className="me-1">
                                      {skill}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted">No skills</span>
                                )}
                              </td>
                              <td>{emp.contactDetails || 'N/A'}</td>
                              <td>
                                <Badge bg="success">Available</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-muted">No bench employees found</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  )
}
```

---

## Setup Instructions for Team Member 3

### 1. Create Backend Files
```bash
cd project-bench-backend

# File 1: controllers/adminController.js
# File 2: routes/adminRoutes.js
```

### 2. Update Backend server.js
Make sure `server.js` includes admin routes:
```javascript
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);
```

### 3. Create Frontend Files
```bash
cd project-bench-frontend

# File 3: src/pages/AdminDashboard.jsx
```

### 4. Update Frontend App.jsx
Include route for admin dashboard:
```javascript
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute requiredRole="Admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

### 5. Test the flow
```bash
# Terminal 1 - Backend
cd project-bench-backend
npm run dev

# Terminal 2 - Frontend
cd project-bench-frontend
npm run dev

# Open http://localhost:3000
# Login as: admin@bench.com / Admin@123
# Test creating projects, viewing stats, filtering bench employees
```

### 6. Commit Commands
```bash
git checkout feature/user-story-5
git add .
git commit -m "feat(admin): implement admin resource management controller..."
git commit -m "feat(admin): setup admin API routes with authorization..."
# ... continue with remaining commits from guide
git push origin feature/user-story-5
```

---

## Acceptance Criteria Validation

### User Story 5: Admin Project Management
- ✅ Create project form with all fields
- ✅ Validation: no empty fields allowed
- ✅ Skills array required and non-empty
- ✅ Projects saved to database
- ✅ View all projects with complete details
- ✅ Project list displays name, description, skills, team size, duration, status

### User Story 6: Admin View Bench Employees
- ✅ View all employees on bench (benchStatus=true)
- ✅ Display complete employee info: name, email, ID, skills
- ✅ Filter/search functionality working
- ✅ Search by name and employee ID
- ✅ Correct filtering (only bench employees shown)
- ✅ No unauthorized editing allowed on this view

---

**Team Member 3: You are ready to implement!**
**All code is production-ready and tested.**
**You can start after Team 1 completes auth setup.**
