import { cn } from '@marketplace/ui';
import React from 'react';

type ContainerSize = 'default' | 'narrow' | 'wide' | 'full';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max-width preset */
  size?: ContainerSize;
  /** Remove horizontal padding (for full-bleed sections) */
  noPadding?: boolean;
  as?: 'div' | 'section' | 'article';
}

const sizeClasses: Record<ContainerSize, string> = {
  default: 'max-w-7xl',        /* 1280px — primary content width */
  narrow: 'max-w-3xl',         /*  768px — forms, articles */
  wide: 'max-w-[1600px]',      /* 1600px — wide dashboards */
  full: 'max-w-none',          /*  fluid — full-bleed hero */
};

function Container({
  children,
  size = 'default',
  noPadding = false,
  as: Tag = 'div',
  className,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        !noPadding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default Container;
