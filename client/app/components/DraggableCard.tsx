'use client';

import { ReactNode, useRef, useState, useEffect, memo, CSSProperties } from 'react';

interface CardPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableCardProps {
  id: string;
  children: ReactNode;
  onPositionChange?: (position: CardPosition) => void;
}

const STORAGE_KEY = 'dashboard-card-layout';

function loadLayout(): Record<string, CardPosition> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveLayout(layout: Record<string, CardPosition>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // ignore
  }
}

export const DraggableCard = memo(function DraggableCard({
  id,
  children,
  onPositionChange,
}: DraggableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CardPosition>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Load from localStorage on mount
  useEffect(() => {
    const layout = loadLayout();
    if (layout[id]) {
      setPosition(layout[id]);
    }
  }, [id]);

  // Initialize size from DOM
  useEffect(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (position.width === 100) { // only on first load
      setPosition((prev) => ({
        ...prev,
        width: Math.max(250, rect.width),
        height: Math.max(200, rect.height),
      }));
    }
  }, []);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;

    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);
    dragOffsetRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition((prev) => {
        let newPos = { ...prev };

        if (isDragging) {
          newPos.x = e.clientX - dragOffsetRef.current.x;
          newPos.y = e.clientY - dragOffsetRef.current.y;
        } else if (isResizing) {
          const deltaX = e.clientX - dragOffsetRef.current.x;
          const deltaY = e.clientY - dragOffsetRef.current.y;
          newPos.width = Math.max(250, prev.width + deltaX);
          newPos.height = Math.max(200, prev.height + deltaY);
          dragOffsetRef.current = { x: e.clientX, y: e.clientY };
        }

        onPositionChange?.(newPos);
        return newPos;
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);

      setPosition((final) => {
        const layout = loadLayout();
        layout[id] = final;
        saveLayout(layout);
        return final;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, id, onPositionChange]);

  const style: CSSProperties = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    zIndex: isDragging || isResizing ? 40 : 10,
  };

  return (
    <div
      ref={cardRef}
      className="rounded-lg border border-white/6 bg-surface-2 flex flex-col overflow-hidden shadow-lg transition-shadow"
      style={style}
    >
      {/* Drag Handle Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-white/3 cursor-move hover:bg-white/5 transition flex-shrink-0"
        onMouseDown={handleDragStart}
      >
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
        <div className="flex-1 text-xs font-medium text-app-text-subtle">Card</div>
      </div>

      {/* Content Area */}
      <div data-no-drag className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize bg-gradient-to-tl from-app-accent/60 to-transparent opacity-0 hover:opacity-100 transition"
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      />
    </div>
  );
});
