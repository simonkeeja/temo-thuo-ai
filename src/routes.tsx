import React from 'react';
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FarmersPage from './pages/FarmersPage';
import FarmsPage from './pages/FarmsPage';
import LivestockPage from './pages/LivestockPage';
import MicrochipsPage from './pages/MicrochipsPage';
import CropsPage from './pages/CropsPage';
import SensorsPage from './pages/SensorsPage';
import VeterinaryPage from './pages/VeterinaryPage';
import VetHealthRecordsPage from './pages/VetHealthRecordsPage';
import MarketplacePage from './pages/MarketplacePage';
import InsurancePage from './pages/InsurancePage';
import PaymentsPage from './pages/PaymentsPage';
import IoTPage from './pages/IoTPage';
import DevicesPage from './pages/DevicesPage';
import GISPage from './pages/GISPage';
import AIInsightsPage from './pages/AIInsightsPage';
import SituationRoomPage from './pages/SituationRoomPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import WhatsAppMonitorPage from './pages/WhatsAppMonitorPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  { name: 'Login',          path: '/login',         element: <LoginPage />,         public: true },
  { name: 'Register',       path: '/register',      element: <RegisterPage />,      public: true },
  { name: 'Root Redirect',  path: '/',              element: <Navigate to="/dashboard" replace />, public: false },
  { name: 'Dashboard',      path: '/dashboard',     element: <DashboardPage /> },
  { name: 'Farmers',        path: '/farmers',       element: <FarmersPage /> },
  { name: 'Farms',          path: '/farms',         element: <FarmsPage /> },
  { name: 'Livestock',      path: '/livestock',     element: <LivestockPage /> },
  { name: 'Bio-Sentinel',   path: '/microchips',    element: <MicrochipsPage /> },
  { name: 'Crops',          path: '/crops',         element: <CropsPage /> },
  { name: 'Crop-Guardian',  path: '/sensors',       element: <SensorsPage /> },
  { name: 'Veterinary',     path: '/veterinary',    element: <VeterinaryPage /> },
  { name: 'Health Records', path: '/health-records', element: <VetHealthRecordsPage /> },
  { name: 'Marketplace',    path: '/marketplace',   element: <MarketplacePage /> },
  { name: 'Insurance',      path: '/insurance',     element: <InsurancePage /> },
  { name: 'Payments',       path: '/payments',      element: <PaymentsPage /> },
  { name: 'IoT Devices',    path: '/iot',           element: <IoTPage /> },
  { name: 'Device Assets',  path: '/devices',       element: <DevicesPage /> },
  { name: 'GIS Map',        path: '/gis',           element: <GISPage /> },
  { name: 'AI Insights',    path: '/ai-insights',   element: <AIInsightsPage /> },
  { name: 'Situation Room', path: '/situation-room',element: <SituationRoomPage /> },
  { name: 'Reports',        path: '/reports',       element: <ReportsPage /> },
  { name: 'Notifications',  path: '/notifications', element: <NotificationsPage /> },
  { name: 'Admin',          path: '/admin',         element: <AdminPage /> },
  { name: 'User Management', path: '/admin/users',      element: <AdminUsersPage /> },
  { name: 'WhatsApp Assistant', path: '/admin/whatsapp', element: <WhatsAppMonitorPage /> },
  { name: 'Profile',        path: '/profile',       element: <ProfilePage /> },
  { name: 'Not Found',      path: '*',              element: <NotFound />, public: true },
];
