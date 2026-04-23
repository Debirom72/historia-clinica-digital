import { createBrowserRouter } from "react-router";
import { WelcomePage } from "./pages/WelcomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PersonalDataPage } from "./pages/PersonalDataPage";
import { AttentionRecordPage } from "./pages/AttentionRecordPage";
import { NursingRecordPage } from "./pages/NursingRecordPage";
import { MedicationPage } from "./pages/MedicationPage";
import { StudiesPage } from "./pages/StudiesPage";
import { SensitiveInfoPage } from "./pages/SensitiveInfoPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { GeneratePrescriptionPage } from "./pages/GeneratePrescriptionPage";
import { EmergencyInfoPage } from "./pages/EmergencyInfoPage";
import { AuthorizeDoctorPage } from "./pages/AuthorizeDoctorPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import { DoctorPortalPage } from "./pages/DoctorPortalPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: WelcomePage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/privacy-policy",
    Component: PrivacyPolicyPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
  },
  {
    path: "/personal-data",
    Component: PersonalDataPage,
  },
  {
    path: "/attention-record",
    Component: AttentionRecordPage,
  },
  {
    path: "/nursing-record",
    Component: NursingRecordPage,
  },
  {
    path: "/medication",
    Component: MedicationPage,
  },
  {
    path: "/studies",
    Component: StudiesPage,
  },
  {
    path: "/sensitive-info",
    Component: SensitiveInfoPage,
  },
  {
    path: "/ai-assistant",
    Component: AIAssistantPage,
  },
  {
    path: "/appointments",
    Component: AppointmentsPage,
  },
  {
    path: "/generate-prescription",
    Component: GeneratePrescriptionPage,
  },
  {
    path: "/emergency-info",
    Component: EmergencyInfoPage,
  },
  {
    path: "/authorize-doctor",
    Component: AuthorizeDoctorPage,
  },
  {
    path: "/audit-log",
    Component: AuditLogPage,
  },
  {
    path: "/doctor-portal",
    Component: DoctorPortalPage,
  },
]);
