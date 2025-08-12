// رمز الريال السعودي الجديد
import React from "react";

interface RiyalIconProps {
  color?: string;
  size?: string;
  className?: string;
}

const RiyalIcon: React.FC<RiyalIconProps> = ({ 
  color = "currentColor", 
  size = "1em",
  className = ""
}) => {
  // إذا كان اللون هو currentColor، استخدم CSS filter للتحكم في اللون
  const getFilter = (color: string) => {
    if (color === "currentColor") return "none";
    
    // تحويل الألوان الشائعة إلى CSS filters
    const colorMap: Record<string, string> = {
      "#1e40af": "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)",
      "#991b1b": "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)",
      "#166534": "brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)",
      "#1e3a8a": "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)",
      "#92400e": "brightness(0) saturate(100%) invert(83%) sepia(31%) saturate(638%) hue-rotate(359deg) brightness(103%) contrast(107%)",
      "green": "brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)",
      "red": "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)",
      "blue": "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)",
      "yellow": "brightness(0) saturate(100%) invert(83%) sepia(31%) saturate(638%) hue-rotate(359deg) brightness(103%) contrast(107%)",
      "purple": "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)",
      "orange": "brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)",
    };
    
    return colorMap[color] || "none";
  };

  return (
    <img
      src="/fonts/riyalsymbol.svg"
      alt="ر.س"
      style={{ 
        display: 'inline', 
        height: size, 
        width: 'auto',
        verticalAlign: 'middle', 
        marginRight: '4px',
        filter: getFilter(color),
        color: color === "currentColor" ? "inherit" : color
      }}
      className={className}
    />
  );
};

export { RiyalIcon };
