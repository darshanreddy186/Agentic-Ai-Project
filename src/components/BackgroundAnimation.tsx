import React from "react";
import "../background.css"; // make sure CSS is imported

const BackgroundAnimation: React.FC = () => {
  const circles = Array.from({ length: 10 }); // create 10 circles

  return (
    <div className="background-animation">
      {circles.map((_, i) => {
        const size = Math.floor(Math.random() * 200) + 100; // 100–300px
        const delay = `${Math.random() * 10}s`;
        const duration = `${10 + Math.random() * 10}s`;
        const opacity = Math.random() * 0.3 + 0.1;

        return (
          <div
            key={i}
            className="circle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              background: `rgba(255, 255, 255, ${opacity})`,
              animationDelay: delay,
              animationDuration: duration,
              left: `${Math.random() * 100}%`,
            }}
          ></div>
        );
      })}
    </div>
  );
};

export default BackgroundAnimation;
