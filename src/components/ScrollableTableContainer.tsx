
import React, { useRef, useState, useEffect } from 'react';

interface ScrollableTableContainerProps {
  children: React.ReactNode;
  onScrollStateChange: (canScrollLeft: boolean, canScrollRight: boolean) => void;
}

export function ScrollableTableContainer({ children, onScrollStateChange }: ScrollableTableContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });

  // Check scroll position and update arrow visibility
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const canScrollLeft = container.scrollLeft > 0;
      const canScrollRight = container.scrollLeft < container.scrollWidth - container.clientWidth;
      onScrollStateChange(canScrollLeft, canScrollRight);
    }
  };

  // Handle drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (container) {
      setIsDragging(true);
      setDragStart({
        x: e.pageX - container.offsetLeft,
        scrollLeft: container.scrollLeft
      });
      container.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    e.preventDefault();
    const container = scrollContainerRef.current;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragStart.x) * 2;
    container.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollTo({
        left: container.scrollLeft - scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollTo({
        left: container.scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Set up scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener('scroll', checkScrollPosition);
      
      // Set initial cursor
      container.style.cursor = 'grab';
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, []);

  return (
    <div 
      ref={scrollContainerRef}
      className="overflow-x-auto scrollbar-hide select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {React.cloneElement(children as React.ReactElement, {
        scrollLeft,
        scrollRight
      })}
    </div>
  );
}
