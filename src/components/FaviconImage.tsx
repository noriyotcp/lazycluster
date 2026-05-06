import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

const DEFAULT_FALLBACK = <span className="size-4 inline-block" />;

type FaviconImageProps = {
  src?: string;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
};

const FaviconImage = ({
  src,
  alt = '',
  className = 'size-4 object-contain',
  fallback = DEFAULT_FALLBACK,
}: FaviconImageProps) => {
  const [error, setError] = useState(false);

  // Reset error state when src changes so a new URL gets a fresh load attempt.
  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) return <>{fallback}</>;

  return <img className={className} src={src} alt={alt} onError={() => setError(true)} />;
};

export default FaviconImage;
