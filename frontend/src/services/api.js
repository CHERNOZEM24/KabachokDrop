import axios from 'axios'

const API_URL = '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const casesAPI = {
  getCases: () => api.get('/cases/'),
  getCaseById: (id) => api.get(`/cases/${id}/`),
  openCase: (id) => api.post(`/cases/${id}/open/`),
}

export default api