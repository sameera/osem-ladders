
import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    // Handle bold text (**text** or __text__)
    let rendered = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    rendered = rendered.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Handle italic text (*text* or _text_)
    rendered = rendered.replace(/\*(.*?)\*/g, '<em>$1</em>');
    rendered = rendered.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Handle line breaks
    rendered = rendered.replace(/\n/g, '<br />');
    
    return rendered;
  };

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
