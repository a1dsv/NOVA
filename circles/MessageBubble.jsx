import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Edit2, Trash2, Pin, Save } from 'lucide-react';
import { format } from 'date-fns';

const emojiOptions = ['❤️', '👍', '😂', '🔥', '💪', '👏'];

export default function MessageBubble({
  message,
  isOwn,
  currentUserId,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onSave,
  replyToMessage,
  allMembers = [],
  isLatestMessage = false,
  onClickSender
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReadReceipts, setShowReadReceipts] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [startX, setStartX] = useState(0);
  const clickTimerRef = useRef(null);
  const reactionTimerRef = useRef(null);
  const menuTimerRef = useRef(null);

  // Auto-dismiss reaction picker after 3 seconds
  useEffect(() => {
    if (showReactions) {
      reactionTimerRef.current = setTimeout(() => {
        setShowReactions(false);
      }, 3000);
    }
    return () => {
      if (reactionTimerRef.current) {
        clearTimeout(reactionTimerRef.current);
      }
    };
  }, [showReactions]);

  // Auto-dismiss menu after 3 seconds
  useEffect(() => {
    if (showMenu) {
      menuTimerRef.current = setTimeout(() => {
        setShowMenu(false);
      }, 3000);
    }
    return () => {
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
      }
    };
  }, [showMenu]);

  // Highlight @mentions in message content
  const highlightMentions = (text) => {
    if (!text || typeof text !== 'string') return text;

    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add highlighted mention
      const mentionName = match[1];
      const isMentioningMe = allMembers.some((m) =>
      m.full_name === mentionName && m.id === currentUserId
      );

      parts.push(
        <span
          key={match.index}
          className={`font-semibold ${
          isMentioningMe ?
          'text-violet-300 bg-violet-500/20 px-1 rounded' :
          'text-cyan-300'}`
          }>

          @{mentionName}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const readByCount = message.read_by?.length || 0;
  const readByOthers = (message.read_by || []).filter((id) => id !== message.sender_id).length;

  // Swipe gesture for reply
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff > 0 && diff < 100) {
      setSwipeX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeX > 50) {
      onReply(message);
    }
    setSwipeX(0);
  };

  // Single click for menu
  const handleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      // Double click - show reactions
      setShowReactions(!showReactions);
    } else {
      // Wait to see if it's a double click
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        // Single click - show menu (for text and burn messages)
        setShowMenu(!showMenu);
      }, 250);
    }
  };

  const reactions = message.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`pt-3 flex group ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <button
            onClick={() => onClickSender?.(message.sender_id)}
            className="text-white/40 hover:text-white/60 text-xs mb-1 ml-3 transition-colors"
          >
            {message.sender_name}
          </button>
        )}

        {/* Reply Preview - Enhanced Threading */}
        {message.reply_to && replyToMessage && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="mx-3 mb-2 p-2.5 bg-white/[0.03] backdrop-blur-md rounded-lg border-l-4 border-white/10 relative overflow-hidden"
            style={{ borderLeftColor: 'var(--nova-accent)' }}
          >
            {/* Subtle glow effect */}
            <div 
              className="absolute inset-0 opacity-10" 
              style={{ backgroundColor: 'var(--nova-accent)' }}
            />
            <div className="relative z-10">
              <p className="text-white/60 text-xs font-medium mb-0.5">{replyToMessage.sender_name}</p>
              <p className="text-white/80 text-xs line-clamp-2">{replyToMessage.content}</p>
            </div>
          </motion.div>
        )}

        <div className="relative">
          <motion.div
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ 
              transform: `translateX(${swipeX}px)`, 
              transition: swipeX === 0 ? 'transform 0.2s' : 'none',
              ...(message.type === 'burn' && !isOwn ? { borderLeft: '4px solid var(--nova-accent)' } : {})
            }}
            className={`rounded-2xl cursor-pointer backdrop-blur-md border-t border-t-white/20 ${
            message.type === 'burn' ?
            message.saved ?
            'bg-white/[0.03] text-white border-2 border-white/20 shadow-lg' :
            isOwn ?
            'bg-white/[0.03] text-white rounded-br-sm border border-white/10' :
            'bg-white/[0.03] text-white rounded-bl-sm border border-white/10' :
            isOwn ?
            'bg-white/10 text-white rounded-br-sm border border-white/10' :
            'bg-white/5 text-white rounded-bl-sm border border-white/5'} ${
            message.type === 'image' ? 'p-1' : 'px-4 py-3'}`}>

            {message.type === 'image' ?
            <img
              src={message.content}
              alt="Shared"
              className="max-w-full rounded-xl max-h-64 object-cover"
              onClick={() => window.open(message.content, '_blank')} /> :


            <p className="text-sm leading-relaxed">{highlightMentions(message.content)}</p>
            }
          </motion.div>

          {/* Swipe Reply Indicator */}
          {swipeX > 20 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12">
              <Reply className="w-5 h-5 text-cyan-400" />
            </motion.div>
          )}

          {/* Context Menu - Single Click */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`absolute ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} ${isLatestMessage ? 'bottom-0' : 'top-0'} bg-black/40 backdrop-blur-2xl border border-white/10 rounded-lg shadow-xl z-[100] min-w-[120px]`}
                onClick={(e) => e.stopPropagation()}>
                {!isOwn ? (
                  <>
                    <button
                      onClick={() => {
                        onReply(message);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-violet-400 text-sm hover:bg-violet-500/10 flex items-center gap-2">
                      <Reply className="w-4 h-4" />
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        onPin?.(message);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-amber-400 text-sm hover:bg-amber-500/10 flex items-center gap-2">
                      <Pin className="w-4 h-4" />
                      {message.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    {message.type === 'burn' && (
                      <button
                        onClick={() => {
                          onSave?.(message);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-cyan-400 text-sm hover:bg-cyan-500/10 flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {message.saved ? 'Unsave' : 'Save'}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {(message.type === 'text' || message.type === 'burn') && (
                      <button
                        onClick={() => {
                          onEdit(message);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-white text-sm hover:bg-white/10 flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onPin?.(message);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-amber-400 text-sm hover:bg-amber-500/10 flex items-center gap-2">
                      <Pin className="w-4 h-4" />
                      {message.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    {message.type === 'burn' && (
                      <button
                        onClick={() => {
                          onSave?.(message);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-cyan-400 text-sm hover:bg-cyan-500/10 flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {message.saved ? 'Unsave' : 'Save'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDelete(message);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 text-sm hover:bg-red-500/10 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reaction Picker */}
          {showReactions &&
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-full px-2 py-1 flex gap-1 shadow-xl z-10`}
            style={{ boxShadow: '0 0 15px var(--nova-accent-glow)' }}>

              {emojiOptions.map((emoji) =>
            <motion.button
              key={emoji}
              onClick={() => {
                onReact(message.id, emoji);
                setShowReactions(false);
              }}
              whileTap={{ scale: 1.3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-8 h-8 hover:scale-125 transition-transform rounded-lg backdrop-blur-md hover:bg-white/10">

                  {emoji}
                </motion.button>
            )}
            </motion.div>
          }

          {/* Reactions Display */}
          {hasReactions &&
          <div className="flex gap-1 mt-1 flex-wrap">
              {Object.entries(reactions).map(([emoji, userIds]) => {
              const userReacted = userIds.includes(currentUserId);
              return (
                <motion.button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  animate={userReacted ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1 backdrop-blur-md border hover:scale-105 transition-transform bg-white/[0.05] border-white/10"
                  style={userReacted ? { 
                    backgroundColor: `rgba(var(--nova-accent-rgb), 0.15)`,
                    boxShadow: '0 0 10px var(--nova-accent-glow)',
                    borderColor: 'var(--nova-accent)'
                  } : {}}>

                    <span>{emoji}</span>
                    <span className="text-white/60">{userIds.length}</span>
                  </motion.button>);

            })}
            </div>
          }
        </div>

        <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end mr-3' : 'ml-3'}`}>
          <p className="text-white/20 text-xs">
            {format(new Date(message.created_date), 'h:mm a')}
          </p>
          {message.edited && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-white/40 text-xs italic"
            >
              (edited)
            </motion.span>
          )}
          {isOwn && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setShowReadReceipts(!showReadReceipts);
              }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-0.5"
            >
              {readByOthers > 0 ? (
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-0.5"
                >
                  <motion.span 
                    className="text-xs"
                    style={{ color: 'var(--nova-accent)' }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✓✓
                  </motion.span>
                  <motion.span 
                    className="text-xs font-medium"
                    style={{ color: 'var(--nova-accent)' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {readByOthers}
                  </motion.span>
                </motion.div>
              ) : (
                <span className="text-white/30 text-xs">✓</span>
              )}
            </motion.button>
          )}
        </div>

        {/* Read Receipts Popup - Enhanced */}
        <AnimatePresence>
          {showReadReceipts && isOwn &&
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-full right-0 mb-2 bg-black/60 backdrop-blur-2xl border border-white/20 rounded-xl p-3 min-w-[160px] z-50 shadow-2xl"
            style={{ boxShadow: '0 0 30px var(--nova-accent-glow)' }}
          >

              <p className="text-white/70 text-xs mb-2.5 font-semibold flex items-center gap-1.5">
                <span style={{ color: 'var(--nova-accent)' }}>✓✓</span>
                Read by {readByOthers}:
              </p>
              <div className="space-y-1.5">
                {allMembers
                  .filter((m) => message.read_by?.includes(m.id) && m.id !== message.sender_id)
                  .map((member, index) => (
                    <motion.div 
                      key={member.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2.5 hover:bg-white/5 rounded-lg p-1 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/20">
                        {member.profile_picture ? (
                          <img 
                            src={member.profile_picture} 
                            alt={member.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-[9px] font-bold"
                            style={{ 
                              background: `linear-gradient(135deg, var(--nova-accent), rgba(var(--nova-accent-rgb), 0.6))`
                            }}
                          >
                            {member.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <span className="text-white text-xs font-medium">{member.full_name}</span>
                    </motion.div>
                  ))
                }
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </motion.div>
  );
}