import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';

interface DropdownItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  exclusive?: boolean;
}

interface DropdownMenuProps {
  label: string;
  items: DropdownItem[];
  className?: string;
  isActive?: boolean;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  label,
  items,
  className,
  isActive = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center space-x-1 transition-colors duration-200',
          'hover:text-foreground focus:outline-none',
          isActive ? 'text-primary' : 'text-foreground-secondary',
          className
        )}
      >
        <span>{label}</span>
        {isOpen ? (
          <ChevronUp size={16} className="transition-transform duration-200" />
        ) : (
          <ChevronDown size={16} className="transition-transform duration-200" />
        )}
      </button>

      {/* Dropdown Menu */}
      <div
        className={cn(
          'absolute top-full left-0 mt-2 w-48 rounded-lg shadow-lg',
          'bg-card border border-border backdrop-blur-xl',
          'transition-all duration-200 transform origin-top',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        )}
      >
        <div className="py-2">
          {items.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-4 py-2 text-sm transition-colors duration-200',
                'hover:bg-card-secondary hover:text-foreground',
                'text-foreground-secondary'
              )}
              onClick={() => setIsOpen(false)}
            >
              {item.icon && <span className="mr-3">{item.icon}</span>}
              <span className="flex-1">{item.name}</span>
              {item.exclusive && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gradient-to-r from-primary to-secondary text-white font-bold uppercase">
                  Exclusive
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DropdownMenu; 