# 🚀 CloudCrafter

## Intelligent No-Code Cloud-Native Application Builder

CloudCrafter is a no-code platform that enables users to visually design, generate, and deploy cloud-native applications without writing backend code, Docker configurations, or Kubernetes YAML files.

Using a drag-and-drop interface, users can create application workflows, validate them, generate application code automatically, and deploy directly to a Kubernetes cluster hosted on Civo Cloud.

---

## 📖 Overview

Building and deploying cloud-native applications traditionally requires:

- Backend development skills
- Docker knowledge
- Kubernetes configuration expertise
- DevOps experience

CloudCrafter simplifies this process by providing a visual workflow builder that automatically converts application blueprints into deployable cloud-native applications.

---

## ✨ Features

### 🎨 Visual Application Builder
- Drag-and-drop interface
- Workflow-based application design
- Interactive node connections
- Real-time validation

### ⚙️ Automatic Code Generation
- Backend application generation
- API structure creation
- Template-based code generation

### ☸️ Kubernetes Deployment
- Automatic Deployment YAML generation
- Automatic Service YAML generation
- One-click deployment to Kubernetes

### 🐳 Docker Integration
- Docker image creation
- Containerized application deployment
- Docker Hub support

### 📊 Monitoring
- Application status monitoring
- Request metrics
- CPU usage metrics
- Memory utilization metrics

### 💰 Cost Estimation
- Basic deployment cost preview
- Resource estimation support

---

## 🏗️ System Architecture

```text
+-------------------+
|  Visual Builder   |
| (React Flow UI)   |
+---------+---------+
          |
          v
+-------------------+
| Blueprint JSON    |
+---------+---------+
          |
          v
+-------------------+
| Backend Generator |
| Code + YAML       |
+---------+---------+
          |
          v
+-------------------+
| Docker Container  |
+---------+---------+
          |
          v
+-------------------+
| Civo Kubernetes   |
+---------+---------+
          |
          v
+-------------------+
| Public URL        |
+-------------------+
```

---

## 🔄 Workflow

### Step 1: Design Application

Users drag and connect components such as:

- Form Block
- API/Function Block
- Database Block
- Response Block

### Step 2: Validate

The system validates:

- Missing connections
- Logical errors
- Invalid workflows

### Step 3: Generate

CloudCrafter generates:

- Backend application code
- Docker deployment configuration
- Kubernetes Deployment YAML
- Kubernetes Service YAML

### Step 4: Deploy

Generated resources are deployed to a Civo Kubernetes cluster.

### Step 5: Monitor

Users can monitor deployment metrics and application health.

---

## 🛠️ Technology Stack

### Frontend
- React
- React Flow

### Backend
- Python
- Node.js
- Express.js

### Containerization
- Docker

### Orchestration
- Kubernetes

### Cloud Platform
- Civo Cloud

### DevOps Tools
- Docker Hub
- kubectl

---

## 📦 Project Structure

```bash
CloudCrafter/
│
├── frontend/
│   ├── React UI
│   └── React Flow Components
│
├── backend/
│   ├── Code Generator
│   ├── YAML Generator
│   └── Deployment APIs
│
├── kubernetes/
│   ├── deployment.yaml
│   └── service.yaml
│
├── docker/
│   └── Dockerfile
│
└── README.md
```

---

## 🚀 Deployment Process

```bash
# Build Docker Image
docker build -t cloudcrafter-demo .

# Push Image
docker push <dockerhub-username>/cloudcrafter-demo

# Deploy to Kubernetes
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

---

## 📊 Monitoring Features

CloudCrafter provides deployment insights including:

- Request Count
- Status Codes
- CPU Usage
- Memory Usage
- Deployment Status

---

## 🎯 Future Enhancements

- Advanced form configuration
- Authentication workflows
- Database integration
- CRUD API templates
- Real-time Kubernetes metrics
- Grafana integration
- CI/CD automation
- Auto-build and auto-deployment pipelines

---

## 👨‍💻 Team TechBotz

- Aruna D H
- Inchara M
- Chaitanya K
- Haripriya D

---

## 🌟 Vision

CloudCrafter aims to make cloud-native application development accessible to everyone by eliminating the complexity of backend development, containerization, and Kubernetes deployment.

Build → Generate → Deploy → Monitor

All from a single visual interface.
