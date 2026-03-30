"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, User, Building2, Shield, BookUser } from "lucide-react";
import type { Department, Role, UserGender, UserType } from "@/lib/types";
import { createUser } from "@/app/actions/users";

interface Props {
  departments: Department[];
  roles: Role[];
}

export function CreateUserForm({ departments, roles }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState("");

  const filteredRoles = selectedDept
    ? roles.filter((r) => r.department_id === selectedDept)
    : roles;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const salary = fd.get("current_salary") as string;

    startTransition(async () => {
      const result = await createUser({
        name:              fd.get("name") as string,
        nickname:          fd.get("nickname") as string || undefined,
        email:             fd.get("email") as string,
        password:          fd.get("password") as string,
        type:              fd.get("type") as UserType,
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add a new team member to the CRM</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm flex items-start gap-2">
          <span className="text-red-400 mt-0.5">⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Section: Personal Info ─────────────────────── */}
        <FormSection
          icon={User}
          title="Personal Information"
          description="Basic details about the user"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name (as per NID)" name="name" required placeholder="Abdullah Al Mamun" />
            <FormField label="Nickname / Display Name" name="nickname" placeholder="Mamun" />
            <FormField label="Personal Phone" name="personal_phone" type="tel" placeholder="+880 1XXXXXXXXX" />
            <FormField label="Office Phone"   name="office_phone"   type="tel" placeholder="+880 1XXXXXXXXX" />
            <div>
              <label className="field-label">Gender</label>
              <select name="gender" className="field-input">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <FormField label="Date of Birth" name="date_of_birth" type="date" />
          </div>
          <FormField label="Address" name="address" placeholder="House, Road, Area, City" />
        </FormSection>

        {/* ── Section: Account ───────────────────────────── */}
        <FormSection
          icon={Shield}
          title="Account Credentials"
          description="Login email and password for this user"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email Address" name="email" type="email" required placeholder="user@example.com" />
            <FormField label="Password"      name="password" type="password" required placeholder="Min 8 characters" />
            <div>
              <label className="field-label">Account Type</label>
              <select name="type" className="field-input" required>
                <option value="Operator">Operator (Standard)</option>
                <option value="Admin">Admin (Full Access)</option>
              </select>
            </div>
          </div>
        </FormSection>

        {/* ── Section: Organization ─────────────────────── */}
        <FormSection
          icon={Building2}
          title="Organization"
          description="Department, role and employment details"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Department</label>
              <select
                name="department_id"
                className="field-input"
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
              <label className="field-label">Role</label>
              <select name="role_id" className="field-input">
                <option value="">— No role —</option>
                {filteredRoles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <FormField label="Joining Date" name="joining_date" type="date" />
            <FormField label="Current Salary (৳)" name="current_salary" type="number" placeholder="0.00" />
          </div>
          <div>
            <label className="field-label">Working Procedure / Notes</label>
            <textarea
              name="working_procedure"
              rows={3}
              placeholder="Describe the working procedure or any notes..."
              className="field-input resize-none"
            />
          </div>
        </FormSection>

        {/* ── Section: Guardian ─────────────────────────── */}
        <FormSection
          icon={BookUser}
          title="Guardian / Emergency Contact"
          description="Emergency contact details"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Guardian Name"     name="guardian_name"     placeholder="Full Name" />
            <FormField label="Guardian Phone"    name="guardian_phone"    type="tel" placeholder="+880 1XXXXXXXXX" />
            <FormField label="Relation"          name="guardian_relation" placeholder="Father / Mother / Spouse" />
          </div>
        </FormSection>

        {/* ── Submit ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            id="create-user-submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#006080] text-white font-semibold text-sm shadow-lg shadow-[#006080]/20 hover:bg-[#005070] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
            ) : (
              "Create User"
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

      <style>{`
        .field-label { display: block; font-size: 0.8125rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem; }
        .field-input {
          display: block; width: 100%; padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb; border-radius: 0.625rem; font-size: 0.875rem;
          background: #f9fafb; color: #111827; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .field-input:focus {
          border-color: #006080; background: #fff;
          box-shadow: 0 0 0 3px rgba(0,96,128,0.08);
        }
        .field-input::placeholder { color: #9ca3af; }
      `}</style>
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
        <div className="h-9 w-9 rounded-xl bg-[#006080]/10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-[#006080]" />
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
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="field-input"
      />
    </div>
  );
}
