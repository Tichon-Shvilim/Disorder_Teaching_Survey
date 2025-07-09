import { getAllItems, getItemById, addItem, updateItem, deleteItem } from './genericRequests';

export interface Student {
  _id: string;
  name: string;
  DOB: string;
  age?: number; // This will be calculated on frontend
}

export interface CreateStudentRequest {
  name: string;
  DOB: string;
}

export interface UpdateStudentRequest extends CreateStudentRequest {
  _id: string;
}

// Student API functions
export const getAllStudents = () => {
  return getAllItems<Student[]>('api/students/');
};

export const getStudentById = (id: string) => {
  return getItemById<Student>('api/students', id);
};

export const createStudent = (student: CreateStudentRequest) => {
  return addItem<CreateStudentRequest>('api/students/', student);
};

export const updateStudent = (id: string, student: UpdateStudentRequest) => {
  return updateItem<Student>('api/students', id, student);
};

export const deleteStudent = (id: string) => {
  return deleteItem<{ message: string }>('api/students', id);
};