import { APP_ROUTES } from "../../constants/routes";

export const patientLinks = [
  { label: "Dashboard", path: APP_ROUTES.PATIENT_DASHBOARD, end: true },
  { label: "Book Appointment", path: APP_ROUTES.PATIENT_BOOK_APPOINTMENT, end: true },
  { label: "My Appointments", path: APP_ROUTES.PATIENT_APPOINTMENTS, end: true },
  { label: "Consultation Notes", path: APP_ROUTES.PATIENT_CONSULTATION_NOTES, end: true },
  { label: "Prescriptions", path: APP_ROUTES.PATIENT_PRESCRIPTIONS, end: true },
  { label: "My Profile", path: APP_ROUTES.PATIENT_PROFILE, end: true },
];