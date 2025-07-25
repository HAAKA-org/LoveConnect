import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Pairing from './pages/Pairing';
import DashboardLayout from './layouts/DashboardLayout';
import Chat from './pages/Chat';
import Gallery from './pages/Gallery';
import Notes from './pages/Notes';
import Timeline from './pages/Timeline';
import Reminders from './pages/Reminders';
import Extras from './pages/Extras';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <Router>
            <div className="min-h-screen bg-pink-50">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/pairing" element={<Pairing />} />
                <Route path="/dashboard" element={

                  <DashboardLayout />

                }>
                  <Route index element={<Navigate to="/dashboard/chat" replace />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="gallery" element={<Gallery />} />
                  <Route path="notes" element={<Notes />} />
                  <Route path="timeline" element={<Timeline />} />
                  <Route path="reminders" element={<Reminders />} />
                  <Route path="extras" element={<Extras />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;