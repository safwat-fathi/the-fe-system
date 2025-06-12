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

- `item_desc` – line description
- `item_qty` – quantity of the item
- `item_price` – unit price used for totals
- `inv_tax` – tax percentage
- `tax_amt` – tax amount for the line
- `inv_status` – status code
- `cr_date` – creation date
- `inv_notes` – additional notes

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

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-app-template/blob/main/LICENSE).
