"use client";

import { Button } from "@heroui/react";

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

export default function NumericKeypad({ onDigit, onBackspace }: NumericKeypadProps) {
  const buttons = [
    "1", "2", "3", "+10",
    "4", "5", "6", "+20",
    "7", "8", "9", "+50",
    "+/-", "0", ".", "⌫"
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      {buttons.map((label) => (
        <Button
          key={label}
          className="py-4 text-lg"
          variant={label === "⌫" ? "solid" : "bordered"}
          color={label === "⌫" ? "danger" : "default"}
          onPress={() => {
            switch (label) {
              case "⌫":
                onBackspace();
                break;
              case "+10":
              case "+20":
              case "+50":
                onDigit((parseFloat(label.replace("+", ""))).toString());
                break;
              case "+/-":
                onDigit("-1"); 
                break;
              default:
                onDigit(label);
            }
          }}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
