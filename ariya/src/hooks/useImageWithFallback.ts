import { useState, useEffect } from 'react';
import { resolveImageUrl, detectImageProvider } from '../utils/imageFetcher';

interface UseImageWithFallbackResult {
  imageUrl: string;
  isLoading: boolean;
  error: string | null;
  provider: 'walrus' | 'cloudinary' | 'imgbb' | 'unknown';
}

export const useImageWithFallback = (imageUrl: string): UseImageWithFallbackResult => {
  const [resolvedUrl, setResolvedUrl] = useState(imageUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'walrus' | 'cloudinary' | 'imgbb' | 'unknown'>('unknown');

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setError('No image URL provided');
      return;
    }

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const detectedProvider = detectImageProvider(imageUrl);
        setProvider(detectedProvider);
        
        const resolved = await resolveImageUrl(imageUrl);
        setResolvedUrl(resolved);
        
        // Test if the resolved URL actually loads
        const img = new Image();
        img.onload = () => {
          setIsLoading(false);
        };
        img.onerror = () => {
          setIsLoading(false);
          setError('Failed to load image from all sources');
        };
        img.src = resolved;
        
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Failed to resolve image URL');
      }
    };

    loadImage();
  }, [imageUrl]);

  return {
    imageUrl: resolvedUrl,
    isLoading,
    error,
    provider,
  };
};
