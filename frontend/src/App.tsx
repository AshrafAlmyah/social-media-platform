import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Bookmarks from './pages/Bookmarks';
import Messages from './pages/Messages';

function App() {
  const { isLoading, isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Background orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Feed />} />
          <Route path="explore" element={<Explore />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="messages" element={<Messages />} />
          <Route path="post/:postId" element={<PostDetail />} />
          <Route path=":username" element={<Profile />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;





