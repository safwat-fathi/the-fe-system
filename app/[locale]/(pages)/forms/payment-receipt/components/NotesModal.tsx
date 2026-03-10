import type { Voucher } from "@/types/voucher";
import type { Dispatch, SetStateAction } from "react";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from "@heroui/react";
import { useTranslations } from "next-intl";

const NotesModal = ({
  isNotesModalOpen,
  setIsNotesModalOpen,
  voucher,
  setVoucher,
  isEditing,
  textAlign,
}: {
  isNotesModalOpen: boolean;
  setIsNotesModalOpen: (value: boolean) => void;
  voucher: Voucher;
  setVoucher: Dispatch<SetStateAction<Voucher>>;
  isEditing: boolean;
  textAlign: string;
}) => {
  const t = useTranslations("forms.paymentReceipt");

  return (
    <Modal
      isOpen={isNotesModalOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={() => setIsNotesModalOpen(false)}
    >
      <ModalContent>
        <ModalHeader className={`flex flex-col gap-1 ${textAlign}`}>
          <p className={`text-lg font-semibold ${textAlign}`}>
            {t("fields.notesModalTitle")}
          </p>
        </ModalHeader>
        <ModalBody>
          <Textarea
            classNames={{
              input: "resize-none",
            }}
            disabled={!isEditing}
            maxRows={12}
            minRows={6}
            placeholder={t("fields.notesModalPlaceholder")}
            value={voucher.vouch_notes || ""}
            onChange={(e) =>
              setVoucher((prev) => ({
                ...prev,
                vouch_notes: e.target.value,
              }))
            }
          />
        </ModalBody>
        <ModalFooter>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            variant="solid"
            onPress={() => setIsNotesModalOpen(false)}
          >
            {t("actions.saveNotes")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NotesModal;
