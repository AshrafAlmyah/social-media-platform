import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, Copy, Forward } from "lucide-react";
import { Message } from "../api/messages";
import { useAuthStore } from "../store/authStore";

interface MessageMenuProps {
  message: Message;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onForward: () => void;
  position?: { x: number; y: number };
}

export default function MessageMenu({
  message,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCopy,
  onForward,
  position,
}: MessageMenuProps) {
  const { user } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwn = message.senderId === user?.id;
  const isDeleted = message.deleted;
  const isText = message.type === "text";

  // Check if message can be edited (within 10 minutes)
  const canEdit = isOwn && !isDeleted && isText;
  const messageAge =
    new Date().getTime() - new Date(message.createdAt).getTime();
  const tenMinutes = 10 * 60 * 1000;
  const withinEditWindow = messageAge <= tenMinutes;

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [];

  if (canEdit && withinEditWindow) {
    menuItems.push({
      icon: Edit2,
      label: "Edit",
      onClick: () => {
        onEdit();
        onClose();
      },
      danger: false,
    });
  }

  if (isOwn && !isDeleted) {
    menuItems.push({
      icon: Trash2,
      label: "Delete",
      onClick: () => {
        onDelete();
        onClose();
      },
      danger: true,
    });
  }

  if (isText && !isDeleted) {
    menuItems.push({
      icon: Copy,
      label: "Copy",
      onClick: () => {
        onCopy();
        onClose();
      },
      danger: false,
    });
  }

  if (!isDeleted) {
    menuItems.push({
      icon: Forward,
      label: "Forward",
      onClick: () => {
        onForward();
        onClose();
      },
      danger: false,
    });
  }

  if (menuItems.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.5,
            }}
            className="fixed z-50"
            style={{
              left: position?.x ? `${position.x}px` : "auto",
              top: position?.y ? `${position.y}px` : "auto",
            }}
          >
            <div
              className="glass-card rounded-xl shadow-2xl border min-w-[180px] overflow-hidden"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--border-color)",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
              }}
            >
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.04,
                      type: "spring",
                      damping: 20,
                      stiffness: 300,
                    }}
                    whileHover={{ x: 2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 text-left first:rounded-t-xl last:rounded-b-xl ${
                      item.danger
                        ? "hover:bg-red-500/10 active:bg-red-500/15"
                        : "hover:bg-hover-bg-strong active:bg-hover-bg"
                    }`}
                    style={{
                      color: item.danger
                        ? "var(--coral-text)"
                        : "var(--text-primary)",
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: item.danger ? -5 : 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                    </motion.div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
