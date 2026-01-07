import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, UserDTO, CreateUserRequest, UserRole } from '@/api/user.api';

// Query Keys
export const userKeys = {
    all: ['users'] as const,
    list: () => [...userKeys.all, 'list'] as const,
    detail: (id: number) => [...userKeys.all, id] as const,
    byClinic: (clinicId: number) => [...userKeys.all, 'clinic', clinicId] as const,
    byRole: (role: UserRole) => [...userKeys.all, 'role', role] as const,
    current: (login: string | undefined) => [...userKeys.all, 'current', login] as const,
};

// Hooks
export function useUsers() {
    return useQuery({
        queryKey: userKeys.list(),
        queryFn: async () => {
            const { data } = await userApi.getAll();
            return data;
        },
    });
}

export function useUser(id: number) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: async () => {
            const { data } = await userApi.getById(id);
            return data;
        },
        enabled: id > 0,
    });
}

export function useUsersByClinic(clinicId: number) {
    return useQuery({
        queryKey: userKeys.byClinic(clinicId),
        queryFn: async () => {
            const { data } = await userApi.getByClinic(clinicId);
            return data;
        },
        enabled: clinicId > 0,
    });
}

export function useUsersByRole(role: UserRole) {
    return useQuery({
        queryKey: userKeys.byRole(role),
        queryFn: async () => {
            const { data } = await userApi.getByRole(role);
            return data;
        },
    });
}

export function useCurrentUser(login: string | undefined) {
    return useQuery({
        queryKey: userKeys.current(login),
        queryFn: async () => {
            const { data } = await userApi.getByLogin(login!);
            return data;
        },
        enabled: !!login,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
}

export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (user: CreateUserRequest) => userApi.create(user),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
}

export function useUpdateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UserDTO }) =>
            userApi.update(id, data),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: userKeys.detail(id) });
            qc.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

export function useActivateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => userApi.activate(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: userKeys.detail(id) });
            qc.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

export function useDeactivateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => userApi.deactivate(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: userKeys.detail(id) });
            qc.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}
