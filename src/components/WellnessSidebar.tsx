import { Home, Book, Target, Users, BarChart3, Camera } from "lucide-react";
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

export const WellnessSidebar = () => {
  return (
    <div className="w-64 bg-sidebar min-h-screen border-r border-sidebar-border">
      <div className="p-6">
        <h2 className="text-xl font-bold text-sidebar-foreground mb-8">MindSpace</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};