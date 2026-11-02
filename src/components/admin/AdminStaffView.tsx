"use client";

import { useState, useEffect, useCallback } from "react";
import { Locale } from "@/translations";
import {
  getAdminStaffMembersAction,
  updateAdminStaffRoleAction,
  type AdminStaffMemberItem,
} from "@/lib/server/admin-actions";
import { formatQatarDate, getRoleBadge } from "./admin-utils";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

interface AdminStaffViewProps {
  locale: Locale;
}

export default function AdminStaffView({
  locale,
}: AdminStaffViewProps) {
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<AdminStaffMemberItem[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminStaffMembersAction();
      if (res.success && res.data) {
        setStaff(res.data);
      } else {
        setMsg({ type: "error", text: res.error || (isAr ? "تعذر تحميل قائمة الموظفين." : "Failed to load staff list.") });
      }
    } catch (err) {
      console.error("[Staff Load Error]", err);
      setMsg({ type: "error", text: isAr ? "حدث خطأ غير متوقع." : "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleRoleChange = async (userId: string, newRole: "super_admin" | "tour_manager" | "concierge_agent" | "finance", currentActive: boolean) => {
    setUpdatingId(userId);
    setMsg(null);
    try {
      const res = await updateAdminStaffRoleAction({
        userId,
        role: newRole,
        isActive: currentActive,
      });

      if (res.success) {
        setMsg({ type: "success", text: isAr ? "تم تحديث الصلاحيات بنجاح." : "Staff permissions updated successfully." });
        await loadStaff();
      } else {
        setMsg({ type: "error", text: res.error || (isAr ? "فشل تعديل الصلاحيات." : "Failed to update role.") });
      }
    } catch {
      setMsg({ type: "error", text: isAr ? "خطأ أثناء تحديث الصلاحيات." : "Error updating role." });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleActiveToggle = async (userId: string, currentRole: "super_admin" | "tour_manager" | "concierge_agent" | "finance", newActive: boolean) => {
    setUpdatingId(userId);
    setMsg(null);
    try {
      const res = await updateAdminStaffRoleAction({
        userId,
        role: currentRole,
        isActive: newActive,
      });

      if (res.success) {
        setMsg({ type: "success", text: isAr ? "تم تحديث حالة الحساب." : "Staff active state updated." });
        await loadStaff();
      } else {
        setMsg({ type: "error", text: res.error || (isAr ? "فشل تحديث الحالة." : "Failed to update state.") });
      }
    } catch {
      setMsg({ type: "error", text: isAr ? "خطأ أثناء تحديث الحالة." : "Error updating state." });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && staff.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-[#C29B38]/30 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#ECC15A] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-[#14171F] p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#72132B]/20 border border-[#72132B]/40 text-[#F3ECE1] text-[10px] font-mono font-semibold tracking-wider uppercase mb-2">
            <Users className="w-3.5 h-3.5 text-rose-300" />
            <span>{isAr ? "الصلاحيات والحوكمة" : "Governance & RBAC"}</span>
          </div>
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#F3ECE1]">
            {isAr ? "إدارة فريق العمل والصلاحيات الإدارية" : "Staff Directory & Role-Based Access Control"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {isAr
              ? "التحكم في مستويات الوصول وصلاحيات الكونسيرج، مدير العمليات، والحسابات المالية."
              : "Super Administrator management of staff roles, operational clearances, and active status."}
          </p>
        </div>
      </div>

      {/* Security Isolation Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#72132B]/15 border border-[#72132B]/40 text-xs text-rose-200 flex items-start gap-3.5 shadow-lg">
        <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-rose-300 font-mono uppercase text-[11px] tracking-wider">
            {isAr ? "عزل صلاحيات حسابات العملاء وجوجل:" : "Strict Customer & Google OAuth Boundary:"}
          </p>
          <p className="text-[11px] text-rose-200/90 leading-relaxed">
            {isAr
              ? "تسجيل دخول العملاء عبر البريد أو جوجل لا يمنح أي وصول إداري على الإطلاق. تقتصر الصلاحيات الإدارية حصرياً على الحسابات المسجلة يدوياً في جدول public.admin_users."
              : "Customer registrations and Google OAuth are strictly quarantined to public.profiles. Admin portal access is exclusively gated through pre-approved records in public.admin_users."}
          </p>
        </div>
      </div>

      {/* Message Banner */}
      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 shadow-lg ${
            msg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right">
            <thead className="bg-white/[0.03] text-stone-400 uppercase tracking-wider text-[10px] font-mono border-b border-white/[0.08]">
              <tr>
                <th className="px-5 py-4">{isAr ? "الموظف" : "Staff Member"}</th>
                <th className="px-5 py-4">{isAr ? "البريد الإلكتروني" : "Email"}</th>
                <th className="px-5 py-4">{isAr ? "الصلاحية الحالية" : "Current Role"}</th>
                <th className="px-5 py-4">{isAr ? "الحالة" : "Active State"}</th>
                <th className="px-5 py-4">{isAr ? "تاريخ الإضافة" : "Added Date"}</th>
                <th className="px-5 py-4 text-right rtl:text-left">{isAr ? "تعديل الدور" : "Update Role"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {staff.map((member) => {
                const roleBadge = getRoleBadge(member.role, locale);
                const isUpdating = updatingId === member.id;

                return (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-semibold text-stone-100">
                      {member.fullName || "Staff Member"}
                    </td>
                    <td className="px-5 py-4 font-mono text-stone-300">
                      {member.email}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-mono font-semibold ${roleBadge.badgeClass}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleActiveToggle(member.id, member.role, !member.isActive)}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          member.isActive
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                        }`}
                      >
                        {member.isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        <span>{member.isActive ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Suspended")}</span>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-stone-400 font-mono">
                      {formatQatarDate(member.createdAt, locale)}
                    </td>
                    <td className="px-5 py-4 text-right rtl:text-left whitespace-nowrap">
                      <select
                        value={member.role}
                        disabled={isUpdating}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as "super_admin" | "tour_manager" | "concierge_agent" | "finance", member.isActive)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-stone-200 text-xs focus:outline-none focus:border-[#C29B38] cursor-pointer"
                      >
                        <option value="super_admin" className="bg-[#14171F]">Super Administrator</option>
                        <option value="tour_manager" className="bg-[#14171F]">Tour Operations Manager</option>
                        <option value="finance" className="bg-[#14171F]">Finance Officer</option>
                        <option value="concierge_agent" className="bg-[#14171F]">VIP Concierge Agent</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
