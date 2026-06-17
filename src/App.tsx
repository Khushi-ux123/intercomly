/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TicketProvider } from './context/TicketContext';
import { Sidebar } from './components/Sidebar';
import { SaaSHeader } from './components/SaaSHeader';
import { LandingPage } from './views/LandingPage';
import { LoginRegister } from './views/LoginRegister';
import { CustomerDashboard } from './views/CustomerDashboard';
import { AgentDashboard } from './views/AgentDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { ProfileSettings } from './views/ProfileSettings';
import { OnboardingTour } from './components/OnboardingTour';
import { NotificationCenter } from './components/NotificationCenter';
import { motion, AnimatePresence } from 'motion/react';

function DashboardSwitch() {
  const { activeView } = useApp();

  switch (activeView) {
    case 'landing':
      return <LandingPage />;
    case 'login':
    case 'register':
      return <LoginRegister />;
    case 'customer':
      return <CustomerDashboard />;
    case 'agent':
      return <AgentDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'settings':
      return <ProfileSettings />;
    default:
      return <LandingPage />;
  }
}

function WorkspaceContainer() {
  const { user, activeView, tourRun, stopTour } = useApp();

  const isPublicPage = activeView === 'landing' || activeView === 'login' || activeView === 'register';

  if (!user || isPublicPage) {
    return <DashboardSwitch />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-gray-900 dark:bg-[#090d16] dark:text-gray-100 font-sans">
      {/* Real-time Toast Notification center */}
      <NotificationCenter />

      {/* Interactive Onboarding Tour Overlay */}
      <OnboardingTour run={tourRun} onClose={stopTour} />

      {/* SaaS Sidebar navigation panel */}
      <Sidebar />

      {/* Main viewport area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <SaaSHeader />
        
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <DashboardSwitch />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <TicketProvider>
        <WorkspaceContainer />
      </TicketProvider>
    </AppProvider>
  );
}
