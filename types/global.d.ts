declare module "written-number" {
  interface WrittenNumber {
    (num: number): string;
    defaults: { lang: string };
  }
  const writtenNumber: WrittenNumber;
  export default writtenNumber;
}

declare module "html2pdf.js" {
  const html2pdf: any;
  export default html2pdf;
}
