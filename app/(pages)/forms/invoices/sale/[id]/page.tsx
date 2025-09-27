import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import InvoiceService from '@/services/api/invoice.service';
import { Breadcrumb } from '@/components';

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: `فاتورة رقم ${id}`,
    description: `عرض تفاصيل فاتورة رقم ${id}`,
  };
}

// Server component to fetch and display invoice details
export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch invoice data
  const invoiceData = await InvoiceService.getInvoiceById(id);
  
  // If invoice not found, show 404
  if (!invoiceData) {
		
    notFound();
  }
  
  const { invoice, details } = invoiceData;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={[
        { name: 'الرئيسية', href: '' },
        { name: 'الفواتير', href: '/forms/invoices/sale' },
        { name: `فاتورة رقم: ${invoice.inv_id}` }
      ]} />
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">فاتورة رقم: {invoice.inv_id}</h1>
          <p className="text-gray-600">تاريخ الفاتورة: {new Date(invoice.inv_date).toLocaleDateString('ar-EG')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-2">معلومات الفاتورة</h2>
            <div className="space-y-2">
              <p><span className="font-medium">المبلغ الإجمالي:</span> {invoice.inv_amt || 'غير محدد'}</p>
              <p><span className="font-medium">الصافي:</span> {invoice.inv_net || 'غير محدد'}</p>
              {invoice.gold_price && (
                <p><span className="font-medium">سعر الذهب:</span> {invoice.gold_price}</p>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">تفاصيل إضافية</h2>
            <div className="space-y-2">
              <p><span className="font-medium">رقم التعريف:</span> {invoice.id}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">تفاصيل الفاتورة</h2>
          {details.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-right">الصنف</th>
                    <th className="py-2 px-4 border-b text-right">الكمية</th>
                    <th className="py-2 px-4 border-b text-right">الوزن</th>
                    <th className="py-2 px-4 border-b text-right">السعر</th>
                    <th className="py-2 px-4 border-b text-right">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail) => (
                    <tr key={detail.id} className="border-b">
                      <td className="py-2 px-4">{detail.item_name || detail.item_code || 'غير محدد'}</td>
                      <td className="py-2 px-4 text-center">{detail.qty}</td>
                      <td className="py-2 px-4 text-center">{detail.weight}</td>
                      <td className="py-2 px-4 text-center">{detail.price}</td>
                      <td className="py-2 px-4 text-center">{(detail.weight * detail.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد تفاصيل للفاتورة</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button 
            // onClick={() => window.print()}
            className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            طباعة الفاتورة
          </button>
        </div>
      </div>
    </div>
  );
}
