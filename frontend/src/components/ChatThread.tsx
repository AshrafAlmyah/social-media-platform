import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import {
  messagesApi,
  Message,
  ConversationWithMessages,
} from "../api/messages";
import { postsApi } from "../api/posts";
import { Post } from "../types";
import { useAuthStore } from "../store/authStore";
import MessageInput from "./MessageInput";
import ImageModal from "./ImageModal";
import MessageMenu from "./MessageMenu";
import ShareModal from "./ShareModal";
import { Loader2, Pause, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = "http://192.168.1.6.6:3001";

interface ChatThreadProps {
  userId: string | null;
  otherUser: ConversationWithMessages["otherUser"] | null;
  onBack?: () => void;
}

export default function ChatThread({
  userId,
  otherUser,
  onBack,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharedPosts, setSharedPosts] = useState<{ [key: string]: Post }>({});
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioDurations, setAudioDurations] = useState<{
    [key: string]: number;
  }>({});
  const [audioCurrentTime, setAudioCurrentTime] = useState<{
    [key: string]: number;
  }>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<
    { x: number; y: number } | undefined
  >();
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (userId) {
      loadMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (preserveOptimistic = false) => {
    if (!userId) return;

    try {
      const data = await messagesApi.getMessages(userId);

      // If preserving optimistic updates, merge with existing messages
      if (preserveOptimistic) {
        setMessages((prev) => {
          // Create a map of existing messages by ID
          const existingMap = new Map(prev.map((msg) => [msg.id, msg]));
          // Merge: keep optimistic messages that aren't in the response yet
          const merged = [...data.messages];
          prev.forEach((msg) => {
            if (
              !existingMap.has(msg.id) &&
              !data.messages.find((m) => m.id === msg.id)
            ) {
              // This is an optimistic message that hasn't been confirmed yet
              merged.push(msg);
            }
          });
          // Sort by createdAt
          return merged.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      } else {
        setMessages(data.messages);
      }

      // Load shared posts
      const postMessages = data.messages.filter(
        (msg) => msg.type === "post" && msg.postId
      );
      if (postMessages.length > 0) {
        const postsMap: { [key: string]: Post } = {};
        await Promise.all(
          postMessages.map(async (msg) => {
            if (msg.postId && !sharedPosts[msg.postId]) {
              try {
                const post = await postsApi.getOne(msg.postId);
                postsMap[msg.postId] = post;
              } catch (err) {
                console.error(`Failed to load post ${msg.postId}:`, err);
              }
            }
          })
        );
        setSharedPosts((prev) => ({ ...prev, ...postsMap }));
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current && isAtBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatAudioTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content || "");
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      const updated = await messagesApi.updateMessage(
        messageId,
        editContent.trim()
      );
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? updated : msg))
      );
      setEditingMessageId(null);
      setEditContent("");
      toast.success("Message updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update message");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const deleted = await messagesApi.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? deleted : msg))
      );
      toast.success("Message deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied");
  };

  const handleForwardMessage = (message: Message) => {
    setForwardingMessage(message);
  };

  const handleForward = async (receiverId: string) => {
    if (!forwardingMessage) return;

    try {
      await messagesApi.sendMessage(
        receiverId,
        forwardingMessage.content || "",
        forwardingMessage.type || "text",
        forwardingMessage.postId || undefined,
        forwardingMessage.fileUrl || undefined,
        forwardingMessage.fileType || undefined,
        forwardingMessage.fileSize || undefined
      );
      toast.success("Message forwarded");
      setForwardingMessage(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to forward message");
    }
  };

  const handleMenuClick = (e: React.MouseEvent, messageId: string) => {
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const bubbleRect = target.getBoundingClientRect();
    const containerRect = messagesContainerRef.current?.getBoundingClientRect();

    // Approximate menu size for positioning & clamping
    const MENU_WIDTH = 200;
    const MENU_HEIGHT = 220;

    // Base position: to the left side of the message bubble,
    // vertically centered relative to the bubble
    let x = bubbleRect.left - MENU_WIDTH - 12;
    let y = bubbleRect.top + bubbleRect.height / 2 - MENU_HEIGHT / 2;

    // Clamp inside the scrollable messages container so it never
    // goes outside the chat area
    if (containerRect) {
      const minX = containerRect.left + 8;
      const maxX = containerRect.right - MENU_WIDTH - 8;
      const minY = containerRect.top + 8;
      const maxY = containerRect.bottom - MENU_HEIGHT - 8;

      x = Math.min(Math.max(x, minX), maxX);
      y = Math.min(Math.max(y, minY), maxY);
    }

    setMenuPosition({ x, y });
    setMenuOpen(messageId);
  };

  const getPressHandlers = (messageId: string) => {
    let pressTimer: number | null = null;
    let startX = 0;
    let startY = 0;
    let moved = false;

    const startPress = (clientX: number, clientY: number) => {
      startX = clientX;
      startY = clientY;
      moved = false;
      pressTimer = window.setTimeout(() => {
        if (!moved) {
          const target = messagesContainerRef.current;
          if (!target) return;
          // Use center of viewport as fallback
          const rect = target.getBoundingClientRect();
          const fakeEvent = {
            stopPropagation: () => {},
            currentTarget: {
              getBoundingClientRect: () => ({
                left: rect.left + rect.width / 2,
                top: rect.top + rect.height / 2,
                height: 0,
                width: 0,
                right: rect.right,
                bottom: rect.bottom,
              }),
            },
          } as unknown as React.MouseEvent;
          handleMenuClick(fakeEvent, messageId);
        }
      }, 450);
    };

    const movePress = (clientX: number, clientY: number) => {
      const dx = Math.abs(clientX - startX);
      const dy = Math.abs(clientY - startY);
      if (dx > 8 || dy > 8) {
        moved = true;
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      }
    };

    const endPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    return {
      onTouchStart: (e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (touch) startPress(touch.clientX, touch.clientY);
      },
      onTouchMove: (e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (touch) movePress(touch.clientX, touch.clientY);
      },
      onTouchEnd: endPress,
      onTouchCancel: endPress,
      onMouseDown: (e: React.MouseEvent) => startPress(e.clientX, e.clientY),
      onMouseMove: (e: React.MouseEvent) => movePress(e.clientX, e.clientY),
      onMouseUp: endPress,
      onMouseLeave: endPress,
    };
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(isNearBottom);
    }
  };

  const handleSend = async (
    content: string,
    type: "text" | "image" | "video" | "audio" = "text",
    fileUrl?: string,
    fileType?: string,
    fileSize?: number
  ) => {
    if (!userId || (!content.trim() && !fileUrl)) return;

    setSending(true);
    try {
      const newMessage = await messagesApi.sendMessage(
        userId,
        content,
        type,
        undefined,
        fileUrl,
        fileType,
        fileSize
      );

      // Ensure the message has all required fields
      const completeMessage: Message = {
        ...newMessage,
        type: newMessage.type || type,
        fileUrl: newMessage.fileUrl || fileUrl || null,
        fileType: newMessage.fileType || fileType || null,
        fileSize: newMessage.fileSize || fileSize || null,
      };

      // Validate that audio messages have fileUrl
      if (completeMessage.type === "audio" && !completeMessage.fileUrl) {
        console.error("Audio message missing fileUrl:", completeMessage);
        toast.error("Audio message is missing file URL");
      }

      setMessages((prev) => {
        // Check if message already exists (from polling)
        const existingIndex = prev.findIndex(
          (m) => m.id === completeMessage.id
        );
        if (existingIndex >= 0) {
          // Update existing message with complete data, preserving fileUrl if it exists
          const existing = prev[existingIndex];
          const updated: Message = {
            ...completeMessage,
            // Preserve fileUrl if server response doesn't have it but we do
            fileUrl:
              completeMessage.fileUrl || existing.fileUrl || fileUrl || null,
            fileType:
              completeMessage.fileType || existing.fileType || fileType || null,
            fileSize:
              completeMessage.fileSize || existing.fileSize || fileSize || null,
          };
          const newMessages = [...prev];
          newMessages[existingIndex] = updated;
          return newMessages;
        }
        return [...prev, completeMessage];
      });

      setIsAtBottom(true);

      // Reload messages after a short delay to get the complete message from server
      // But preserve our optimistic update
      setTimeout(() => {
        loadMessages(true);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to send message:", err);
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getInitials = (user: {
    displayName?: string | null;
    username: string;
  }) => {
    const name = user.displayName || user.username;
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!userId || !otherUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-6xl mb-4">💬</div>
        <p
          className="text-lg font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Select a conversation to start messaging
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2
          className="w-6 h-6 animate-spin"
          style={{ color: "var(--accent)" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p style={{ color: "var(--text-secondary)" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 p-4 border-b border-border-color"
        style={{
          backgroundColor: "var(--card-bg)",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden mr-1 p-2 rounded-full text-dark-400 hover:text-white hover:bg-white/10 transition-all duration-200 interactive-btn"
            aria-label="Back to conversations"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <Link
          to={`/${otherUser.username}`}
          className="flex items-center gap-3 group interactive-link"
        >
          {otherUser.avatar ? (
            <img
              src={otherUser.avatar}
              alt={otherUser.displayName || otherUser.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent) 0%, var(--coral-text) 100%)",
                color: "white",
              }}
            >
              {getInitials(otherUser)}
            </div>
          )}
          <div>
            <p
              className="font-semibold group-hover:text-accent-400 transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              {otherUser.displayName || otherUser.username}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              @{otherUser.username}
            </p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <AnimatePresence>
          {messages.map((message, index) => {
            const isOwn = message.senderId === user?.id;
            const showAvatar =
              index === 0 || messages[index - 1].senderId !== message.senderId;
            const showTime =
              index === messages.length - 1 ||
              new Date(message.createdAt).getTime() -
                new Date(messages[index + 1].createdAt).getTime() >
                300000; // 5 minutes

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: isOwn ? 20 : -20 }}
                transition={{ delay: index * 0.02 }}
                className={`flex gap-2 ${
                  isOwn ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {!isOwn && showAvatar && (
                  <div className="flex-shrink-0">
                    {message.sender.avatar ? (
                      <img
                        src={message.sender.avatar}
                        alt={
                          message.sender.displayName || message.sender.username
                        }
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--accent) 0%, var(--coral-text) 100%)",
                          color: "white",
                        }}
                      >
                        {getInitials(message.sender)}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${
                    isOwn ? "items-end" : "items-start"
                  }`}
                  {...(isOwn && !message.deleted ? getPressHandlers(message.id) : {})}
                >
                  {message.type === "post" &&
                  message.postId &&
                  sharedPosts[message.postId] ? (
                    <Link
                      to={`/post/${message.postId}`}
                      className="block w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/post/${message.postId}`);
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
                          isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                        }`}
                        style={{
                          backgroundColor: isOwn
                            ? "var(--accent)"
                            : "var(--card-bg)",
                          border: `1px solid ${
                            isOwn
                              ? "rgba(255,255,255,0.2)"
                              : "var(--border-color)"
                          }`,
                        }}
                      >
                        {/* Post Author */}
                        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                          {sharedPosts[message.postId].author?.avatar ? (
                            <img
                              src={sharedPosts[message.postId].author.avatar}
                              alt={
                                sharedPosts[message.postId].author
                                  .displayName ||
                                sharedPosts[message.postId].author.username
                              }
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                              style={{
                                background:
                                  "linear-gradient(135deg, var(--accent) 0%, var(--coral-text) 100%)",
                                color: "white",
                              }}
                            >
                              {
                                (sharedPosts[message.postId].author
                                  ?.displayName ||
                                  sharedPosts[message.postId].author
                                    ?.username ||
                                  "U")[0]
                              }
                            </div>
                          )}
                          <span
                            className="text-xs font-semibold"
                            style={{
                              color: isOwn
                                ? "rgba(255,255,255,0.9)"
                                : "var(--text-primary)",
                            }}
                          >
                            {sharedPosts[message.postId].author?.displayName ||
                              sharedPosts[message.postId].author?.username}
                          </span>
                        </div>

                        {/* Post Content */}
                        {sharedPosts[message.postId].content && (
                          <p
                            className="text-sm px-4 pb-2 line-clamp-3"
                            style={{
                              color: isOwn
                                ? "rgba(255,255,255,0.95)"
                                : "var(--text-primary)",
                            }}
                          >
                            {sharedPosts[message.postId].content}
                          </p>
                        )}

                        {/* Post Image */}
                        {sharedPosts[message.postId].image && (
                          <div className="relative w-full h-48 overflow-hidden">
                            <motion.img
                              src={sharedPosts[message.postId].image}
                              alt=""
                              className="w-full h-full object-cover"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}

                        {/* Share indicator */}
                        <div
                          className="px-4 py-2 border-t"
                          style={{
                            borderColor: isOwn
                              ? "rgba(255,255,255,0.1)"
                              : "var(--border-color)",
                          }}
                        >
                          <p
                            className="text-xs"
                            style={{
                              color: isOwn
                                ? "rgba(255,255,255,0.7)"
                                : "var(--text-secondary)",
                            }}
                          >
                            {message.content || "Shared a post"}
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  ) : message.type === "image" && message.fileUrl ? (
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
                        isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                      }`}
                      style={{
                        backgroundColor: isOwn
                          ? "var(--accent)"
                          : "var(--card-bg)",
                        border: `1px solid ${
                          isOwn
                            ? "rgba(255,255,255,0.2)"
                            : "var(--border-color)"
                        }`,
                      }}
                      onClick={() => {
                        const imageUrl = message.fileUrl?.startsWith("http")
                          ? message.fileUrl
                          : `${API_URL}${message.fileUrl}`;
                        setImageModalUrl(imageUrl);
                      }}
                    >
                      <img
                        src={
                          message.fileUrl?.startsWith("http")
                            ? message.fileUrl
                            : `${API_URL}${message.fileUrl}`
                        }
                        alt={message.content || "Image"}
                        className="max-w-full max-h-64 object-cover"
                      />
                      {message.content && (
                        <div
                          className="px-4 py-2 border-t"
                          style={{
                            borderColor: isOwn
                              ? "rgba(255,255,255,0.1)"
                              : "var(--border-color)",
                          }}
                        >
                          <p
                            className="text-sm"
                            style={{
                              color: isOwn
                                ? "rgba(255,255,255,0.95)"
                                : "var(--text-primary)",
                            }}
                          >
                            {message.content}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : message.type === "video" && message.fileUrl ? (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                        isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                      }`}
                      style={{
                        backgroundColor: isOwn
                          ? "var(--accent)"
                          : "var(--card-bg)",
                        border: `1px solid ${
                          isOwn
                            ? "rgba(255,255,255,0.2)"
                            : "var(--border-color)"
                        }`,
                      }}
                    >
                      <video
                        src={
                          message.fileUrl?.startsWith("http")
                            ? message.fileUrl
                            : `${API_URL}${message.fileUrl}`
                        }
                        controls
                        className="max-w-full max-h-64"
                        style={{ backgroundColor: "var(--bg-primary)" }}
                      />
                      {message.content && (
                        <div
                          className="px-4 py-2 border-t"
                          style={{
                            borderColor: isOwn
                              ? "rgba(255,255,255,0.1)"
                              : "var(--border-color)",
                          }}
                        >
                          <p
                            className="text-sm"
                            style={{
                              color: isOwn
                                ? "rgba(255,255,255,0.95)"
                                : "var(--text-primary)",
                            }}
                          >
                            {message.content}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : message.type === "audio" &&
                    message.fileUrl &&
                    message.fileUrl.trim() !== "" ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.01 }}
                      className={`rounded-2xl transition-all duration-300 ${
                        isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                      }`}
                      style={{
                        backgroundColor: isOwn
                          ? "var(--accent)"
                          : "var(--card-bg)",
                        border: `1px solid ${
                          isOwn
                            ? "rgba(255,255,255,0.15)"
                            : "var(--border-color)"
                        }`,
                        minWidth: "200px",
                        maxWidth: "280px",
                      }}
                    >
                      <div className="px-4 py-3 flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const audioId = message.id;
                            const audio = audioRefs.current[audioId];
                            if (!audio) {
                              console.error(
                                "Audio element not found for message:",
                                audioId
                              );
                              toast.error("Audio not loaded");
                              return;
                            }
                            if (playingAudio === audioId) {
                              audio.pause();
                              setPlayingAudio(null);
                            } else {
                              // Stop all other audio
                              Object.values(audioRefs.current).forEach((a) => {
                                if (a && a !== audio) {
                                  a.pause();
                                }
                              });
                              try {
                                // Load the audio if needed
                                if (audio.readyState < 2) {
                                  audio.load();
                                }
                                await audio.play();
                                setPlayingAudio(audioId);
                              } catch (error: any) {
                                console.error("Failed to play audio:", error);
                                toast.error(
                                  error.message || "Failed to play audio"
                                );
                              }
                            }
                          }}
                          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-lg"
                          style={{
                            backgroundColor: isOwn
                              ? "rgba(255,255,255,0.25)"
                              : "var(--accent)",
                            color: "white",
                          }}
                        >
                          {playingAudio === message.id ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <svg
                              className="w-6 h-6 ml-0.5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              style={{
                                filter:
                                  "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                              }}
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </motion.button>

                        {/* Audio Waveform & Info */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          {/* Waveform Bars */}
                          <div className="flex items-end gap-1 h-8">
                            {Array.from({ length: 20 }).map((_, i) => {
                              const isActive = playingAudio === message.id;
                              const baseHeight = 4;
                              const maxHeight = 20;
                              const height = isActive
                                ? baseHeight +
                                  Math.random() * (maxHeight - baseHeight)
                                : baseHeight +
                                  (Math.sin(i * 0.5) * 0.5 + 0.5) *
                                    (maxHeight - baseHeight) *
                                    0.3;
                              return (
                                <motion.div
                                  key={i}
                                  className="rounded-full"
                                  style={{
                                    width: "3px",
                                    height: `${height}px`,
                                    backgroundColor: isOwn
                                      ? playingAudio === message.id
                                        ? "rgba(255,255,255,0.9)"
                                        : "rgba(255,255,255,0.6)"
                                      : playingAudio === message.id
                                      ? "var(--accent)"
                                      : "var(--text-secondary)",
                                    transition: "background-color 0.2s",
                                  }}
                                  animate={
                                    isActive && playingAudio === message.id
                                      ? {
                                          height: [
                                            `${height}px`,
                                            `${
                                              baseHeight +
                                              Math.random() *
                                                (maxHeight - baseHeight)
                                            }px`,
                                            `${height}px`,
                                          ],
                                        }
                                      : {}
                                  }
                                  transition={{
                                    duration: 0.3,
                                    repeat: isActive ? Infinity : 0,
                                    ease: "easeInOut",
                                  }}
                                />
                              );
                            })}
                          </div>

                          {/* Duration & Info */}
                          <div className="flex items-center justify-between">
                            <span
                              className="text-xs font-medium tabular-nums"
                              style={{
                                color: isOwn
                                  ? "rgba(255,255,255,0.85)"
                                  : "var(--text-secondary)",
                              }}
                            >
                              {audioCurrentTime[message.id] !== undefined
                                ? formatAudioTime(audioCurrentTime[message.id])
                                : audioDurations[message.id]
                                ? formatAudioTime(audioDurations[message.id])
                                : "--:--"}
                            </span>
                            {audioDurations[message.id] && (
                              <span
                                className="text-xs"
                                style={{
                                  color: isOwn
                                    ? "rgba(255,255,255,0.6)"
                                    : "var(--text-tertiary)",
                                }}
                              >
                                / {formatAudioTime(audioDurations[message.id])}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hidden Audio Element */}
                        {message.fileUrl && message.fileUrl.trim() !== "" && (
                          <audio
                            ref={(el) => {
                              if (el && message.fileUrl) {
                                audioRefs.current[message.id] = el;
                                el.onerror = (e) => {
                                  console.error(
                                    "Audio playback error:",
                                    e,
                                    "URL:",
                                    message.fileUrl
                                  );
                                  const errorMsg =
                                    el.error?.message || "Failed to load audio";
                                  toast.error(errorMsg);
                                };
                                const audioUrl = message.fileUrl.startsWith(
                                  "http"
                                )
                                  ? message.fileUrl
                                  : `${API_URL}${message.fileUrl}`;
                                if (el.src !== audioUrl && audioUrl) {
                                  el.src = audioUrl;
                                }
                                // Get duration when loaded
                                el.onloadedmetadata = () => {
                                  if (el.duration && isFinite(el.duration)) {
                                    setAudioDurations((prev) => ({
                                      ...prev,
                                      [message.id]: el.duration,
                                    }));
                                  }
                                };
                                // Update current time
                                el.ontimeupdate = () => {
                                  if (isFinite(el.currentTime)) {
                                    setAudioCurrentTime((prev) => ({
                                      ...prev,
                                      [message.id]: el.currentTime,
                                    }));
                                  }
                                };
                              } else {
                                delete audioRefs.current[message.id];
                              }
                            }}
                            src={
                              message.fileUrl?.startsWith("http")
                                ? message.fileUrl
                                : `${API_URL}${message.fileUrl}`
                            }
                            preload="metadata"
                            onEnded={() => {
                              setPlayingAudio(null);
                              setAudioCurrentTime((prev) => ({
                                ...prev,
                                [message.id]: 0,
                              }));
                            }}
                            onPause={() => {
                              if (playingAudio === message.id) {
                                setPlayingAudio(null);
                              }
                            }}
                            onPlay={() => setPlayingAudio(message.id)}
                            onLoadedData={() => {
                              console.log(
                                "Audio loaded for message:",
                                message.id,
                                "URL:",
                                message.fileUrl
                              );
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  ) : editingMessageId === message.id ? (
                    <div className="flex items-start gap-2 w-full">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit(message.id);
                          }
                          if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                        className="flex-1 px-4 py-2 rounded-xl resize-none"
                        style={{
                          backgroundColor: isOwn
                            ? "rgba(255,255,255,0.2)"
                            : "var(--bg-tertiary)",
                          color: isOwn ? "white" : "var(--text-primary)",
                          border: "1px solid var(--border-color)",
                        }}
                        rows={2}
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleSaveEdit(message.id)}
                          className="px-3 py-1 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: "var(--accent)",
                            color: "white",
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`px-4 py-2 rounded-2xl transition-all duration-200 ${
                          isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                        }`}
                        style={{
                          backgroundColor: isOwn
                            ? "var(--accent)"
                            : "var(--card-bg)",
                          color: isOwn ? "white" : "var(--text-primary)",
                        }}
                      >
                        {message.deleted ? (
                          <p className="text-sm italic opacity-70">
                            This message was deleted
                          </p>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words select-none">
                            {message.content?.replace(/🎤\s*/g, "").trim() ||
                              message.content}
                          </p>
                        )}
                        {message.edited && !message.deleted && (
                          <p
                            className="text-xs mt-1 opacity-70"
                            style={{
                              color: isOwn
                                ? "rgba(255,255,255,0.7)"
                                : "var(--text-secondary)",
                            }}
                          >
                            Edited
                          </p>
                        )}
                      </motion.div>
                    </div>
                  )}
                  {showTime && (
                    <span
                      className="text-xs px-2"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {format(new Date(message.createdAt), "h:mm a")}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={sending} />

      {/* Image Modal */}
      {imageModalUrl && (
        <ImageModal
          imageUrl={imageModalUrl}
          isOpen={!!imageModalUrl}
          onClose={() => setImageModalUrl(null)}
        />
      )}

      {/* Message Menu */}
      {menuOpen && messages.find((m) => m.id === menuOpen) && (
        <MessageMenu
          message={messages.find((m) => m.id === menuOpen)!}
          isOpen={!!menuOpen}
          onClose={() => setMenuOpen(null)}
          onEdit={() =>
            handleEditMessage(messages.find((m) => m.id === menuOpen)!)
          }
          onDelete={() => handleDeleteMessage(menuOpen)}
          onCopy={() =>
            handleCopyMessage(
              messages.find((m) => m.id === menuOpen)?.content || ""
            )
          }
          onForward={() =>
            handleForwardMessage(messages.find((m) => m.id === menuOpen)!)
          }
          position={menuPosition}
        />
      )}

      {/* Forward Modal */}
      {forwardingMessage && (
        <ShareModal
          isOpen={!!forwardingMessage}
          onClose={() => setForwardingMessage(null)}
          postId={forwardingMessage.id}
          onShare={handleForward}
        />
      )}
    </div>
  );
}
