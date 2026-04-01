# Smart Healthcare Platform

AI-Enabled Smart Healthcare Appointment and Telemedicine Platform using Microservices.

## Tech Stack
- MongoDB
- Express.js
- React.js
- Node.js
- Docker
- Kubernetes

## Project Structure
```text
smart-healthcare-platform/
├── docs/
├── frontend/
├── infra/
│   ├── docker/
│   └── k8s/
├── services/
│   ├── appointment-service/
│   ├── auth-service/
│   ├── doctor-service/
│   └── patient-service/
├── .gitignore
└── README.md
```

## Services
- Auth Service
- Patient Service
- Doctor Service
- Appointment Service

## Team Members
- Sandeepa - Appointment, Payment, Notification, Integration
- Teshan - Auth, User Management
- Malith - Patient Management, Reports
- Harith - Doctor Management, Prescription

- # API List

## Auth Service
- POST /auth/register/patient
- POST /auth/register/doctor
- POST /auth/login
- GET /auth/me
- PATCH /admin/doctors/:id/approve
- PATCH /admin/doctors/:id/reject

## Patient Service
- GET /patients/me
- PATCH /patients/me
- POST /patients/reports
- GET /patients/reports
- GET /patients/history
- GET /patients/prescriptions

## Doctor Service
- GET /doctors/me
- PATCH /doctors/me
- POST /doctors/availability
- GET /doctors/availability
- GET /doctors/appointments
- PATCH /doctors/appointments/:id/status
- POST /doctors/prescriptions
- GET /doctors/prescriptions

## Appointment Service
- GET /appointments/doctors/search
- POST /appointments
- GET /appointments/me
- PATCH /appointments/:id/cancel
- POST /payments/:appointmentId/pay
- POST /notifications/send
- POST /telemedicine/session/:appointmentId

- # Main Workflows

## 1. Patient Registration
Patient registers, account is created, and patient profile is created.

## 2. Doctor Registration and Approval
Doctor registers, account status becomes pending, admin approves doctor, then doctor can log in.

## 3. Appointment Booking
Patient searches doctor, selects doctor, chooses appointment type, enters reason, uploads reports, and sends appointment request.

## 4. Doctor Appointment Handling
Doctor reviews request and accepts, rejects, or reschedules it.

## 5. Payment Flow
After doctor confirmation, patient completes payment. If payment succeeds, appointment becomes confirmed.

## 6. Telemedicine Session
For telemedicine appointments, session link is generated after confirmation and payment.

## 7. Prescription Flow
Doctor issues digital prescription after consultation. Patient can view prescription history.

# Architecture Notes

## Architecture Style
Microservices architecture

## Services
1. Auth Service
2. Patient Service
3. Doctor Service
4. Appointment Service

## Frontend
React-based asynchronous web client

## Database
MongoDB

## Containerization
Docker

## Orchestration
Kubernetes

## Security
- JWT authentication
- Role-based authorization
- Password hashing
- Protected routes

## Main Roles
- Patient
- Doctor
- Admin
