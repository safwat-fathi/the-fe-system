"use client";

import { ReactNode } from "react";
import { Modal as HeroModal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

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
  message: string;
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
  closeOnEscape = true
}: BaseModalProps) {
  return (
    <HeroModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      showCloseButton={showCloseButton}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEscape={closeOnEscape}
      className={className}
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
  size = "md"
}: ConfirmationModalProps) {
  return (
    <HeroModal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="text-gray-600">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="flat" onPress={onClose}>
            {cancelText}
          </Button>
          <Button color={confirmColor} onPress={onConfirm}>
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
  ...baseProps
}: FormModalProps) {
  return (
    <HeroModal isOpen={isOpen} onClose={onClose} size={size} {...baseProps}>
      <ModalContent>
        {title && <ModalHeader>{title}</ModalHeader>}
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          <Button color="danger" variant="flat" onPress={onClose}>
            {cancelText}
          </Button>
          <Button 
            color={submitColor} 
            onPress={onSubmit}
            isLoading={isLoading}
            isDisabled={submitDisabled}
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
  return (
    <HeroModal isOpen={isOpen} onClose={onClose} size={size} {...baseProps}>
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
export function UnifiedModal(props: BaseModalProps | ConfirmationModalProps | FormModalProps | InfoModalProps) {
  // Detect modal type based on props
  if ('onConfirm' in props && 'message' in props) {
    return <ConfirmationModal {...(props as ConfirmationModalProps)} />;
  } else if ('onSubmit' in props) {
    return <FormModal {...(props as FormModalProps)} />;
  } else if ('message' in props || 'icon' in props) {
    return <InfoModal {...(props as InfoModalProps)} />;
  } else {
    return <BaseModal {...(props as BaseModalProps)} />;
  }
}

// Export HeroModal for direct use
export { Modal as HeroModal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";


