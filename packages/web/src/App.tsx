import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import BoardList from './pages/Forum/BoardList';
import BoardDetail from './pages/Forum/BoardDetail';
import PostDetail from './pages/Forum/PostDetail';
import CreatePost from './pages/Forum/CreatePost';
import AnnouncementList from './pages/Announcement/AnnouncementList';
import AnnouncementDetail from './pages/Announcement/AnnouncementDetail';
import LostFoundList from './pages/LostFound/LostFoundList';
import MarketList from './pages/Marketplace/MarketList';
import ResourceList from './pages/Resource/ResourceList';
import QuestionList from './pages/QA/QuestionList';
import QuestionDetail from './pages/QA/QuestionDetail';
import ProfilePage from './pages/Profile/ProfilePage';
import SearchResults from './pages/Search/SearchResults';
import AdminDashboard from './pages/Admin/Dashboard';
import NotificationList from './pages/Notifications/NotificationList';
import { useAuthStore } from './stores/useAuthStore';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forum" element={<BoardList />} />
        <Route path="/forum/board/:id" element={<BoardDetail />} />
        <Route path="/forum/post/:id" element={<PostDetail />} />
        <Route path="/forum/create" element={<AuthGuard><CreatePost /></AuthGuard>} />
        <Route path="/forum/edit/:id" element={<AuthGuard><CreatePost /></AuthGuard>} />
        <Route path="/announcements" element={<AnnouncementList />} />
        <Route path="/announcements/:id" element={<AnnouncementDetail />} />
        <Route path="/lost-found" element={<LostFoundList />} />
        <Route path="/marketplace" element={<MarketList />} />
        <Route path="/resources" element={<ResourceList />} />
        <Route path="/qa" element={<QuestionList />} />
        <Route path="/qa/:id" element={<QuestionDetail />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/notifications" element={<AuthGuard><NotificationList /></AuthGuard>} />
        <Route path="/admin/*" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
      </Route>
    </Routes>
  );
}
