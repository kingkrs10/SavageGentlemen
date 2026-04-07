"use client";

import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function EditProductPage({ params }: { params: { id: string } }) {
    const productId = params.id;

    const { data: product, isLoading, error } = useQuery({
        queryKey: [`/api/products/${productId}`],
        queryFn: () => apiRequest("GET", `/api/products/${productId}`).then(res => res.json())
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl text-white font-bold mb-4">Product Not Found</h1>
                <Link href="/admin/products">
                    <Button variant="outline">Back to Products</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/products">
                    <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-heading text-white tracking-wide uppercase">Edit Product</h1>
                    <p className="text-gray-400">Update product details.</p>
                </div>
            </div>

            <ProductForm initialData={product} isEditing />
        </div>
    );
}
