import type { Voucher } from "@/types/voucher";
import type { Dispatch, SetStateAction } from "react";

import { useTranslations } from "next-intl";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";

const NotesModal = ({
  isNotesModalOpen,
  setIsNotesModalOpen,
  isEditing,
  voucher,
  setVoucher,
  textAlign,
}: {
  isNotesModalOpen: boolean;
  setIsNotesModalOpen: Dispatch<SetStateAction<boolean>>;
  isEditing: boolean;
  voucher: Voucher;
  setVoucher: Dispatch<SetStateAction<Voucher>>;
  textAlign: string;
}) => {
  const t = useTranslations("forms.balanceVoucher");

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
