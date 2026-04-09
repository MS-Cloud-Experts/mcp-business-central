import type { EntityDefinition } from "../types.js";
import { str, uuid, date, datetime, decimal, int32, ro } from "../helpers.js";

const listOnly = { list: true, create: false, modify: false, delete: false };

export const agedAccountsReceivable: EntityDefinition = {
  entityName: "agedAccountsReceivable",
  entitySetName: "agedAccountsReceivable",
  pageId: "PAG30031",
  apiBase: "standard",
  description: "Exposes aged accounts receivable report data by customer showing current, 1-30, 31-60, 61-90, and 91+ day balances.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("customerId", "Customer Id"),
    str("customerNumber", "Customer Number"),
    str("name", "Name"),
    str("currencyCode", "Currency Code"),
    decimal("balanceDue", "Balance Due"),
    decimal("currentAmount", "Current Amount"),
    decimal("period1Amount", "Period 1 Amount"),
    decimal("period2Amount", "Period 2 Amount"),
    decimal("period3Amount", "Period 3 Amount"),
    date("agedAsOfDate", "Aged As Of Date"),
    str("periodLengthFilter", "Period Length Filter"),
  ],
};

export const agedAccountsPayable: EntityDefinition = {
  entityName: "agedAccountsPayable",
  entitySetName: "agedAccountsPayable",
  pageId: "PAG30032",
  apiBase: "standard",
  description: "Exposes aged accounts payable report data by vendor.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("vendorId", "Vendor Id"),
    str("vendorNumber", "Vendor Number"),
    str("name", "Name"),
    str("currencyCode", "Currency Code"),
    decimal("balanceDue", "Balance Due"),
    decimal("currentAmount", "Current Amount"),
    decimal("period1Amount", "Period 1 Amount"),
    decimal("period2Amount", "Period 2 Amount"),
    decimal("period3Amount", "Period 3 Amount"),
    date("agedAsOfDate", "Aged As Of Date"),
    str("periodLengthFilter", "Period Length Filter"),
  ],
};

export const balanceSheet: EntityDefinition = {
  entityName: "balanceSheet",
  entitySetName: "balanceSheet",
  pageId: "PAG30033",
  apiBase: "standard",
  description: "Exposes balance sheet report data.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    int32("lineNumber", "Line Number"),
    str("display", "Display"),
    decimal("balance", "Balance"),
    str("lineType", "Line Type"),
    int32("indentation", "Indentation"),
    date("dateFilter", "Date Filter"),
  ],
};

export const trialBalance: EntityDefinition = {
  entityName: "trialBalance",
  entitySetName: "trialBalance",
  pageId: "PAG30034",
  apiBase: "standard",
  description: "Exposes trial balance report data.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    str("number", "Number"),
    str("accountType", "Account Type"),
    str("display", "Display"),
    decimal("totalDebit", "Total Debit"),
    decimal("totalCredit", "Total Credit"),
    decimal("balanceAtDateDebit", "Balance at Date Debit"),
    decimal("balanceAtDateCredit", "Balance at Date Credit"),
    date("dateFilter", "Date Filter"),
  ],
};

export const incomeStatement: EntityDefinition = {
  entityName: "incomeStatement",
  entitySetName: "incomeStatement",
  pageId: "PAG30035",
  apiBase: "standard",
  description: "Exposes income statement report data.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    int32("lineNumber", "Line Number"),
    str("display", "Display"),
    decimal("netChange", "Net Change"),
    str("lineType", "Line Type"),
    int32("indentation", "Indentation"),
    date("dateFilter", "Date Filter"),
  ],
};

export const cashFlowStatement: EntityDefinition = {
  entityName: "cashFlowStatement",
  entitySetName: "cashFlowStatement",
  pageId: "PAG30026",
  apiBase: "standard",
  description: "Exposes cash flow statement report data.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    int32("lineNumber", "Line Number"),
    str("display", "Display"),
    decimal("netChange", "Net Change"),
    str("lineType", "Line Type"),
    int32("indentation", "Indentation"),
    date("dateFilter", "Date Filter"),
  ],
};

export const retainedEarningsStatement: EntityDefinition = {
  entityName: "retainedEarningsStatement",
  entitySetName: "retainedEarningsStatement",
  pageId: "PAG30029",
  apiBase: "standard",
  description: "Exposes retained earnings statement report data.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    int32("lineNumber", "Line Number"),
    str("display", "Display"),
    decimal("netChange", "Net Change"),
    str("lineType", "Line Type"),
    int32("indentation", "Indentation"),
    date("dateFilter", "Date Filter"),
  ],
};

export const timeRegistrationEntries: EntityDefinition = {
  entityName: "timeRegistrationEntry",
  entitySetName: "timeRegistrationEntries",
  pageId: "PAG30041",
  apiBase: "standard",
  description: "Exposes employee time registration entries.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    uuid("employeeId", "Employee Id"),
    str("employeeNumber", "Employee Number"),
    date("date", "Date"),
    decimal("quantity", "Quantity"),
    str("status", "Status"),
    str("unitOfMeasureId", "Unit of Measure Id"),
    str("unitOfMeasureCode", "Unit of Measure Code"),
    ro(datetime("lastModifiedDateTime", "Last Modified Date-Time")),
  ],
};

export const pdfDocument: EntityDefinition = {
  entityName: "pdfDocument",
  entitySetName: "pdfDocument",
  pageId: "PAG30056",
  apiBase: "standard",
  description: "Retrieves PDF documents linked to parent entities like invoices and orders.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  subEntityOf: {
    parentEntitySetName: "salesInvoices",
    parentKeyParam: "parent_id",
    parentDescription: "Parent entity id.",
    parentListTool: "ListSalesInvoices_PAG30012",
  },
  properties: [
    uuid("id", "Id"),
    str("content", "Content"),
  ],
};

export const jobQueueEntries: EntityDefinition = {
  entityName: "jobQueueEntry",
  entitySetName: "jobQueueEntries",
  pageId: "PAG30091",
  apiBase: "standard",
  description: "Exposes job queue entry configuration and status.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    str("objectTypeToRun", "Object Type to Run"),
    int32("objectIdToRun", "Object ID to Run"),
    str("description", "Description"),
    str("status", "Status"),
    str("jobQueueCategoryCode", "Job Queue Category Code"),
    datetime("earliestStartDateTime", "Earliest Start Date/Time"),
    datetime("lastReadyState", "Last Ready State"),
    int32("noOfMinutesBetweenRuns", "No. of Minutes Between Runs"),
    str("recurringJob", "Recurring Job"),
  ],
};

export const jobQueueLogEntries: EntityDefinition = {
  entityName: "jobQueueLogEntry",
  entitySetName: "jobQueueLogEntries",
  pageId: "PAG30090",
  apiBase: "standard",
  description: "Exposes job queue execution log entries.",
  keyStrategy: { kind: "uuid" },
  operations: listOnly,
  properties: [
    uuid("id", "Id"),
    int32("entryNo", "Entry No."),
    str("objectTypeToRun", "Object Type to Run"),
    int32("objectIdToRun", "Object ID to Run"),
    str("description", "Description"),
    str("status", "Status"),
    datetime("startDateTime", "Start Date/Time"),
    datetime("endDateTime", "End Date/Time"),
    str("errorMessage", "Error Message"),
  ],
};

export const reportEntities: EntityDefinition[] = [
  agedAccountsReceivable,
  agedAccountsPayable,
  balanceSheet,
  trialBalance,
  incomeStatement,
  cashFlowStatement,
  retainedEarningsStatement,
  timeRegistrationEntries,
  pdfDocument,
  jobQueueEntries,
  jobQueueLogEntries,
];
