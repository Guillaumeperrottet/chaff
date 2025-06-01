import { useState, useRef, useEffect } from "react";
import {
  LogOut,
  User,
  ChevronDown,
  LayoutDashboard,
  CreditCard,
  Users,
  Lightbulb,
  Archive,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface UserMenuProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  isAdmin?: boolean;
}

export default function UserMenu({ user, isAdmin = false }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuItems = [
    {
      icon: <LayoutDashboard size={16} />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <Archive size={16} />,
      label: "Archives",
      href: "/dashboard/archives",
    },
    {
      icon: <CreditCard size={16} />,
      label: "Abonnement",
      href: "/profile/subscription",
    },
    {
      icon: <User size={16} />,
      label: "Mon profil",
      href: "/profile",
    },
    {
      icon: <Lightbulb size={16} />,
      label: "Proposer une amélioration",
      href: "/features",
    },
    ...(isAdmin
      ? [
          {
            icon: <Users size={16} />,
            label: "Gestion utilisateurs",
            href: "/profile/edit",
          },
        ]
      : []),
    {
      icon: <LogOut size={16} />,
      label: "Déconnexion",
      href: "/signout",
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center gap-2 p-1.5 rounded-lg border border-transparent hover:bg-[color:var(--muted)] transition-colors duration-200 focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-primary text-primary-foreground text-sm font-medium">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              fill
              sizes="32px"
              className="object-cover"
              priority
            />
          ) : (
            <span>
              {user.name?.[0]?.toUpperCase() ||
                user.email?.[0]?.toUpperCase() ||
                "U"}
            </span>
          )}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium leading-none text-[color:var(--foreground)]">
            {user.name || "Utilisateur"}
          </p>
          <p className="text-xs text-[color:var(--muted-foreground)] truncate max-w-[120px]">
            {user.email}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 text-[color:var(--foreground)] ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-md shadow-lg z-50 overflow-hidden bg-[color:var(--card)] border border-[color:var(--border)]"
          >
            <div className="p-3 border-b border-[color:var(--border)]">
              <p className="text-sm font-medium text-[color:var(--foreground)]">
                {user.name || "Utilisateur"}
              </p>
              <p className="text-xs text-[color:var(--muted-foreground)] truncate">
                {user.email}
              </p>
            </div>
            <div className="py-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[color:var(--foreground)] hover:bg-[color:var(--accent)] transition-colors duration-150"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-[color:var(--foreground)]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
