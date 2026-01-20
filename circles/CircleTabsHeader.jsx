import React from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import QuestFeed from './QuestFeed';
import PinnedMessageBanner from './PinnedMessageBanner';

export default function CircleTabsHeader({
  circle,
  currentUserId,
  circleId,
  activeTab,
  onTabChange,
  onFeedModalChange,
  dynamicTop,
  pinnedMessages,
  onUnpinMessage,
  onJumpToMessage
}) {
  return (
    <div className="absolute left-0 right-0 bg-white/[0.02] backdrop-blur-2xl border-b border-white/10 z-[40]" style={{ top: `${dynamicTop}px`, ...(activeTab === 'feed' ? { bottom: '72px' } : {}) }}>
      {/* Tab Switcher */}
      <div className="pt-3 pb-2 px-4 flex-shrink-0">
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-xl p-1 flex gap-1 relative">
          <button
            onClick={() => onTabChange('feed')}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'feed' 
                ? 'text-white' 
                : 'text-white/40 hover:text-white/60'
            }`}
            style={activeTab === 'feed' ? { 
              color: 'var(--nova-accent)',
              boxShadow: '0 0 15px var(--nova-accent-glow)',
              borderBottom: '2px solid var(--nova-accent)'
            } : {}}>
            <TrendingUp className="w-4 h-4" />
            Feed
          </button>
          <button
            onClick={() => onTabChange('burn')}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'burn' 
                ? 'text-white' 
                : 'text-white/40 hover:text-white/60'
            }`}
            style={activeTab === 'burn' ? { 
              color: 'var(--nova-accent)',
              boxShadow: '0 0 15px var(--nova-accent-glow)',
              borderBottom: '2px solid var(--nova-accent)'
            } : {}}>
            <Flame className="w-4 h-4" />
            Trash Talk
          </button>
        </div>
      </div>

      {/* Pinned Message Banner (only for burn tab) */}
      {activeTab === 'burn' && pinnedMessages && pinnedMessages.length > 0 && (
        <PinnedMessageBanner
          pinnedMessages={pinnedMessages}
          onUnpin={onUnpinMessage}
          onJumpTo={onJumpToMessage}
        />
      )}

      {/* Content */}
      {activeTab === 'feed' &&
        <div className="border-t border-white/5 absolute inset-0 top-[60px] overflow-hidden">
          <QuestFeed circleId={circleId} currentUserId={currentUserId} circle={circle} onModalChange={onFeedModalChange} />
        </div>
      }
    </div>
  );
}