/**
 * Helpdesk & Employee Support Tickets Service (Dynamic Firestore)
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from '@/types/database';
import { seedDatabaseIfEmpty } from './seed';
import { triggerAutomationEvent } from './automations';

export async function getTickets(employeeId?: string): Promise<SupportTicket[]> {
  await seedDatabaseIfEmpty();

  try {
    const ticketsRef = collection(db, 'tickets');
    let q = query(ticketsRef);

    if (employeeId) {
      q = query(ticketsRef, where('employee_id', '==', employeeId));
    }

    const snapshot = await getDocs(q);
    const results: SupportTicket[] = [];
    snapshot.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as SupportTicket);
    });
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error fetching tickets from Firestore:', error);
    return [];
  }
}

export async function createTicket(
  ticket: Omit<SupportTicket, 'id' | 'ticket_number' | 'status' | 'created_at' | 'updated_at'>
): Promise<SupportTicket> {
  const newId = `tkt_${Date.now()}`;
  const tktNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

  const newTicket: SupportTicket = {
    ...ticket,
    id: newId,
    ticket_number: tktNumber,
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'tickets', newId), newTicket);
  } catch (error) {
    console.error('Error creating ticket in Firestore:', error);
  }

  return newTicket;
}

export async function resolveTicket(ticketId: string, resolutionNotes: string): Promise<void> {
  try {
    const tktRef = doc(db, 'tickets', ticketId);
    await updateDoc(tktRef, {
      status: 'resolved',
      resolution_notes: resolutionNotes,
      updated_at: new Date().toISOString(),
    });

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
  } catch (error) {
    console.error('Error resolving ticket in Firestore:', error);
  }
}
