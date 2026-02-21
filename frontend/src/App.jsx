import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Test from "./pages/Test.jsx";
import Result from "./pages/Result.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import ProfileAI from "./pages/ProfileAI.jsx";
import Duel from "./pages/Duel.jsx";
import AIBattle from "./pages/AIBattle.jsx";
import Login from "./pages/Login.jsx";
import Navbar from "./components/Navbar.jsx";
import Search from "./pages/Search.jsx";

import UserDashboard from "./pages/UserDashboard.jsx";
import CompanyDashboard from "./pages/CompanyDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Methodology from "./pages/Methodology.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import ProfileSelection from "./pages/ProfileSelection.jsx";
import OAuthCallback from "./pages/OAuthCallback.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import ResultReview from "./pages/ResultReview.jsx";
import TalentPool from "./pages/Recruiter/TalentPool.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import MessagingPage from "./pages/MessagingPage.jsx";

import CompanyReputation from "./pages/Company/CompanyReputation.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/ranking/me" element={<ProfilePage />} /> {/* Shortcut for ranking tab */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/search" element={<Search />} />
          <Route path="/test" element={<Test />} />
          <Route path="/result" element={<Result />} />
          <Route path="/review/:sessionId" element={<ResultReview />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/talent" element={<TalentPool />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/details" element={<UserDashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/messages" element={<MessagingPage />} />
          <Route path="/companies" element={<CompanyDashboard />} /> {/* Placeholder/Alias for Company Dashboard */}
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/company/reputation" element={<CompanyReputation />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/profile-selection" element={<ProfileSelection />} />
          <Route path="/ai" element={<ProfileAI />} />
          <Route path="/duel" element={<Duel />} />
          <Route path="/ai-battle" element={<AIBattle />} />
          <Route path="/login" element={<Login />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
