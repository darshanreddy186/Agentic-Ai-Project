import {
  Home,
  Users,
  Brain,
  Book,
  Target,
  BarChart3,
  Camera
} from "lucide-react";

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "Diary", icon: Book, path: "/diary" },
  { name: "Recommendations", icon: Target, path: "/recommendations" },
  { name: "Community", icon: Users, path: "/community" },
  { name: "Analytics", icon: BarChart3, path: "/analytics" },
  { name: "Memories", icon: Camera, path: "/memories" },
];

export const Sidebar = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Hamburger Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-card border border-border shadow-md flex flex-col justify-center items-center w-10 h-10 focus:outline-none"
        aria-label="Open sidebar"
        onClick={() => setOpen(true)}
        style={{ display: open ? 'none' : 'flex' }}
      >
        <span className="block w-6 h-0.5 bg-foreground mb-1" />
        <span className="block w-6 h-0.5 bg-foreground mb-1" />
        <span className="block w-6 h-0.5 bg-foreground" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 w-72 bg-card border-r border-border card-shadow min-h-screen flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ boxShadow: open ? '0 0 24px 0 rgba(0,0,0,0.08)' : undefined }}
        aria-hidden={!open}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 p-2 rounded-md bg-muted hover:bg-accent focus:outline-none"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
        >
          <span className="block w-5 h-0.5 bg-foreground rotate-45 absolute left-1 top-2.5" />
          <span className="block w-5 h-0.5 bg-foreground -rotate-45 absolute left-1 top-2.5" />
        </button>

        {/* Logo and Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">MindSpace</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
              onClick={() => setOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Quote of the Day */}
        <div className="p-6 border-t border-border mt-auto">
          <div className="bg-accent rounded-lg p-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">
              Quote of the Day
            </h3>
            <p className="text-foreground text-sm leading-relaxed">
              This too shall pass.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
// ...no code here, removed stray closing brace...