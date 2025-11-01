# Invoice Edit Functionality Report

## Overview
This report details the invoice edit functionality implemented in `/app/dashboard/forms/invoices/Gold_invoice2/page.tsx`. The functionality allows users to edit existing invoices and their details (items), including search capabilities, navigation between invoices, and manual total adjustments.

## Key Features

### 1. Invoice Loading and Search
- **URL-based Loading**: When an invoice ID is passed via URL parameter (`inv_id`), the system automatically loads that invoice
- **Search Functionality**: Users can search for invoices by number using the search box in the header
- **Navigation**: Users can navigate between invoices using first/prev/next/last buttons

```typescript
useEffect(() => {
  const invId = searchParams.get("inv_id");
  const isNewInvoice = searchParams.get("new") === "true";

  if (isNewInvoice) {
    resetInvoiceForm();
    return;
  }

  if (invId) {
    setSearchNumber(invId);
    handleInvoiceSearch(invId);
  }
}, [searchParams]);
```

### 2. Invoice Data Structure
The system maintains two important states:
- `invoiceItems`: Current items state that can be edited
- `originalInvoiceItems`: Items as they were loaded, for comparison during updates
- `deletedItems`: Items that were removed from the original invoice, to be deleted from DB

### 3. Edit Mode State Management
- `isEditing`: Controls whether form fields are editable
- `isExistingInvoice`: Indicates if this is a pre-existing invoice vs new one
- `invoicePk`: Primary key of the invoice in the database

```typescript
const [isEditing, setIsEditing] = useState<boolean>(true);
const [isExistingInvoice, setIsExistingInvoice] = useState<boolean>(false);
const [invoicePk, setInvoicePk] = useState<number | null>(null);
```

### 4. Update Process
When updating an existing invoice:

#### 4.1 Update Invoice Header
- Uses PATCH request to `api_update_invoice/${invoicePk}`
- Updates main invoice information (customer, date, amounts, etc.)

#### 4.2 Smart Invoice Details Update
The system implements a smart update strategy for invoice details:

1. **Identify Deleted Items**: 
   - Compares original items with current items
   - Tracks items that were removed from the original set
   - Sends DELETE requests to `api_delete_invoice_dtl/${item.id}`

2. **Update Existing Items**:
   - For items present in both original and current, sends PATCH requests to `api_update_invoice_dtl/${item.id}`

3. **Create New Items**:
   - For items that weren't in the original invoice, sends POST requests to `api_create_invoice_dtl`

```typescript
// Update smart for invoice details
const originalIds = originalInvoiceItems.map((item) => item.id);
const currentIds = invoiceItems.map((item) => item.id);

// Delete removed items from database
if (deletedItems.length > 0) {
  for (const itemToDelete of deletedItems) {
    await apiFetch(`${API_BASE_URL}api_delete_invoice_dtl/${itemToDelete.id}`, { 
      method: "DELETE" 
    });
  }
}

// Update or add rows
for (const row of invoiceItems) {
  if (!row.item_id) continue;
  if (originalIds.includes(row.id)) {
    // Update existing
    await apiFetch(`${API_BASE_URL}api_update_invoice_dtl/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dtl),
    });
  } else {
    // Create new
    await apiFetch(`${API_BASE_URL}api_create_invoice_dtl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dtl),
    });
  }
}
```

### 5. API Endpoints Used for Editing
The invoice edit functionality utilizes the following API endpoints:

- **Invoice Header Updates**:
  - `PATCH /api_update_invoice/${invoicePk}` - Updates invoice header information
  - `GET /invoices_list?xinv_id=${num}&xtrans_type=2` - Fetches invoice header data

- **Invoice Details Updates**:
  - `PATCH /api_update_invoice_dtl/${item.id}` - Updates existing invoice detail items
  - `POST /api_create_invoice_dtl` - Creates new invoice detail items
  - `DELETE /api_delete_invoice_dtl/${item.id}` - Deletes removed invoice detail items
  - `GET /invoices_dtl_list?inv=${invoicePk}` - Fetches invoice details for a specific invoice

- **Supporting Endpoints**:
  - `GET /customers_list` - Fetches customer data
  - `GET /GetItemsList/` - Fetches item catalog
  - `GET /categories_list/` - Fetches category information
  - `GET /home_list` - Fetches system settings including purity values

### 5. Item Management
#### 5.1 Item Removal Handling
The system carefully tracks which items should be deleted from the database:

```typescript
const handleItemRemoved = (removedItem: InvoiceItem) => {
  // Only add to deletedItems if the item existed in the original invoice
  const isOriginalItem = originalInvoiceItems.some(item => item.id === removedItem.id);

  if (isOriginalItem) {
    setDeletedItems(prev => [...prev, removedItem]);
  }
};
```

#### 5.2 Single Row Protection
If there's only one row in the invoice, removing it empties the row instead of deleting it:

```typescript
const removeRow = (id: number) => {
  if (invoiceItems.length === 1) {
    const updated = [...invoiceItems];
    const index = updated.findIndex(item => item.id === id);
    
    if (index !== -1) {
      updated[index] = {
        ...updated[index],
        item_id: null,
        item_code: "",
        item_name: "",
        // Reset all fields to defaults
        // ...
      };
    }
    
    setInvoiceItems(updated);
    return;
  }
  
  // For multiple items, proceed with actual deletion
  const itemToRemove = invoiceItems.find(item => item.id === id);
  if (itemToRemove && onItemRemoved) {
    onItemRemoved(itemToRemove);
  }
  
  const updated = invoiceItems.filter(item => item.id !== id);
  setInvoiceItems(updated);
};
```

### 6. Manual Totals Feature
The system supports manual adjustment of total values:

- **Auto Totals**: Calculated automatically from item details
- **Manual Totals**: User can override calculated totals
- **Toggle**: Switch between auto and manual calculation modes

```typescript
const [manualTotalValue, setManualTotalValue] = useState<number>(0);
const [manualTotalWages, setManualTotalWages] = useState<number>(0);
const [useManualTotals, setUseManualTotals] = useState<boolean>(false);
```

### 7. Data Persistence
- **Local Storage**: Draft invoices are saved to localStorage when in edit mode
- **Automatic Restore**: Previous draft is restored when entering edit mode
- **Cleanup**: Draft is removed after successful save

### 8. UI/UX Features
- **Edit Button**: Visible when viewing existing invoices, switches to edit mode
- **State Preservation**: Editing state is preserved during navigation
- **Visual Indicators**: Form becomes read-only with reduced opacity when not in edit mode
- **Confirmation**: Users can confirm before loading invoice data from reference numbers

## Security and Data Integrity
- **Primary Key Validation**: Ensures `invoicePk` exists before update operations
- **Field Sanitization**: Removes null/undefined values before API calls
- **Reference Management**: Properly tracks changes between original and current state
- **Branch Context**: Automatically applies branch context to API calls

## Error Handling
- **API Response Validation**: Checks for proper response structure
- **User Feedback**: Uses toast notifications for success/error messages
- **Graceful Degradation**: Handles missing data with default values
- **Console Logging**: Comprehensive logging for debugging purposes

## Performance Considerations
- **Caching**: Fraction settings are cached to avoid repeated API calls
- **State Management**: Efficient state updates using functional updates
- **API Optimization**: Uses proper filtering at API level to minimize data transfer
- **Batch Operations**: Handles multiple detail updates in sequence
