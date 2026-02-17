import { useTranslations, type MessageKeys } from "next-intl";

interface SharedTableProps {
  title: string;
  textAlign: "text-left" | "text-right";
  handleAddRow: () => void;
  isEditing: boolean;
  columns: { key: string; label: string; width: string }[];
  children: React.ReactNode;
}

const SharedTable = ({
  title,
  textAlign,
  handleAddRow,
  isEditing,
  columns,
  children,
}: SharedTableProps) => {
  const t = useTranslations("forms.paymentReceipt");

  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-2">
      <div className="p-1.5 border-b border-slate-200 bg-slate-50">
        <h3 className={`text-sm font-semibold text-slate-800 ${textAlign}`}>
          {title}
        </h3>
      </div>
      <div className="p-1 flex justify-between mb-1">
        <button
          className={`btn ${textAlign}`}
          data-skip-key-as-tab="true"
          disabled={!isEditing}
          type="button"
          onClick={handleAddRow}
        >
          {t("actions.addRow")}
        </button>
      </div>
      <div className="overflow-x-auto mb-1 max-w-full">
        <table className="w-full border text-xs text-center table-fixed">
          <thead className="bg-gray-100 text-xs font-bold">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="border px-2 py-1">
                  {t(
                    column.label as MessageKeys<
                      IntlMessages,
                      "forms.paymentReceipt"
                    >,
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
};

export default SharedTable;
