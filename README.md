# Next.js & HeroUI Template

This is a template for creating applications using Next.js 14 (app directory) and HeroUI (v2).

[Try it on CodeSandbox](https://githubbox.com/heroui-inc/heroui/next-app-template)

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [HeroUI v2](https://heroui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to Use

### Use the template with create-next-app

To create a new project based on this template using `create-next-app`, run the following command:

```bash
npx create-next-app -e https://github.com/heroui-inc/next-app-template
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## Invoice and Payment Features

### Supported Invoice Detail Fields

The application works with all columns available in the invoice detail table. The following table lists each field and its purpose:


| Field | Description | DB Field |
|-------|-------------|----------|
| `id` | Auto increment key | `id` |
| `trans_type` | Invoice type (`2` means sales invoice) | `trans_type` |
| `G875` | Purity/calibration value | `G875` |
| `qty` | Number of pieces | `qty` |
| `weight` | Gross weight | `weight` |
| `g_weight` | Net/gauged weight | `g_weight` |
| `price` | Price per gram | `price` |
| `price_w` | Wage per gram | `price_w` |
| `total` | Total value | `total` |
| `total_w` | Total wages | `total_w` |
| `total_a` | Value + wages | `total_a` |
| `inv_note` | Line notes | `inv_note` |
| `tax` | Added tax amount | `tax` |
| `tax_prc` | Tax percentage (15% by default) | `tax_prc` |
| `stones` | Stones information | `stones` |
| `item_disc_prc` | Item discount percentage | `item_disc_prc` |
| `item_disc_amt` | Item discount amount | `item_disc_amt` |
| `sn` | Serial number of the item line | `sn` |
| `item_desc` | Item description text | `item_desc` |
| `cr_date` | Creation timestamp | `cr_date` |
| `cr_user` | Username who created the line | `cr_user` |
| `upd_date` | Last update timestamp | `upd_date` |
| `upd_user` | Username who updated the line | `upd_user` |
| `com` | Branch identifier | `com` |
| `inv` | Invoice number (foreign key) | `inv` |
| `item` | Item ID (foreign key) | `item` |

### payType

The `payType` dropdown controls the visibility of four financial columns when editing an invoice:

- **price** – price per gram
- **price_w** – wage per gram
- **total** – total value
- **total_w** – total wages

`total_a` and the weight columns remain visible regardless of the selected pay type. The numeric options are:

1 – value only
2 – wages only
3 – value and wages

### Recording Payments

1. Open the **Payments** page from the dashboard.
2. Select the invoice to pay.
3. Enter payment amount, method and reference.
4. Click **Save** to record the payment.

### ZATCA QR Generation

When an invoice is saved, a Phase 1 ZATCA QR string is generated using the
company name **"شركة ثمار الصفاء المتميزة التجارية"** and VAT number
**311452959900003**. The timestamp, VAT amount and total come from the invoice
data. The resulting value is stored in the `inv_QR` field of the invoice.

#### API Endpoints

- `getPayTypeList`
- `customers_list`
- `GetItemsList/`
- `invoices_list`
- `api_create_invoice`
- `api_create_invoice_dtl`
- `invoices_dtl_list`
- `api_update_invoice_dtl`
- `api_delete_invoice_dtl`

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-app-template/blob/main/LICENSE).
