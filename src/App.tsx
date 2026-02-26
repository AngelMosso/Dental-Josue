import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import PatientsPage from './pages/PatientsPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import ClinicalRecordsPage from './pages/ClinicalRecordsPage';
import AgendaPage from './pages/AgendaPage';
import InventoryPage from './pages/InventoryPage';
import FinancePage from './pages/FinancePage';
import CompliancePage from './pages/CompliancePage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider } from './context/AuthContext';



// Auditoría COFEPRIS Activa
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={<DashboardLayout />}
          >
            <Route index element={<Dashboard />} />
            <Route path="pacientes" element={<PatientsPage />} />
            <Route path="pacientes/:id" element={<PatientDetailsPage />} />
            <Route path="historiales" element={<ClinicalRecordsPage />} />
            <Route path="citas" element={<AgendaPage />} />
            <Route path="inventario" element={<InventoryPage />} />
            <Route path="finanzas" element={<FinancePage />} />
            <Route path="normativa" element={<CompliancePage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

