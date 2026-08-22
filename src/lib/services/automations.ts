/**
 * Automation Workflow Engine
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { AutomationRule, AutomationTrigger } from '@/types/database';
import { sendResendEmail, generateWelcomeEmailHtml, generateLeaveDecisionEmailHtml } from './resend';

let AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule_1',
    organization_id: 'subedge_org',
    name: 'New Employee Onboarding Email Dispatch',
    trigger: 'on_employee_created',
    action_type: 'send_resend_email',
    is_active: true,
    target_recipient: 'employee',
    template_subject: 'Welcome to Subedge Technology Pvt Ltd — Oasis HRMS Access',
    executions_count: 14,
    last_executed_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'rule_2',
    organization_id: 'subedge_org',
    name: 'Leave Approval Resend Notification',
    trigger: 'on_leave_approved',
    action_type: 'send_resend_email',
    is_active: true,
    target_recipient: 'employee',
    template_subject: 'Your Leave Request Has Been Approved — Oasis Portal',
    executions_count: 42,
    last_executed_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'rule_3',
    organization_id: 'subedge_org',
    name: 'Support Ticket Resolution Alert',
    trigger: 'on_ticket_resolved',
    action_type: 'send_resend_email',
    is_active: true,
    target_recipient: 'employee',
    template_subject: 'Your Helpdesk Ticket has been Resolved',
    executions_count: 28,
    last_executed_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'rule_4',
    organization_id: 'subedge_org',
    name: 'Appraisal Cycle Completion Notice',
    trigger: 'on_appraisal_submitted',
    action_type: 'send_push',
    is_active: true,
    target_recipient: 'manager',
    template_subject: 'New 360 Performance Appraisal Ready for Manager Review',
    executions_count: 8,
    last_executed_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function getAutomationRules(): Promise<AutomationRule[]> {
  return [...AUTOMATION_RULES];
}

export async function toggleAutomationRule(ruleId: string, isActive: boolean): Promise<AutomationRule> {
  const rule = AUTOMATION_RULES.find((r) => r.id === ruleId);
  if (!rule) throw new Error('Rule not found');
  rule.is_active = isActive;
  return rule;
}

export async function triggerAutomationEvent(trigger: AutomationTrigger, payload: Record<string, any>): Promise<void> {
  const activeRules = AUTOMATION_RULES.filter((r) => r.trigger === trigger && r.is_active);

  for (const rule of activeRules) {
    rule.executions_count += 1;
    rule.last_executed_at = new Date().toISOString();

    if (rule.action_type === 'send_resend_email') {
      if (trigger === 'on_employee_created' && payload.email) {
        await sendResendEmail({
          to: payload.email,
          subject: rule.template_subject,
          htmlContent: generateWelcomeEmailHtml(payload.name || 'Team Member', payload.designation || 'Specialist'),
          category: 'onboarding',
        });
      } else if (trigger === 'on_leave_approved' && payload.email) {
        await sendResendEmail({
          to: payload.email,
          subject: rule.template_subject,
          htmlContent: generateLeaveDecisionEmailHtml(payload.name || 'Colleague', 'approved', payload.dates || 'selected period'),
          category: 'leave',
        });
      }
    }
  }
}
