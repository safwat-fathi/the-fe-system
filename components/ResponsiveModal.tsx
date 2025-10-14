"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";

interface ResponsiveModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  scrollBehavior?: "inside" | "outside";
  backdrop?: "transparent" | "blur" | "opaque";
  isDismissable?: boolean;
  className?: string;
}

export default function ResponsiveModal({
  children,
  isOpen,
  onClose,
  title,
  size = "2xl",
  scrollBehavior = "inside",
  backdrop = "opaque",
  isDismissable = true,
  className = "",
}: ResponsiveModalProps) {
  return (
    <Modal
      backdrop={backdrop}
      className={`responsive-modal ${className}`}
      isDismissable={isDismissable}
      isOpen={isOpen}
      scrollBehavior={scrollBehavior}
      size={size}
      onClose={onClose}
    >
      <ModalContent className="font-cairo">
        {title && (
          <ModalHeader className="responsive-text-lg">{title}</ModalHeader>
        )}
        <ModalBody className="responsive-p">{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
}

// Helper components for modal sections
export function ModalSection({
  children,
  title,
  className = "",
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <h3 className="responsive-text-base font-bold border-b pb-2 mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export function ModalActions({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ModalFooter className={`responsive-actions ${className}`}>
      {children}
    </ModalFooter>
  );
}
