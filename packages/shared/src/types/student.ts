export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  grade: string;
  school: string;
  parentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentCreateInput {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  grade: string;
  school: string;
  parentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentUpdateInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  grade?: string;
  school?: string;
  parentId?: string;
  updatedAt: Date;
}

export interface StudentWhereUniqueInput {
  id: string;
}

export interface StudentWhereInput {
  parentId?: string;
}

export interface StudentEvent {
  type: string;
  studentId: string;
  data: any;
}

export interface StudentNotification {
  type: string;
  studentId: string;
  message: string;
  data?: any;
} 