import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import { useAuthStore } from './stores/useAuthStore';
import { HomeSkeleton } from './components/Skeleton';

// 路由级懒加载
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const BoardList = lazy(() => import('./pages/Forum/BoardList'));
const BoardDetail = lazy(() => import('./pages/Forum/BoardDetail'));
const PostDetail = lazy(() => import('./pages/Forum/PostDetail'));
const CreatePost = lazy(() => import('./pages/Forum/CreatePost'));
const AnnouncementList = lazy(() => import('./pages/Announcement/AnnouncementList'));
const AnnouncementDetail = lazy(() => import('./pages/Announcement/AnnouncementDetail'));
const LostFoundList = lazy(() => import('./pages/LostFound/LostFoundList'));
const LostFoundDetail = lazy(() => import('./pages/LostFound/LostFoundDetail'));
const MarketList = lazy(() => import('./pages/Marketplace/MarketList'));
const MarketDetail = lazy(() => import('./pages/Marketplace/MarketDetail'));
const ResourceList = lazy(() => import('./pages/Resource/ResourceList'));
const QuestionList = lazy(() => import('./pages/QA/QuestionList'));
const QuestionDetail = lazy(() => import('./pages/QA/QuestionDetail'));
const AIChat = lazy(() => import('./pages/QA/AIChat'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const SearchResults = lazy(() => import('./pages/Search/SearchResults'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const NotificationList = lazy(() => import('./pages/Notifications/NotificationList'));
const ConversationList = lazy(() => import('./pages/Messages/ConversationList'));
const ChatView = lazy(() => import('./pages/Messages/ChatView'));

// 加载占位符
function PageLoading() {
  return <HomeSkeleton />;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
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
          <Route path="/lost-found/:id" element={<LostFoundDetail />} />
          <Route path="/marketplace" element={<MarketList />} />
          <Route path="/marketplace/:id" element={<MarketDetail />} />
          <Route path="/resources" element={<ResourceList />} />
          <Route path="/qa" element={<QuestionList />} />
          <Route path="/qa/ai" element={<AIChat />} />
          <Route path="/qa/:id" element={<QuestionDetail />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/notifications" element={<AuthGuard><NotificationList /></AuthGuard>} />
          <Route path="/messages" element={<AuthGuard><ConversationList /></AuthGuard>} />
          <Route path="/messages/:id" element={<AuthGuard><ChatView /></AuthGuard>} />
          <Route path="/admin/*" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
