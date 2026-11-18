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
        staleTime: 10 * 60 * 1000, // 10 minutes - users don't change often
    });
}

export function useUser(id: number) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: async () => {
            const { data } = await userApi.getById(id);
            return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
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
        staleTime: 10 * 60 * 1000, // 10 minutes
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
        staleTime: 10 * 60 * 1000, // 10 minutes
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
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await qc.cancelQueries({ queryKey: userKeys.all });

            // Snapshot previous values
            const previousUser = qc.getQueryData(userKeys.detail(id));
            const queryCache = qc.getQueryCache();
            const previousLists = new Map();

            queryCache.findAll({ queryKey: userKeys.all }).forEach(query => {
                previousLists.set(query.queryKey, query.state.data);
            });

            // Optimistically activate
            if (previousUser) {
                qc.setQueryData(userKeys.detail(id), (old: any) => ({ ...old, activated: true }));
            }

            // Update in all lists
            queryCache.findAll({ queryKey: userKeys.all }).forEach(query => {
                qc.setQueryData(
                    query.queryKey,
                    (old: any) => Array.isArray(old) ? old.map((u: any) => u.id === id ? { ...u, activated: true } : u) : old
                );
            });

            return { previousUser, previousLists };
        },
        onError: (err, id, context) => {
            // Rollback on error
            const ctx = context as { previousUser?: any; previousLists?: Map<any, any> };
            if (ctx?.previousUser) {
                qc.setQueryData(userKeys.detail(id), ctx.previousUser);
            }
            if (ctx?.previousLists) {
                ctx.previousLists.forEach((data: any, queryKey: any) => {
                    qc.setQueryData(queryKey, data);
                });
            }
        },
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
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await qc.cancelQueries({ queryKey: userKeys.all });

            // Snapshot previous values
            const previousUser = qc.getQueryData(userKeys.detail(id));
            const queryCache = qc.getQueryCache();
            const previousLists = new Map();

            queryCache.findAll({ queryKey: userKeys.all }).forEach(query => {
                previousLists.set(query.queryKey, query.state.data);
            });

            // Optimistically deactivate
            if (previousUser) {
                qc.setQueryData(userKeys.detail(id), (old: any) => ({ ...old, activated: false }));
            }

            // Update in all lists
            queryCache.findAll({ queryKey: userKeys.all }).forEach(query => {
                qc.setQueryData(
                    query.queryKey,
                    (old: any) => Array.isArray(old) ? old.map((u: any) => u.id === id ? { ...u, activated: false } : u) : old
                );
            });

            return { previousUser, previousLists };
        },
        onError: (err, id, context) => {
            // Rollback on error
            const ctx = context as { previousUser?: any; previousLists?: Map<any, any> };
            if (ctx?.previousUser) {
                qc.setQueryData(userKeys.detail(id), ctx.previousUser);
            }
            if (ctx?.previousLists) {
                ctx.previousLists.forEach((data: any, queryKey: any) => {
                    qc.setQueryData(queryKey, data);
                });
            }
        },
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: userKeys.detail(id) });
            qc.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}
