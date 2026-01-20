import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';

export default function MentionInput({ 
  value, 
  onChange, 
  onKeyPress, 
  placeholder, 
  disabled, 
  className,
  members = [],
  onMentionsChange 
}) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);

  const filteredMembers = members.filter(member =>
    member.full_name?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  useEffect(() => {
    // Check if user is typing @ symbol
    const lastAtIndex = value.lastIndexOf('@', cursorPosition);
    if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1, cursorPosition);
      if (!textAfterAt.includes(' ') && textAfterAt.length < 20) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [value, cursorPosition]);

  const handleMentionSelect = (member) => {
    const lastAtIndex = value.lastIndexOf('@', cursorPosition);
    const beforeMention = value.substring(0, lastAtIndex);
    const afterCursor = value.substring(cursorPosition);
    const newValue = `${beforeMention}@${member.full_name} ${afterCursor}`;
    
    onChange(newValue);
    setShowMentions(false);
    
    // Extract all mentions
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(newValue)) !== null) {
      const mentionedMember = members.find(m => m.full_name === match[1]);
      if (mentionedMember) {
        mentions.push(mentionedMember.id);
      }
    }
    onMentionsChange?.(mentions);
    
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPosition(e.target.selectionStart || 0);
        }}
        onKeyPress={onKeyPress}
        onKeyUp={(e) => setCursorPosition(e.target.selectionStart || 0)}
        onClick={(e) => setCursorPosition(e.target.selectionStart || 0)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      
      <AnimatePresence>
        {showMentions && filteredMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto z-[1000]"
          >
            {filteredMembers.slice(0, 5).map((member) => (
              <button
                key={member.id}
                onClick={() => handleMentionSelect(member)}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  {member.full_name?.charAt(0) || 'U'}
                </div>
                <span className="text-white text-sm">{member.full_name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}