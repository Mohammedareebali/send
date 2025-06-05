export interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuardianCreateInput {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
}

export interface StudentGuardian {
  id: string;
  studentId: string;
  guardianId: string;
  relationship?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: Date;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceCreateInput {
  studentId: string;
  date: Date;
  status: string;
  notes?: string;
}
