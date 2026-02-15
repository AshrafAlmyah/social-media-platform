import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home } from "lucide-react";
import MessagesList from "../components/MessagesList";
import ChatThread from "../components/ChatThread";
import { messagesApi, ConversationWithMessages } from "../api/messages";

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get("userId");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    userIdFromUrl || null
  );
  const [otherUser, setOtherUser] = useState<
    ConversationWithMessages["otherUser"] | null
  >(null);

  const handleSelectConversation = async (userId: string) => {
    setSelectedUserId(userId);
    // Update URL without causing navigation
    setSearchParams({ userId });
    try {
      const data = await messagesApi.getMessages(userId);
      setOtherUser(data.otherUser);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  // Handle userId from URL query param - load conversation data on mount and when URL changes
  useEffect(() => {
    if (userIdFromUrl) {
      // Always load conversation data, even if selectedUserId is already set
      // This ensures otherUser is loaded when navigating from Profile page
      handleSelectConversation(userIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdFromUrl]);

  return (
    <div className="fixed inset-0 md:left-64 top-0 right-0 bottom-0 p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden h-full flex"
        style={{ backgroundColor: "var(--card-bg)" }}
      >
        {/* Chat Thread */}
        <div className="flex-1 hidden md:flex flex-col">
          <ChatThread userId={selectedUserId} otherUser={otherUser} />
        </div>

        {/* Conversations List */}
        <div className="w-full md:w-64 border-l border-border-color flex flex-col">
          <div
            className="p-4 border-b border-border-color flex items-center justify-between gap-3"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Messages
            </h1>
            <Link
              to="/"
              className="md:hidden inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-tertiary)",
              }}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>
          <div className="flex-1 overflow-hidden">
            <MessagesList
              onSelectConversation={handleSelectConversation}
              selectedUserId={selectedUserId}
            />
          </div>
        </div>

        {/* Mobile: Show chat thread in full screen when selected and data loaded */}
        <AnimatePresence>
          {selectedUserId && otherUser && (
            <motion.div
              key={selectedUserId}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="md:hidden fixed inset-0 z-50 flex flex-col"
              style={{
                backgroundColor: "var(--bg-primary)",
                height: "100dvh",
                minHeight: "100vh",
              }}
            >
              <ChatThread
                userId={selectedUserId}
                otherUser={otherUser}
                onBack={() => {
                  setSelectedUserId(null);
                  setSearchParams({});
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
