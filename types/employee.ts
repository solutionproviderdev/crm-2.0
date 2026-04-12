import type { User, CreateUserInput, UpdateUserInput } from "@/lib/types";
import type { EmploymentStatusValue, AccountStatusValue } from "@/constants/employeeStatus";

export type { EmploymentStatusValue, AccountStatusValue };

// Re-export the base User type as Employee for semantic mapping in this module
export interface Employee extends User {}
export interface CreateEmployeeInput extends CreateUserInput {}
export interface UpdateEmployeeInput extends UpdateUserInput {}
