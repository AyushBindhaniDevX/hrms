/**
 * Helpdesk & Employee Support Tickets Service (Supabase)
 * Oasis HRMS Multi-Tenant Platform
 */

import { supabase } from '@/lib/supabase';
import { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from '@/types/database';
import { triggerAutomationEvent } from './automations';

export async function getTickets(employeeId?: string): Promise<SupportTicket[]> {
  let query = supabase.from('tickets').select('*');

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as SupportTicket[];
}

export async function createTicket(
  ticket: Omit<SupportTicket, 'id' | 'ticket_number' | 'status' | 'created_at' | 'updated_at'>
): Promise<SupportTicket> {
  const newId = `tkt_${Date.now()}`;
  const tktNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newTicket: SupportTicket = {
    ...ticket,
    id: newId,
    ticket_number: tktNumber,
    status: 'open',
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from('tickets').insert(newTicket);
  if (error) {
    console.error('Error creating ticket in Supabase:', error);
  }

  return newTicket;
}

export async function resolveTicket(ticketId: string, resolutionNotes: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('tickets')
    .update({
      status: 'resolved',
      resolution_notes: resolutionNotes,
      updated_at: now,
    })
    .eq('id', ticketId);

  if (error) throw error;

  await triggerAutomationEvent('on_ticket_resolved', {
    ticketNumber: ticketId,
    resolutionNotes,
  });

  try {
    const { sendTicketStatusEmail } = await import('./resend');
    await sendTicketStatusEmail(
      'employee@subedge.com',
      ticketId,
      'Service Ticket',
      resolutionNotes
    );
  } catch (mailErr) {
    console.warn('Resend ticket email warning:', mailErr);
  }
}
