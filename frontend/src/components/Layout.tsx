import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Compass,
  User,
  LogOut,
  Sparkles,
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  CheckCheck,
  Bookmark,
  Moon,
  Sun,
  Menu,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../store/authStore";
import { notificationsApi, Notification } from "../api/notifications";
import { messagesApi } from "../api/messages";
import { useTheme } from "../hooks/useTheme";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMessagesRoute = location.pathname === "/messages";
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/explore", icon: Compass, label: "Explore" },
    {
      to: "/messages",
      icon: MessageCircle,
      label: "Messages",
      badge: unreadMessageCount,
    },
    { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
    { to: `/${user?.username}`, icon: User, label: "Profile" },
  ];

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { count } = await notificationsApi.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch unread message count on mount and periodically
  useEffect(() => {
    const fetchUnreadMessageCount = async () => {
      try {
        const count = await messagesApi.getUnreadCount();
        setUnreadMessageCount(count);
      } catch (error) {
        console.error("Failed to fetch unread message count:", error);
      }
    };

    fetchUnreadMessageCount();
    const interval = setInterval(fetchUnreadMessageCount, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when panel opens
  useEffect(() => {
    if (showNotifications) {
      const fetchNotifications = async () => {
        setIsLoading(true);
        try {
          const { notifications: data } = await notificationsApi.getAll(1, 20);
          setNotifications(data);
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [showNotifications]);

  // Close notifications panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "follow":
        return <UserPlus className="w-4 h-4 text-accent-400" />;
      case "post_like":
      case "comment_like":
        return <Heart className="w-4 h-4 text-coral-400 fill-current" />;
      case "post_comment":
      case "comment_reply":
        return <MessageCircle className="w-4 h-4 text-mint-400" />;
      case "message":
        return <MessageCircle className="w-4 h-4 text-accent-400" />;
      default:
        return <Bell className="w-4 h-4 text-dark-400" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actor = notification.actor.displayName || notification.actor.username;
    switch (notification.type) {
      case "follow":
        return (
          <>
            <strong>{actor}</strong> started following you
          </>
        );
      case "post_like":
        return (
          <>
            <strong>{actor}</strong> liked your post
          </>
        );
      case "post_comment":
        return (
          <>
            <strong>{actor}</strong> commented on your post
          </>
        );
      case "comment_like":
        return (
          <>
            <strong>{actor}</strong> liked your comment
          </>
        );
      case "comment_reply":
        return (
          <>
            <strong>{actor}</strong> replied to your comment
          </>
        );
      case "message":
        return (
          <>
            <strong>{actor}</strong> sent you a message
          </>
        );
      default:
        return (
          <>
            <strong>{actor}</strong> interacted with you
          </>
        );
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === "follow") {
      return `/${notification.actor.username}`;
    }
    if (notification.type === "message") {
      return `/messages`;
    }
    if (notification.post) {
      return `/post/${notification.post.id}`;
    }
    return "#";
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            style={{ backgroundColor: "var(--overlay-medium)" }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`fixed left-0 top-0 h-screen w-64 glass border-r border-white/5 p-6 flex flex-col z-50 transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-coral-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">Nexus</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? "bg-gradient-to-r from-accent-500/30 to-coral-500/30 text-white shadow-lg shadow-accent-500/20"
                    : "text-dark-400 hover:text-white hover:bg-white/8"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-r from-accent-500/30 to-coral-500/30 rounded-xl -z-10"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <div className="relative">
                    <Icon className="w-5 h-5 relative z-10" />
                    {badge !== undefined && badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-coral-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white z-20"
                      >
                        {badge > 9 ? "9+" : badge}
                      </motion.span>
                    )}
                  </div>
                  <span className="font-semibold relative z-10">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Notifications Button */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 w-full relative ${
                showNotifications
                  ? "bg-gradient-to-r from-accent-500/30 to-coral-500/30 text-white shadow-lg shadow-accent-500/20"
                  : "text-dark-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <div className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-coral-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </div>
              <span className="font-medium">Notifications</span>
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-full top-0 ml-2 w-80 glass-card rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 transition-all duration-200 interactive-btn hover:scale-105"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <Bell className="w-10 h-10 text-dark-500 mx-auto mb-2" />
                        <p className="text-dark-400 text-sm">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          to={getNotificationLink(notification)}
                          onClick={() => {
                            if (!notification.isRead)
                              handleMarkAsRead(notification.id);
                            setShowNotifications(false);
                          }}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-white/8 transition-all duration-200 interactive-link hover-scale ${
                            !notification.isRead ? "bg-accent-500/5" : ""
                          }`}
                        >
                          {/* Actor Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-mint-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden avatar-hover">
                            {notification.actor.avatar ? (
                              <img
                                src={notification.actor.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              notification.actor.displayName?.[0] ||
                              notification.actor.username[0]
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <p
                                  className="text-sm text-white/90 leading-snug"
                                  style={{ color: "var(--text-opacity-90)" }}
                                >
                                  {getNotificationText(notification)}
                                </p>
                                {notification.post &&
                                  notification.type !== "follow" && (
                                    <p className="text-xs text-dark-400 mt-1 truncate">
                                      "{notification.post.content.slice(0, 50)}
                                      {notification.post.content.length > 50
                                        ? "..."
                                        : ""}
                                      "
                                    </p>
                                  )}
                                <p className="text-xs text-dark-500 mt-1">
                                  {formatDistanceToNow(
                                    new Date(notification.createdAt),
                                    { addSuffix: true }
                                  )}
                                </p>
                              </div>
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                            </div>
                          </div>

                          {/* Unread indicator */}
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0 mt-2" />
                          )}
                        </Link>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="border-t border-white/5 p-2">
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="block text-center text-sm text-accent-400 hover:text-accent-300 py-2 rounded-lg hover:bg-white/8 transition-all duration-200 interactive-link"
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-dark-400 hover:text-white hover:bg-white/8 interactive-btn"
          >
            <motion.div
              animate={{
                rotate: theme === "dark" ? [0, 180, 360] : [360, 180, 0],
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
              }}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.div>
            <span className="font-medium">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </motion.button>
        </nav>

        {/* User section */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-mint-500 flex items-center justify-center text-white font-bold overflow-hidden avatar-hover">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.displayName?.[0] || user?.username?.[0] || "U"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">
                {user?.displayName || user?.username}
              </p>
              <p className="text-sm text-dark-400 truncate">
                @{user?.username}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-dark-400 hover:text-coral-500 transition-all duration-200 w-full px-4 py-2 rounded-lg interactive-btn hover:bg-white/5"
          >
            <LogOut className="w-5 h-5 icon-rotate" />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen md:ml-64">
        {/* Mobile top bar */}
        {!isMessagesRoute && (
          <div
            className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border-color"
            style={{ backgroundColor: "var(--bg-primary)" }}
          >
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/8 transition-all duration-200 interactive-btn"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-coral-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">Nexus</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/8 transition-all duration-200 interactive-btn"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        )}

        <div className="max-w-2xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
