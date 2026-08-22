/**
 * Helpdesk & Employee Support Tickets Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from '@/types/database';
import { triggerAutomationEvent } from './automations';

let TICKETS_STORE: SupportTicket[] = [
  {
    id: 'tkt_1',
    organization_id: 'subedge_org',
    employee_id: 'emp_demo',
    ticket_number: 'TKT-1089',
    title: 'VPN Access Certificate Renewal for Remote Staging Cluster',
    category: 'it_support',
    priority: 'high',
    status: 'in_progress',
    description: 'My WireGuard client certificate for the internal testing VPC is expiring this Friday.',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tkt_2',
    organization_id: 'subedge_org',
    employee_id: 'emp_demo',
    ticket_number: 'TKT-1082',
    title: 'Tax Declaration Form 12BB Proof Submission Verification',
    category: 'payroll_issue',
    priority: 'medium',
    status: 'resolved',
    description: 'Submitted rent agreement and Section 80C investment receipts.',
    resolution_notes: 'All investment proofs verified and updated for Q4 FY25-26 payroll deductions.',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'tkt_3',
    organization_id: 'subedge_org',
    employee_id: 'emp_demo',
    ticket_number: 'TKT-1075',
    title: 'Ergonomic Chair Request for Bengaluru Desk',
    category: 'facility',
    priority: 'low',
    status: 'closed',
    description: 'Need lumbar support adjustment on 4th floor workstation.',
    resolution_notes: 'Replaced with Herman Miller Aeron unit.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export async function getTickets(employeeId?: string): Promise<SupportTicket[]> {
  if (employeeId) {
    return TICKETS_STORE.filter((t) => t.employee_id === employeeId);
  }
  return [...TICKETS_STORE];
}

export async function createTicket(ticket: Omit<SupportTicket, 'id' | 'ticket_number' | 'status' | 'created_at' | 'updated_at'>): Promise<SupportTicket> {
  const newTicket: SupportTicket = {
    ...ticket,
    id: `tkt_${Date.now()}`,
    ticket_number: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  TICKETS_STORE.unshift(newTicket);
  return newTicket;
}

export async function resolveTicket(ticketId: string, resolutionNotes: string): Promise<SupportTicket> {
  const ticket = TICKETS_STORE.find((t) => t.id === ticketId);
  if (!ticket) throw new Error('Ticket not found');
  ticket.status = 'resolved';
  ticket.resolution_notes = resolutionNotes;
  ticket.updated_at = new Date().toISOString();

  // Trigger automation
  await triggerAutomationEvent('on_ticket_resolved', {
    ticketNumber: ticket.ticket_number,
    title: ticket.title,
    resolutionNotes,
  });

  return ticket;
}
