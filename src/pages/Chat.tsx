import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WellnessSidebar } from "@/components/WellnessSidebar";

const Chat = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-accent">
      <WellnessSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
            </Link>
          </div>
          
          <div className="bg-card rounded-lg p-8 card-shadow">
            <h1 className="text-2xl font-bold mb-4">Share Your Thoughts</h1>
            <p className="text-muted-foreground">Chat interface coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;