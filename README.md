🎓 CertifyPro – Learning & Certification Platform
<p align="center"> A modern learning and certification platform built with a microservices architecture. </p>
📌 Overview

CertifyPro is a learning and certification platform that enables learners to access trainings, participate in events, interact through forums, communicate with trainers, and obtain certifications.

The platform is designed using a microservices architecture to ensure scalability, modularity, and maintainability.

This project was developed as part of the PIDEV – 3rd Year Engineering Program at Esprit School of Engineering – Tunisia
Academic Year 2025–2026.

🚀 Features

🔐 User authentication & authorization (JWT)

✉️ Email verification & password reset

🔑 Two-Factor Authentication (2FA)

📚 Training management system

📅 Event management (workshops, webinars, bootcamps)

🗓 Event registration & personal agenda calendar

🎟 QR Code Event Pass

💬 Forum discussions

📩 Messaging between users

🏆 Certification management

🛒 E-commerce module for trainings

🔔 Notifications and reminders

🎥 Online meeting integration (Zoom / Google Meet / Teams)

🛠 Tech Stack
Frontend

Angular

TypeScript

HTML / CSS

Bootstrap

Angular Material

Backend

Spring Boot

Spring Security

JWT Authentication

Spring Cloud (Microservices)

RESTful APIs

Database

PostgreSQL

DevOps & Tools

Git

GitHub

Docker (optional)

🏗 Architecture

The platform follows a Microservices Architecture.

Core Services

API Gateway
Central entry point for all client requests

Discovery Server (Eureka)
Service registration and discovery

Business Services

User Service
Authentication, user management and security

Training Service
Training and course management

Event Service
Event creation, registration and agenda management

Forum Service
Community discussions

Messaging Service
Communication between users

Certification Service
Certificate generation and management

E-Commerce Service
Online purchasing of trainings

Notification Service
Email notifications and reminders

All services communicate through REST APIs and are registered using Eureka Service Discovery.

📂 Project Structure
certifypro
│
├── frontend/                 # Angular application
│
├── backend/
│   ├── api-gateway
│   ├── discovery-server
│   ├── user-service
│   ├── training-service
│   ├── event-service
│   ├── forum-service
│   ├── messaging-service
│   ├── certification-service
│   ├── ecommerce-service
│   └── notification-service
│
└── README.md
👨‍💻 Contributors

Sirine Dahmane

Khalil Houari

Rania Kalai

Mohamed Ali Saadaoui

Nesrine Romdhane

Ammar

🎓 Academic Context

Developed at Esprit School of Engineering – Tunisia

PIDEV – 3rd Year Engineering Program
Academic Year 2025–2026

⚙️ Getting Started
Clone the repository
git clone https://github.com/username/project-name.git
cd project-name
Run Backend
cd backend
mvn spring-boot:run
Run Frontend
cd frontend
npm install
ng serve

Application URLs

Frontend: http://localhost:4200
API Gateway: http://localhost:8081
🙏 Acknowledgments

This project was developed as part of the PIDEV course at Esprit School of Engineering – Tunisia.
