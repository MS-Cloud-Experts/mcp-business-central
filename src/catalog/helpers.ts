import type { PropertyDef } from "./types.js";

export const str = (name: string, desc: string): PropertyDef => ({
  name,
  type: "string",
  description: desc,
});

export const uuid = (name: string, desc: string): PropertyDef => ({
  name,
  type: "string",
  format: "uuid",
  description: desc,
});

export const date = (name: string, desc: string): PropertyDef => ({
  name,
  type: "string",
  format: "date",
  description: desc,
});

export const datetime = (name: string, desc: string): PropertyDef => ({
  name,
  type: "string",
  format: "date-time",
  description: desc,
});

export const decimal = (name: string, desc: string): PropertyDef => ({
  name,
  type: "number",
  format: "decimal",
  description: desc,
});

export const int32 = (name: string, desc: string): PropertyDef => ({
  name,
  type: "integer",
  format: "int32",
  description: desc,
});

export const bool = (name: string, desc: string): PropertyDef => ({
  name,
  type: "boolean",
  description: desc,
});

export const opt = (
  name: string,
  desc: string,
  values: string[]
): PropertyDef => ({
  name,
  type: "string",
  description: desc,
  enum: values,
});

export const ro = (p: PropertyDef): PropertyDef => ({
  ...p,
  readOnly: true,
});

// Shared property groups
export const sellToAddress = (): PropertyDef[] => [
  str("sellToAddressLine1", "Sell-to Address Line 1"),
  str("sellToAddressLine2", "Sell-to Address Line 2"),
  str("sellToCity", "Sell-to City"),
  str("sellToCountry", "Sell-to Country/Region Code"),
  str("sellToState", "Sell-to State"),
  str("sellToPostCode", "Sell-to ZIP Code"),
];

export const billToAddress = (): PropertyDef[] => [
  str("billToAddressLine1", "Bill-to Address Line 1"),
  str("billToAddressLine2", "Bill-to Address Line 2"),
  str("billToCity", "Bill-to City"),
  str("billToCountry", "Bill-to Country/Region Code"),
  str("billToState", "Bill-to State"),
  str("billToPostCode", "Bill-to ZIP Code"),
];

export const shipToAddress = (): PropertyDef[] => [
  str("shipToName", "Ship-to Name"),
  str("shipToContact", "Ship-to Contact"),
  str("shipToAddressLine1", "Ship-to Address Line 1"),
  str("shipToAddressLine2", "Ship-to Address Line 2"),
  str("shipToCity", "Ship-to City"),
  str("shipToCountry", "Ship-to Country/Region Code"),
  str("shipToState", "Ship-to State"),
  str("shipToPostCode", "Ship-to ZIP Code"),
];

export const dimensions = (): PropertyDef[] => [
  str("shortcutDimension1Code", "Shortcut Dimension 1 Code"),
  str("shortcutDimension2Code", "Shortcut Dimension 2 Code"),
];

export const salesDocTotals = (): PropertyDef[] => [
  ro(decimal("discountAmount", "Discount Amount")),
  ro(bool("discountAppliedBeforeTax", "Discount Applied Before Tax")),
  ro(decimal("totalAmountExcludingTax", "Total Amount Excluding Tax")),
  ro(decimal("totalTaxAmount", "Total Tax Amount")),
  ro(decimal("totalAmountIncludingTax", "Total Amount Including Tax")),
];

export const lineFields = (): PropertyDef[] => [
  uuid("id", "Id"),
  ro(uuid("documentId", "Document Id")),
  ro(int32("sequence", "Sequence")),
  uuid("itemId", "Item Id"),
  uuid("accountId", "Account Id"),
  opt("lineType", "Line Type", [
    "Comment",
    "Account",
    "Item",
    "Resource",
    "Fixed_x0020_Asset",
    "Charge",
    "Allocation_x0020_Account",
  ]),
  str("lineObjectNumber", "Line Object Number"),
  str("description", "Description"),
  str("description2", "Description 2"),
  uuid("unitOfMeasureId", "Unit of Measure Id"),
  str("unitOfMeasureCode", "Unit of Measure Code"),
  decimal("quantity", "Quantity"),
  decimal("unitPrice", "Unit Price"),
  decimal("discountAmount", "Discount Amount"),
  decimal("discountPercent", "Discount Percent"),
  ro(bool("discountAppliedBeforeTax", "Discount Applied Before Tax")),
  ro(decimal("amountExcludingTax", "Amount Excluding Tax")),
  str("taxCode", "Tax Code"),
  ro(decimal("taxPercent", "Tax Percent")),
  ro(decimal("totalTaxAmount", "Total Tax Amount")),
  ro(decimal("amountIncludingTax", "Amount Including Tax")),
  ro(decimal("invoiceDiscountAllocation", "Invoice Discount Allocation")),
  ro(decimal("netAmount", "Net Amount")),
  ro(decimal("netTaxAmount", "Net Tax Amount")),
  ro(decimal("netAmountIncludingTax", "Net Amount Including Tax")),
  date("shipmentDate", "Shipment Date"),
  ro(decimal("shippedQuantity", "Shipped Quantity")),
  ro(decimal("invoicedQuantity", "Invoiced Quantity")),
  decimal("invoiceQuantity", "Invoice Quantity"),
  decimal("shipQuantity", "Ship Quantity"),
  uuid("itemVariantId", "Item Variant Id"),
  uuid("locationId", "Location Id"),
];
