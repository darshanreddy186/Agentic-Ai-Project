import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const TopBar = () => {
  return (
    <div className="bg-card border-b border-border p-6 card-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Good Afternoon, Dheeraj ☀️
          </h1>
        </div>
        
        <Avatar className="w-12 h-12">
          <AvatarImage src="/placeholder.svg" alt="Dheeraj" />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            D
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};