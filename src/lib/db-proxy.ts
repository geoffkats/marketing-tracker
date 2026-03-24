/**
 * Helper to proxy requests to Express DB service
 */

const DB_SERVICE_PORT = '3001'

export async function proxyToDBService(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `http://localhost:${DB_SERVICE_PORT}${path}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  return response
}

export async function getFromDBService<T>(path: string): Promise<T> {
  const response = await proxyToDBService(path)
  
  if (!response.ok) {
    throw new Error(`DB Service error: ${response.status}`)
  }
  
  return response.json()
}

export async function postToDBService<T>(path: string, data: unknown): Promise<T> {
  const response = await proxyToDBService(path, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error(`DB Service error: ${response.status}`)
  }
  
  return response.json()
}

export async function patchToDBService<T>(path: string, data: unknown): Promise<T> {
  const response = await proxyToDBService(path, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error(`DB Service error: ${response.status}`)
  }
  
  return response.json()
}

export async function deleteFromDBService<T>(path: string): Promise<T> {
  const response = await proxyToDBService(path, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error(`DB Service error: ${response.status}`)
  }
  
  return response.json()
}
