export interface ClassReference {
    _id: string;
    classNumber: string;
}

export interface StudentReference {
    _id: string;
    name: string;
}

export default interface UserModel {
    id?: number,
    name: string,
    password?: string,
    email: string,
    role: string,
    status?: 'active' | 'inactive',
    classes?: ClassReference[], // For teachers
    students?: StudentReference[], // For therapists
}



