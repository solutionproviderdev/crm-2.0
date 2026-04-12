"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Globe2,
  Phone,
  MapPin,
  Calendar,
  Mail,
  Briefcase,
  DollarSign,
  Shield,
  FileText,
  ArrowLeft,
  ShieldCheck,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { updateUserStatuses } from "@/app/actions/users";
import { PermissionTogglePanel } from "@/components/users/PermissionTogglePanel";
import { DeleteEmployeeModal } from "@/components/employees/DeleteEmployeeModal";
import { getAccountStatusLabel, getEmploymentStatusLabel, ACCOUNT_STATUSES, EMPLOYMENT_STATUSES } from "@/constants/employeeStatus";
import type { Employee, AccountStatusValue, EmploymentStatusValue } from "@/types/employee";
import type { PermissionMap } from "@/lib/permissions";

interface Props {
  user: Employee;
  isAdmin?: boolean;
}

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-700 border-gray-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  locked: "bg-red-100 text-red-700 border-red-200",
  archived: "bg-slate-200 text-slate-800 border-slate-300",
};

const TABS = ["Contact", "Employment", "Access & Role", "Documents"] as const;
type Tab = (typeof TABS)[number];

export function UserProfileClient({ user: initialUser, isAdmin = false }: Props) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<Tab>("Contact");
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function handleAccountStatusChange(newStatus: AccountStatusValue) {
    if (!isAdmin) return;
    setIsTogglingStatus(true);
    const result = await updateUserStatuses(user.id, newStatus, undefined);
    if (result.success) setUser((u) => ({ ...u, account_status: newStatus }));
    setIsTogglingStatus(false);
  }

  async function handleEmploymentStatusChange(newStatus: EmploymentStatusValue) {
    if (!isAdmin) return;
    setIsTogglingStatus(true);
    const result = await updateUserStatuses(user.id, undefined, newStatus);
    if (result.success) setUser((u) => ({ ...u, employment_status: newStatus }));
    setIsTogglingStatus(false);
  }

  const socialIcons: Record<string, React.ElementType> = {
    facebook: Globe,
    instagram: Globe2,
    whatsapp: Phone,
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4 w-fit transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* ── Cover + Avatar Header ──────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden h-44 mb-16"
        style={{
          background: `linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)`,
        }}
      >
        {user.cover_photo && (
          <img
            src={user.cover_photo}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}

        {/* Social links top-right */}
        <div className="absolute top-4 right-4 flex gap-2">
          {user.social_links?.map((link) => {
            const Icon = socialIcons[link.platform.toLowerCase()];
            return Icon ? (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ) : null;
          })}
        </div>

        {/* Avatar overlapping bottom */}
        <div className="absolute -bottom-12 left-6 flex items-end gap-4">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.name}
              className="h-24 w-24 rounded-2xl border-4 border-white shadow-xl object-cover"
            />
          ) : (
            <div
              className="h-24 w-24 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-black"
              style={{ background: "var(--brand-primary)" }}
            >
              {user.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* ── Name row ─────────────────────────────────────── */}
      <div className="px-2 flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">
              {user.name}
              {user.nickname && (
                <span className="text-gray-400 font-normal ml-1.5">
                  ({user.nickname})
                </span>
              )}
            </h1>
            {user.type === "Admin" && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                style={{
                  background: "var(--brand-primary-light)",
                  color: "var(--brand-primary)",
                  borderColor: `color-mix(in srgb, var(--brand-primary) 30%, transparent)`,
                }}
              >
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {[user.role?.name, user.department?.name]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* Status toggle + Edit */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Employment Status */}
            {isAdmin ? (
              <div className="relative border-r border-gray-200 pr-2">
                <select
                  value={user.employment_status}
                  onChange={(e) => handleEmploymentStatusChange(e.target.value as EmploymentStatusValue)}
                  disabled={isTogglingStatus}
                  className={`appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none pl-2.5 pr-7 py-1 rounded-md text-xs font-semibold border transition bg-blue-50 text-blue-700 border-blue-200 ${
                    isTogglingStatus ? 'opacity-50' : 'cursor-pointer'
                  }`}
                >
                  {EMPLOYMENT_STATUSES.map(s => (
                    <option key={s.value} value={s.value} className="bg-white text-gray-900">
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-60 text-blue-700" />
              </div>
            ) : (
              <span className="inline-flex px-2.5 py-1 rounded-md border text-xs font-medium capitalize bg-blue-50 text-blue-700 border-blue-200 mr-2">
                {getEmploymentStatusLabel(user.employment_status)}
              </span>
            )}

            {/* Account Status */}
            {isAdmin ? (
              <div className="relative">
                <select
                  value={user.account_status}
                  onChange={(e) => handleAccountStatusChange(e.target.value as AccountStatusValue)}
                  disabled={isTogglingStatus}
                  className={`appearance-none focus:ring-2 focus:ring-emerald-500 focus:outline-none pl-2.5 pr-7 py-1 rounded-md text-xs font-semibold border transition ${
                    isTogglingStatus ? 'opacity-50' : 'cursor-pointer'
                  } ${ACCOUNT_STATUS_COLORS[user.account_status] || ACCOUNT_STATUS_COLORS.inactive}`}
                >
                  {ACCOUNT_STATUSES.map(s => (
                    <option key={s.value} value={s.value} className="bg-white text-gray-900">
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-60" />
              </div>
            ) : (
              <span className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-medium capitalize ${ACCOUNT_STATUS_COLORS[user.account_status] || ACCOUNT_STATUS_COLORS.inactive}`}>
                {getAccountStatusLabel(user.account_status)}
              </span>
            )}
          </div>
          
          <Link
            href={`/users/${user.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="border-b border-gray-100 mb-6">
        <nav className="flex gap-0 px-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-[var(--brand-primary)]"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {tab}
              {/* Active underline using pseudo-absolute bar, overlapping parent border correctly */}
              {activeTab === tab && (
                <span
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full"
                  style={{ background: "var(--brand-primary)" }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab Content ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {activeTab === "Contact" && <ContactTab user={user} />}
        {activeTab === "Employment" && <EmploymentTab user={user} />}
        {activeTab === "Access & Role" && <AccessRoleTab user={user} />}
        {activeTab === "Documents" && <DocumentsTab user={user} />}
      </div>

      {/* ── Danger Zone (Admin Only) ───────────────────────── */}
      {isAdmin && (
        <div className="mt-8 pt-6 border-t border-red-100 flex justify-end">
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 transition duration-200 text-sm font-semibold shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete Employee
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {isAdmin && isDeleteOpen && (
        <DeleteEmployeeModal 
          user={user} 
          isOpen={isDeleteOpen} 
          onClose={() => setIsDeleteOpen(false)} 
        />
      )}
    </div>
  );
}

// ── Contact Tab ────────────────────────────────────────────────────────────
function ContactTab({ user }: { user: Employee }) {
  const fields = [
    { icon: Mail,    label: "Email",          value: user.email },
    { icon: Phone,   label: "Personal Phone", value: user.personal_phone },
    { icon: Phone,   label: "Office Phone",   value: user.office_phone },
    { icon: MapPin,  label: "Address",        value: user.address },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle>Contact Information</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-medium text-gray-900">
                {value || "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Guardian */}
      {(user.guardian_name || user.guardian_phone) && (
        <>
          <SectionTitle className="mt-6">Guardian Information</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Name"     value={user.guardian_name} />
            <InfoRow label="Phone"    value={user.guardian_phone} />
            <InfoRow label="Relation" value={user.guardian_relation} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Employment Tab ─────────────────────────────────────────────────────────
function EmploymentTab({ user }: { user: Employee }) {
  return (
    <div className="space-y-4">
      <SectionTitle>Employment Details</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow
          label="Employment Status"
          value={getEmploymentStatusLabel(user.employment_status)}
          icon={Briefcase}
        />
        <InfoRow
          label="Joining Date"
          value={
            user.joining_date
              ? new Date(user.joining_date).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric",
                })
              : undefined
          }
          icon={Calendar}
        />
        <InfoRow
          label="Department"
          value={user.department?.name}
          icon={Briefcase}
        />
        <InfoRow label="Role" value={user.role?.name} icon={Shield} />
        <InfoRow
          label="Current Salary"
          value={
            user.current_salary
              ? `৳ ${user.current_salary.toLocaleString()}`
              : undefined
          }
          icon={DollarSign}
        />
      </div>
      {user.working_procedure && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-1.5">Working Procedure</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
            {user.working_procedure}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Access Role Tab ────────────────────────────────────────────────────────
function AccessRoleTab({ user }: { user: Employee }) {
  const permissions = (user.role?.permissions ?? {}) as PermissionMap;

  return (
    <div className="space-y-4">
      <SectionTitle>
        Permissions via{" "}
        <span style={{ color: "var(--brand-primary)" }}>{user.role?.name ?? "No Role"}</span>
      </SectionTitle>

      {user.role ? (
        <PermissionTogglePanel
          permissions={permissions}
          onChange={() => {}} // read-only here
          readOnly
        />
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          No role assigned. Contact an Admin to assign a role.
        </div>
      )}
    </div>
  );
}

// ── Documents Tab ──────────────────────────────────────────────────────────
function DocumentsTab({ user }: { user: Employee }) {
  const docLabels: Record<string, string> = {
    resume:            "Resume / CV",
    nid_copy:          "NID Copy",
    academic_document: "Academic Documents",
    bank_account:      "Bank Account Info",
    agreement:         "Agreement / Contract",
    other:             "Other",
  };

  return (
    <div className="space-y-4">
      <SectionTitle>Documents</SectionTitle>
      {!user.documents || user.documents.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No documents uploaded
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {user.documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.storage_path}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 transition-colors group"
            >
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--brand-primary-light)" }}
              >
                <FileText className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-[var(--brand-primary)]">
                  {doc.label || docLabels[doc.type] || doc.type}
                </p>
                <p className="text-xs text-gray-400">View document</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-sm font-semibold text-gray-900 ${className ?? ""}`}>
      {children}
    </h3>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-gray-500" />
        </div>
      )}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
      </div>
    </div>
  );
}
