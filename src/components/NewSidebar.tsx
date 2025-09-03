import { Home } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export const NewSidebar = () => {
  return (
    <div className="w-64 bg-blue-50 min-h-screen p-4">
      <nav>
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </NavLink>
      </nav>
    </div>
  );
};