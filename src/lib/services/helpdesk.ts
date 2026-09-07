/**
 * Helpdesk & Employee Support Tickets Service (Cloud Firestore)
 * Oasis HRMS Multi-Tenant Platform
 */

import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from '@/types/database';
import { triggerAutomationEvent } from './automations';

export async function getTickets(employeeId?: string, organizationId?: string): Promise<SupportTicket[]> {
  try {
    const snap = await getDocs(collection(db, 'tickets'));
    const tickets: SupportTicket[] = [];
    snap.forEach((d) => {
      const t = { id: d.id, ...d.data() } as SupportTicket;
      const orgMatch =
        !organizationId ||
        t.organization_id === organizationId ||
        (organizationId === 'shanti-memorial-hospital' && t.organization_id === 'smh');
      if (orgMatch && (!employeeId || t.employee_id === employeeId)) {
        tickets.push(t);
      }
    });

    tickets.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return tickets;
  } catch (err) {
    console.error('getTickets error:', err);
    return [];
  }
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

  await setDoc(doc(db, 'tickets', newId), newTicket);
  return newTicket;
}

export async function resolveTicket(ticketId: string, resolutionNotes: string): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'tickets', ticketId), {
    status: 'resolved',
    resolution_notes: resolutionNotes,
    updated_at: now,
  });

  await triggerAutomationEvent('on_ticket_resolved', {
    ticketNumber: ticketId,
    resolutionNotes,
  });

  try {
    const { sendTicketStatusEmail } = await import('./resend');
    await sendTicketStatusEmail(
      'employee@oasis.io',
      ticketId,
      'Service Ticket',
      resolutionNotes
    );
  } catch (mailErr) {
    console.warn('Resend ticket email warning:', mailErr);
  }
}
