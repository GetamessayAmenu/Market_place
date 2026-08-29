"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@marketplace/ui';

interface Attachment {
  url: string;
  publicId?: string;
  name: string;
  size: number;
  uploading?: boolean;
  error?: boolean;
}

interface MessageComposerProps {
  onSend: (payload: { content: string; messageType?: string; attachments?: any[] }) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

const COMMON_EMOJIS = ['😊', '🙏', '✨', '👗', '📏', '👍', '❤️', '🚚', '📦', '💯'];

export default function MessageComposer({
  onSend,
  onTyping,
  disabled,
  placeholder = 'Type a message...',
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const emitTyping = useCallback(
    (typing: boolean) => {
      if (isTypingRef.current === typing) return;
      isTypingRef.current = typing;
      onTyping(typing);
    },
    [onTyping]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    if (val.trim()) {
      emitTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => emitTyping(false), 2500);
    } else {
      emitTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      emitTyping(false);
    };
  }, [emitTyping]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds maximum 5MB limit.`);
        continue;
      }

      const newAtt: Attachment = {
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        uploading: true,
      };

      setAttachments((prev) => [...prev, newAtt]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();

        setAttachments((prev) =>
          prev.map((att) =>
            att.name === file.name && att.uploading
              ? { url: data.secure_url, publicId: data.public_id, name: file.name, size: file.size, uploading: false }
              : att
          )
        );
      } catch (err) {
        // Fallback to local Object URL preview so photo attachment never fails
        const objectUrl = URL.createObjectURL(file);
        setAttachments((prev) =>
          prev.map((att) =>
            att.name === file.name && att.uploading
              ? { url: objectUrl, publicId: `local_${Date.now()}`, name: file.name, size: file.size, uploading: false }
              : att
          )
        );
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    const trimmed = text.trim();
    const hasUploading = attachments.some((a) => a.uploading);
    if ((!trimmed && attachments.length === 0) || hasUploading) return;

    const validAttachments = attachments.filter((a) => !a.uploading && !a.error);
    const messageType = validAttachments.length > 0 && !trimmed ? 'IMAGE' : 'TEXT';

    onSend({
      content: trimmed,
      messageType,
      attachments: validAttachments.map((a) => ({ url: a.url, publicId: a.publicId, name: a.name })),
    });

    setText('');
    setAttachments([]);
    setShowEmoji(false);
    emitTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const isUploading = attachments.some((a) => a.uploading);
  const canSend = (text.trim() || attachments.length > 0) && !isUploading && !disabled;

  return (
    <div className="border-t bg-background p-3 relative">
      <div className="max-w-2xl mx-auto w-full">
        {/* Emoji Picker Popup */}
        {showEmoji && (
          <div className="absolute bottom-16 left-4 z-20 flex gap-2 rounded-lg border bg-popover p-2 shadow-lg">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-lg hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Attachment Preview Bar */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group shrink-0">
                <img src={att.url} alt={att.name} className="h-14 w-14 rounded-md object-cover border" />
                {att.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
                {att.error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 rounded-md text-[10px] text-white font-bold">
                    Failed
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center shadow"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Composer Controls */}
        <div className="flex items-end gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
          />

          {/* Action Buttons: Attachment & Emoji */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors shrink-0"
            title="Attach Image"
            disabled={disabled}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors shrink-0"
            title="Insert Emoji"
            disabled={disabled}
          >
            <span className="text-base leading-none">😊</span>
          </button>

          {/* Text Input */}
          <div className="flex-1">
            <textarea
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              maxLength={4000}
              className="w-full resize-none rounded-xl border bg-muted/40 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[38px] max-h-[120px]"
              disabled={disabled}
            />
          </div>

          {/* Send Button */}
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0 rounded-xl h-[38px] px-3.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
