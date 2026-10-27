/**
 * Server-Sent Events (SSE) Real-Time Notification Service
 * Paramount Textile Mills (P) Ltd
 * Permission-aware live event dispatcher for ticket state updates.
 */

class SSEService {
  constructor() {
    /** @type {Map<string, { res: object, user: object }>} */
    this.clients = new Map();
  }

  /**
   * Register a new SSE client
   * @param {string} clientId 
   * @param {object} res 
   * @param {object} user 
   */
  addClient(clientId, res, user) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Connection Established' })}\n\n`);

    this.clients.set(clientId, { res, user });

    // Send periodic heartbeat every 25 seconds to keep connection alive through proxies
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (err) {
        clearInterval(heartbeatTimer);
        this.clients.delete(clientId);
      }
    }, 25000);

    res.on('close', () => {
      clearInterval(heartbeatTimer);
      this.clients.delete(clientId);
    });
  }

  /**
   * Broadcast a ticket event to authorized clients only
   * @param {string} eventType e.g., 'TICKET_CREATED', 'TICKET_UPDATED', 'TICKET_ASSIGNED'
   * @param {object} ticketData
   */
  broadcastTicketEvent(eventType, ticketData) {
    const payload = JSON.stringify({
      type: eventType,
      ticket: ticketData,
      timestamp: new Date().toISOString()
    });

    for (const [clientId, client] of this.clients.entries()) {
      const { res, user } = client;

      // Permission check:
      // - Admin receives all ticket updates
      // - Support receives tickets assigned to them or unassigned
      // - Employee receives only their own created tickets
      let isAuthorized = false;

      if (!user) continue;

      if (user.role === 'admin') {
        isAuthorized = true;
      } else if (user.role === 'support') {
        if (!ticketData.assigned_to || ticketData.assigned_to === user.support_team_id || ticketData.created_by === user.id) {
          isAuthorized = true;
        }
      } else if (user.role === 'employee') {
        if (ticketData.created_by === user.id) {
          isAuthorized = true;
        }
      }

      if (isAuthorized) {
        try {
          res.write(`data: ${payload}\n\n`);
        } catch (err) {
          this.clients.delete(clientId);
        }
      }
    }
  }
}

const sseService = new SSEService();
module.exports = sseService;
