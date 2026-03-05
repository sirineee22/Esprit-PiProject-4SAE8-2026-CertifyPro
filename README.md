# 🎓 CertifyPro – Learning & Certification Platform

A modern learning and certification platform built with a microservices architecture.

## 📌 Overview

CertifyPro is a learning and certification platform that enables learners to access trainings, participate in events, interact through forums, communicate with trainers, and obtain certifications.

The platform is designed using a microservices architecture to ensure scalability, modularity, and maintainability.

*This project was developed as part of the PIDEV – 3rd Year Engineering Program at Esprit School of Engineering – Tunisia Academic Year 2025–2026.*

---

## 🚀 Features

### 🔐 User Management
- User authentication & authorization (JWT)
- Email verification & password reset

### 📚 Learning & Training
- Training management system
- E-commerce module for trainings
- Certification management

### 📅 Events & Scheduling
- Event management (workshops, webinars, bootcamps)
- Event registration & personal agenda calendar
- QR Code Event Pass
- Online meeting integration (Zoom / Google Meet / Teams)

### 💬 Communication
- Forum discussions
- Messaging between users
- Notifications and reminders

---

## 🛠 Tech Stack

### Frontend
- **Angular** – Frontend framework
- **TypeScript** – Typed JavaScript
- **HTML / CSS** – Markup and styling
- **Bootstrap** – Responsive design
- **Angular Material** – UI components

### Backend
- **Spring Boot** – Backend framework
- **Spring Security** – Authentication & authorization
- **JWT Authentication** – Secure token-based auth
- **Spring Cloud** – Microservices management
- **RESTful APIs** – Service communication

### Database
- **PostgreSQL** – Relational database

### DevOps & Tools
- **Git** & **GitHub** – Version control
- **Docker** (optional) – Containerization

---

## 🏗 Architecture

The platform follows a **Microservices Architecture**.

### Core Services

| Service | Responsibility |
|---------|----------------|
| **API Gateway** | Central entry point for all client requests |
| **Discovery Server (Eureka)** | Service registration and discovery |
| **User Service** | Authentication, user management and security |
| **Training Service** | Training and course management |
| **Event Service** | Event creation, registration and agenda management |
| **Forum Service** | Community discussions |
| **Messaging Service** | Communication between users |
| **Certification Service** | Certificate generation and management |
| **E-Commerce Service** | Online purchasing of trainings |
| **Notification Service** | Email notifications and reminders |

All services communicate through REST APIs and are registered using **Eureka Service Discovery**.

---

## 📂 Project Structure
certifypro
│
├── frontend/ # Angular application
│ ├── src/
│ ├── angular.json
│ └── package.json
│
├── backend/
│ ├── api-gateway/
│ ├── discovery-server/
│ ├── user-service/
│ ├── training-service/
│ ├── event-service/
│ ├── forum-service/
│ ├── messaging-service/
│ ├── certification-service/
│ ├── ecommerce-service/
│ └── notification-service/
│
└── README.md

---

## 👨‍💻 Contributors

- **Sirine Dahmane**
- **Khalil Houari**
- **Rania Kalai**
- **Mohamed Ali Saadaoui**
- **Nesrine Romdhane**
- **Ammar**

---

## 🎓 Academic Context

- **Developed at:** Esprit School of Engineering – Tunisia
- **Program:** PIDEV – 3rd Year Engineering Program
- **Academic Year:** 2025–2026

---

## ⚙️ Getting Started

### Prerequisites
- Java 11+
- Node.js & npm
- PostgreSQL
- Maven

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/username/certifypro.git
cd certifypro
Run Backend Services

bash
# Start Discovery Server first
cd backend/discovery-server
mvn spring-boot:run

# Start API Gateway
cd ../api-gateway
mvn spring-boot:run

# Start other services in separate terminals
cd ../user-service
mvn spring-boot:run
# Repeat for other services
Run Frontend

bash
cd frontend
npm install
ng serve

🙏 Acknowledgments
This project was developed as part of the PIDEV course at Esprit School of Engineering – Tunisia. Special thanks to our instructors and supervisors for their guidance throughout this academic project.
