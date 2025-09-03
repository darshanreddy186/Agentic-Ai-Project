import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface MoodPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const moods = [
  { emoji: "😀", value: "very-happy", label: "Very Happy" },
  { emoji: "😊", value: "happy", label: "Happy" },
  { emoji: "😐", value: "neutral", label: "Neutral" },
  { emoji: "😞", value: "sad", label: "Sad" },
  { emoji: "😡", value: "very-sad", label: "Very Sad" },
];

export const MoodPopup = ({ isOpen, onClose }: MoodPopupProps) => {
  const { toast } = useToast();

  const handleMoodSelect = async (moodValue: string) => {
    try {
      // Check if user is logged in (you would implement actual auth logic here)
      const isLoggedIn = false; // For now, assuming not logged in
      
      let userId = null;
      let tempUserId = null;

      if (isLoggedIn) {
        // Get actual user ID from auth
        userId = "actual-user-id";
      } else {
        // Create or get temp user ID
        tempUserId = localStorage.getItem('tempUserId') || `temp-${Date.now()}`;
        localStorage.setItem('tempUserId', tempUserId);
      }

      const response = await fetch('https://agenticairishi/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tempUserId,
          mood: moodValue,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Mood recorded",
          description: `Thank you for sharing how you're feeling!`,
        });
      } else {
        throw new Error('Failed to record mood');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not record your mood. Please try again.",
        variant: "destructive",
      });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">How are you feeling today?</DialogTitle>
        </DialogHeader>
        <div className="flex justify-around py-6">
          {moods.map((mood) => (
            <Button
              key={mood.value}
              variant="ghost"
              size="lg"
              className="flex flex-col items-center space-y-2 p-4 h-auto hover:bg-accent"
              onClick={() => handleMoodSelect(mood.value)}
            >
              <span className="text-4xl">{mood.emoji}</span>
              <span className="text-xs text-muted-foreground">{mood.label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};