export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",

  VERIFY_ACCOUNT: "/verify-account",
  VERIFY_EMAIL: "/verify-email",

  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  UNAUTHORIZED: "/unauthorized",
  PENDING_APPROVAL: "/pending-approval",
  ACCOUNT_BLOCKED: "/account-blocked",

  ADMIN_DASHBOARD: "/admin/dashboard",
  DOCTOR_DASHBOARD: "/doctor/dashboard",
  PATIENT_DASHBOARD: "/patient/dashboard",

  ADMIN_PROFILE: "/admin/profile",
  DOCTOR_PROFILE: "/doctor/profile",
  PATIENT_PROFILE: "/patient/profile",

  ADMIN_PROFILE_EDIT: "/admin/profile/edit",
  DOCTOR_PROFILE_EDIT: "/doctor/profile/edit",
  PATIENT_PROFILE_EDIT: "/patient/profile/edit",

  ADMIN_PENDING_DOCTORS: "/admin/doctors/pending",
  ADMIN_ALL_USERS: "/admin/users",
  ADMIN_DOCTORS: "/admin/doctors",
  ADMIN_PATIENTS: "/admin/patients",

  PATIENT_BOOK_APPOINTMENT: "/patient/appointments/book",
  PATIENT_APPOINTMENTS: "/patient/appointments",
  PATIENT_APPOINTMENT_DETAILS: "/patient/appointments/:id",
  PATIENT_PAYMENT: "/patient/appointments/:id/pay",
  PATIENT_TELEMEDICINE: "/patient/telemedicine/:sessionId",

  // New Patient Routes
  PATIENT_UPLOAD_REPORT: "/patient/reports/upload",
  PATIENT_VIEW_REPORTS: "/patient/reports",
  PATIENT_MEDICAL_HISTORY: "/patient/medical-history",
  PATIENT_PRESCRIPTIONS: "/patient/prescriptions",
  PATIENT_PRESCRIPTION_DETAILS: "/patient/prescriptions/:id",

  DOCTOR_APPOINTMENTS: "/doctor/appointments",
  DOCTOR_APPOINTMENT_DETAILS: "/doctor/appointments/:id",
};