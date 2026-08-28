import React from 'react';

interface BadgeProps {
  variant?: 'neutral' | 'accent' | 'dark' | 'alert' | 'cyan' | 'emerald' | 'indigo' | 'amber' | 'rose' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = ''
}) => {
  // Map legacy color variants to editorial tags
  let tagClass = 'tag-neutral';
  if (variant === 'accent' || variant === 'emerald' || variant === 'cyan') {
    tagClass = 'tag-accent';
  } else if (variant === 'dark' || variant === 'indigo' || variant === 'purple') {
    tagClass = 'tag-dark';
  } else if (variant === 'alert' || variant === 'rose' || variant === 'amber') {
    tagClass = 'tag-alert';
  }

  return (
    <span className={`tag ${tagClass} ${className}`}>
      {children}
    </span>
  );
};
