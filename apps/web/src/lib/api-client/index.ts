export type ApiClientConfig = {
  baseUrl: string;
};

export function createApiClient({ baseUrl }: ApiClientConfig) {
  return {
    async health() {
      const response = await fetch(new URL("/health", baseUrl));
      return response.json() as Promise<{ data: { status: string } }>;
    }
  };
}
