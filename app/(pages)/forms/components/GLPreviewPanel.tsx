"use client";

import { memo } from "react";
import { Button } from "@heroui/react";

import { formatAmount } from "@/utilities/formatAmount";

interface GLPreviewLine {
  key?: string | number;
  accountCode?: string | number | null;
  accountName?: string | null;
  debit?: number;
  credit?: number;
  goldDebit?: number;
  goldCredit?: number;
  note?: string | null;
}

interface GLPreviewPanelProps {
  title?: string;
  subtitle?: string | null;
  lines: GLPreviewLine[];
  totals: {
    debit: number;
    credit: number;
    goldDebit: number;
    goldCredit: number;
  };
  onOpenGLModal?: () => void;
  showGLButton?: boolean;
}

const GLPreviewPanel = ({
  title = "معاينة القيد المحاسبي",
  subtitle,
  lines,
  totals,
  onOpenGLModal,
  showGLButton = true,
}: GLPreviewPanelProps) => {
  const hasGold = totals.goldDebit > 0 || totals.goldCredit > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          {subtitle ? (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          ) : null}
        </div>
        {showGLButton && onOpenGLModal ? (
          <Button
            size="sm"
            variant="light"
            color="primary"
            className="font-medium"
            onPress={onOpenGLModal}
          >
            عرض حركة الدفتر
          </Button>
        ) : null}
      </header>
      <div className="overflow-x-auto px-4 py-3">
        <table className="min-w-full text-sm text-slate-700">
          <thead>
            <tr className="text-xs uppercase text-slate-500">
              <th className="py-2 text-right">الحساب</th>
              <th className="py-2 text-right">مدين</th>
              <th className="py-2 text-right">دائن</th>
              {hasGold ? (
                <>
                  <th className="py-2 text-right">ذهب مدين</th>
                  <th className="py-2 text-right">ذهب دائن</th>
                </>
              ) : null}
              <th className="py-2 text-right">الملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={hasGold ? 5 : 4}
                  className="py-6 text-center text-slate-400 text-sm"
                >
                  لا توجد بيانات بعد، أضف تفاصيل السند لعرض المعاينة.
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => (
                <tr key={line.key ?? idx} className="hover:bg-slate-50/70">
                  <td className="py-2 text-right font-medium">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-800">
                        {line.accountName || "-"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {line.accountCode ?? ""}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 text-right font-semibold text-emerald-700">
                    {line.debit && line.debit > 0
                      ? formatAmount(line.debit)
                      : "-"}
                  </td>
                  <td className="py-2 text-right font-semibold text-red-600">
                    {line.credit && line.credit > 0
                      ? formatAmount(line.credit)
                      : "-"}
                  </td>
                  {hasGold ? (
                    <>
                      <td className="py-2 text-right text-amber-600 font-semibold">
                        {line.goldDebit && line.goldDebit > 0
                          ? formatAmount(line.goldDebit)
                          : "-"}
                      </td>
                      <td className="py-2 text-right text-amber-600 font-semibold">
                        {line.goldCredit && line.goldCredit > 0
                          ? formatAmount(line.goldCredit)
                          : "-"}
                      </td>
                    </>
                  ) : null}
                  <td className="py-2 text-right text-xs text-slate-500">
                    {line.note || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50/70 text-sm font-semibold text-slate-700">
              <td className="py-2 text-right">الإجمالي</td>
              <td className="py-2 text-right text-emerald-700">
                {formatAmount(totals.debit)}
              </td>
              <td className="py-2 text-right text-red-600">
                {formatAmount(totals.credit)}
              </td>
              {hasGold ? (
                <>
                  <td className="py-2 text-right text-amber-600">
                    {formatAmount(totals.goldDebit)}
                  </td>
                  <td className="py-2 text-right text-amber-600">
                    {formatAmount(totals.goldCredit)}
                  </td>
                </>
              ) : null}
              <td className="py-2 text-right text-xs text-slate-500">
                {Math.abs(totals.debit - totals.credit) < 0.01 &&
                Math.abs(totals.goldDebit - totals.goldCredit) < 0.01
                  ? "✅ متوازن"
                  : "⚠️ غير متوازن"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};

export type { GLPreviewPanelProps, GLPreviewLine };
export default memo(GLPreviewPanel);

