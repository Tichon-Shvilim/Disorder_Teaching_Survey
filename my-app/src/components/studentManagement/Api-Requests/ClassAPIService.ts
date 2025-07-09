import { getAllItems, getItemById, addItem, updateItem, deleteItem } from './genericRequests';

export interface Class {
  _id: string;
  classNumber: string;
  teachers: string[]; // Array of teacher IDs instead of populated objects
  students: Array<{
    _id: string;
    name: string;
    DOB: string;
    classNumber?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassRequest {
  classNumber: string;
  teachers?: string[];
  students?: string[];
}

export interface UpdateClassRequest extends CreateClassRequest {
  _id: string;
}

// Class API functions
export const getAllClasses = () => {
  return getAllItems<Class[]>('api/classes/');
};

export const getClassById = (id: string) => {
  return getItemById<Class>('api/classes', id);
};

export const createClass = (classData: CreateClassRequest) => {
  return addItem<CreateClassRequest>('api/classes/', classData);
};

export const updateClass = (id: string, classData: UpdateClassRequest) => {
  return updateItem<UpdateClassRequest>('api/classes', id, classData);
};

export const deleteClass = (id: string) => {
  return deleteItem<{ message: string }>('api/classes', id);
};
