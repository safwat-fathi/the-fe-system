"use client";

import { ReactNode, useEffect } from "react";
import {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

// Base Modal Props
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

// Confirmation Modal Props
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "primary" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
}

// Form Modal Props
interface FormModalProps extends BaseModalProps {
  onSubmit: () => void;
  submitText?: string;
  cancelText?: string;
  submitColor?: "primary" | "danger" | "success" | "warning";
  isLoading?: boolean;
  submitDisabled?: boolean;
  shouldBlockScroll?: boolean;
}

// Info Modal Props
interface InfoModalProps extends BaseModalProps {
  message?: string;
  icon?: ReactNode;
  showOkButton?: boolean;
  okText?: string;
}

// Base Modal Component
export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: BaseModalProps) {
  return (
    <HeroModal
      className={className}
      hideCloseButton={!showCloseButton}
      isDismissable={closeOnOverlayClick}
      isOpen={isOpen}
      size={size}
      onClose={onClose}
    >
      <ModalContent>
        {title && <ModalHeader>{title}</ModalHeader>}
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </HeroModal>
  );
}

// Confirmation Modal Component
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  confirmColor = "primary",
  size = "md",
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        onConfirm();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onConfirm, onClose]);

  return (
    <HeroModal
      isDismissable={false}
      isOpen={isOpen}
      size={size}
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <p className="text-lg font-semibold">{title}</p>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <div className="text-gray-700 text-center text-sm leading-relaxed">
              {typeof message === "string" ? <p>{message}</p> : message}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="gap-3">
          {cancelText && (
            <Button
              className="font-medium min-w-[100px]"
              color="default"
              variant="flat"
              onPress={onClose}
            >
              {cancelText}
            </Button>
          )}
          <Button
            className="font-medium min-w-[100px] bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md"
            color={confirmColor}
            variant="solid"
            onPress={onConfirm}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </HeroModal>
  );
}

// Form Modal Component
export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = "حفظ",
  cancelText = "إلغاء",
  submitColor = "primary",
  isLoading = false,
  submitDisabled = false,
  size = "2xl",
  shouldBlockScroll,
  ...baseProps
}: FormModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <HeroModal
      isDismissable={false}
      isOpen={isOpen}
      shouldBlockScroll={shouldBlockScroll}
      size={size}
      onClose={onClose}
      {...baseProps}
    >
      <ModalContent>
        {title && <ModalHeader>{title}</ModalHeader>}
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          <Button color="danger" variant="flat" onPress={onClose}>
            {cancelText}
          </Button>
          <Button
            color={submitColor}
            isDisabled={submitDisabled}
            isLoading={isLoading}
            onPress={onSubmit}
          >
            {submitText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </HeroModal>
  );
}

// Info Modal Component
export function InfoModal({
  isOpen,
  onClose,
  title,
  message,
  icon,
  showOkButton = true,
  okText = "حسناً",
  children,
  size = "md",
  ...baseProps
}: InfoModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        if (showOkButton) {
          event.preventDefault();
          onClose();
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, showOkButton, onClose]);

  return (
    <HeroModal
      isDismissable={false}
      isOpen={isOpen}
      size={size}
      onClose={onClose}
      {...baseProps}
    >
      <ModalContent>
        {title && <ModalHeader>{title}</ModalHeader>}
        <ModalBody>
          {icon && <div className="flex justify-center mb-4">{icon}</div>}
          {message && <p className="text-gray-600 text-center">{message}</p>}
          {children}
        </ModalBody>
        {showOkButton && (
          <ModalFooter>
            <Button color="primary" onPress={onClose}>
              {okText}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </HeroModal>
  );
}

// Unified Modal Component with type detection
export function UnifiedModal(
  props:
    | BaseModalProps
    | ConfirmationModalProps
    | FormModalProps
    | InfoModalProps,
) {
  // Detect modal type based on props
  if ("onConfirm" in props && "message" in props) {
    return <ConfirmationModal {...(props as ConfirmationModalProps)} />;
  } else if ("onSubmit" in props) {
    return <FormModal {...(props as FormModalProps)} />;
  } else if ("message" in props || "icon" in props) {
    return <InfoModal {...(props as InfoModalProps)} />;
  } else {
    return <BaseModal {...(props as BaseModalProps)} />;
  }
}

// Export HeroModal for direct use
export {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
