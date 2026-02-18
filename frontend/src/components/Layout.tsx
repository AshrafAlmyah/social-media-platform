import { useState, useEffect, useRef, type ReactNode } from "react";
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
  Search,
  Plus,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../store/authStore";
import { notificationsApi, Notification } from "../api/notifications";
import { messagesApi } from "../api/messages";
import { useTheme } from "../hooks/useTheme";

function MainContainer({ children }: { children: ReactNode }) {
  return (
    <main className="max-w-[960px] mx-auto px-4 sm:px-6 py-10 md:py-12 pb-28 md:pb-12">
      {children}
    </main>
  );
}

function FloatingActionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed right-5 bottom-24 md:bottom-8 z-40 w-14 h-14 rounded-full btn-primary shadow-lg flex items-center justify-center interactive-btn"
      aria-label="Create post"
      title="Create post"
    >
      <Plus className="w-6 h-6 text-white" />
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateAction = () => {
    if (location.pathname !== "/") {
      navigate("/");
    }
    setTimeout(() => {
      const createInput = document.querySelector(
        "textarea[placeholder=\"What's on your mind?\"]"
      ) as HTMLTextAreaElement | null;
      if (createInput) {
        createInput.scrollIntoView({ behavior: "smooth", block: "center" });
        createInput.focus();
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 180);
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
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
    const interval = setInterval(fetchUnreadMessageCount, 10000);
    return () => clearInterval(interval);
  }, []);

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
    if (notification.type === "follow") return `/${notification.actor.username}`;
    if (notification.type === "message") return `/messages`;
    if (notification.post) return `/post/${notification.post.id}`;
    return "#";
  };

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-40 border-b border-border-color"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-accent-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold gradient-text">Nexus</span>
          </Link>

          <div className="hidden sm:flex flex-1 max-w-md mx-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-9 pr-3 py-2 rounded-lg"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsChatDrawerOpen(true)}
              className="relative p-2 rounded-lg interactive-btn"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Open chat panel"
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-coral-500 rounded-full text-[10px] font-semibold flex items-center justify-center text-white">
                  {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                </span>
              )}
            </button>

            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg interactive-btn"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-coral-500 rounded-full text-[10px] font-semibold flex items-center justify-center text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border-color">
                      <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 text-xs interactive-btn"
                          style={{ color: "var(--accent-text)" }}
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            No notifications yet
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            to={getNotificationLink(notification)}
                            onClick={() => {
                              if (!notification.isRead) handleMarkAsRead(notification.id);
                              setShowNotifications(false);
                            }}
                            className={`flex items-start gap-3 px-4 py-3 transition-all duration-200 ${
                              !notification.isRead ? "bg-accent-500/5" : ""
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
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
                            <div className="flex-1 min-w-0">
                              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                                {getNotificationText(notification)}
                              </p>
                              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                          </Link>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to={`/${user?.username}`}
              className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span style={{ color: "var(--text-primary)" }}>
                  {user?.displayName?.[0] || user?.username?.[0] || "U"}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-border-color">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-3 overflow-x-auto">
          <div className="flex items-center justify-center gap-3 min-w-max mx-auto">
            {navItems.map(({ to, icon: Icon, label, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-accent-500 text-white"
                      : "bg-white/5 text-dark-400 hover:bg-accent-500/10"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-coral-500 text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      <MainContainer>
        <div className="w-full">
          <Outlet />
        </div>
      </MainContainer>

      <FloatingActionButton onClick={handleCreateAction} />

      <AnimatePresence>
        {isChatDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: "var(--overlay-medium)" }}
              onClick={() => setIsChatDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed right-0 top-0 h-screen w-full sm:w-[360px] z-[60] border-l border-border-color"
              style={{ backgroundColor: "var(--card-bg)" }}
            >
              <div className="h-full flex flex-col">
                <div className="h-16 px-4 border-b border-border-color flex items-center justify-between">
                  <h3 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
                    Panel
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsChatDrawerOpen(false)}
                    className="p-2 rounded-lg interactive-btn"
                    style={{ color: "var(--text-secondary)" }}
                    aria-label="Close panel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <Link
                    to="/messages"
                    onClick={() => setIsChatDrawerOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 transition-all"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Open Messages
                    </span>
                    {unreadMessageCount > 0 && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-coral-500 text-white">
                        {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                      </span>
                    )}
                  </Link>

                  {navItems.map(({ to, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setIsChatDrawerOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 transition-all"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-auto p-4 border-t border-border-color space-y-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 transition-all"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {theme === "dark" ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    )}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 transition-all"
                    style={{ color: "var(--coral-text)" }}
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border-color px-2 py-2"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="max-w-[960px] mx-auto grid grid-cols-5 gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 rounded-lg text-xs ${
                isActive ? "bg-accent-500 text-white" : "text-dark-400"
              }`
            }
          >
            <Home className="w-4 h-4 mb-1" />
            Home
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 rounded-lg text-xs ${
                isActive ? "bg-accent-500 text-white" : "text-dark-400"
              }`
            }
          >
            <Search className="w-4 h-4 mb-1" />
            Search
          </NavLink>
          <button
            type="button"
            onClick={handleCreateAction}
            className="flex flex-col items-center justify-center py-2 rounded-lg text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            <Plus className="w-4 h-4 mb-1" />
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsChatDrawerOpen(true)}
            className="relative flex flex-col items-center justify-center py-2 rounded-lg text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            <MessageCircle className="w-4 h-4 mb-1" />
            Chat
            {unreadMessageCount > 0 && (
              <span className="absolute top-1 right-5 w-4 h-4 text-[10px] rounded-full bg-coral-500 text-white flex items-center justify-center">
                {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
              </span>
            )}
          </button>
          <NavLink
            to={`/${user?.username}`}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 rounded-lg text-xs ${
                isActive ? "bg-accent-500 text-white" : "text-dark-400"
              }`
            }
          >
            <User className="w-4 h-4 mb-1" />
            Profile
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
