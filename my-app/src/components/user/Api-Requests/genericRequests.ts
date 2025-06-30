import httpSrvice from "./httpService";

export const getItemById = <T>(route: string, id: string) => {
    return httpSrvice.get<T>(`/${route}/${id}`);
};

export const getAllItems = <T>(route: string) => {
    return httpSrvice.get<T>(`/${route}`);
};

export const deleteItem = <T>(route: string, id: string) => {
    return httpSrvice.delete<T>(`/${route}/${id}`);
};

export const addItem = <T>(route: string, item: T) => {
    return httpSrvice.post<T>(`/${route}`, item);
};

export const updateItem = <T>(route: string, id: string, item: T) => {
    return httpSrvice.put<T>(`/${route}/${id}`, item);
};
