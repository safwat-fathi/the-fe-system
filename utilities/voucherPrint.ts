/**
 * Generate HTML for printing balance voucher (قيد افتتاحي)
 */
export const generateBalanceVoucherPrintHTML = (
  voucher: any,
  details: any[],
  accounts: any[],
  totals: {
    totalDebit: number;
    totalCredit: number;
    totalDebitG: number;
    totalCreditG: number;
  },
  systemName: string = "نظام نفيس ويب",
): string => {
  const formattedDate = voucher.vouch_date
    ? new Date(voucher.vouch_date).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const validDetails = details.filter((d) => d.acc_id && d.acc_id > 0);

  return `
    <html dir="rtl">
      <head>
        <title>قيد افتتاحي - ${voucher.vouch_id}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Cairo', sans-serif;
            padding: 30px 20px;
            background: #fff;
            color: #2d3748;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 35px;
            padding-bottom: 25px;
            border-bottom: 3px solid #e2e8f0;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 15px;
          }
          .header-info {
            display: flex;
            justify-content: center;
            gap: 40px;
            flex-wrap: wrap;
            margin-top: 20px;
          }
          .header-info-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .header-info-label {
            font-size: 12px;
            color: #718096;
            font-weight: 600;
            text-transform: uppercase;
          }
          .header-info-value {
            font-size: 16px;
            color: #2d3748;
            font-weight: 600;
          }
          .voucher-notes {
            margin-top: 15px;
            padding: 15px;
            background: #f7fafc;
            border-right: 4px solid #4299e1;
            border-radius: 4px;
            font-size: 14px;
            color: #4a5568;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            font-size: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            padding: 14px 10px;
            text-align: center;
            font-weight: 600;
            border: 1px solid #4c51bf;
            font-size: 12px;
          }
          td {
            padding: 12px 10px;
            text-align: center;
            border: 1px solid #e2e8f0;
            font-size: 11.5px;
            color: #2d3748;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .account-code {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #4a5568;
          }
          .account-name {
            text-align: right;
            font-weight: 500;
            color: #2d3748;
          }
          .amount-debit { color: #059669; }
          .amount-credit { color: #dc2626; }
          .amount-gold { color: #d97706; font-weight: 600; }
          .gauge {
            font-family: 'Courier New', monospace;
            color: #7c3aed;
            font-weight: 500;
          }
          .totals {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            font-weight: 700;
            border-top: 2px solid #f59e0b;
            border-bottom: 2px solid #f59e0b;
          }
          .totals td {
            padding: 16px 10px;
            font-size: 13.5px;
            color: #92400e;
            border: none;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 11px;
          }
          @media print {
            body { padding: 20px 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>قيد افتتاحي</h1>
          <div class="header-info">
            <div class="header-info-item">
              <span class="header-info-label">رقم القيد</span>
              <span class="header-info-value">${voucher.vouch_id || "-"}</span>
            </div>
            <div class="header-info-item">
              <span class="header-info-label">التاريخ</span>
              <span class="header-info-value">${formattedDate}</span>
            </div>
            <div class="header-info-item">
              <span class="header-info-label">عدد البنود</span>
              <span class="header-info-value">${validDetails.length}</span>
            </div>
          </div>
          ${
            voucher.vouch_notes
              ? `<div class="voucher-notes"><strong>البيان:</strong> ${voucher.vouch_notes}</div>`
              : ""
          }
        </div>
        <table>
          <thead>
            <tr>
              <th>رقم الحساب</th>
              <th>اسم الحساب</th>
              <th>مدين</th>
              <th>دائن</th>
              <th>مدين معاير</th>
              <th>دائن معاير</th>
              <th>المعايرة</th>
              <th>البيان</th>
            </tr>
          </thead>
          <tbody>
            ${validDetails
              .map((detail) => {
                const account = accounts.find(
                  (acc) => acc.id === detail.acc_id,
                );
                const debit = detail.debit || 0;
                const credit = detail.credit || 0;
                const debitG = detail.debit_g || 0;
                const creditG = detail.credit_g || 0;
                const gauge = detail.gauge || 875;

                return `
                <tr>
                  <td class="account-code">${account?.acc_code || "-"}</td>
                  <td class="account-name">${account?.acc_name || "-"}</td>
                  <td class="amount amount-debit">${debit > 0 ? debit.toFixed(2) : "-"}</td>
                  <td class="amount amount-credit">${credit > 0 ? credit.toFixed(2) : "-"}</td>
                  <td class="amount amount-gold">${debitG > 0 ? debitG.toFixed(2) : "-"}</td>
                  <td class="amount amount-gold">${creditG > 0 ? creditG.toFixed(2) : "-"}</td>
                  <td class="gauge">${gauge}</td>
                  <td style="text-align: right; font-size: 11px; color: #718096;">${detail.vouch_notes || "-"}</td>
                </tr>
              `;
              })
              .join("")}
            <tr class="totals">
              <td colspan="2" style="text-align: right; padding-right: 20px; font-weight: 700;">الإجمالي</td>
              <td class="amount amount-debit">${totals.totalDebit.toFixed(2)}</td>
              <td class="amount amount-credit">${totals.totalCredit.toFixed(2)}</td>
              <td class="amount amount-gold">${totals.totalDebitG.toFixed(2)}</td>
              <td class="amount amount-gold">${totals.totalCreditG.toFixed(2)}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <p>تم طباعة هذا القيد بتاريخ ${new Date().toLocaleDateString("ar-SA")} - ${systemName}</p>
        </div>
      </body>
    </html>
  `;
};
