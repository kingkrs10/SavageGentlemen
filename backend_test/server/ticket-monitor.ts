import { storage } from './storage';
import { sendTicketEmail } from './email';

interface TicketDeliveryStatus {
  ticketId: number;
  orderId: number;
  userId: number;
  email: string;
  eventName: string;
  deliveryAttempts: number;
  lastAttempt: Date;
  delivered: boolean;
  errorMessage?: string;
}

class TicketDeliveryMonitor {
  private pendingDeliveries: Map<string, TicketDeliveryStatus> = new Map();
  private maxRetries = 3;
  private retryDelay = 30000; // 30 seconds

  async ensureTicketDelivery(
    ticketId: number,
    orderId: number,
    userId: number,
    email: string,
    eventName: string,
    qrCodeData: string,
    eventLocation: string,
    eventDate: Date,
    ticketType: string,
    ticketPrice: number
  ): Promise<boolean> {
    const deliveryKey = `${ticketId}-${orderId}`;
    
    try {
      console.log(`Ensuring ticket delivery for user ${userId}, email: ${email}`);
      
      const result = await sendTicketEmail({
        ticketId: ticketId.toString(),
        qrCodeDataUrl: qrCodeData,
        eventName,
        eventLocation,
        eventDate,
        ticketType,
        ticketPrice,
        purchaseDate: new Date()
      }, email);

      if (result) {
        console.log(`✓ Ticket email delivered successfully to ${email}`);
        this.pendingDeliveries.delete(deliveryKey);
        return true;
      } else {
        throw new Error('Email delivery failed');
      }
    } catch (error) {
      console.error(`Failed to deliver ticket email to ${email}:`, error);
      
      // Track failed delivery for retry
      const status: TicketDeliveryStatus = {
        ticketId,
        orderId,
        userId,
        email,
        eventName,
        deliveryAttempts: (this.pendingDeliveries.get(deliveryKey)?.deliveryAttempts || 0) + 1,
        lastAttempt: new Date(),
        delivered: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };

      this.pendingDeliveries.set(deliveryKey, status);
      
      // Schedule retry if under max attempts
      if (status.deliveryAttempts < this.maxRetries) {
        setTimeout(() => {
          this.retryDelivery(deliveryKey);
        }, this.retryDelay * status.deliveryAttempts);
        console.log(`Scheduled retry ${status.deliveryAttempts}/${this.maxRetries} for ${email}`);
      } else {
        console.error(`Max delivery attempts reached for ticket ${ticketId} to ${email}`);
      }
      
      return false;
    }
  }

  private async retryDelivery(deliveryKey: string): Promise<void> {
    const status = this.pendingDeliveries.get(deliveryKey);
    if (!status || status.delivered) return;

    try {
      // Get fresh ticket data
      const ticket = await storage.getTicketPurchase(status.ticketId);
      if (!ticket) {
        console.error(`Ticket ${status.ticketId} not found for retry`);
        return;
      }

      const event = await storage.getEvent(ticket.eventId);
      if (!event) {
        console.error(`Event ${ticket.eventId} not found for retry`);
        return;
      }

      console.log(`Retrying ticket delivery for ${status.email} (attempt ${status.deliveryAttempts + 1})`);
      
      await this.ensureTicketDelivery(
        status.ticketId,
        status.orderId,
        status.userId,
        status.email,
        status.eventName,
        ticket.qrCodeData,
        event.location,
        event.date,
        ticket.ticketType,
        typeof ticket.price === 'string' ? parseFloat(ticket.price) : ticket.price || 0
      );
    } catch (error) {
      console.error(`Retry failed for ${status.email}:`, error);
    }
  }

  async monitorUserTickets(username: string): Promise<TicketDeliveryStatus[]> {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      console.log(`User ${username} not found`);
      return [];
    }

    const tickets = await storage.getTicketsByUserId(user.id);
    const deliveryStatuses: TicketDeliveryStatus[] = [];

    for (const ticket of tickets) {
      const deliveryKey = `${ticket.id}-${ticket.orderId}`;
      const status = this.pendingDeliveries.get(deliveryKey);
      
      if (status) {
        deliveryStatuses.push(status);
      } else if (user.email) {
        // Check if ticket was delivered (no pending delivery means it was successful)
        deliveryStatuses.push({
          ticketId: ticket.id,
          orderId: ticket.orderId,
          userId: user.id,
          email: user.email,
          eventName: 'Event', // Would need to fetch event details
          deliveryAttempts: 1,
          lastAttempt: ticket.purchaseDate,
          delivered: true
        });
      }
    }

    return deliveryStatuses;
  }

  getPendingDeliveries(): TicketDeliveryStatus[] {
    return Array.from(this.pendingDeliveries.values());
  }

  getDeliveryStatus(ticketId: number, orderId: number): TicketDeliveryStatus | null {
    const deliveryKey = `${ticketId}-${orderId}`;
    return this.pendingDeliveries.get(deliveryKey) || null;
  }
}

export const ticketMonitor = new TicketDeliveryMonitor();