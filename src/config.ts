function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. ` +
      `Set it in your MCP client config or run the setup script.`
    );
  }
  return value;
}

const tenantId = required("BC_TENANT_ID");
const environment = required("BC_ENVIRONMENT");
const customPublisher = process.env.BC_CUSTOM_API_PUBLISHER || "";
const customGroup = process.env.BC_CUSTOM_API_GROUP || "";
const customVersion = process.env.BC_CUSTOM_API_VERSION || "v1.0";

export const CONFIG = {
  tenantId,
  environment,
  company: required("BC_COMPANY"),
  standardBase:
    `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/api/v2.0`,
  customBase: customPublisher && customGroup
    ? `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/api/${customPublisher}/${customGroup}/${customVersion}`
    : "",
};
