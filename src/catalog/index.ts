import type { EntityDefinition } from "./types.js";
import { masterDataEntities } from "./standard/master-data.js";
import { salesEntities } from "./standard/sales.js";
import { purchasingEntities } from "./standard/purchasing.js";
import { financeEntities } from "./standard/finance.js";
import { projectEntities } from "./standard/projects.js";
import { reportEntities } from "./standard/reports.js";
import { customEntities } from "./custom/index.js";

export const allEntities: EntityDefinition[] = [
  ...masterDataEntities,
  ...salesEntities,
  ...purchasingEntities,
  ...financeEntities,
  ...projectEntities,
  ...reportEntities,
  ...customEntities,
];
