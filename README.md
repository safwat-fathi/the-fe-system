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

| Field | Description |
|-------|-------------|
| `id` | Auto increment key |
| `trans_type` | Invoice type (`2` means sales invoice) |
| `G875` | Purity/calibration value |
| `qty` | Number of pieces |
| `weight` | Gross weight |
| `g_weight` | Net/gauged weight |
| `price` | Price per gram |
| `price_w` | Wage per gram |
| `total` | Total value |
| `total_w` | Total wages |
| `total_a` | Value + wages |
| `inv_note` | Line notes |
| `tax` | Added tax amount |
| `tax_prc` | Tax percentage (15% by default) |
| `stones` | Stones information |
| `item_disc_prc` | Item discount percentage |
| `item_disc_amt` | Item discount amount |
| `sn` | Serial number of the item line |
| `item_desc` | Item description text |
| `cr_date` | Creation timestamp |
| `cr_user` | Username who created the line |
| `upd_date` | Last update timestamp |
| `upd_user` | Username who updated the line |
| `com` | Branch identifier |
| `inv` | Invoice number (foreign key) |
| `item` | Item ID (foreign key) |

### payType

The `payType` dropdown controls which financial columns are shown when editing an invoice:

1 – value only
2 – wages only
3 – value and wages

### Recording Payments

1. Open the **Payments** page from the dashboard.
2. Select the invoice to pay.
3. Enter payment amount, method and reference.
4. Click **Save** to record the payment.

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
