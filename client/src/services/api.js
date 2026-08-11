import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('avs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('avs_token');
      window.dispatchEvent(new Event('avs-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  localStorage.setItem('avs_token', data.token);
  return data;
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  localStorage.setItem('avs_token', data.token);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post('/projects', payload);
  return data;
}

export async function getProjects() {
  const { data } = await api.get('/projects');
  return data;
}

export async function getProject(id) {
  const { data } = await api.get(`/projects/${id}`);
  return data;
}

export async function runAgent(projectId, autoMode = false) {
  const isAuto = typeof autoMode === 'boolean' ? autoMode : autoMode === 'auto';
  const { data } = await api.post(`/projects/${projectId}/run`, { autoMode: isAuto });
  return data;
}

export async function decideAgent(projectId, agentKey, decision, editedContent) {
  if (decision === 'approve') {
    const { data } = await api.post(`/projects/${projectId}/agents/${agentKey}/approve`);
    return data;
  }
  if (decision === 'regenerate') {
    const { data } = await api.post(`/projects/${projectId}/agents/${agentKey}/regenerate`);
    return data;
  }
  const { data } = await api.post(`/workflows/${projectId}/agents/${agentKey}/decision`, {
    decision,
    editedContent
  });
  return data;
}

export async function createBoardroomSession(payload) {
  const { data } = await api.post('/boardroom/debate', payload);
  return data;
}

export async function askMemory(query) {
  const { data } = await api.get(`/memory/search?q=${encodeURIComponent(query)}`);
  return data;
}

export async function sendProjectEmail(projectId, email) {
  const { data } = await api.post(`/email/${projectId}`, { email });
  return data;
}

export async function getAdminStats() {
  const { data } = await api.get('/admin/stats');
  return data;
}

export async function getAdminUsers() {
  const { data } = await api.get('/admin/users');
  return data;
}

export async function updateUserRole(userId, role) {
  const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
  return data;
}

export async function deleteUser(userId) {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
}

export async function getAdminProjects() {
  const { data } = await api.get('/admin/projects');
  return data;
}

export async function downloadExport(projectId, format) {
  const response = await api.get(`/exports/${projectId}/${format}`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const extension = format === 'markdown' ? 'md' : format;
  link.setAttribute('download', `export_${projectId}.${extension}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function exportUrl(projectId, format) {
  return `/api/exports/${projectId}/${format}`;
}
