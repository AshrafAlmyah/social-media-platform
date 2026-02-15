import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Video, Mic, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadsApi } from '../api/uploads';
import { API_BASE_URL } from '../config/env';
import MediaPreviewModal from './MediaPreviewModal';
import toast from 'react-hot-toast';

interface MessageInputProps {
  onSend: (content: string, type?: 'text' | 'image' | 'video' | 'audio', fileUrl?: string, fileType?: string, fileSize?: number) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState<{ type: 'image' | 'video' | 'audio'; url: string; file: File } | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ type: 'image' | 'video'; url: string; file: File } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const validateFile = (file: File, type: 'image' | 'video'): boolean => {
    const maxSize = 15 * 1024 * 1024; // 15MB
    
    if (file.size > maxSize) {
      toast.error('File size must be less than 15MB');
      return false;
    }

    if (type === 'image') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are allowed');
        return false;
      }
    } else if (type === 'video') {
      const allowedTypes = ['video/mp4', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only MP4 and WebM videos are allowed');
        return false;
      }
    }

    return true;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file, mediaType)) {
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setMediaPreview({ type: mediaType, url: previewUrl, file });
    e.target.value = '';
  };

  const handleMediaSend = async (caption: string) => {
    if (!mediaPreview) return;

    setUploading(true);
    try {
      let uploadResult;
      if (mediaPreview.type === 'image') {
        uploadResult = await uploadsApi.uploadImage(mediaPreview.file);
      } else {
        uploadResult = await uploadsApi.uploadVideo(mediaPreview.file);
      }

      const fullUrl = `${API_BASE_URL}${uploadResult.url}`;
      onSend(
        caption.trim() || (mediaPreview.type === 'image' ? 'Photo' : 'Video'),
        mediaPreview.type,
        fullUrl,
        uploadResult.fileType,
        uploadResult.fileSize
      );
      
      URL.revokeObjectURL(mediaPreview.url);
      setMediaPreview(null);
      setContent('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const audioFile = new File([audioBlob], 'recording.webm', { type: mediaRecorder.mimeType });
        const previewUrl = URL.createObjectURL(audioBlob);
        setPreview({ type: 'audio', url: previewUrl, file: audioFile });
        stream.getTracks().forEach((track) => track.stop());
      };

      // Clear any existing interval first
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      recordingStartTimeRef.current = Date.now();

      recordingIntervalRef.current = setInterval(() => {
        if (recordingStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setRecordingTime(elapsed);
        }
      }, 100); // Update every 100ms for smooth display
    } catch (error) {
      toast.error('Failed to access microphone');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    recordingStartTimeRef.current = null;
    setRecording(false);
  };

  const handleCancelPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
    if (recording) {
      handleStopRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || uploading) return;

    // Audio messages are handled separately (no modal)
    if (preview && preview.type === 'audio') {
      setUploading(true);
      try {
        const uploadResult = await uploadsApi.uploadAudio(preview.file);
        const fullUrl = `${API_BASE_URL}${uploadResult.url}`;
        onSend(
          content.trim() || 'Voice message',
          'audio',
          fullUrl,
          uploadResult.fileType,
          uploadResult.fileSize
        );
        
        URL.revokeObjectURL(preview.url);
        setPreview(null);
        setContent('');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to upload file');
      } finally {
        setUploading(false);
      }
    } else if (content.trim() && !preview) {
      onSend(content.trim());
      setContent('');
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !preview) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = content.trim() || preview;

  return (
    <form onSubmit={handleSubmit} className="border-t border-border-color p-4">
      {/* Audio Preview Only (images/videos use modal) */}
      <AnimatePresence>
        {preview && preview.type === 'audio' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 relative rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Voice message</p>
                <audio src={preview.url} controls className="w-full mt-2" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelPreview}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview Modal */}
      {mediaPreview && (
        <MediaPreviewModal
          isOpen={!!mediaPreview}
          onClose={() => {
            if (mediaPreview) {
              URL.revokeObjectURL(mediaPreview.url);
              setMediaPreview(null);
            }
          }}
          onSend={handleMediaSend}
          mediaType={mediaPreview.type}
          mediaUrl={mediaPreview.url}
          mediaFile={mediaPreview.file}
          isUploading={uploading}
        />
      )}

      {/* Recording indicator */}
      {recording && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: 'var(--coral-bg-20)' }}
        >
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Recording... {formatTime(recordingTime)}
          </span>
          <button
            type="button"
            onClick={handleStopRecording}
            className="ml-auto px-3 py-1 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--coral-text)' }}
          >
            Stop
          </button>
        </motion.div>
      )}

      <div className="flex items-end gap-3">
        {/* Media buttons */}
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e, 'image')}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm"
            onChange={(e) => handleFileSelect(e, 'video')}
            className="hidden"
          />
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading || recording}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
            title="Upload image"
          >
            <ImageIcon className="w-5 h-5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={disabled || uploading || recording}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
            title="Upload video"
          >
            <Video className="w-5 h-5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={recording ? handleStopRecording : handleStartRecording}
            disabled={disabled || uploading || !!preview}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              recording ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: recording ? 'var(--coral-bg-20)' : 'var(--bg-tertiary)',
              color: recording ? 'var(--coral-text)' : 'var(--text-secondary)',
            }}
            title="Record voice"
          >
            <Mic className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={recording ? "Recording..." : "Type a message..."}
            disabled={disabled || uploading || recording}
            rows={1}
            className="w-full px-4 py-3 rounded-xl resize-none transition-all duration-200 focus-glow"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              minHeight: '48px',
              maxHeight: '120px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          />
        </div>
        <motion.button
          type="submit"
          disabled={!canSend || disabled || uploading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
          style={{
            backgroundColor: canSend ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: 'white',
          }}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </form>
  );
}
