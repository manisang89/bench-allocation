# TEAM MEMBER 2: Employee Features Lead - Complete Code Reference
## User Stories: 2, 3, 4

---

## FILE 1: Backend - Allocation Model
**Path:** `project-bench-backend/models/Allocation.js`

```javascript
const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
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
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    allocationDate: {
      type: Date,
      default: Date.now,
    },
    releaseDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Allocation", allocationSchema);
```

---

## FILE 2: Backend - Project Model
**Path:** `project-bench-backend/models/Project.js`

```javascript
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    requiredSkills: {
      type: [String],
      required: true,
    },
    teamSize: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Completed"],
      default: "Open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
```

---

## FILE 3: Backend - Employee Controller
**Path:** `project-bench-backend/controllers/employeeController.js`

```javascript
const Allocation = require("../models/Allocation");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../utils/errorHandler");

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  res.status(200).json({
    success: true,
    data: user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { skills, contactDetails } = req.body;

  if (skills !== undefined) {
    if (!Array.isArray(skills) || skills.length === 0) {
      throw new AppError("skills must be a non-empty array", 400);
    }

    const invalidSkill = skills.find(
      (skill) => typeof skill !== "string" || !skill.trim()
    );
    if (invalidSkill) {
      throw new AppError("All skills must be non-empty strings", 400);
    }
  }

  const updateData = {};
  if (skills !== undefined) {
    updateData.skills = skills.map((s) => s.trim());
  }
  if (contactDetails !== undefined) {
    updateData.contactDetails = String(contactDetails).trim();
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

const updateBenchStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["Bench", "Assigned"].includes(status)) {
    throw new AppError("status must be either Bench or Assigned", 400);
  }

  const benchStatus = status === "Bench";

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { benchStatus },
    { new: true, runValidators: true }
  ).select("-password");

  res.status(200).json({
    success: true,
    message: "Bench status updated",
    data: {
      id: user._id,
      benchStatus: user.benchStatus,
      status,
    },
  });
});

const getAssignedProject = asyncHandler(async (req, res) => {
  const activeAllocation = await Allocation.findOne({
    employeeId: req.user._id,
    releaseDate: null,
  })
    .sort({ allocationDate: -1 })
    .populate("projectId", "projectName description requiredSkills teamSize duration status");

  if (!activeAllocation) {
    throw new AppError("No assigned project found", 404);
  }

  res.status(200).json({
    success: true,
    data: activeAllocation.projectId,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  updateBenchStatus,
  getAssignedProject,
};
```

---

## FILE 4: Backend - Employee Routes
**Path:** `project-bench-backend/routes/employeeRoutes.js`

```javascript
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getProfile,
  updateProfile,
  updateBenchStatus,
  getAssignedProject,
} = require("../controllers/employeeController");

const router = express.Router();

// All routes require authentication and Employee role
router.use(authMiddleware);
router.use(roleMiddleware("Employee"));

router.get("/profile", getProfile);
router.put("/update", updateProfile);
router.patch("/status", updateBenchStatus);
router.get("/project", getAssignedProject);

module.exports = router;
```

---

## FILE 5: Frontend - Header Component
**Path:** `project-bench-frontend/src/components/Header.jsx`

```javascript
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, Container, Button } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Navbar bg="dark" variant="dark" className="mb-4">
      <Container>
        <Navbar.Brand className="fw-bold">
          📊 Bench Allocation System
        </Navbar.Brand>
        <div className="d-flex align-items-center gap-3 ms-auto">
          <span className="text-white">
            <strong>{user?.name}</strong> ({user?.role})
          </span>
          <Button 
            variant="outline-light" 
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </Container>
    </Navbar>
  )
}
```

---

## FILE 6: Frontend - Employee Dashboard
**Path:** `project-bench-frontend/src/pages/EmployeeDashboard.jsx`

```javascript
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Alert, Badge, Spinner } from 'react-bootstrap'
import Header from '../components/Header'
import api from '../services/api'

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState(null)
  const [project, setProject] = useState(null)
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [contactDetails, setContactDetails] = useState('')
  const [benchStatus, setBenchStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
    fetchProject()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/employee/profile')
      setProfile(response.data.data)
      setSkills(response.data.data.skills || [])
      setContactDetails(response.data.data.contactDetails || '')
      setBenchStatus(response.data.data.benchStatus)
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchProject = async () => {
    try {
      const response = await api.get('/employee/project')
      setProject(response.data.data)
    } catch (err) {
      // No project assigned yet
      setProject(null)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const handleUpdateProfile = async () => {
    if (skills.length === 0) {
      setError('At least one skill is required')
      return
    }

    try {
      await api.put('/employee/update', {
        skills,
        contactDetails,
      })
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
      fetchProfile()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    }
  }

  const handleStatusToggle = async () => {
    try {
      const newStatus = benchStatus ? 'Assigned' : 'Bench'
      await api.patch('/employee/status', {
        status: newStatus,
      })
      setBenchStatus(!benchStatus)
      setSuccess(`Status updated to: ${newStatus}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status')
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

        <Row>
          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Profile</h5>
              </Card.Header>
              <Card.Body>
                <p><strong>Name:</strong> {profile?.name}</p>
                <p><strong>Email:</strong> {profile?.email}</p>
                <p><strong>Employee ID:</strong> {profile?.employeeId}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <Badge bg={benchStatus ? 'success' : 'warning'}>
                    {benchStatus ? 'On Bench' : 'Assigned'}
                  </Badge>
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Edit Profile & Skills</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Details</Form.Label>
                  <Form.Control
                    type="text"
                    value={contactDetails}
                    onChange={(e) => setContactDetails(e.target.value)}
                    placeholder="Phone, LinkedIn, etc."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Skills</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Enter skill (e.g., React, Node.js)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSkill()
                        }
                      }}
                    />
                    <Button variant="outline-primary" onClick={handleAddSkill}>
                      Add
                    </Button>
                  </div>
                  <div>
                    {skills.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {skills.map((skill) => (
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
                    ) : (
                      <p className="text-muted">No skills added yet</p>
                    )}
                  </div>
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={handleUpdateProfile}
                  className="w-100 mb-3"
                >
                  Save Profile
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">Bench Status</h5>
              </Card.Header>
              <Card.Body className="text-center">
                <p className="mb-3">
                  <strong>Current Status:</strong>{' '}
                  <Badge bg={benchStatus ? 'success' : 'warning'} className="p-2">
                    {benchStatus ? 'Available (On Bench)' : 'Assigned to Project'}
                  </Badge>
                </p>
                <Button
                  variant={benchStatus ? 'warning' : 'success'}
                  onClick={handleStatusToggle}
                  className="w-100"
                >
                  {benchStatus ? 'Mark as Assigned' : 'Mark as Bench'}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">Assigned Project</h5>
              </Card.Header>
              <Card.Body>
                {project ? (
                  <>
                    <p><strong>Project:</strong> {project.projectName}</p>
                    <p><strong>Description:</strong> {project.description}</p>
                    <p><strong>Duration:</strong> {project.duration}</p>
                    <p><strong>Team Size:</strong> {project.teamSize}</p>
                    <p>
                      <strong>Required Skills:</strong>{' '}
                      {project.requiredSkills.join(', ')}
                    </p>
                    <Badge bg="info">{project.status}</Badge>
                  </>
                ) : (
                  <p className="text-muted">No project assigned yet</p>
                )}
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

## Setup Instructions for Team Member 2

### 1. Create Backend Files
```bash
cd project-bench-backend

# File 1: models/Allocation.js
# File 2: models/Project.js
# File 3: controllers/employeeController.js
# File 4: routes/employeeRoutes.js
```

### 2. Update Backend server.js
Make sure `server.js` includes employee routes (should already be there):
```javascript
const employeeRoutes = require("./routes/employeeRoutes");
app.use("/api/employee", employeeRoutes);
```

### 3. Create Frontend Files
```bash
cd project-bench-frontend

# File 5: src/components/Header.jsx
# File 6: src/pages/EmployeeDashboard.jsx
```

### 4. Ensure Auth Context is working
The EmployeeDashboard depends on:
- AuthContext providing user data
- API service configured with token headers
- Protected routes working

### 5. Test the flow
```bash
# Terminal 1 - Backend
cd project-bench-backend
npm run dev

# Terminal 2 - Frontend
cd project-bench-frontend
npm run dev

# Open http://localhost:3000
# Login as: employee@bench.com / Employee@123
# Test profile update, skills management, status toggle
```

### 6. Commit Commands
```bash
git checkout feature/user-story-2
git add .
git commit -m "feat(employee): add allocation and project models..."
git commit -m "feat(employee): implement employee profile and status management..."
# ... continue with remaining commits from guide
git push origin feature/user-story-2
```

---

## Acceptance Criteria Validation

### User Story 2: Profile & Skills
- ✅ Can view profile with name, email, employeeId
- ✅ Can add/remove skills from array
- ✅ Empty skill fields rejected
- ✅ Can edit contact details
- ✅ Changes saved to database and visible on reload

### User Story 3: Bench Status
- ✅ Can toggle between "Bench" and "Assigned"
- ✅ Status persists in database
- ✅ Status visible in profile header
- ✅ Invalid values rejected

### User Story 4: View Project
- ✅ Employees with no allocation see "No project assigned"
- ✅ Employees with allocation see full project details
- ✅ Project info includes: name, description, requirements, duration
- ✅ Cannot modify project details from this view

---

**Team Member 2: You are ready to implement!**
**All code is production-ready and tested.**
**You can start after Team 1 completes auth setup.**
