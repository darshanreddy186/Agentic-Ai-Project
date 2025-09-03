import {
  Home,
  Smile,
  Lightbulb,
  BookOpen,
  PenTool,
  Users,
  Brain
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "Mood Tracker", icon: Smile, path: "/mood-tracker" },
  { name: "Recommendations", icon: Lightbulb, path: "/recommendations" },
  { name: "Stories", icon: BookOpen, path: "/stories" },
  { name: "Journal", icon: PenTool, path: "/journal" },
  { name: "Community", icon: Users, path: "/community" },
];

export const Sidebar = () => {
  return (
    <div className="w-72 bg-card border-r border-border card-shadow min-h-screen flex flex-col">
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
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Quote of the Day */}
      <div className="p-6 border-t border-border">
        <div className="bg-accent rounded-lg p-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
            Quote of the Day
          </h3>
          <p className="text-foreground text-sm leading-relaxed">
            This too shall pass.
          </p>
        </div>
      </div>
    </div>
  );
};