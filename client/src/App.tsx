import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DisasterProvider } from './context/DisasterContext';
import { DLEMeshProvider } from './context/DLEMeshContext';
import { Navbar } from './components/common/Navbar';
import { LocationPickerModal } from './components/common/LocationPickerModal';
import { DLEMeshBanner } from './components/mesh/DLEMeshBanner';
import { DLEMeshControlModal } from './components/mesh/DLEMeshControlModal';

// Pages
import { HomePage } from './pages/HomePage';
import { MissingReportPage } from './pages/MissingReportPage';
import { SightingPage } from './pages/SightingPage';
import { VolunteerIntakePage } from './pages/VolunteerIntakePage';
import { CoordinatorPage } from './pages/CoordinatorPage';
import { SearchPortalPage } from './pages/SearchPortalPage';
import { SafeCheckInPage } from './pages/SafeCheckInPage';
import { CampsMapPage } from './pages/CampsMapPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { FamilyTokenPage } from './pages/FamilyTokenPage';
import { AlertPortalPage } from './pages/AlertPortalPage';

import { ShieldCheck, Heart, Lock } from 'lucide-react';

export const App: React.FC = () => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isMeshControlOpen, setIsMeshControlOpen] = useState(false);

  return (
    <AuthProvider>
      <DisasterProvider>
        <DLEMeshProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 selection:bg-teal-100 selection:text-teal-900">
              {/* DLE Mesh Mode Active Status Banner */}
              <DLEMeshBanner onOpenMeshControl={() => setIsMeshControlOpen(true)} />

              {/* Main Navigation with Location and DLE Mesh triggers */}
              <Navbar
                onOpenLocationPicker={() => setIsLocationModalOpen(true)}
                onOpenMeshControl={() => setIsMeshControlOpen(true)}
              />

              {/* Page Router Body */}
              <main className="flex-1">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <HomePage
                        onOpenLocationPicker={() => setIsLocationModalOpen(true)}
                        onOpenMeshControl={() => setIsMeshControlOpen(true)}
                      />
                    }
                  />
                  <Route path="/report-missing" element={<MissingReportPage />} />
                  <Route path="/report-sighting" element={<SightingPage />} />
                  <Route path="/volunteer-intake" element={<VolunteerIntakePage />} />
                  <Route path="/coordinator" element={<CoordinatorPage />} />
                  <Route path="/search" element={<SearchPortalPage />} />
                  <Route path="/safe-checkin" element={<SafeCheckInPage />} />
                  <Route
                    path="/camps"
                    element={
                      <CampsMapPage
                        onOpenLocationPicker={() => setIsLocationModalOpen(true)}
                        onOpenMeshControl={() => setIsMeshControlOpen(true)}
                      />
                    }
                  />
                  <Route path="/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/family-token" element={<FamilyTokenPage />} />
                  <Route path="/alerts" element={<AlertPortalPage />} />
                </Routes>
              </main>

            {/* Interactive Disaster Location & Live Coordinates Modal */}
            <LocationPickerModal
              isOpen={isLocationModalOpen}
              onClose={() => setIsLocationModalOpen(false)}
            />

            {/* Interactive DLE Mesh & Offline Traceable Route Modal */}
            <DLEMeshControlModal
              isOpen={isMeshControlOpen}
              onClose={() => setIsMeshControlOpen(false)}
            />

            {/* Privacy, Ethics & Data Retention Footer */}
            <footer className="bg-white border-t border-slate-200 py-8 px-4 text-xs text-slate-500">
              <div className="max-w-7xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <span className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center text-xs">
                      GX
                    </span>
                    <span>GlobalX Disaster Reunification Platform</span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-teal-600" />
                      Strict Public Privacy Masking
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Coordinator Rumor Shield Active
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-slate-400 leading-relaxed">
                  <p>
                    <strong>Privacy & Ethics Notice:</strong> We collect only essential identification details to locate separated family members. Public search queries never expose phone numbers, exact residential coordinates, or photos of children. All information updates are gated by camp nodal officer verification.
                  </p>
                  <p>
                    <strong>Data Retention & Deletion Policy:</strong> Emergency roster entries and contact records are retained solely for the duration of the active disaster operation and automatically archived with an encrypted state audit log following de-escalation.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </DLEMeshProvider>
    </DisasterProvider>
  </AuthProvider>
);
};

export default App;
