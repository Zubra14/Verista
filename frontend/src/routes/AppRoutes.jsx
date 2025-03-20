// src/routes/AppRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProtectedRoute from "../components/common/ProtectedRoute";

// Lazy load components for better performance
const MainLayout = lazy(() => import("../components/layout/MainLayout"));
const Navbar = lazy(() => import("../components/common/Navbar"));
const Footer = lazy(() => import("../components/common/Footer"));
const Hero = lazy(() => import("../components/Hero"));
const VideoSection = lazy(() => import("../components/VideoSection"));
const KeyBenefits = lazy(() => import("../components/dashboard/KeyBenefits"));
const HowItWorksSection = lazy(() => import("../components/HowItWorksSection"));
const TestimonialsSection = lazy(() =>
  import("../components/TestimonialsSection")
);
const StatsSection = lazy(() => import("../components/StatsSection"));

// Auth components
const LoginForm = lazy(() => import("../components/auth/LoginForm"));
const SignupForm = lazy(() => import("../components/auth/SignupForm"));
const AuthCallback = lazy(() => import("../components/auth/AuthCallback"));
const RoleSelection = lazy(() => import("../components/auth/RoleSelection"));
const TestAccountRoleSelector = lazy(() =>
  import("../components/auth/TestAccountRoleSelector")
);

// Dashboard components
const ParentDashboard = lazy(() =>
  import("../components/dashboard/ParentDashboard")
);
const DriverDashboard = lazy(() =>
  import("../components/dashboard/DriverDashboard")
);
const SchoolDashboard = lazy(() =>
  import("../components/dashboard/SchoolDashboard")
);
const GovernmentDashboard = lazy(() =>
  import("../components/dashboard/GovernmentDashboard")
);

// New components
const PricingPlans = lazy(() =>
  import("../components/subscription/PricingPlans")
);
const ContactPage = lazy(() => import("../components/ContactPage"));
const AboutPage = lazy(() => import("../components/AboutPage"));
const PrivacyPolicy = lazy(() => import("../components/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("../components/legal/TermsOfService"));

// Parent dashboard modules
const LiveTracking = lazy(() =>
  import("../components/dashboard/dashboard-modules/LiveTracking")
);
const TripHistory = lazy(() =>
  import("../components/dashboard/dashboard-modules/TripHistory")
);
const DriverInfo = lazy(() =>
  import("../components/dashboard/dashboard-modules/DriverInfo")
);
const Settings = lazy(() =>
  import("../components/dashboard/dashboard-modules/Settings")
);

// School dashboard modules
const StudentManagement = lazy(() =>
  import("../components/dashboard/dashboard-modules/school/StudentManagement")
);
const RouteManagement = lazy(() =>
  import("../components/dashboard/dashboard-modules/school/RouteManagement")
);
const FleetOverview = lazy(() =>
  import("../components/dashboard/dashboard-modules/school/FleetOverview")
);
const ComplianceReports = lazy(() =>
  import("../components/dashboard/dashboard-modules/school/ComplianceReports")
);
const SystemIntegration = lazy(() =>
  import("../components/dashboard/dashboard-modules/school/SystemIntegration")
);

// Driver dashboard modules
const MyRoutes = lazy(() =>
  import("../components/dashboard/dashboard-modules/driver/MyRoutes")
);
const MyVehicle = lazy(() =>
  import("../components/dashboard/dashboard-modules/driver/MyVehicle")
);
const Students = lazy(() =>
  import("../components/dashboard/dashboard-modules/driver/Students")
);

// Government dashboard modules
const ComplianceOverview = lazy(() =>
  import(
    "../components/dashboard/dashboard-modules/government/ComplianceOverview"
  )
);
const IncidentReports = lazy(() =>
  import("../components/dashboard/dashboard-modules/government/IncidentReports")
);
const OperatorManagement = lazy(() =>
  import(
    "../components/dashboard/dashboard-modules/government/OperatorManagement"
  )
);
const AnalyticsReporting = lazy(() =>
  import(
    "../components/dashboard/dashboard-modules/government/AnalyticsReporting"
  )
);
const LicensingModule = lazy(() =>
  import("../components/dashboard/dashboard-modules/government/LicensingModule")
);

// Fallback components for suspended routes
const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Wrap lazy-loaded components with Suspense
const withSuspense = (Component) => (props) =>
  (
    <Suspense fallback={<SuspenseFallback />}>
      <Component {...props} />
    </Suspense>
  );

const AppRoutes = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={withSuspense(MainLayout)()}>
        <Route
          index
          element={
            <>
              {withSuspense(Hero)()}
              {withSuspense(VideoSection)()}
              {withSuspense(KeyBenefits)()}
              {withSuspense(HowItWorksSection)()}
              {withSuspense(TestimonialsSection)()}
              {withSuspense(StatsSection)()}
            </>
          }
        />
        <Route path="features" element={withSuspense(KeyBenefits)()} />
        <Route
          path="how-it-works"
          element={withSuspense(HowItWorksSection)()}
        />
        <Route path="pricing" element={withSuspense(PricingPlans)()} />
        <Route path="contact" element={withSuspense(ContactPage)()} />
        <Route path="about" element={withSuspense(AboutPage)()} />
        <Route path="privacy-policy" element={withSuspense(PrivacyPolicy)()} />
        <Route
          path="terms-of-service"
          element={withSuspense(TermsOfService)()}
        />
      </Route>

      {/* Authentication routes */}
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to={`/dashboard/${currentUser.role}`} replace />
          ) : (
            withSuspense(LoginForm)()
          )
        }
      />

      <Route
        path="/login/:role"
        element={
          currentUser ? (
            <Navigate to={`/dashboard/${currentUser.role}`} replace />
          ) : (
            withSuspense(LoginForm)()
          )
        }
      />

      <Route
        path="/signup"
        element={
          currentUser ? (
            <Navigate to={`/dashboard/${currentUser.role}`} replace />
          ) : (
            withSuspense(SignupForm)()
          )
        }
      />

      <Route path="/auth/callback" element={withSuspense(AuthCallback)()} />
      <Route path="/select-role" element={withSuspense(RoleSelection)()} />
      <Route
        path="/test-account/select-role"
        element={withSuspense(TestAccountRoleSelector)()}
      />

      {/* Dashboard routes */}
      <Route
        path="/dashboard/parent"
        element={
          <ProtectedRoute requiredRole="parent">
            {withSuspense(ParentDashboard)()}
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<div>Overview</div>} />
        <Route path="tracking" element={withSuspense(LiveTracking)()} />
        <Route path="history" element={withSuspense(TripHistory)()} />
        <Route path="driver" element={withSuspense(DriverInfo)()} />
        <Route path="settings" element={withSuspense(Settings)()} />
        <Route path="profile" element={<div>Profile</div>} />
        <Route path="subscription" element={withSuspense(PricingPlans)()} />
      </Route>

      <Route
        path="/dashboard/driver"
        element={
          <ProtectedRoute requiredRole="driver">
            {withSuspense(DriverDashboard)()}
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<div>Overview</div>} />
        <Route path="routes" element={withSuspense(MyRoutes)()} />
        <Route path="vehicle" element={withSuspense(MyVehicle)()} />
        <Route path="students" element={withSuspense(Students)()} />
        <Route path="settings" element={withSuspense(Settings)()} />
        <Route path="profile" element={<div>Profile</div>} />
        <Route path="subscription" element={withSuspense(PricingPlans)()} />
      </Route>

      <Route
        path="/dashboard/school"
        element={
          <ProtectedRoute requiredRole="school">
            {withSuspense(SchoolDashboard)()}
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<div>Overview</div>} />
        <Route path="students" element={withSuspense(StudentManagement)()} />
        <Route path="routes" element={withSuspense(RouteManagement)()} />
        <Route path="fleet" element={withSuspense(FleetOverview)()} />
        <Route path="compliance" element={withSuspense(ComplianceReports)()} />
        <Route path="integration" element={withSuspense(SystemIntegration)()} />
        <Route path="settings" element={withSuspense(Settings)()} />
        <Route path="profile" element={<div>Profile</div>} />
        <Route path="subscription" element={withSuspense(PricingPlans)()} />
      </Route>

      <Route
        path="/dashboard/government"
        element={
          <ProtectedRoute requiredRole="government">
            {withSuspense(GovernmentDashboard)()}
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<div>Overview</div>} />
        <Route path="compliance" element={withSuspense(ComplianceOverview)()} />
        <Route path="incidents" element={withSuspense(IncidentReports)()} />
        <Route path="operators" element={withSuspense(OperatorManagement)()} />
        <Route path="analytics" element={withSuspense(AnalyticsReporting)()} />
        <Route path="licensing" element={withSuspense(LicensingModule)()} />
        <Route path="settings" element={withSuspense(Settings)()} />
        <Route path="profile" element={<div>Profile</div>} />
      </Route>

      {/* Fallback routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
