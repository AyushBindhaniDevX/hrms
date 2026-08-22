/**
 * Resend Email Notification Service
 * Handles transactional emails for Oasis HRMS by Subedge Technology Pvt Ltd.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  recipientName?: string;
  category?: 'onboarding' | 'leave' | 'payroll' | 'ticket' | 'appraisal' | 'general';
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  sentAt: string;
  status: 'delivered' | 'simulated';
  category: string;
}

// In-memory / persistent execution log for dashboard inspection
const SENT_EMAIL_LOGS: EmailLog[] = [];

/**
 * Send an email via Resend API (or simulated enterprise gateway when API key is not configured)
 */
export async function sendResendEmail(payload: EmailPayload): Promise<{ success: boolean; id: string; simulated: boolean }> {
  const logId = `resend_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const apiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Oasis HRMS <notifications@subedge.com>',
          to: [payload.to],
          subject: payload.subject,
          html: payload.htmlContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        SENT_EMAIL_LOGS.unshift({
          id: data.id || logId,
          to: payload.to,
          subject: payload.subject,
          sentAt: new Date().toISOString(),
          status: 'delivered',
          category: payload.category || 'general',
        });
        return { success: true, id: data.id || logId, simulated: false };
      }
    } catch (e) {
      console.warn('Resend API call fallback to simulation:', e);
    }
  }

  // Graceful simulation with delivery confirmation
  SENT_EMAIL_LOGS.unshift({
    id: logId,
    to: payload.to,
    subject: payload.subject,
    sentAt: new Date().toISOString(),
    status: 'simulated',
    category: payload.category || 'general',
  });

  return { success: true, id: logId, simulated: true };
}

/**
 * Get recent email delivery logs
 */
export function getEmailDeliveryLogs(): EmailLog[] {
  return SENT_EMAIL_LOGS;
}

// ----------------------------------------------------
// PRE-FORMATTED BRANDED EMAIL TEMPLATES
// ----------------------------------------------------
export function generateWelcomeEmailHtml(employeeName: string, role: string): string {
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #F8FAFC; padding: 32px; border-radius: 12px;">
      <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(13,115,119,0.06);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0D7377; margin: 0; letter-spacing: 2px;">SUBEDGE</h2>
          <p style="color: #64748B; font-size: 12px; margin: 4px 0 0;">Oasis Platform: Oasis HRMS</p>
        </div>
        <h3 style="color: #1A1A2E;">Welcome aboard, ${employeeName}! 🎉</h3>
        <p style="color: #475569; line-height: 1.6;">Your employee profile as <strong>${role}</strong> has been created in the Subedge Oasis HCM Suite. You can now log in to mark geofenced attendance, submit leave requests, view payslips, and review your performance OKRs.</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="https://subedge.vercel.app/" style="background: #0D7377; color: #FFFFFF; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Open Oasis Workplace</a>
        </div>
        <p style="color: #94A3B8; font-size: 11px; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px;">© 2026 Subedge Technology Pvt Ltd. All rights reserved.</p>
      </div>
    </div>
  `;
}

export function generateLeaveDecisionEmailHtml(employeeName: string, status: 'approved' | 'rejected', dates: string, reviewerComments?: string): string {
  const isApproved = status === 'approved';
  return `
    <div style="font-family: 'Inter', sans-serif; background-color: #F8FAFC; padding: 32px;">
      <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px;">
        <h3 style="color: ${isApproved ? '#10B981' : '#EF4444'};">Leave Request ${isApproved ? 'Approved ✅' : 'Rejected ❌'}</h3>
        <p style="color: #475569;">Hello ${employeeName},</p>
        <p style="color: #475569;">Your leave request for <strong>${dates}</strong> has been <strong>${status.toUpperCase()}</strong> by management.</p>
        ${reviewerComments ? `<div style="background: #F1F5F9; padding: 12px; border-radius: 8px; color: #334155; margin: 16px 0;"><strong>Remarks:</strong> ${reviewerComments}</div>` : ''}
        <p style="color: #94A3B8; font-size: 11px; margin-top: 24px;">Subedge Technology Pvt Ltd · Oasis Automated Workflow</p>
      </div>
    </div>
  `;
}
