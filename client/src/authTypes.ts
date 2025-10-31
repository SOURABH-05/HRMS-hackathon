export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'recruiter' | 'employee';
  employeeId?: string; // Optional employee ID for users who are also employees
}
export interface AuthResponse {
  token: string;
  user: User;
}
