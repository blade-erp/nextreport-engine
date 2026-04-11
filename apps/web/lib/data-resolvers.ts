export async function resolveData(
  requestData?: Record<string, unknown>,
  dataSourceUrl?: string,
): Promise<Record<string, unknown>> {
  if (requestData && Object.keys(requestData).length > 0) return requestData
  if (dataSourceUrl) {
    const response = await fetch(dataSourceUrl)
    return response.json() as Promise<Record<string, unknown>>
  }
  return {}
}
