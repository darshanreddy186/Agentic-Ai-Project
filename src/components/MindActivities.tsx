import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Music, Dumbbell, Heart } from "lucide-react";

const activities = [
  { 
    name: "Meditation", 
    icon: User, 
    bgClass: "wellness-turquoise",
    textClass: "text-wellness-turquoise-foreground"
  },
  { 
    name: "Music", 
    icon: Music, 
    bgClass: "wellness-pink",
    textClass: "text-wellness-pink-foreground"
  },
  { 
    name: "Exercise", 
    icon: Dumbbell, 
    bgClass: "wellness-orange",
    textClass: "text-wellness-orange-foreground"
  },
  { 
    name: "Gratitude Journal", 
    icon: Heart, 
    bgClass: "wellness-purple",
    textClass: "text-wellness-purple-foreground"
  },
];

export const MindActivities = () => {
  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-6">Mind Activities</h3>
        
        {/* Activity Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {activities.map((activity) => (
            <Button
              key={activity.name}
              variant="ghost"
              className={`h-20 flex flex-col items-center justify-center rounded-xl ${activity.bgClass} hover:opacity-90 transition-all duration-200 hover:scale-105`}
              onClick={() => console.log(`Starting ${activity.name}`)}
            >
              <activity.icon className={`w-6 h-6 mb-2 ${activity.textClass}`} />
              <span className={`text-sm font-medium ${activity.textClass}`}>
                {activity.name}
              </span>
            </Button>
          ))}
        </div>

        {/* Quote and Log Mood */}
        <div className="space-y-4">
          <p className="text-center text-muted-foreground text-sm italic">
            This too shall pass.
          </p>
          
          <Button 
            variant="default" 
            className="w-full flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Log Mood</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};