import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";

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
  isActive = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200",
          "hover:bg-card-secondary hover:text-foreground focus:outline-none",
          "border border-transparent hover:border-border",
          isActive
            ? "text-primary bg-primary/10 border-primary/20"
            : "text-foreground-secondary",
          className
        )}
      >
        <span className="font-medium">{label}</span>
        <div className="relative">
          {isOpen ? (
            <ChevronUp
              size={14}
              className="transition-all duration-200 transform rotate-180"
            />
          ) : (
            <ChevronDown
              size={14}
              className="transition-all duration-200 transform rotate-0"
            />
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      <div
        className={cn(
          "absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl",
          "bg-card/95 border border-border backdrop-blur-xl",
          "transition-all duration-300 transform origin-top",
          "before:absolute before:top-0 before:left-4 before:w-2 before:h-2",
          "before:bg-card before:border-l before:border-t before:border-border",
          "before:transform before:rotate-45 before:-translate-y-1",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        )}
        style={{
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <p className="text-xs text-foreground-muted mt-1">
            {items.length} option{items.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          {items.map((item, index) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm transition-all duration-200",
                "hover:bg-card-secondary hover:text-foreground group",
                "text-foreground-secondary relative overflow-hidden",
                "border-l-2 border-transparent hover:border-l-primary",
                "transform hover:translate-x-1"
              )}
              onClick={() => setIsOpen(false)}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Hover Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              {/* Icon */}
              {item.icon && (
                <span className="mr-3 relative z-10 group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </span>
              )}

              {/* Text */}
              <span className="flex-1 relative z-10 font-medium">
                {item.name}
              </span>

              {/* Exclusive Badge */}
              {item.exclusive && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold uppercase tracking-wide relative z-10 shadow-sm">
                  Exclusive
                </span>
              )}

              {/* Arrow Indicator */}
              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative z-10">
                <ChevronDown size={12} className="transform rotate-[-90deg]" />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border/50 bg-card-secondary/30">
          <p className="text-xs text-foreground-muted text-center">
            Click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default DropdownMenu;
