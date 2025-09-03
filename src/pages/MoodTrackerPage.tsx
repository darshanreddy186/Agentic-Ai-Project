import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { MoodTracker } from "@/components/MoodTracker";

const MoodTrackerPage = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-accent">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Mood Tracker</h1>
            <MoodTracker />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTrackerPage;