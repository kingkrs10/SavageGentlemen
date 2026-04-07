"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import FileUploader from "@/components/ui/file-uploader";

// Infer type from schema
type ProductFormValues = z.infer<typeof insertProductSchema>;

interface ProductFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultValues = initialData ? {
        ...initialData,
        price: initialData.price || 0,
        // Ensure booleans and other fields are clean
        inStock: !!initialData.inStock,
        featured: !!initialData.featured,
        trackInventory: !!initialData.trackInventory,
        stockLevel: initialData.stockLevel || 0,
        lowStockThreshold: initialData.lowStockThreshold || 5,
    } : {
        title: "",
        description: "",
        price: 0,
        imageUrl: "",
        category: "merch",
        featured: false,
        inStock: true,
        stockLevel: 0,
        trackInventory: true,
        lowStockThreshold: 5,
        sku: "",
    };

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(insertProductSchema),
        defaultValues,
    });

    async function onSubmit(data: ProductFormValues) {
        setIsSubmitting(true);
        try {
            const url = isEditing && initialData?.id
                ? `/api/products/${initialData.id}`
                : "/api/products";

            const method = isEditing ? "PUT" : "POST";

            await apiRequest(method, url, data);

            toast({
                title: isEditing ? "Product Updated" : "Product Created",
                description: `Successfully ${isEditing ? "updated" : "created"} the product.`,
            });

            router.push("/admin/products");
            router.refresh();
        } catch (error) {
            console.error("Form Error:", error);
            toast({
                title: "Error",
                description: "Failed to save product. Please check your inputs.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl bg-gray-900/50 p-6 rounded-lg border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel className="text-white">Product Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter product name" {...field} className="bg-black/40 border-white/10 text-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Category</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Merch, Accessories" {...field} className="bg-black/40 border-white/10 text-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Price (Cents)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="2500 for $25.00"
                                        {...field}
                                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                        className="bg-black/40 border-white/10 text-white"
                                    />
                                </FormControl>
                                <FormDescription className="text-xs text-white/40">Enter price in cents (e.g., 2500 = $25.00)</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel className="text-white">Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Product details..." {...field} className="min-h-[100px] bg-black/40 border-white/10 text-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="col-span-2 border-t border-white/10 pt-4">
                        <h3 className="text-lg font-medium text-white mb-4">Inventory</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="stockLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Stock Level</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                                className="bg-black/40 border-white/10 text-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">SKU</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Optional SKU" {...field} value={field.value || ''} className="bg-black/40 border-white/10 text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel className="text-white">Product Image</FormLabel>
                                <FormControl>
                                    <FileUploader
                                        value={field.value || ""}
                                        onUpload={(url) => field.onChange(url)}
                                        folder="products"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                        <FormField
                            control={form.control}
                            name="inStock"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-white/10 rounded-md bg-black/20">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="border-white/20 data-[state=checked]:bg-primary"
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="text-white">In Stock</FormLabel>
                                        <FormDescription className="text-white/40 text-xs">
                                            Available for purchase.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="featured"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-white/10 rounded-md bg-black/20">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="border-white/20 data-[state=checked]:bg-primary"
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="text-white">Featured Product</FormLabel>
                                        <FormDescription className="text-white/40 text-xs">
                                            Show on home/shop highlights.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-white/60 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary text-white hover:bg-primary/90 font-bold uppercase tracking-wider"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Save Changes" : "Create Product"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
