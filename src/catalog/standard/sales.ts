import type { EntityDefinition } from "../types.js";
import {
  str, uuid, date, datetime, decimal, int32, bool, opt, ro,
  sellToAddress, billToAddress, shipToAddress, dimensions, salesDocTotals, lineFields,
} from "../helpers.js";

const listOnly = { list: true, create: false, modify: false, delete: false };
const fullCrud = { list: true, create: true, modify: true, delete: true };

const salesDocDescription =
  "Manages sales order documents including customer details, billing and shipping addresses, order status, delivery dates, and financial totals. Supports full CRUD operations for creating, retrieving, updating, and deleting sales orders, enabling integration with e-commerce platforms, order processing systems, and automated sales workflows.";

const salesOrderProps = [
  uuid("id", "Id"),
  str("number", "Number"),
  str("externalDocumentNumber", "External Document No."),
  date("orderDate", "Order Date"),
  date("postingDate", "Posting Date"),
  uuid("customerId", "Customer Id"),
  str("customerNumber", "Customer No."),
  ro(str("customerName", "Customer Name")),
  ro(str("billToName", "Bill-to Name")),
  uuid("billToCustomerId", "Bill-to Customer Id"),
  str("billToCustomerNumber", "Bill-to Customer No."),
  ...shipToAddress(),
  ...sellToAddress(),
  ...billToAddress(),
  ...dimensions(),
  uuid("currencyId", "Currency Id"),
  str("currencyCode", "Currency Code"),
  bool("pricesIncludeTax", "Prices Include Tax"),
  uuid("paymentTermsId", "Payment Terms Id"),
  uuid("shipmentMethodId", "Shipment Method Id"),
  str("salesperson", "Salesperson"),
  bool("partialShipping", "Partial Shipping"),
  date("requestedDeliveryDate", "Requested Delivery Date"),
  decimal("discountAmount", "Discount Amount"),
  ...salesDocTotals(),
  ro(bool("fullyShipped", "Fully Shipped")),
  ro(opt("status", "Status", ["Draft", "In_x0020_Review", "Open"])),
  ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  str("phoneNumber", "Phone No."),
  str("email", "Email"),
];

export const salesOrders: EntityDefinition = {
  entityName: "salesOrder",
  entitySetName: "salesOrders",
  pageId: "PAG30028",
  apiBase: "standard",
  description: salesDocDescription,
  keyStrategy: { kind: "uuid" },
  operations: fullCrud,
  actions: [
    {
      name: "ShipAndInvoice",
      description: "Ships and invoices the sales order.",
    },
  ],
  properties: salesOrderProps,
};

export const salesOrderLines: EntityDefinition = {
  entityName: "salesOrderLine",
  entitySetName: "salesOrderLines",
  pageId: "PAG30044",
  apiBase: "standard",
  description:
    "Exposes detailed sales order line data including item, variant, location, quantity, pricing, discounts, tax amounts, and shipment dates.",
  keyStrategy: { kind: "uuid" },
  operations: fullCrud,
  subEntityOf: {
    parentEntitySetName: "salesOrders",
    parentKeyParam: "SalesOrder_id",
    parentDescription: "Parent sales order identification.",
    parentListTool: "ListSalesOrders_PAG30028",
  },
  properties: lineFields(),
};

export const salesQuotes: EntityDefinition = {
  entityName: "salesQuote",
  entitySetName: "salesQuotes",
  pageId: "PAG30037",
  apiBase: "standard",
  description:
    "Manages sales quote documents including customer details, pricing, and delivery information.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("number", "Number"),
    str("externalDocumentNumber", "External Document No."),
    date("documentDate", "Document Date"),
    date("dueDate", "Due Date"),
    uuid("customerId", "Customer Id"),
    str("customerNumber", "Customer No."),
    ro(str("customerName", "Customer Name")),
    ...sellToAddress(),
    ...billToAddress(),
    ...shipToAddress(),
    ...dimensions(),
    uuid("currencyId", "Currency Id"),
    str("currencyCode", "Currency Code"),
    uuid("paymentTermsId", "Payment Terms Id"),
    uuid("shipmentMethodId", "Shipment Method Id"),
    str("salesperson", "Salesperson"),
    ...salesDocTotals(),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
    str("phoneNumber", "Phone No."),
    str("email", "Email"),
    ro(str("status", "Status")),
    date("sentDate", "Sent Date"),
    date("validUntilDate", "Valid Until Date"),
    bool("acceptedDate", "Accepted Date"),
  ],
};

export const salesQuoteLines: EntityDefinition = {
  entityName: "salesQuoteLine",
  entitySetName: "salesQuoteLines",
  pageId: "PAG30045",
  apiBase: "standard",
  description: "Exposes sales quote line data including items, quantities, and pricing.",
  keyStrategy: { kind: "uuid" },
  operations: fullCrud,
  subEntityOf: {
    parentEntitySetName: "salesQuotes",
    parentKeyParam: "SalesQuote_id",
    parentDescription: "Parent sales quote identification.",
    parentListTool: "ListSalesQuotes_PAG30037",
  },
  properties: lineFields(),
};

export const salesCreditMemos: EntityDefinition = {
  entityName: "salesCreditMemo",
  entitySetName: "salesCreditMemos",
  pageId: "PAG30038",
  apiBase: "standard",
  description:
    "Manages sales credit memo documents for processing customer returns and credit adjustments.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("number", "Number"),
    str("externalDocumentNumber", "External Document No."),
    date("creditMemoDate", "Credit Memo Date"),
    date("dueDate", "Due Date"),
    uuid("customerId", "Customer Id"),
    str("customerNumber", "Customer No."),
    ro(str("customerName", "Customer Name")),
    ...sellToAddress(),
    ...billToAddress(),
    ...dimensions(),
    uuid("currencyId", "Currency Id"),
    str("currencyCode", "Currency Code"),
    uuid("paymentTermsId", "Payment Terms Id"),
    str("salesperson", "Salesperson"),
    ...salesDocTotals(),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
    str("phoneNumber", "Phone No."),
    str("email", "Email"),
    ro(str("status", "Status")),
  ],
};

export const salesCreditMemoLines: EntityDefinition = {
  entityName: "salesCreditMemoLine",
  entitySetName: "salesCreditMemoLines",
  pageId: "PAG30046",
  apiBase: "standard",
  description: "Exposes sales credit memo line data.",
  keyStrategy: { kind: "uuid" },
  operations: fullCrud,
  subEntityOf: {
    parentEntitySetName: "salesCreditMemos",
    parentKeyParam: "SalesCreditMemo_id",
    parentDescription: "Parent sales credit memo identification.",
    parentListTool: "ListSalesCreditMemos_PAG30038",
  },
  properties: lineFields(),
};

export const salesInvoices: EntityDefinition = {
  entityName: "salesInvoice",
  entitySetName: "salesInvoices",
  pageId: "PAG30012",
  apiBase: "standard",
  description:
    "Exposes posted and draft sales invoice documents including customer, pricing, and payment details.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("number", "Number"),
    str("externalDocumentNumber", "External Document No."),
    date("invoiceDate", "Invoice Date"),
    date("dueDate", "Due Date"),
    date("postingDate", "Posting Date"),
    uuid("customerId", "Customer Id"),
    str("customerNumber", "Customer No."),
    ro(str("customerName", "Customer Name")),
    ...sellToAddress(),
    ...billToAddress(),
    ...shipToAddress(),
    ...dimensions(),
    uuid("currencyId", "Currency Id"),
    str("currencyCode", "Currency Code"),
    uuid("paymentTermsId", "Payment Terms Id"),
    uuid("shipmentMethodId", "Shipment Method Id"),
    str("salesperson", "Salesperson"),
    ...salesDocTotals(),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
    str("phoneNumber", "Phone No."),
    str("email", "Email"),
    ro(str("status", "Status")),
  ],
};

export const salesInvoiceLines: EntityDefinition = {
  entityName: "salesInvoiceLine",
  entitySetName: "salesInvoiceLines",
  pageId: "PAG30043",
  apiBase: "standard",
  description: "Exposes sales invoice line data.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  subEntityOf: {
    parentEntitySetName: "salesInvoices",
    parentKeyParam: "SalesInvoice_id",
    parentDescription: "Parent sales invoice identification.",
    parentListTool: "ListSalesInvoices_PAG30012",
  },
  properties: lineFields(),
};

export const salesShipments: EntityDefinition = {
  entityName: "salesShipment",
  entitySetName: "salesShipments",
  pageId: "PAG30062",
  apiBase: "standard",
  description: "Exposes posted sales shipment header data.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("number", "Number"),
    str("externalDocumentNumber", "External Document No."),
    date("shipmentDate", "Shipment Date"),
    str("customerNumber", "Customer No."),
    ro(str("customerName", "Customer Name")),
    ...sellToAddress(),
    ...billToAddress(),
    ...shipToAddress(),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const salesShipmentLines: EntityDefinition = {
  entityName: "salesShipmentLine",
  entitySetName: "salesShipmentLines",
  pageId: "PAG30063",
  apiBase: "standard",
  description: "Exposes posted sales shipment line data.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  subEntityOf: {
    parentEntitySetName: "salesShipments",
    parentKeyParam: "SalesShipment_id",
    parentDescription: "Parent sales shipment identification.",
    parentListTool: "ListSalesShipments_PAG30062",
  },
  properties: [
    uuid("id", "Id"),
    uuid("documentId", "Document Id"),
    int32("sequence", "Sequence"),
    uuid("itemId", "Item Id"),
    str("lineObjectNumber", "Line Object Number"),
    str("description", "Description"),
    str("unitOfMeasureCode", "Unit of Measure Code"),
    decimal("quantity", "Quantity"),
    date("shipmentDate", "Shipment Date"),
  ],
};

export const salesEntities: EntityDefinition[] = [
  salesOrders,
  salesOrderLines,
  salesQuotes,
  salesQuoteLines,
  salesCreditMemos,
  salesCreditMemoLines,
  salesInvoices,
  salesInvoiceLines,
  salesShipments,
  salesShipmentLines,
];
