"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
    id: number;
    title: string;
    price: number;
    category: string;
    inStock: boolean;
    stockLevel: number;
}

export default function AdminProductsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ["/api/products"],
        queryFn: () => apiRequest("GET", "/api/products").then(res => res.json())
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Product deleted", description: "The product has been permanently removed." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
        }
    });

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this product?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-heading text-white tracking-wide uppercase">Products</h1>
                    <p className="text-gray-400">Manage your merchandise inventory.</p>
                </div>
                <Link href="/admin/products/new">
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                    </Button>
                </Link>
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-black/40">
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">ID</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Name</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Price</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Stock Level</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Status</TableHead>
                            <TableHead className="text-right text-white/60 uppercase text-xs tracking-wider">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-white/40">Loading products...</TableCell>
                            </TableRow>
                        ) : products?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-white/40">No products found.</TableCell>
                            </TableRow>
                        ) : (
                            products?.map((product) => {
                                return (
                                    <TableRow key={product.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                        <TableCell className="font-mono text-white/40">#{product.id}</TableCell>
                                        <TableCell className="text-white font-medium">{product.title}</TableCell>
                                        <TableCell className="text-white/70">
                                            ${(product.price / 100).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-white/70">{product.stockLevel}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${product.inStock ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                                                }`}>
                                                {product.inStock ? "In Stock" : "Out of Stock"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Link href={`/shop`} target="_blank">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/products/${product.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                onClick={() => handleDelete(product.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
