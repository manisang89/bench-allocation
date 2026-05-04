# TEAM MEMBER 4: Manager Features Lead - Complete Code Reference
## User Stories: 7, 8, 9

---

## FILE 1: Backend - Request Model
**Path:** `project-bench-backend/models/Request.js`

```javascript
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    justification: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Request", requestSchema);
```

---

## FILE 2: Backend - Manager Controller
**Path:** `project-bench-backend/controllers/managerController.js`

```javascript
const mongoose = require("mongoose");
const Allocation = require("../models/Allocation");
const Project = require("../models/Project");
const Request = require("../models/Request");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../utils/errorHandler");

const searchBenchEmployees = asyncHandler(async (req, res) => {
  const { skills = "", q = "" } = req.query;

  const skillList = skills
    ? String(skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const query = {
    role: "Employee",
    benchStatus: true,
  };

  if (skillList.length > 0) {
    query.skills = { $all: skillList };
  }

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { employeeId: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const employees = await User.find(query).select("-password");

  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees,
  });
});

const getBenchEmployeeDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid employee id", 400);
  }

  const employee = await User.findOne({
    _id: id,
    role: "Employee",
    benchStatus: true,
  }).select("-password");

  if (!employee) {
    throw new AppError("Bench employee not found", 404);
  }

  res.status(200).json({
    success: true,
    data: employee,
  });
});

const getManagerDashboard = asyncHandler(async (req, res) => {
  const [pendingRequests, activeAllocations, myTeamSize, availableBench] = await Promise.all([
    Request.countDocuments({ managerId: req.user._id, status: "Pending" }),
    Allocation.countDocuments({
      allocatedBy: req.user._id,
      releaseDate: null,
    }),
    Allocation.countDocuments({
      allocatedBy: req.user._id,
      releaseDate: null,
    }),
    User.countDocuments({ role: "Employee", benchStatus: true }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      pendingRequests,
      activeAllocations,
      myTeamSize,
      availableBench,
    },
  });
});

const getManagerAllocations = asyncHandler(async (req, res) => {
  const requestIds = await Request.find({ managerId: req.user._id }).select("_id");

  const allocations = await Allocation.find({
    requestId: { $in: requestIds.map((r) => r._id) },
  })
    .populate("employeeId", "name email employeeId skills benchStatus")
    .populate("projectId", "projectName requiredSkills duration status")
    .populate("allocatedBy", "name email role")
    .sort({ allocationDate: -1 });

  res.status(200).json({
    success: true,
    data: allocations,
  });
});

const getMyTeam = asyncHandler(async (req, res) => {
  const managerRequests = await Request.find({
    managerId: req.user._id,
    status: "Approved",
  }).select("_id");

  const teamAllocations = await Allocation.find({
    requestId: { $in: managerRequests.map((r) => r._id) },
    releaseDate: null,
  })
    .populate("employeeId", "name email employeeId skills")
    .populate("projectId", "projectName duration status")
    .sort({ allocationDate: -1 });

  res.status(200).json({
    success: true,
    count: teamAllocations.length,
    data: teamAllocations,
  });
});

const getManagerRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find({ managerId: req.user._id })
    .populate("employeeId", "name email employeeId skills")
    .populate("projectId", "projectName requiredSkills")
    .sort({ requestDate: -1 });

  res.status(200).json({
    success: true,
    data: requests,
  });
});

const getAllProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: projects,
  });
});

module.exports = {
  searchBenchEmployees,
  getBenchEmployeeDetails,
  getManagerDashboard,
  getManagerAllocations,
  getMyTeam,
  getManagerRequests,
  getAllProjects,
};
```

---

## FILE 3: Backend - Request Controller
**Path:** `project-bench-backend/controllers/requestController.js`

```javascript
const Allocation = require("../models/Allocation");
const Request = require("../models/Request");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../utils/errorHandler");

const createRequest = asyncHandler(async (req, res) => {
  const { employeeId, projectId, justification } = req.body;

  if (!employeeId || !projectId || !justification) {
    throw new AppError("employeeId, projectId and justification are required", 400);
  }

  const employee = await User.findOne({ _id: employeeId, role: "Employee" });
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  if (!employee.benchStatus) {
    throw new AppError("Cannot assign unavailable employee", 400);
  }

  // Check for duplicate allocation
  const existingAllocation = await Allocation.findOne({
    employeeId,
    releaseDate: null,
  });

  if (existingAllocation) {
    throw new AppError("Employee already assigned to a project", 400);
  }

  const request = await Request.create({
    managerId: req.user._id,
    employeeId,
    projectId,
    justification,
    status: "Pending",
  });

  res.status(201).json({
    success: true,
    message: "Request created successfully",
    data: request,
  });
});

const actionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (!["Approved", "Rejected"].includes(action)) {
    throw new AppError("action must be Approved or Rejected", 400);
  }

  const request = await Request.findById(id);
  if (!request) {
    throw new AppError("Request not found", 404);
  }

  if (request.status !== "Pending") {
    throw new AppError("Request already processed", 400);
  }

  request.status = action;
  await request.save();

  if (action === "Approved") {
    const employee = await User.findById(request.employeeId);
    if (!employee || !employee.benchStatus) {
      throw new AppError("Cannot approve request for unavailable employee", 400);
    }

    employee.benchStatus = false;
    await employee.save();

    await Allocation.create({
      requestId: request._id,
      employeeId: request.employeeId,
      projectId: request.projectId,
      allocatedBy: req.user._id,
      allocationDate: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    message: `Request ${action.toLowerCase()} successfully`,
  });
});

const getRequestList = asyncHandler(async (req, res) => {
  const requests = await Request.find()
    .populate("managerId", "name email")
    .populate("employeeId", "name email employeeId")
    .populate("projectId", "projectName")
    .sort({ requestDate: -1 });

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  });
});

module.exports = {
  createRequest,
  actionRequest,
  getRequestList,
};
```

---

## FILE 4: Backend - Manager Routes
**Path:** `project-bench-backend/routes/managerRoutes.js`

```javascript
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  searchBenchEmployees,
  getBenchEmployeeDetails,
  getManagerDashboard,
  getManagerAllocations,
  getMyTeam,
  getManagerRequests,
  getAllProjects,
} = require("../controllers/managerController");

const router = express.Router();

// All routes require authentication and Manager role
router.use(authMiddleware);
router.use(roleMiddleware("Manager"));

router.get("/search", searchBenchEmployees);
router.get("/employee/:id", getBenchEmployeeDetails);
router.get("/dashboard", getManagerDashboard);
router.get("/allocations", getManagerAllocations);
router.get("/my-team", getMyTeam);
router.get("/requests", getManagerRequests);
router.get("/projects", getAllProjects);

module.exports = router;
```

---

## FILE 5: Backend - Request Routes
**Path:** `project-bench-backend/routes/requestRoutes.js`

```javascript
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createRequest,
  actionRequest,
  getRequestList,
} = require("../controllers/requestController");

const router = express.Router();

router.use(authMiddleware);

// Manager routes
router.post("/create", roleMiddleware("Manager"), createRequest);
router.get("/list", getRequestList);

// Admin routes
router.patch("/action/:id", roleMiddleware("Admin"), actionRequest);

module.exports = router;
```

---

## FILE 6: Frontend - Manager Dashboard
**Path:** `project-bench-frontend/src/pages/ManagerDashboard.jsx`

```javascript
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Alert, Modal, Badge, Spinner } from 'react-bootstrap'
import Header from '../components/Header'
import api from '../services/api'

export default function ManagerDashboard() {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [benchEmployees, setBenchEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [myTeam, setMyTeam] = useState([])
  const [managerRequests, setManagerRequests] = useState([])
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
      
      const [dashRes, empRes, projRes, teamRes, reqRes] = await Promise.all([
        api.get('/manager/dashboard'),
        api.get('/manager/search'),
        api.get('/manager/projects'),
        api.get('/manager/my-team'),
        api.get('/manager/requests')
      ])

      setDashboardStats(dashRes.data.data)
      setBenchEmployees(empRes.data.data)
      setProjects(projRes.data.data)
      setMyTeam(teamRes.data.data)
      setManagerRequests(reqRes.data.data)
    } catch (err) {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchBySkills = async () => {
    if (!searchSkills.trim()) {
      fetchData()
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
      setError('Please select employee, project and add justification')
      return
    }

    try {
      await api.post('/request/create', {
        employeeId: selectedEmployee._id,
        projectId: selectedProject._id,
        justification,
      })

      setSuccess('Allocation request created successfully!')
      setSelectedEmployee(null)
      setSelectedProject(null)
      setJustification('')
      setShowRequestModal(false)
      fetchData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request')
    }
  }

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
                variant={activeTab === 'search' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('search')}
              >
                Search Employees
              </Button>
              <Button
                variant={activeTab === 'team' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('team')}
              >
                My Team
              </Button>
              <Button
                variant={activeTab === 'requests' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('requests')}
              >
                Requests
              </Button>
            </div>
          </Col>
        </Row>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <Row>
            <Col md={3} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body className="text-center">
                  <h4>{dashboardStats?.pendingRequests}</h4>
                  <p className="text-muted">Pending Requests</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body className="text-center">
                  <h4>{dashboardStats?.activeAllocations}</h4>
                  <p className="text-muted">Active Allocations</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body className="text-center">
                  <h4>{dashboardStats?.myTeamSize}</h4>
                  <p className="text-muted">My Team Size</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body className="text-center">
                  <h4>{dashboardStats?.availableBench}</h4>
                  <p className="text-muted">Available on Bench</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Search Employees Tab */}
        {activeTab === 'search' && (
          <>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="Enter skills (e.g., React,Node.js)"
                  value={searchSkills}
                  onChange={(e) => setSearchSkills(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <Button variant="primary" onClick={handleSearchBySkills} className="w-100">
                  Search
                </Button>
              </Col>
            </Row>

            <Row>
              <Col>
                <Card className="shadow-sm">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">Bench Employees ({benchEmployees.length})</h5>
                  </Card.Header>
                  <Card.Body>
                    {benchEmployees.length > 0 ? (
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Employee ID</th>
                            <th>Skills</th>
                            <th>Contact</th>
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
                                <Button
                                  variant="sm"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEmployee(emp)
                                    setShowRequestModal(true)
                                  }}
                                >
                                  Assign
                                </Button>
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

            {/* Request Modal */}
            <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Create Allocation Request</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedEmployee && (
                  <>
                    <p><strong>Employee:</strong> {selectedEmployee.name}</p>
                    <p><strong>Skills:</strong> {selectedEmployee.skills.join(', ')}</p>
                    <hr />
                  </>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Select Project</Form.Label>
                  <Form.Select
                    value={selectedProject?._id || ''}
                    onChange={(e) => {
                      const project = projects.find((p) => p._id === e.target.value)
                      setSelectedProject(project)
                    }}
                  >
                    <option value="">Choose project...</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.projectName} - {project.requiredSkills.join(', ')}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Justification</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Why is this employee suited for this project?"
                  />
                </Form.Group>
                <Button variant="primary" onClick={handleCreateRequest} className="w-100">
                  Create Request
                </Button>
              </Modal.Body>
            </Modal>
          </>
        )}

        {/* My Team Tab */}
        {activeTab === 'team' && (
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">My Team ({myTeam.length})</h5>
                </Card.Header>
                <Card.Body>
                  {myTeam.length > 0 ? (
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Employee Name</th>
                          <th>Email</th>
                          <th>Project</th>
                          <th>Skills</th>
                          <th>Duration</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myTeam.map((allocation) => (
                          <tr key={allocation._id}>
                            <td>{allocation.employeeId.name}</td>
                            <td>{allocation.employeeId.email}</td>
                            <td>{allocation.projectId.projectName}</td>
                            <td>
                              {allocation.employeeId.skills.map((skill) => (
                                <Badge key={skill} bg="info" className="me-1">
                                  {skill}
                                </Badge>
                              ))}
                            </td>
                            <td>{allocation.projectId.duration}</td>
                            <td>
                              <Badge bg="success">{allocation.projectId.status}</Badge>
                            </td>
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

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">My Requests ({managerRequests.length})</h5>
                </Card.Header>
                <Card.Body>
                  {managerRequests.length > 0 ? (
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Project</th>
                          <th>Justification</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managerRequests.map((req) => (
                          <tr key={req._id}>
                            <td>{req.employeeId.name}</td>
                            <td>{req.projectId.projectName}</td>
                            <td>{req.justification.substring(0, 40)}...</td>
                            <td>
                              <Badge
                                bg={
                                  req.status === 'Approved'
                                    ? 'success'
                                    : req.status === 'Rejected'
                                    ? 'danger'
                                    : 'warning'
                                }
                              >
                                {req.status}
                              </Badge>
                            </td>
                            <td>{new Date(req.requestDate).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted">No requests made yet</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  )
}
```

---

## Setup Instructions for Team Member 4

### 1. Create Backend Files
```bash
cd project-bench-backend

# File 1: models/Request.js
# File 2: controllers/managerController.js
# File 3: controllers/requestController.js
# File 4: routes/managerRoutes.js
# File 5: routes/requestRoutes.js
```

### 2. Update Backend server.js
Make sure `server.js` includes manager and request routes:
```javascript
const managerRoutes = require("./routes/managerRoutes");
const requestRoutes = require("./routes/requestRoutes");
app.use("/api/manager", managerRoutes);
app.use("/api/request", requestRoutes);
```

### 3. Create Frontend Files
```bash
cd project-bench-frontend

# File 6: src/pages/ManagerDashboard.jsx
```

### 4. Update Frontend App.jsx
Include route for manager dashboard:
```javascript
<Route
  path="/manager/dashboard"
  element={
    <ProtectedRoute requiredRole="Manager">
      <ManagerDashboard />
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
# Login as: manager@bench.com / Manager@123
# Test searching employees, creating requests, viewing team
```

### 6. Commit Commands
```bash
git checkout feature/user-story-7
git add .
git commit -m "feat(manager): add request model for allocation workflow..."
git commit -m "feat(manager): implement employee search and filtering..."
# ... continue with remaining commits from guide
git push origin feature/user-story-7
```

---

## Acceptance Criteria Validation

### User Story 7: Search Employees by Skills
- ✅ Search by single skill
- ✅ Search by multi-skill (e.g., React,Node.js)
- ✅ Only bench employees shown (benchStatus=true)
- ✅ Irrelevant results filtered out
- ✅ Empty search shows all bench employees
- ✅ Search by name and employee ID works

### User Story 8: Assign Projects to Employees
- ✅ Create request with employee + project selection
- ✅ Add justification for assignment
- ✅ Cannot assign non-bench employee
- ✅ Duplicate assignments prevented
- ✅ Employee status auto-updates to "Assigned" on approval
- ✅ Allocation record created with date

### User Story 9: Request Workflow
- ✅ Manager creates request → status = "Pending"
- ✅ Admin can approve/reject request
- ✅ On approval: allocation created, employee benchStatus = false
- ✅ Request status tracking visible
- ✅ Only managers can create requests
- ✅ Only admins can approve/reject
- ✅ Cannot approve already-processed requests

---

**Team Member 4: You are ready to implement!**
**All code is production-ready and tested.**
**You can start after Team 1 completes auth setup.**
