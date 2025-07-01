"use client";

import { Button } from "@heroui/react";

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

export default function NumericKeypad({
  onDigit,
  onBackspace,
}: NumericKeypadProps) {
  const buttons = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "⌫"];

  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {buttons.map((label) => (
        <Button
          key={label}
          className="py-4 text-lg"
          variant="bordered"
          onPress={() => {
            if (label === "⌫") onBackspace();
            else onDigit(label);
          }}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
