import type { EntityDefinition } from "../types.js";
import {
  str, uuid, date, datetime, decimal, int32, bool, opt, ro,
} from "../helpers.js";

const listOnly = { list: true, create: false, modify: false, delete: false };

export const accounts: EntityDefinition = {
  entityName: "account",
  entitySetName: "accounts",
  pageId: "PAG30014",
  apiBase: "standard",
  description: "Exposes chart of accounts data including account categories, subcategories, and balances.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("number", "Number"),
    str("displayName", "Display Name"),
    str("category", "Category"),
    str("subCategory", "Sub Category"),
    bool("blocked", "Blocked"),
    str("accountType", "Account Type"),
    bool("directPosting", "Direct Posting"),
    ro(decimal("balance", "Balance")),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const generalLedgerEntries: EntityDefinition = {
  entityName: "generalLedgerEntry",
  entitySetName: "generalLedgerEntries",
  pageId: "PAG30018",
  apiBase: "standard",
  description: "Exposes general ledger entries for financial tracking.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    int32("entryNumber", "Entry Number"),
    date("postingDate", "Posting Date"),
    str("documentNumber", "Document Number"),
    str("documentType", "Document Type"),
    str("accountId", "Account Id"),
    str("accountNumber", "Account Number"),
    str("description", "Description"),
    decimal("debitAmount", "Debit Amount"),
    decimal("creditAmount", "Credit Amount"),
    str("dimensionSetID", "Dimension Set ID"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const generalLedgerSetup: EntityDefinition = {
  entityName: "generalLedgerSetup",
  entitySetName: "generalLedgerSetup",
  pageId: "PAG30087",
  apiBase: "standard",
  description: "Exposes general ledger setup configuration.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("localCurrencyCode", "Local Currency Code"),
    str("localCurrencySymbol", "Local Currency Symbol"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const journals: EntityDefinition = {
  entityName: "journal",
  entitySetName: "journals",
  pageId: "PAG30016",
  apiBase: "standard",
  description: "Exposes general journal batches for financial data entry.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    str("templateDisplayName", "Template Display Name"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
    str("balancingAccountId", "Balancing Account Id"),
    str("balancingAccountNumber", "Balancing Account Number"),
  ],
};

export const journalLines: EntityDefinition = {
  entityName: "journalLine",
  entitySetName: "journalLines",
  pageId: "PAG30049",
  apiBase: "standard",
  description: "Exposes journal line data within a journal batch.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  subEntityOf: {
    parentEntitySetName: "journals",
    parentKeyParam: "Journal_id",
    parentDescription: "Parent journal identification.",
    parentListTool: "ListJournals_PAG30016",
  },
  properties: [
    uuid("id", "Id"),
    str("journalDisplayName", "Journal Display Name"),
    int32("lineNumber", "Line Number"),
    str("accountType", "Account Type"),
    str("accountId", "Account Id"),
    str("accountNumber", "Account Number"),
    date("postingDate", "Posting Date"),
    str("documentNumber", "Document Number"),
    str("externalDocumentNumber", "External Document Number"),
    decimal("amount", "Amount"),
    str("description", "Description"),
    str("comment", "Comment"),
    str("taxCode", "Tax Code"),
    str("balancingAccountType", "Balancing Account Type"),
    str("balancingAccountId", "Balancing Account Id"),
    str("balancingAccountNumber", "Balancing Account Number"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const customerPaymentJournals: EntityDefinition = {
  entityName: "customerPaymentJournal",
  entitySetName: "customerPaymentJournals",
  pageId: "PAG30013",
  apiBase: "standard",
  description: "Exposes customer payment journal batches.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    str("balancingAccountId", "Balancing Account Id"),
    str("balancingAccountNumber", "Balancing Account Number"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const customerPayments: EntityDefinition = {
  entityName: "customerPayment",
  entitySetName: "customerPayments",
  pageId: "PAG30055",
  apiBase: "standard",
  description: "Exposes customer payment lines within a customer payment journal.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  subEntityOf: {
    parentEntitySetName: "customerPaymentJournals",
    parentKeyParam: "CustomerPaymentJournal_id",
    parentDescription: "Parent customer payment journal identification.",
    parentListTool: "ListCustomerPaymentJournals_PAG30013",
  },
  properties: [
    uuid("id", "Id"),
    str("journalDisplayName", "Journal Display Name"),
    int32("lineNumber", "Line Number"),
    uuid("customerId", "Customer Id"),
    str("customerNumber", "Customer Number"),
    date("postingDate", "Posting Date"),
    str("documentNumber", "Document Number"),
    str("externalDocumentNumber", "External Document Number"),
    decimal("amount", "Amount"),
    str("appliesToInvoiceId", "Applies-to Invoice Id"),
    str("appliesToInvoiceNumber", "Applies-to Invoice Number"),
    str("description", "Description"),
    str("comment", "Comment"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const vendorPaymentJournals: EntityDefinition = {
  entityName: "vendorPaymentJournal",
  entitySetName: "vendorPaymentJournals",
  pageId: "PAG30061",
  apiBase: "standard",
  description: "Exposes vendor payment journal batches.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    str("balancingAccountId", "Balancing Account Id"),
    str("balancingAccountNumber", "Balancing Account Number"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const vendorPayments: EntityDefinition = {
  entityName: "vendorPayment",
  entitySetName: "vendorPayments",
  pageId: "PAG30060",
  apiBase: "standard",
  description: "Exposes vendor payment lines within a vendor payment journal.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  subEntityOf: {
    parentEntitySetName: "vendorPaymentJournals",
    parentKeyParam: "VendorPaymentJournal_id",
    parentDescription: "Parent vendor payment journal identification.",
    parentListTool: "ListVendorPaymentJournals_PAG30061",
  },
  properties: [
    uuid("id", "Id"),
    str("journalDisplayName", "Journal Display Name"),
    int32("lineNumber", "Line Number"),
    uuid("vendorId", "Vendor Id"),
    str("vendorNumber", "Vendor Number"),
    date("postingDate", "Posting Date"),
    str("documentNumber", "Document Number"),
    str("externalDocumentNumber", "External Document Number"),
    decimal("amount", "Amount"),
    str("appliesToInvoiceId", "Applies-to Invoice Id"),
    str("appliesToInvoiceNumber", "Applies-to Invoice Number"),
    str("description", "Description"),
    str("comment", "Comment"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const bankAccounts: EntityDefinition = {
  entityName: "bankAccount",
  entitySetName: "bankAccounts",
  pageId: "PAG30051",
  apiBase: "standard",
  description: "Exposes bank account master data.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("number", "Number"),
    str("displayName", "Display Name"),
    str("bankAccountNumber", "Bank Account Number"),
    bool("blocked", "Blocked"),
    str("currencyCode", "Currency Code"),
    str("intercompanyEnabled", "Intercompany Enabled"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const dims: EntityDefinition = {
  entityName: "dimension",
  entitySetName: "dimensions",
  pageId: "PAG30021",
  apiBase: "standard",
  description: "Exposes dimension definitions used for financial analysis.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const dimensionValues: EntityDefinition = {
  entityName: "dimensionValue",
  entitySetName: "dimensionValues",
  pageId: "PAG30040",
  apiBase: "standard",
  description: "Exposes dimension value records for a given dimension.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  subEntityOf: {
    parentEntitySetName: "dimensions",
    parentKeyParam: "Dimension_id",
    parentDescription: "Parent dimension identification.",
    parentListTool: "ListDimensions_PAG30021",
  },
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const dimensionSetLines: EntityDefinition = {
  entityName: "dimensionSetLine",
  entitySetName: "dimensionSetLines",
  pageId: "PAG30022",
  apiBase: "standard",
  description: "Exposes dimension set line data linked to transactions.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  subEntityOf: {
    parentEntitySetName: "salesOrders",
    parentKeyParam: "parent_id",
    parentDescription: "Parent entity id.",
    parentListTool: "ListSalesOrders_PAG30028",
  },
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    str("valueId", "Value Id"),
    str("valueCode", "Value Code"),
    str("valueDisplayName", "Value Display Name"),
  ],
};

export const currencies: EntityDefinition = {
  entityName: "currency",
  entitySetName: "currencies",
  pageId: "PAG30019",
  apiBase: "standard",
  description: "Exposes currency definitions and symbols.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    str("symbol", "Symbol"),
    int32("amountDecimalPlaces", "Amount Decimal Places"),
    int32("amountRoundingPrecision", "Amount Rounding Precision"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const currencyExchangeRates: EntityDefinition = {
  entityName: "currencyExchangeRate",
  entitySetName: "currencyExchangeRates",
  pageId: "PAG30085",
  apiBase: "standard",
  description: "Exposes currency exchange rate data.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("currencyCode", "Currency Code"),
    date("startingDate", "Starting Date"),
    decimal("exchangeRateAmount", "Exchange Rate Amount"),
    decimal("relationalExchangeRateAmount", "Relational Exchange Rate Amount"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const paymentMethods: EntityDefinition = {
  entityName: "paymentMethod",
  entitySetName: "paymentMethods",
  pageId: "PAG30020",
  apiBase: "standard",
  description: "Exposes payment method definitions.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const paymentTerms: EntityDefinition = {
  entityName: "paymentTerm",
  entitySetName: "paymentTerms",
  pageId: "PAG30023",
  apiBase: "standard",
  description: "Exposes payment term definitions.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    str("dueDateCalculation", "Due Date Calculation"),
    str("discountDateCalculation", "Discount Date Calculation"),
    decimal("discountPercent", "Discount Percent"),
    bool("calculateDiscountOnCreditMemos", "Calculate Discount on Credit Memos"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const shipmentMethods: EntityDefinition = {
  entityName: "shipmentMethod",
  entitySetName: "shipmentMethods",
  pageId: "PAG30024",
  apiBase: "standard",
  description: "Exposes shipment method definitions.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const taxGroups: EntityDefinition = {
  entityName: "taxGroup",
  entitySetName: "taxGroups",
  pageId: "PAG30015",
  apiBase: "standard",
  description: "Exposes tax group definitions.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    str("taxType", "Tax Type"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const taxAreas: EntityDefinition = {
  entityName: "taxArea",
  entitySetName: "taxAreas",
  pageId: "PAG30036",
  apiBase: "standard",
  description: "Exposes tax area definitions.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("displayName", "Display Name"),
    str("taxType", "Tax Type"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const accountingPeriods: EntityDefinition = {
  entityName: "accountingPeriod",
  entitySetName: "accountingPeriods",
  pageId: "PAG30086",
  apiBase: "standard",
  description: "Exposes accounting period definitions.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    date("startingDate", "Starting Date"),
    str("name", "Name"),
    bool("newFiscalYear", "New Fiscal Year"),
    bool("closed", "Closed"),
    bool("dateLocked", "Date Locked"),
  ],
};

export const fixedAssetLocations: EntityDefinition = {
  entityName: "fixedAssetLocation",
  entitySetName: "fixedAssetLocations",
  pageId: "PAG30097",
  apiBase: "standard",
  description: "Exposes fixed asset location definitions.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("code", "Code"),
    str("name", "Name"),
  ],
};

export const financeEntities: EntityDefinition[] = [
  accounts,
  generalLedgerEntries,
  generalLedgerSetup,
  journals,
  journalLines,
  customerPaymentJournals,
  customerPayments,
  vendorPaymentJournals,
  vendorPayments,
  bankAccounts,
  dims,
  dimensionValues,
  dimensionSetLines,
  currencies,
  currencyExchangeRates,
  paymentMethods,
  paymentTerms,
  shipmentMethods,
  taxGroups,
  taxAreas,
  accountingPeriods,
  fixedAssetLocations,
];
