// API 基础地址配置
// 由于前后端部署在同一域名下，使用相对路径 /api/v1
const BASE_URL = '/api/v1'

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  
  const data = await response.json()
  
  if (data.code !== 200 && data.code !== undefined) {
    throw new Error(data.message || '请求失败')
  }
  
  return data.data || data
}

export async function post<T>(url: string, body: any): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function get<T>(url: string): Promise<T> {
  return request<T>(url, {
    method: 'GET'
  })
}

export async function put<T>(url: string, body: any): Promise<T> {
  return request<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function del<T>(url: string): Promise<T> {
  return request<T>(url, {
    method: 'DELETE'
  })
}
