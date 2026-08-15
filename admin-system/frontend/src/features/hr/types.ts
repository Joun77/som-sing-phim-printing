export interface EmployeeAttendance {
  present: number;
  absent: number;
  late: number;
}

export interface Employee {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  department: string;
  phone: string;
  address: string;
  salary: number;
  salaryType?: string;
  startDate?: string;
  status: string;
  attendance?: EmployeeAttendance;
  skills: string[];
  shift?: string;
  avatar?: string;
  rating?: number;
  assignedMachines?: string[];
  pieceRatePerImpression?: number;
  impressionsProduced?: number;
  salesCommissionRate?: number;
}
