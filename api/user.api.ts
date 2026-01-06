import apiClient from './client';

// Types
export type UserRole = 'MEDCIN' | 'SECRETAIRE' | 'ADMIN';

export interface UserDTO {
    id?: number;
    firstName: string;
    lastName: string;
    login: string;
    password?: string;
    phoneNumber: string;
    role: UserRole;
    clinicId?: number;
    active: boolean;
}

export interface CreateUserRequest {
    firstName: string;
    lastName: string;
    login: string;
    password: string;
    phoneNumber: string;
    role: UserRole;
    clinicId?: number;
}

// API Calls
export const userApi = {
    getAll: () =>
        apiClient.get<UserDTO[]>('/api/users'),

    getById: (id: number) =>
        apiClient.get<UserDTO>(`/api/users/${id}`),

    getByClinic: (clinicId: number) =>
        apiClient.get<UserDTO[]>(`/api/users/clinic/${clinicId}`),

    getByRole: (role: UserRole) =>
        apiClient.get<UserDTO[]>(`/api/users/role/${role}`),

    create: (data: CreateUserRequest) =>
        apiClient.post<UserDTO>('/api/users', data),

    update: (id: number, data: UserDTO) =>
        apiClient.put<UserDTO>(`/api/users/${id}`, data),

    activate: (id: number) =>
        apiClient.post<UserDTO>(`/api/users/${id}/activate`),

    deactivate: (id: number) =>
        apiClient.post<UserDTO>(`/api/users/${id}/deactivate`),
};
