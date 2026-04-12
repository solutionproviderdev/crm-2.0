"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, User, Building2, Shield, BookUser } from "lucide-react";
import type { Department, Role, UserGender, UserType } from "@/lib/types";
import { updateEmployee } from "@/lib/supabase/employees";
import { EMPLOYMENT_STATUSES, ACCOUNT_STATUSES } from "@/constants/employeeStatus";
import type { Employee, EmploymentStatusValue, AccountStatusValue } from "@/types/employee";

interface Props {
  employee: Employee;
  isAdmin: boolean;
  departments: Department[];
  roles: Role[];
}

const fieldLabel = "block text-[0.8125rem] font-medium text-gray-700 mb-1.5";
const fieldInput =
  "block w-full px-3 py-2 border border-gray-200 rounded-[0.625rem] text-sm bg-gray-50 text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/10";

export function EditEmployeeForm({ employee, isAdmin, departments, roles }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState(employee.department_id || "");

  const filteredRoles = selectedDept
    ? roles.filter((r) => r.department_id === selectedDept)
    : roles;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const salary = fd.get("current_salary") as string;
    
    // Only admins modify account_status, default back to original if missing in fd
    const accountStatusRaw = fd.get("account_status");
    const account_status = accountStatusRaw ? (accountStatusRaw as AccountStatusValue) : employee.account_status;

    startTransition(async () => {
      const result = await updateEmployee(employee.id, {
        name:              fd.get("name") as string,
        nickname:          fd.get("nickname") as string || undefined,
        type:              fd.get("type") as UserType,
        employment_status: fd.get("employment_status") as EmploymentStatusValue,
        account_status:    account_status,
        personal_phone:    fd.get("personal_phone") as string || undefined,
        office_phone:      fd.get("office_phone") as string || undefined,
        gender:            fd.get("gender") as UserGender || undefined,
        address:           fd.get("address") as string || undefined,
        date_of_birth:     fd.get("date_of_birth") as string || undefined,
        department_id:     fd.get("department_id") as string || undefined,
        role_id:           fd.get("role_id") as string || undefined,
        joining_date:      fd.get("joining_date") as string || undefined,
        current_salary:    salary ? parseFloat(salary) : undefined,
        working_procedure: fd.get("working_procedure") as string || undefined,
        guardian_name:     fd.get("guardian_name") as string || undefined,
        guardian_phone:    fd.get("guardian_phone") as string || undefined,
        guardian_relation: fd.get("guardian_relation") as string || undefined,
      });

      if (!result.success) {
        setError(result.error);
      } else {
        router.push(`/users/${result.data.id}`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update {employee.name}'s details</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm flex items-start gap-2">
          <span className="text-red-400 mt-0.5">⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection icon={User} title="Personal Information" description="Basic details about the employee">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name (as per NID)" name="name" required defaultValue={employee.name} fieldLabel={fieldLabel} fieldInput={fieldInput} />
            <FormField label="Nickname / Display Name" name="nickname" defaultValue={employee.nickname || ""} fieldLabel={fieldLabel} fieldInput={fieldInput} />
            <FormField label="Personal Phone" name="personal_phone" type="tel" defaultValue={employee.personal_phone || ""} fieldLabel={fieldLabel} fieldInput={fieldInput} />
            <FormField label="Office Phone"   name="office_phone"   type="tel" defaultValue={employee.office_phone || ""} fieldLabel={fieldLabel} fieldInput={fieldInput} />
            <div>
              <label className={fieldLabel}>Gender</label>
              <select name="gender" className={fieldInput} defaultValue={employee.gender || ""}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <FormField label="Date of Birth" name="date_of_birth" type="date" defaultValue={employee.date_of_birth || ""} fieldLabel={fieldLabel} fieldInput={fieldInput} />
          </div>
          <FormField label="Address" name="address" defaultValue={employee.address || ""} fieldLabel={fieldLabel} fieldInput={fieldInput} />
        </FormSection>

        <FormSection icon={Shield} title="Account Configuration" description="System access and status">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>Account Type</label>
              <select name="type" className={fieldInput} required defaultValue={employee.type}>
                <option value="Operator">Operator (Standard)</option>
                <option value="Admin">Admin (Full Access)</option>
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Account Status</label>
              <select 
                name="account_status" 
                className={`${fieldInput} ${!isAdmin ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''}`}
                required 
                defaultValue={employee.account_status}
                disabled={!isAdmin}
              >
                {ACCOUNT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {!isAdmin && <p className="text-xs text-gray-400 mt-1">Only admins can edit this.</p>}
            </div>
          </div>
        </FormSection>

        <FormSection icon={Building2} title="Organization" description="Department, role and employment details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>Employment Status</label>
              <select name="employment_status" className={fieldInput} required defaultValue={employee.employment_status}>
                {EMPLOYMENT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div />
            <div>
              <label className={fieldLabel}>Department</label>
              <select
                name="department_id"
                className={fieldInput}
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">— No department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Role</label>
              <select name="role_id" className={fieldInput} defaultValue={employee.role_id || ""}>
                <option value="">— No role —</option>
                {filteredRoles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <FormField label="Joining Date" name="joining_date" type="date" defaultValue={employee.joining_date || ""} fieldLabel={fieldLabel} fieldInput={fieldInput} />
            <FormField label="Current Salary (৳)" name="current_salary" type="number" defaultValue={employee.current_salary?.toString() || ""} fieldLabel={fieldLabel} fieldInput={fieldInput} />
          </div>
          <div>
            <label className={fieldLabel}>Working Procedure / Notes</label>
            <textarea
              name="working_procedure"
              rows={3}
              defaultValue={employee.working_procedure || ""}
              className={`${fieldInput} resize-none`}
            />
          </div>
        </FormSection>

        <FormSection icon={BookUser} title="Guardian / Emergency Contact" description="Emergency contact details">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Guardian Name"  name="guardian_name" defaultValue={employee.guardian_name || ""} fieldLabel={fieldLabel} fieldInput={fieldInput} />
            <FormField label="Guardian Phone" name="guardian_phone" type="tel" defaultValue={employee.guardian_phone || ""} fieldLabel={fieldLabel} fieldInput={fieldInput} />
            <FormField label="Relation"       name="guardian_relation" defaultValue={employee.guardian_relation || ""} fieldLabel={fieldLabel} fieldInput={fieldInput} />
          </div>
        </FormSection>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:opacity-90"
            style={{
              background: "var(--brand-primary)",
              boxShadow: "0 4px 14px color-mix(in srgb, var(--brand-primary) 30%, transparent)",
            }}
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--brand-primary-light)" }}>
          <Icon className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  required,
  defaultValue = "",
  fieldLabel: labelClass,
  fieldInput: inputClass,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  fieldLabel: string;
  fieldInput: string;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className={inputClass}
      />
    </div>
  );
}
