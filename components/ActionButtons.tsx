"use client";

import { Button } from "@heroui/react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

interface ActionButtonsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ActionButtons({ onView, onEdit, onDelete }: ActionButtonsProps) {
  return (
    <div className="flex justify-center gap-2">
      <Button isIconOnly variant="light" size="sm" onPress={onView}>
        <FaEye className="text-blue-500" />
      </Button>
      <Button isIconOnly variant="light" size="sm" onPress={onEdit}>
        <FaEdit className="text-yellow-500" />
      </Button>
      <Button isIconOnly variant="light" size="sm" onPress={onDelete}>
        <FaTrash className="text-red-500" />
      </Button>
    </div>
  );
}

