import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils/cn';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className, 
  size = 'md' 
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'rounded-lg p-2 transition-all duration-200 hover:scale-105',
        'bg-card border border-border hover:border-border-secondary',
        'text-foreground-secondary hover:text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun size={iconSizes[size]} className="transition-transform duration-200" />
      ) : (
        <Moon size={iconSizes[size]} className="transition-transform duration-200" />
      )}
    </button>
  );
};

export default ThemeToggle; 