import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VisualEditProvider } from './visual-edit';
import { isVisualEditEnabled } from './utils/featureFlags';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import GuidePage from './pages/GuidePage';
import TemplatesPage from './pages/TemplatesPage';

const routes = (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/templates" element={<TemplatesPage />} />
      <Route path="/new" element={<EditorPage />} />
      <Route path="/edit/:id" element={<EditorPage />} />
      <Route path="/history/:id" element={<HistoryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default function App() {
  const visualEdit = isVisualEditEnabled();
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

  return (
    <BrowserRouter basename={basename}>
      {visualEdit ? <VisualEditProvider>{routes}</VisualEditProvider> : routes}
    </BrowserRouter>
  );
}
