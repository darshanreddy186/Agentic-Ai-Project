// src/components/BackgroundAnimation.tsx

import React from "react";
import "../background.css"; // Make sure this path is correct

// Define the component's props interface
interface BackgroundAnimationProps {
  circleColor: string;
}

const BackgroundAnimation: React.FC<BackgroundAnimationProps> = ({ circleColor }) => {
  // Create an array to render 10 circles
  const circles = Array.from({ length: 20 });

  return (
    <div className="background-animation">
      {circles.map((_, i) => {
        // Define random properties for each circle to make them unique
        const size = Math.floor(Math.random() * 200) + 100; // Random size
        const delay = `${Math.random() * 10}s`; // Random start delay
        const duration = `${10 + Math.random() * 10}s`; // Random duration
        const opacity = Math.random() * 0.3 + 0.1; // Random opacity

        return (
          <div
            key={i}
            className="circle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              background: circleColor, // Use the color passed from Layout.tsx
              opacity: opacity,
              animationDelay: delay,
              animationDuration: duration,
              left: `${Math.random() * 100}%`, // Random horizontal start
            }}
          ></div>
        );
      })}
    </div>
  );
};

export default BackgroundAnimation;