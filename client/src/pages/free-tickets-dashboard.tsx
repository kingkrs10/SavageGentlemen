import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Ticket, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface FreeTicketData {
  id: number;
  userId: number;
  eventId: number;
  ticketId: number;
  orderId: number;
  purchaseDate: string;
  price: string;
  status: string;
  attendeeEmail: string;
  attendeeName: string;
  username: string;
  displayName: string;
  eventTitle: string;
  ticketName: string;
}

interface FreeTicketSummary {
  totalFreeTickets: number;
  uniqueUsers: number;
  events: string[];
  recentPurchases: FreeTicketData[];
  userBreakdown: Record<string, number>;
}

export default function FreeTicketsDashboard() {
  const { data, isLoading, error } = useQuery<{
    summary: FreeTicketSummary;
    tickets: FreeTicketData[];
  }>({
    queryKey: ["/api/admin/free-tickets"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load free ticket data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>No data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, tickets } = data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Free Ticket Monitoring</h1>
          <p className="text-muted-foreground">Track and monitor free ticket usage across your events</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Free Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalFreeTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events with Free Tickets</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.events.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Tickets per User</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary.totalFreeTickets / summary.uniqueUsers).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Free Tickets by User</CardTitle>
          <CardDescription>Breakdown of free ticket usage per user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(summary.userBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([username, count]) => (
                <div key={username} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{username}</div>
                  <Badge variant="secondary">{count} tickets</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Free Ticket Purchases</CardTitle>
          <CardDescription>Latest 10 free ticket purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.recentPurchases.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{ticket.displayName || ticket.username}</div>
                  <div className="text-sm text-muted-foreground">{ticket.eventTitle}</div>
                  <div className="text-xs text-muted-foreground">{ticket.ticketName}</div>
                </div>
                <div className="text-right space-y-1">
                  <Badge 
                    variant={ticket.status === 'valid' ? 'default' : 'destructive'}
                    className="mb-2"
                  >
                    {ticket.status}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(ticket.purchaseDate), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Order #{ticket.orderId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Free Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Free Tickets</CardTitle>
          <CardDescription>Complete list of all free ticket purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">Ticket Type</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Order</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{ticket.displayName || ticket.username}</div>
                        {ticket.attendeeEmail && (
                          <div className="text-xs text-muted-foreground">{ticket.attendeeEmail}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">{ticket.eventTitle}</td>
                    <td className="p-2 text-sm">{ticket.ticketName}</td>
                    <td className="p-2 text-sm">
                      {format(new Date(ticket.purchaseDate), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant={ticket.status === 'valid' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm">#{ticket.orderId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}