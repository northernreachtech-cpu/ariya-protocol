import { getWalrusImageUrl, isWalrusUrl } from "../utils/walrus";

interface ProfilePictureProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallback?: string;
}

const ProfilePicture = ({
  src,
  alt = "Profile picture",
  size = "md",
  className = "",
  fallback = "👤",
}: ProfilePictureProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const getImageUrl = (url: string) => {
    // If it's already a Walrus URL, use it as is
    if (isWalrusUrl(url)) {
      return url;
    }

    // If it's a blob ID, convert to Walrus URL
    if (url && !url.startsWith("http")) {
      return getWalrusImageUrl(url);
    }

    // Otherwise, use the URL as provided
    return url;
  };

  if (!src) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-card-secondary border border-border flex items-center justify-center text-foreground-secondary ${className}`}
      >
        <span className="text-lg">{fallback}</span>
      </div>
    );
  }

  return (
    <img
      src={getImageUrl(src)}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover border border-border ${className}`}
      onError={(e) => {
        // Fallback to placeholder on error
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        target.nextElementSibling?.classList.remove("hidden");
      }}
    />
  );
};

export default ProfilePicture;
