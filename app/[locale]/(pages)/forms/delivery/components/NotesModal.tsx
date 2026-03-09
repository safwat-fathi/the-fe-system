import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Button,
} from "@heroui/react";
import { useTranslations } from "next-intl";

interface NotesModalProps {
  isNotesModalOpen: boolean;
  setIsNotesModalOpen: (isOpen: boolean) => void;
  isEditing: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NotesModal = ({
  isNotesModalOpen,
  setIsNotesModalOpen,
  isEditing,
  value,
  onChange,
}: NotesModalProps) => {
  const t = useTranslations("forms.customerGoldVoucher.modals.notes");

  return (
    <Modal
      isOpen={isNotesModalOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={() => setIsNotesModalOpen(false)}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <p className="text-lg font-semibold">{t("title")}</p>
        </ModalHeader>
        <ModalBody>
          <Textarea
            classNames={{
              input: "resize-none",
            }}
            disabled={!isEditing}
            maxRows={12}
            minRows={6}
            placeholder={t("placeholder")}
            value={value || ""}
            onChange={(e) => onChange(e)}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            variant="solid"
            onPress={() => setIsNotesModalOpen(false)}
          >
            {t("save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NotesModal;
