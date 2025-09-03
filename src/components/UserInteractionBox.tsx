import { useState } from "react";
import { Mic, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const UserInteractionBox = () => {
  const [inputType, setInputType] = useState<"text" | "microphone">("text");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      const response = await fetch("https://agenticairishi/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputType, message }),
      });

      if (response.ok) {
        toast({
          title: "Message shared successfully",
          description: "Redirecting to chat...",
        });
        navigate("/chat");
      } else {
        toast({
          title: "Error sharing message",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Want to share something</h3>
        
        <div className="flex items-center space-x-2 mb-4">
          <Button
            variant={inputType === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputType("text")}
            className="flex items-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Text</span>
          </Button>
          
          <Button
            variant={inputType === "microphone" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputType("microphone")}
            className="flex items-center space-x-2"
          >
            <Mic className="w-4 h-4" />
            <span>Voice</span>
          </Button>
        </div>

        <div className="flex space-x-2">
          <Input
            placeholder={inputType === "text" ? "Type your message..." : "Click to start recording..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};