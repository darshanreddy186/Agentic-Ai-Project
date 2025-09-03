import { useState, useEffect } from "react";
import { WellnessSidebar } from "@/components/WellnessSidebar";
import { UserInteractionBox } from "@/components/UserInteractionBox";
import { AudioPlayer } from "@/components/AudioPlayer";
import { RecommendationCard } from "@/components/RecommendationCard";
import { MoodPopup } from "@/components/MoodPopup";

const Dashboard = () => {
  const [showMoodPopup, setShowMoodPopup] = useState(false);

  useEffect(() => {
    // Show mood popup on page load/refresh
    const lastMoodCheck = localStorage.getItem('lastMoodCheck');
    const today = new Date().toDateString();
    
    if (lastMoodCheck !== today) {
      setShowMoodPopup(true);
    }
  }, []);

  const handleMoodPopupClose = () => {
    setShowMoodPopup(false);
    localStorage.setItem('lastMoodCheck', new Date().toDateString());
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-accent">
      {/* Mood Popup */}
      <MoodPopup isOpen={showMoodPopup} onClose={handleMoodPopupClose} />
      
      {/* Left Sidebar */}
      <WellnessSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-accent border-b border-border p-6">
          <h1 className="text-2xl font-medium text-foreground">
            Good Afternoon, Dheeraj 👋
          </h1>
        </div>
        
        {/* Dashboard Content Grid */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Column - User Interaction & Audio Player */}
            <div className="lg:col-span-2 space-y-6">
              <UserInteractionBox />
              <AudioPlayer />
            </div>
            
            {/* Right Panel - Daily Recommendation */}
            <div className="lg:col-span-1">
              <RecommendationCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;