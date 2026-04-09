import { AzureCliCredential } from "@azure/identity";

const BC_SCOPE = "https://api.businesscentral.dynamics.com/.default";

export class AuthProvider {
  private credential = new AzureCliCredential();

  async getToken(): Promise<string> {
    const response = await this.credential.getToken(BC_SCOPE);
    if (!response) {
      throw new Error(
        "Authentication failed. Please run 'az login' in your terminal and try again."
      );
    }
    return response.token;
  }
}
