import { getAllItems, getItemById, addItem, updateItem, deleteItem } from './genericRequests';
import httpService from './httpService';

export interface Student {
  _id: string;
  name: string;
  DOB: string;
  classId?: string; // ObjectId reference to Class
  therapists?: Array<{
    _id: string;
    name: string;
  }>; // Array of assigned therapists
  age?: number; // This will be calculated on frontend
}

export interface CreateStudentRequest {
  name: string;
  DOB: string;
  classId?: string; // ObjectId reference to Class
}

export interface UpdateStudentRequest extends CreateStudentRequest {
  _id: string;
}

export interface AssignTherapistRequest {
  therapistId: string;
  therapistName: string;
}

export interface RemoveTherapistRequest {
  therapistId: string;
}

export interface TherapistAssignmentResponse {
  message: string;
  student: Student;
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

// Therapist assignment functions
export const assignTherapistToStudent = (studentId: string, request: AssignTherapistRequest) => {
  return httpService.put<TherapistAssignmentResponse>(`/api/students/${studentId}/assign-therapist`, request);
};

export const removeTherapistFromStudent = (studentId: string, request: RemoveTherapistRequest) => {
  return httpService.delete<TherapistAssignmentResponse>(`/api/students/${studentId}/remove-therapist`, { data: request });
};