import httpService from "./httpService";

export const getItemById = <T>(route: string, id: string) => {
    return httpService.get<T>(`/${route}/${id}`);
};

export const getAllItems = <T>(route: string) => {
    return httpService.get<T>(`/${route}`);
};

export const deleteItem = <T>(route: string, id: string) => {
    return httpService.delete<T>(`/${route}/${id}`);
};

export const addItem = <T>(route: string, item: T) => {
    return httpService.post<T>(`/${route}`, item);
};

export const updateItem = <T>(route: string, id: string, item: T) => {
    return httpService.put<T>(`/${route}/${id}`, item);
};