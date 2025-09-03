import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const moods = [
  { emoji: "😢", label: "Very Sad", value: 1 },
  { emoji: "😔", label: "Sad", value: 2 },
  { emoji: "😐", label: "Neutral", value: 3 },
  { emoji: "😊", label: "Happy", value: 4 },
  { emoji: "😄", label: "Very Happy", value: 5 },
];

export const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState(4); // Happy by default

  return (
    <Card className="card-shadow h-fit">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Mood Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Selection */}
        <div className="flex justify-between">
          {moods.map((mood) => (
            <Button
              key={mood.value}
              variant="ghost"
              size="sm"
              className={`w-12 h-12 text-2xl rounded-full hover:scale-110 transition-transform ${
                selectedMood === mood.value
                  ? "bg-primary/10 ring-2 ring-primary"
                  : "hover:bg-accent"
              }`}
              onClick={() => setSelectedMood(mood.value)}
            >
              {mood.emoji}
            </Button>
          ))}
        </div>

        {/* Current Mood Display */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-2">Today you feel</p>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-3xl">{moods.find(m => m.value === selectedMood)?.emoji}</span>
          </div>
        </div>

        {/* Simple Mood Chart Visualization */}
        <div className="bg-accent rounded-lg p-4">
          <div className="flex items-end justify-between h-20 space-x-1">
            {[3, 2, 4, 3, 4].map((height, index) => (
              <div
                key={index}
                className={`bg-primary rounded-t-sm transition-all duration-300 ${
                  index === 4 ? "opacity-100" : "opacity-60"
                }`}
                style={{ height: `${height * 20}%`, width: "20%" }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};