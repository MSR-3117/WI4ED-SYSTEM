import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HeroGeometric } from './components/ui/shape-landing-hero';
import Login from './components/ui/login-form';
import Dashboard from './components/Dashboard';
import WaveformAnalysis from './components/WaveformAnalysis';
import Maintenance from './components/Maintenance';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HeroGeometric />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/waveforms" element={<WaveformAnalysis />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
