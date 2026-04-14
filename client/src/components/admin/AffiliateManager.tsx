
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
        queryFn: async () => {
            const res = await fetch("/api/admin/affiliates");
            if (!res.ok) throw new Error("Failed to fetch affiliates");
            return res.json();
        }
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
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Affiliates</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalAffiliates}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Clicks</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalClicks}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Conversions</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalConversions}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">${(totalRevenue / 100).toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Affiliate Performance</CardTitle>
                    <CardDescription>Track referrals and click counts for each affiliate.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-zinc-800 bg-black/20">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                                    <TableHead className="text-zinc-400 font-semibold">User</TableHead>
                                    <TableHead className="text-zinc-400 font-semibold">Code</TableHead>
                                    <TableHead className="text-zinc-400 font-semibold text-center">Clicks</TableHead>
                                    <TableHead className="text-zinc-400 font-semibold text-center">Conversions</TableHead>
                                    <TableHead className="text-zinc-400 font-semibold text-center">Revenue</TableHead>
                                    <TableHead className="text-zinc-400 font-semibold text-right">Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {affiliates?.length === 0 ? (
                                    <TableRow className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                                        <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
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
