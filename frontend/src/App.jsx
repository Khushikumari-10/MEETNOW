import './App.css';
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/home';
import History from './pages/history';

function App() {
  return (
    <div className="App">
      
      <Router>

        <AuthProvider>


          <Routes>

            <Route path='/' element={<LandingPage />} />    {/* Landing page route (public) */}

            <Route path='/auth' element={<Authentication />} />    {/* Authentication page route (login/register) */}

            <Route path='/home's element={<HomeComponent />} />     {/* Home page route (protected) */}

            <Route path='/history' element={<History />} />    {/* Meeting history page route (protected) */}

            <Route path='/:url' element={<VideoMeetComponent />} />    {/* Dynamic meeting room route */}

          </Routes>

        </AuthProvider>

      </Router>

    </div>
  );
}

export default App;