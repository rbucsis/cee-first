const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dev_token') : null;

  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type")
  let data
  if (contentType.includes('text/plain')) {
    data = await response.text().catch(() => ({}));
  } else {
    data = await response.json().catch(() => ({}));
  }

  if (!response.ok) {
    console.log(response)
    const message = data.detail || `Request failed with status ${response.status}`;
    throw new Error((typeof message !== 'string' ? JSON.stringify(message) : message));
  }

  return data;
}