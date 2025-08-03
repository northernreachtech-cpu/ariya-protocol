import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Calendar,
  Users,
  Settings,
  FileText,
  Home,
} from "lucide-react";
import ConnectWalletButton from "./ConnectWalletButton";
import ThemeToggle from "./ThemeToggle";
import DropdownMenu from "./DropdownMenu";
import { cn } from "../utils/cn";
import { useTheme } from "../contexts/ThemeContext";
import logoWhite from "../assets/logo-white.png";
import logoBlack from "../assets/logo-black.png";

interface MenuItem {
  type: "link" | "dropdown";
  name?: string;
  href?: string;
  icon?: React.ReactElement;
  label?: string;
  items?: Array<{
    name: string;
    href: string;
    icon: React.ReactElement;
    exclusive?: boolean;
  }>;
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();

  // Menu structure with dropdowns
  const menuItems: MenuItem[] = [
    {
      type: "link",
      name: "Home",
      href: "/",
      icon: <Home size={16} />,
    },
    {
      type: "dropdown",
      label: "Events",
      items: [
        {
          name: "Browse Events",
          href: "/events",
          icon: <Calendar size={16} />,
        },
        { name: "My Events", href: "/my-events", icon: <Calendar size={16} /> },
        {
          name: "Create Event",
          href: "/event/create",
          icon: <Calendar size={16} />,
        },
      ],
    },
    {
      type: "dropdown",
      label: "Dashboard",
      items: [
        {
          name: "Organizer Dashboard",
          href: "/dashboard/organizer",
          icon: <Users size={16} />,
        },
        {
          name: "Sponsor Dashboard",
          href: "/dashboard/sponsor",
          icon: <Users size={16} />,
        },
      ],
    },
    {
      type: "dropdown",
      label: "Communities",
      items: [
        {
          name: "Browse Communities",
          href: "/communities",
          icon: <Users size={16} />,
        },
        {
          name: "Community Hub",
          href: "/community",
          icon: <Users size={16} />,
        },
      ],
    },
    {
      type: "dropdown",
      label: "Tools",
      items: [
        {
          name: "Document Flow",
          href: "/docflow",
          icon: <FileText size={16} />,
        },
        {
          name: "SUI Workshop",
          href: "/sui-workshop",
          icon: <Settings size={16} />,
          exclusive: true,
        },
        { name: "Organizers", href: "/organizers", icon: <Users size={16} /> },
        {
          name: "Create Profile",
          href: "/profile/organizer/create",
          icon: <Settings size={16} />,
        },
      ],
    },
  ];

  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  const isActiveDropdown = (items: any[]) => {
    return items.some((item) => isActiveLink(item.href));
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              {theme === "light" ? (
                <img src={logoWhite} alt="Ariya Logo" className="h-8 w-auto" />
              ) : (
                <img src={logoBlack} alt="Ariya Logo" className="h-8 w-auto" />
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 font-open-sans">
            {menuItems.map((item) => {
              if (item.type === "link" && item.href && item.name && item.icon) {
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-1 transition-colors duration-200",
                      isActiveLink(item.href)
                        ? "text-primary"
                        : "text-foreground-secondary hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              } else if (item.type === "dropdown" && item.label && item.items) {
                return (
                  <DropdownMenu
                    key={item.label}
                    label={item.label}
                    items={item.items}
                    isActive={isActiveDropdown(item.items)}
                  />
                );
              }
              return null;
            })}
          </div>

          {/* Right side - Theme Toggle and Wallet */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle size="sm" />
            <ConnectWalletButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle size="sm" />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden transition-all duration-300 overflow-hidden font-open-sans",
            isMenuOpen ? "max-h-screen pb-4" : "max-h-0"
          )}
        >
          <div className="pt-4 space-y-2">
            {menuItems.map((item) => {
              if (item.type === "link" && item.href && item.name && item.icon) {
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200",
                      isActiveLink(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-foreground-secondary hover:text-foreground hover:bg-card"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              } else if (item.type === "dropdown" && item.label && item.items) {
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="px-4 py-2 text-sm font-semibold text-foreground-secondary uppercase tracking-wide">
                      {item.label}
                    </div>
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        className={cn(
                          "flex items-center space-x-2 px-6 py-2 text-sm transition-colors duration-200",
                          isActiveLink(subItem.href)
                            ? "text-primary bg-primary/10"
                            : "text-foreground-secondary hover:text-foreground hover:bg-card"
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {subItem.icon}
                        <span className="flex-1">{subItem.name}</span>
                        {subItem.exclusive && (
                          <span className="px-2 py-0.5 text-xs rounded bg-gradient-to-r from-primary to-secondary text-white font-bold uppercase">
                            Exclusive
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                );
              }
              return null;
            })}
            <div className="pt-4 border-t border-border">
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
