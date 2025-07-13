export default interface UserModel {
    id?: number,
    name: string,
    password?: string,
    email: string,
    role: string,
    status?: 'active' | 'inactive',
}



