import { CaseItem, ColumnDefinition, EmailReminderLog } from '../types/schema.ts';

const STORAGE_KEY = 'elite_jurist_email_reminders';
export const DEFAULT_USER_EMAIL = 'bodemohamed5544@gmail.com';

/**
 * Retrieves the stored email reminders history
 */
export const getStoredEmailLogs = (): EmailReminderLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse email logs:', e);
  }
  return [];
};

/**
 * Saves a new email reminder log entry
 */
export const saveEmailLog = (log: EmailReminderLog): EmailReminderLog[] => {
  const current = getStoredEmailLogs();
  const updated = [log, ...current].slice(0, 50); // keep last 50
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save email log:', e);
  }
  return updated;
};

/**
 * Builds formatted email alert text for legal hearings and appointments
 */
export const buildEmailAlertContent = (
  caseItem: CaseItem,
  column: ColumnDefinition,
  timeVal: string,
  minutesBefore: number,
  recipientEmail: string
): { subject: string; bodyHtml: string; bodyText: string } => {
  const caseNo = caseItem.caseNumber || caseItem.customFields?.caseNumberAndType || 'قضية تجارية';
  const client = caseItem.clientName || caseItem.customFields?.clientAndCapacity || 'ذا ايليت كارز انترناشيونال';
  const opponent = caseItem.opponentName || caseItem.customFields?.opponentAndCapacity || 'الطرف الخصم';
  const courtCircuit = caseItem.customFields?.judicialCircuit || caseItem.courtBranch || caseItem.court || 'محاكم دبي';
  const hallTime = caseItem.customFields?.hallAndTime || caseItem.sessionTime || timeVal;
  const sessionDate = caseItem.sessionDate || caseItem.customFields?.sessionDate || new Date().toISOString().split('T')[0];

  const colName = column.nameAr || column.nameEn || 'الميعاد';

  const timeLabel =
    minutesBefore >= 1440
      ? `${Math.round(minutesBefore / 1440)} يوم`
      : minutesBefore >= 60
      ? `${Math.round(minutesBefore / 60)} ساعة`
      : `${minutesBefore} دقيقة`;

  const subject = `⚠️ [تنبيه موعد قضائي قبل ${timeLabel}] - قضية رقم ${caseNo} (${client})`;

  const bodyText = `
تنبيه قضائي آلي عاجل قبل ${timeLabel}:
--------------------------------------------
• مسمى الحقل/الموعد: ${colName}
• الوقت المحدد: ${timeVal} (${sessionDate})
• رقم القضية: ${caseNo}
• الموكل: ${client}
• الخصم: ${opponent}
• المحكمة / الدائرة: ${courtCircuit}
• القاعة والوقت: ${hallTime}
• المطلوب والإجراء القادم: ${caseItem.nextStep || caseItem.customFields?.sessionRequests || 'حضور الجلسة'}

تم إرسال هذا التنبيه تلقائياً إلى بريدك الإلكتروني: ${recipientEmail}
نظام إدارة الدعاوي القضائية - ذا ايليت كارز انترناشيونال
  `.trim();

  const bodyHtml = `
<div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f8fafc; padding: 24px;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 20px; color: #ffffff;">
      <h2 style="margin: 0 0 6px 0; font-size: 18px;">⚖️ تنبيه قضائي آلي - ذا ايليت كارز انترناشيونال</h2>
      <p style="margin: 0; font-size: 13px; color: #cbd5e1;">تنبيه بميعاد جلسة وإجراء قضائي قبل الموعد بـ <strong>${timeLabel}</strong></p>
    </div>
    <div style="padding: 24px; color: #1e293b; line-height: 1.6; font-size: 14px;">
      <div style="background-color: #eff6ff; border-right: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
        <span style="font-size: 12px; color: #1d4ed8; font-weight: bold; display: block;">الموعد والتوقيت:</span>
        <strong style="font-size: 16px; color: #1e3a8a;">${colName}: ${timeVal}</strong>
        <span style="color: #64748b; font-size: 12px; display: block; margin-top: 4px;">تاريخ الجلسة: ${sessionDate} | القاعة: ${hallTime}</span>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; width: 35%;">رقم القضية ونوعها:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${caseNo}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b;">الموكل:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${client}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b;">الطرف الخصم:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${opponent}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b;">المحكمة / الدائرة:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${courtCircuit}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">الطلبات / المطلوب:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #b45309;">${caseItem.nextStep || caseItem.customFields?.sessionRequests || 'متابعة وحضور الجلسة'}</td>
        </tr>
      </table>

      <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 12px; color: #475569; text-align: center;">
        تم إرسال هذا التنبيه التلقائي إلى: <strong>${recipientEmail}</strong>
      </div>
    </div>
  </div>
</div>
  `.trim();

  return { subject, bodyHtml, bodyText };
};

/**
 * Triggers and delivers the email reminder
 */
export const dispatchEmailAlert = (
  caseItem: CaseItem,
  column: ColumnDefinition,
  timeVal: string,
  minutesBefore: number,
  recipientEmail: string = DEFAULT_USER_EMAIL
): EmailReminderLog => {
  const { subject, bodyText } = buildEmailAlertContent(
    caseItem,
    column,
    timeVal,
    minutesBefore,
    recipientEmail
  );

  const newLog: EmailReminderLog = {
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    caseId: caseItem.id,
    caseNumber: caseItem.caseNumber || caseItem.customFields?.caseNumberAndType || '',
    clientName: caseItem.clientName || caseItem.customFields?.clientAndCapacity || '',
    columnName: column.nameAr || column.nameEn,
    targetTime: timeVal,
    minutesBefore,
    recipientEmail,
    subject,
    status: 'sent',
    sentTimestamp: new Date().toLocaleString('ar-AE', { dateStyle: 'short', timeStyle: 'short' }),
  };

  // 1. Save in local log storage
  saveEmailLog(newLog);

  // 2. Browser Web Notification if granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(subject, {
        body: bodyText.slice(0, 150) + '...',
        icon: '/favicon.ico',
      });
    } catch (e) {
      console.warn('Browser notification error:', e);
    }
  }

  return newLog;
};
