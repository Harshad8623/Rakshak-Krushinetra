import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import CameraFeed from './pages/CameraFeed';
import DroneControl from './pages/DroneControl';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import CropHealth from './pages/CropHealth';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/camera" element={<CameraFeed />} />
            <Route path="/drone" element={<DroneControl />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/crop-health" element={<CropHealth />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
