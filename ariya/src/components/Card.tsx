import React from 'react';
import { cn } from '../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card = ({ children, className, hover = false }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-6 backdrop-blur-sm',
        hover && 'hover:bg-card-secondary hover:scale-105 cursor-pointer transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card; 