import React from 'react';
import { useImageWithFallback } from '../hooks/useImageWithFallback';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = '',
  
  onLoad,
  onError,
}) => {
  const { imageUrl, isLoading, error, provider } = useImageWithFallback(src);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 ${className}`}>
        <div className="w-full h-full bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className}`}>
        <span className="text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={onError}
      title={`Loaded from ${provider}`}
    />
  );
};

// Simple wrapper for profile pictures
export const ProfileImage: React.FC<{
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <SmartImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
    />
  );
};
