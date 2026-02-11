import type { Account } from "@/types/models/account";
import type { AccountOption, VoucherDetail } from "@/types/voucher";

import { useTranslations } from "next-intl";

import SelectCol from "./SelectCol";

import {
  getAccountSelectValue,
  loadAccounts,
} from "@/utilities/account.actions";

const AdjustmentColumn = ({
  detail,
  isEditing,
  initialAccounts,
  updateDetail,
  index,
}: {
  detail: VoucherDetail;
  isEditing: boolean;
  initialAccounts: Account[];
  updateDetail: (index: number, detail: Partial<VoucherDetail>) => void;
  index: number;
}) => {
  const loadAccountOptions = loadAccounts(initialAccounts);
  const t = useTranslations("forms.adjustment");

  return (
    <tr className={"border-b border-slate-100 hover:bg-slate-50"}>
      <td className="p-0 border bg-white">
        <SelectCol<AccountOption>
          options={loadAccountOptions}
          placeholder={t("table.columns.accountPlaceholder")}
          formatCreateLabel={(inputValue) =>
            t("table.addAccountLabel", {
              value: inputValue,
            })
          }
          isEditing={isEditing}
          value={getAccountSelectValue(detail, initialAccounts)}
          onChange={(selectedOption) => {
            if (selectedOption) {
              updateDetail(index, {
                acc_id: selectedOption.value,
                acc_code: selectedOption.account.acc_code,
                acc_name: selectedOption.account.acc_name,
              });
            } else {
              updateDetail(index, {
                acc_id: 0,
                acc_code: "",
                acc_name: "",
              });
            }
          }}
        />
      </td>
    </tr>
  );
};

export default AdjustmentColumn;
