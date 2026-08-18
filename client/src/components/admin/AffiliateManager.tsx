
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import BrandLoader from "@/components/ui/BrandLoader";
import { DollarSign, MousePointerClick, Users } from "lucide-react";

export function AffiliateManager() {
    const { data, isLoading } = useQuery({
        queryKey: ["/api/admin/affiliates"],
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <BrandLoader />
            </div>
        );
    }

    const affiliates = data?.performance || [];
    const totalClicks = data?.overallClicks || 0;
    const totalConversions = data?.overallConversions || 0;
    const totalRevenue = data?.overallRevenue || 0;
    const totalAffiliates = affiliates.length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Affiliate Program</h2>
                <p className="text-gray-400">Manage affiliates, referral codes, and tracking.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Total Affiliates</CardTitle>
                        <Users className="h-4 w-4 text-gold-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-heading font-extrabold text-white">{totalAffiliates}</div>
                    </CardContent>
                </Card>
                <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Total Clicks</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-gold-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-heading font-extrabold text-white">{totalClicks}</div>
                    </CardContent>
                </Card>
                <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Conversions</CardTitle>
                        <Users className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-heading font-extrabold text-emerald-400">{totalConversions}</div>
                    </CardContent>
                </Card>
                <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-gold-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-heading font-extrabold text-gold-400">${(totalRevenue / 100).toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-xl font-heading text-gold-400">Affiliate Performance</CardTitle>
                    <CardDescription className="text-gray-400 text-xs">Track referrals, commissions, and click counts for each partner.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-white/5 border-b border-gold-500/20">
                                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">User</TableHead>
                                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Code</TableHead>
                                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold text-center">Clicks</TableHead>
                                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold text-center">Conversions</TableHead>
                                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold text-center">Revenue</TableHead>
                                    <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold text-right">Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {affiliates?.length === 0 ? (
                                    <TableRow className="border-b border-white/5">
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500 font-mono text-xs">
                                            No affiliates found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    affiliates?.map((affiliate: any) => (
                                        <TableRow key={affiliate.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                                            <TableCell className="font-medium text-white">
                                                {affiliate.username || 'Unknown'}
                                                <div className="text-xs text-zinc-500 font-normal">
                                                    {affiliate.email || ''}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="px-2 py-1 bg-black rounded border border-zinc-800 text-primary text-xs">
                                                    {affiliate.referralCode}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-white">
                                                {affiliate.totalClicks}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-white">
                                                {affiliate.totalConversions}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-white">
                                                <Badge variant="outline" className="text-zinc-300 border-zinc-700 bg-black/40">
                                                    ${((affiliate.totalRevenueGenerated || 0) / 100).toFixed(2)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-zinc-400 text-sm">
                                                {formatDate(affiliate.createdAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
