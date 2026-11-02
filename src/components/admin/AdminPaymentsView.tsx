"use client";

import { useState, useEffect, useCallback } from "react";
import { Locale } from "@/translations";
import {
  getAdminPaymentSettingsAction,
  updateAdminPaymentSettingsAction,
  getPaymentReconciliationLedgerAction,
  type AdminPaymentReconciliationItem,
} from "@/lib/server/payment-actions";
import { getAdminSignedProofUrlAction } from "@/lib/server/admin-actions";
import type { QatarPaymentSettings } from "@/lib/payments/qatar-payment-config";
import type { CardGatewayStatus } from "@/lib/payments/card-gateway";
import {
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Save,
  Eye,
  RefreshCw,
  ExternalLink,
  DollarSign,
} from "lucide-react";

interface AdminPaymentsViewProps {
  locale: Locale;
  onOpenProofQueue?: () => void;
}

export default function AdminPaymentsView({
  locale,
  onOpenProofQueue,
}: AdminPaymentsViewProps) {
  void onOpenProofQueue;
  const isAr = locale === "ar";

  const [activeSubTab, setActiveSubTab] = useState<"bank" | "gateway" | "ledger">("bank");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settings form state
  const [settings, setSettings] = useState<QatarPaymentSettings | null>(null);
  const [cardGateway, setCardGateway] = useState<CardGatewayStatus | null>(null);

  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [swiftBic, setSwiftBic] = useState("");
  const [depositPercentage, setDepositPercentage] = useState(30);
  const [paymentTypeDue, setPaymentTypeDue] = useState<"deposit" | "full">("deposit");
  const [transferInstructionsEn, setTransferInstructionsEn] = useState("");
  const [transferInstructionsAr, setTransferInstructionsAr] = useState("");

  const [bankTransferEnabled, setBankTransferEnabled] = useState(true);
  const [cardPaymentEnabled, setCardPaymentEnabled] = useState(false);
  const [officePaymentEnabled, setOfficePaymentEnabled] = useState(true);

  // Reconciliation ledger state
  const [ledger, setLedger] = useState<AdminPaymentReconciliationItem[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [inspectUrl, setInspectUrl] = useState<string | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // 1. Load settings & ledger
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminPaymentSettingsAction();
      if (res.success && res.settings) {
        setSettings(res.settings);
        setCardGateway(res.cardGateway || null);

        const b = res.settings.bankTransfer;
        setAccountHolderName(b.accountHolderName || "");
        setBankName(b.bankName || "");
        setIban(b.iban || "");
        setAccountNumber(b.accountNumber || "");
        setSwiftBic(b.swiftBic || "");
        setDepositPercentage(res.settings.depositDefaultPercentage || 30);
        setPaymentTypeDue(res.settings.paymentTypeDue || "deposit");
        setTransferInstructionsEn(b.transferReferenceInstructionsEn || "");
        setTransferInstructionsAr(b.transferReferenceInstructionsAr || "");
        setBankTransferEnabled(res.settings.bankTransferEnabled);
        setCardPaymentEnabled(res.settings.cardPaymentEnabled);
        setOfficePaymentEnabled(res.settings.officePaymentEnabled);
      } else {
        setMsg({ type: "error", text: res.error || "Failed to load payment settings." });
      }
    } catch (err) {
      console.error("[Payment Settings Load Error]", err);
      setMsg({ type: "error", text: "An error occurred while loading payment configuration." });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLedger = useCallback(async () => {
    try {
      setLoadingLedger(true);
      const res = await getPaymentReconciliationLedgerAction();
      if (res.success && res.ledger) {
        setLedger(res.ledger);
      }
    } catch (err) {
      console.error("[Payment Ledger Error]", err);
    } finally {
      setLoadingLedger(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadLedger();
  }, [loadData, loadLedger]);

  // 2. Save settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await updateAdminPaymentSettingsAction({
        accountHolderName: accountHolderName.trim() || null,
        bankName: bankName.trim() || null,
        iban: iban.trim() || null,
        accountNumber: accountNumber.trim() || null,
        swiftBic: swiftBic.trim() || null,
        depositPercentage: Number(depositPercentage),
        paymentTypeDue,
        transferReferenceInstructionsEn: transferInstructionsEn.trim(),
        transferReferenceInstructionsAr: transferInstructionsAr.trim(),
        bankTransferEnabled,
        cardPaymentEnabled,
        officePaymentEnabled,
      });

      if (res.success && res.settings) {
        setSettings(res.settings);
        setMsg({
          type: "success",
          text: isAr ? "تم حفظ إعدادات الدفع والحساب البنكي بنجاح." : "Qatar payment settings saved successfully.",
        });
      } else {
        setMsg({
          type: "error",
          text: res.error || (isAr ? "فشل حفظ الإعدادات." : "Failed to save settings."),
        });
      }
    } catch (err) {
      console.error("[Save Settings Error]", err);
      setMsg({
        type: "error",
        text: isAr ? "حدث خطأ غير متوقع أثناء الحفظ." : "Unexpected error saving settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  // 3. Inspect proof
  const handleInspect = async (storagePath: string) => {
    setInspectLoading(true);
    try {
      const res = await getAdminSignedProofUrlAction(storagePath);
      if (res.success && res.signedUrl) {
        setInspectUrl(res.signedUrl);
      } else {
        alert(res.error || "Unable to generate secure inspection URL.");
      }
    } catch (err) {
      console.error("[Inspect Error]", err);
      alert("Failed to load signed receipt.");
    } finally {
      setInspectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#14171F] p-6 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-[#ECC15A]" />
            <h3 className="font-headline text-lg sm:text-xl font-bold text-[#F3ECE1]">
              {isAr ? "المدفوعات والحسابات البنكية (دولة قطر)" : "Qatar Payments & Bank Management"}
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono mt-1 block">
            Qatar Bank Transfers • QPay Card Gateway Diagnostics • Reconciliation Ledger
          </span>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-[#0F1115] p-1.5 rounded-2xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveSubTab("bank")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "bank"
                ? "bg-[#C29B38] text-[#0F1115] shadow-md font-bold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {isAr ? "الحساب البنكي والسياسة" : "Bank & Policy"}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("gateway")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "gateway"
                ? "bg-[#C29B38] text-[#0F1115] shadow-md font-bold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {isAr ? "بوابة البطاقات (كيو باي)" : "Card Gateway"}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("ledger")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "ledger"
                ? "bg-[#C29B38] text-[#0F1115] shadow-md font-bold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {isAr ? "سجل المطابقة المالية" : "Reconciliation"} ({ledger.length})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 ${
            msg.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg(null)}
            className="text-stone-400 hover:text-stone-200 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-xs text-stone-400 bg-[#14171F] rounded-3xl border border-white/[0.08] shadow-xl flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#C29B38]" />
          <span>{isAr ? "جاري تحميل إعدادات الدفع..." : "Loading payment configuration..."}</span>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* SUB-TAB 1: QATAR BANK TRANSFER SETTINGS & DEPOSIT POLICY */}
          {/* ========================================================================= */}
          {activeSubTab === "bank" && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-[#0F1115] border border-white/[0.08] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      settings?.bankTransfer.isConfigured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-[#F3ECE1]">
                      {settings?.bankTransfer.isConfigured
                        ? isAr
                          ? "الحساب البنكي القطري مفعل وموثق للعملاء"
                          : "Qatar Bank Coordinates Active & Published"
                        : isAr
                        ? "إعداد التحويل البنكي قيد التهيئة (يعرض إشعار التواصل مع الكونسيرج للعميل)"
                        : "Bank Transfer Setup Pending (Customer sees pending setup notice with WhatsApp concierge CTA)"}
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                      {isAr
                        ? "لن يتم عرض أي بيانات بنكية تجريبية أو وهمية للعملاء."
                        : "Placeholder bank coordinates are strictly suppressed until verified values are entered."}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#C29B38] hover:bg-[#ECC15A] text-[#0F1115] text-xs font-bold flex items-center gap-2 shadow-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isAr ? "حفظ الإعدادات" : "Save Settings"}</span>
                </button>
              </div>

              {/* Coordinates Grid */}
              <div className="bg-[#14171F] p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ECC15A] pb-2 border-b border-white/[0.06]">
                  <Building className="w-4 h-4" />
                  <span>{isAr ? "إحداثيات الحساب البنكي بدولة قطر" : "Corporate Qatar Bank Account Coordinates"}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 block">
                      {isAr ? "اسم المستفيد / اسم الشركة الرسمي *" : "Account Holder / Business Name *"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MZ Tourism Qatar W.L.L."
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1115] border border-white/[0.1] text-xs text-stone-200 focus:outline-none focus:border-[#C29B38]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 block">
                      {isAr ? "اسم البنك داخل قطر *" : "Bank Name in Qatar *"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Qatar National Bank (QNB)"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1115] border border-white/[0.1] text-xs text-stone-200 focus:outline-none focus:border-[#C29B38]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-stone-300 block">
                      {isAr ? "رقم الآيبان القطري (IBAN) *" : "Qatar IBAN (Starts with QA) *"}
                    </label>
                    <input
                      type="text"
                      placeholder="QA00QNBA000000000000000000000"
                      value={iban}
                      onChange={(e) => setIban(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1115] border border-white/[0.1] text-xs font-mono text-[#ECC15A] tracking-wider focus:outline-none focus:border-[#C29B38]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 block">
                      {isAr ? "رقم الحساب المحلي (اختياري)" : "Local Account Number (Optional)"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0001-XXXXXX-001"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1115] border border-white/[0.1] text-xs font-mono text-stone-200 focus:outline-none focus:border-[#C29B38]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 block">
                      {isAr ? "رمز السويفت (SWIFT / BIC) (اختياري)" : "SWIFT / BIC Code (Optional)"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. QNBAQAQA"
                      value={swiftBic}
                      onChange={(e) => setSwiftBic(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1115] border border-white/[0.1] text-xs font-mono text-stone-200 focus:outline-none focus:border-[#C29B38]"
                    />
                  </div>
                </div>
              </div>

              {/* Deposit & Payment Policy */}
              <div className="bg-[#14171F] p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ECC15A] pb-2 border-b border-white/[0.06]">
                  <DollarSign className="w-4 h-4" />
                  <span>{isAr ? "سياسة الدفعات والعربون (QAR)" : "Deposit & Payment Policy (QAR)"}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 block">
                      {isAr ? "نوع الدفعة المستحقة عند الحجز" : "Payment Due Upon Booking"}
                    </label>
                    <select
                      value={paymentTypeDue}
                      onChange={(e) => setPaymentTypeDue(e.target.value as "deposit" | "full")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1115] border border-white/[0.1] text-xs text-stone-200 focus:outline-none focus:border-[#C29B38] cursor-pointer"
                    >
                      <option value="deposit">Deposit Only (e.g. 30%)</option>
                      <option value="full">Full 100% Payment Upfront</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 block">
                      {isAr ? "نسبة العربون الافتراضية (%)" : "Default Deposit Percentage (%)"}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={10}
                        max={100}
                        step={5}
                        value={depositPercentage}
                        onChange={(e) => setDepositPercentage(Number(e.target.value))}
                        className="w-24 px-3.5 py-2.5 rounded-xl bg-[#0F1115] border border-white/[0.1] text-xs font-mono text-stone-200 focus:outline-none focus:border-[#C29B38]"
                      />
                      <span className="text-xs text-stone-400 font-mono">
                        {isAr ? "من إجمالي قيمة الحجز (ريال قطري)" : "of total booking price in QAR"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transfer Remarks Instructions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/[0.06]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 block">
                      Transfer Memo Instructions (English)
                    </label>
                    <textarea
                      rows={3}
                      value={transferInstructionsEn}
                      onChange={(e) => setTransferInstructionsEn(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0F1115] border border-white/[0.1] text-xs text-stone-200 focus:outline-none focus:border-[#C29B38]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 block">
                      تعليمات ملاحظات التحويل (العربية)
                    </label>
                    <textarea
                      rows={3}
                      value={transferInstructionsAr}
                      onChange={(e) => setTransferInstructionsAr(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0F1115] border border-white/[0.1] text-xs text-stone-200 focus:outline-none focus:border-[#C29B38]"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="bg-[#14171F] p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#ECC15A] pb-2 border-b border-white/[0.06]">
                  {isAr ? "تفعيل وتعطيل قنوات الدفع" : "Payment Method Availability Toggles"}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="p-4 rounded-2xl bg-[#0F1115] border border-white/[0.08] flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-stone-200">
                      Bank Transfer (Qatar)
                    </span>
                    <input
                      type="checkbox"
                      checked={bankTransferEnabled}
                      onChange={(e) => setBankTransferEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#C29B38] cursor-pointer"
                    />
                  </label>

                  <label className="p-4 rounded-2xl bg-[#0F1115] border border-white/[0.08] flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-stone-200">
                      Online Card Gateway
                    </span>
                    <input
                      type="checkbox"
                      checked={cardPaymentEnabled}
                      onChange={(e) => setCardPaymentEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#C29B38] cursor-pointer"
                    />
                  </label>

                  <label className="p-4 rounded-2xl bg-[#0F1115] border border-white/[0.08] flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-stone-200">
                      Cash at West Bay Office
                    </span>
                    <input
                      type="checkbox"
                      checked={officePaymentEnabled}
                      onChange={(e) => setOfficePaymentEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#C29B38] cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#C29B38] hover:bg-[#ECC15A] text-[#0F1115] text-xs font-bold flex items-center gap-2 shadow-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isAr ? "حفظ كافة الإعدادات" : "Save All Payment Settings"}</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 2: CARD GATEWAY DIAGNOSTICS & QPAY ONBOARDING */}
          {/* ========================================================================= */}
          {activeSubTab === "gateway" && (
            <div className="space-y-6">
              <div className="bg-[#14171F] p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ECC15A]">
                    <CreditCard className="w-4 h-4" />
                    <span>{isAr ? "تشخيص بوابة البطاقات الوطنية (كيو باي / فيزا / ماستركارد)" : "Card Gateway Diagnostics & Status"}</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                      cardGateway?.isConfigured
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {cardGateway?.isConfigured ? "Ready for Live Settlements" : "Setup Pending / Unconfigured"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0F1115] border border-white/[0.06] space-y-2">
                  <div className="text-xs font-bold text-[#F3ECE1]">
                    {cardGateway?.statusMessageEn}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    {cardGateway?.statusMessageAr}
                  </div>
                </div>

                {/* Gateway Provider Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#0F1115] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-stone-400">Detected Provider</span>
                    <div className="font-bold text-[#ECC15A] uppercase">{cardGateway?.provider || "None"}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0F1115] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-stone-400">Settlement Currency</span>
                    <div className="font-bold text-[#F3ECE1]">QAR (Qatari Riyal)</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0F1115] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-stone-400">Supported Networks</span>
                    <div className="font-bold text-stone-300">
                      {cardGateway?.supportedCards.join(", ")}
                    </div>
                  </div>
                </div>

                {/* Environment Variables Checklist */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-300 block">
                    {isAr ? "قائمة متغيرات البيئة المطلوبة لتفعيل بوابة الدفع:" : "Required Environment Variables Checklist:"}
                  </span>

                  <div className="space-y-2">
                    {cardGateway?.requiredEnvVars.map((v, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-[#0F1115] border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[#ECC15A] font-bold">{v.name}</span>
                          <span className="text-stone-400 text-[11px] block">{v.description}</span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            v.isSet
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-stone-800 text-stone-400"
                          }`}
                        >
                          {v.isSet ? "Configured" : "Not Set"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Integration notice */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span>Security & Commercial Compliance Note</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    In accordance with Qatar Central Bank regulations, online card payments require an authorized merchant agreement with a licensed local acquirer (e.g. QNB, Commercial Bank, Tap Payments Qatar). Until merchant API keys are supplied in the production environment, the website transparently directs guests to verified Bank Transfer or concierge billing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 3: RECONCILIATION LEDGER */}
          {/* ========================================================================= */}
          {activeSubTab === "ledger" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-mono">
                  {isAr ? "جدول مطابقة الدفعات والإيصالات:" : "Bookings & Proofs Financial Reconciliation Ledger:"}
                </span>

                <button
                  type="button"
                  onClick={loadLedger}
                  disabled={loadingLedger}
                  className="px-3 py-1.5 rounded-xl bg-[#0F1115] hover:bg-white/[0.06] border border-white/[0.08] text-xs text-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingLedger ? "animate-spin" : ""}`} />
                  <span>{isAr ? "تحديث السجل" : "Refresh"}</span>
                </button>
              </div>

              {ledger.length === 0 ? (
                <div className="p-16 text-center text-xs text-stone-500 bg-[#14171F] rounded-3xl border border-white/[0.08] shadow-xl">
                  {isAr ? "لا توجد حجوزات مسجلة في النظام حالياً." : "No bookings recorded yet."}
                </div>
              ) : (
                <div className="bg-[#14171F] rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0F1115] text-[10px] uppercase font-mono text-stone-400 border-b border-white/[0.06]">
                        <tr>
                          <th className="p-3.5">Ref</th>
                          <th className="p-3.5">Guest</th>
                          <th className="p-3.5">Service</th>
                          <th className="p-3.5">Deposit Req</th>
                          <th className="p-3.5">Deposit Paid</th>
                          <th className="p-3.5">Balance Due</th>
                          <th className="p-3.5">Payment Status</th>
                          <th className="p-3.5">Proof Audit</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {ledger.map((item) => (
                          <tr key={item.bookingId} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3.5 font-mono font-bold text-[#ECC15A]">
                              {item.bookingRef}
                            </td>
                            <td className="p-3.5">
                              <div className="font-semibold text-stone-200">{item.customerName}</div>
                              <div className="text-[10px] text-stone-500 font-mono">{item.customerEmail}</div>
                            </td>
                            <td className="p-3.5 text-stone-400 font-mono text-[11px]">
                              {item.serviceId}
                            </td>
                            <td className="p-3.5 font-mono text-stone-300">
                              {item.depositRequired.toLocaleString("en-US")} {item.currency}
                            </td>
                            <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                              {item.depositPaid.toLocaleString("en-US")} {item.currency}
                            </td>
                            <td className="p-3.5 font-mono text-stone-300">
                              {item.balanceDue.toLocaleString("en-US")} {item.currency}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                                  item.paymentStatus === "deposit_confirmed" || item.paymentStatus === "fully_paid"
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : item.paymentStatus === "deposit_submitted"
                                    ? "bg-primary/20 text-primary border-primary/30"
                                    : item.paymentStatus === "deposit_rejected"
                                    ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                }`}
                              >
                                {item.paymentStatus.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {item.proofReviewStatus ? (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                                    item.proofReviewStatus === "accepted"
                                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                      : item.proofReviewStatus === "rejected"
                                      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                      : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                  }`}
                                >
                                  {item.proofReviewStatus}
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-stone-500">—</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              {item.proofStoragePath ? (
                                <button
                                  type="button"
                                  onClick={() => handleInspect(item.proofStoragePath!)}
                                  disabled={inspectLoading}
                                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#ECC15A] text-[11px] font-semibold border border-white/[0.08] inline-flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Receipt</span>
                                </button>
                              ) : (
                                <span className="text-[10px] font-mono text-stone-600">No proof</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Proof Inspection Modal */}
      {inspectUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/[0.1] rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ECC15A]">
                Secure Receipt Inspection (15-Minute Signed URL)
              </span>
              <button
                type="button"
                onClick={() => setInspectUrl(null)}
                className="text-stone-400 hover:text-stone-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/60 rounded-2xl overflow-hidden p-2 flex items-center justify-center min-h-[300px]">
              {inspectUrl.includes(".pdf") ? (
                <iframe src={inspectUrl} className="w-full h-[400px] rounded-xl" title="Receipt PDF" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inspectUrl}
                  alt="Customer Payment Receipt"
                  className="max-h-[450px] object-contain rounded-xl"
                />
              )}
            </div>

            <div className="flex justify-between items-center text-xs">
              <a
                href={inspectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ECC15A] hover:underline flex items-center gap-1.5"
              >
                <span>Open in Full Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setInspectUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-stone-300 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
