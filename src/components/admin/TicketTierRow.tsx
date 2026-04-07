"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, ChevronDown, ChevronUp, Ticket, Crown, Star, Zap } from "lucide-react";
import { useState } from "react";

export interface TicketTierData {
    _clientId: string; // local unique ID for React key
    name: string;
    description: string;
    price: number;
    quantity: number;
    tierLevel: "standard" | "premium" | "vip" | "ultra_vip";
    badgeColor: string;
    benefits: string[];
    includedItems: string[];
    salesStartDate: string;
    salesEndDate: string;
    maxPerPurchase: number;
    transferable: boolean;
    refundable: boolean;
    earlyAccess: boolean;
}

const TIER_PRESETS: Record<string, Partial<TicketTierData>> = {
    early_bird: {
        name: "Early Bird",
        tierLevel: "standard",
        badgeColor: "#22c55e",
        description: "Limited early pricing — act fast!",
        maxPerPurchase: 4,
        earlyAccess: false,
        transferable: true,
        refundable: false,
    },
    general: {
        name: "General Admission",
        tierLevel: "standard",
        badgeColor: "#3b82f6",
        description: "Standard event access.",
        maxPerPurchase: 10,
        earlyAccess: false,
        transferable: true,
        refundable: false,
    },
    vip: {
        name: "VIP",
        tierLevel: "vip",
        badgeColor: "#d4af37",
        description: "Premium experience with exclusive perks.",
        maxPerPurchase: 6,
        earlyAccess: true,
        transferable: true,
        refundable: false,
        benefits: ["Priority Entry", "VIP Lounge Access", "Complimentary Drink"],
    },
    ultra_vip: {
        name: "Ultra VIP",
        tierLevel: "ultra_vip",
        badgeColor: "#c084fc",
        description: "The ultimate experience. All-access pass.",
        maxPerPurchase: 4,
        earlyAccess: true,
        transferable: false,
        refundable: false,
        benefits: ["All VIP Benefits", "Backstage Access", "Meet & Greet", "Bottle Service Included"],
    },
};

const TIER_ICONS: Record<string, React.ReactNode> = {
    standard: <Ticket className="h-4 w-4" />,
    premium: <Star className="h-4 w-4" />,
    vip: <Crown className="h-4 w-4" />,
    ultra_vip: <Zap className="h-4 w-4" />,
};

interface TicketTierRowProps {
    tier: TicketTierData;
    index: number;
    onChange: (index: number, tier: TicketTierData) => void;
    onRemove: (index: number) => void;
}

export function TicketTierRow({ tier, index, onChange, onRemove }: TicketTierRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newBenefit, setNewBenefit] = useState("");
    const [newItem, setNewItem] = useState("");

    const updateField = (field: keyof TicketTierData, value: any) => {
        onChange(index, { ...tier, [field]: value });
    };

    const addBenefit = () => {
        if (newBenefit.trim()) {
            updateField("benefits", [...tier.benefits, newBenefit.trim()]);
            setNewBenefit("");
        }
    };

    const removeBenefit = (i: number) => {
        updateField("benefits", tier.benefits.filter((_, idx) => idx !== i));
    };

    const addIncludedItem = () => {
        if (newItem.trim()) {
            updateField("includedItems", [...tier.includedItems, newItem.trim()]);
            setNewItem("");
        }
    };

    const removeIncludedItem = (i: number) => {
        updateField("includedItems", tier.includedItems.filter((_, idx) => idx !== i));
    };

    return (
        <div className="border border-white/10 rounded-lg bg-black/30 overflow-hidden transition-all duration-200">
            {/* Header Row */}
            <div className="flex items-center gap-3 p-4">
                {/* Badge Preview */}
                <div
                    className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                    style={{ backgroundColor: tier.badgeColor + "30", color: tier.badgeColor }}
                >
                    {TIER_ICONS[tier.tierLevel] || <Ticket className="h-4 w-4" />}
                </div>

                {/* Name */}
                <Input
                    value={tier.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Tier Name"
                    className="bg-black/40 border-white/10 text-white flex-1 max-w-[200px]"
                />

                {/* Price */}
                <div className="flex items-center gap-1">
                    <span className="text-white/40 text-sm">$</span>
                    <Input
                        type="number"
                        value={tier.price}
                        onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                        className="bg-black/40 border-white/10 text-white w-24"
                        min={0}
                        step={0.01}
                    />
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-1">
                    <span className="text-white/40 text-xs">QTY</span>
                    <Input
                        type="number"
                        value={tier.quantity}
                        onChange={(e) => updateField("quantity", parseInt(e.target.value) || 0)}
                        className="bg-black/40 border-white/10 text-white w-20"
                        min={1}
                    />
                </div>

                {/* Tier Level Select */}
                <select
                    value={tier.tierLevel}
                    onChange={(e) => updateField("tierLevel", e.target.value)}
                    className="bg-black/40 border border-white/10 text-white rounded-md px-3 py-2 text-sm"
                >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                    <option value="ultra_vip">Ultra VIP</option>
                </select>

                {/* Color Picker */}
                <input
                    type="color"
                    value={tier.badgeColor}
                    onChange={(e) => updateField("badgeColor", e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10"
                    title="Badge Color"
                />

                {/* Expand/Collapse */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-white/40 hover:text-white shrink-0"
                >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {/* Delete */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-white/5 p-4 space-y-4 bg-white/[0.02]">
                    <Textarea
                        value={tier.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        placeholder="Tier description..."
                        className="bg-black/40 border-white/10 text-white min-h-[60px]"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        {/* Sales Window */}
                        <div>
                            <label className="text-xs text-white/40 mb-1 block">Sales Start Date</label>
                            <Input
                                type="datetime-local"
                                value={tier.salesStartDate}
                                onChange={(e) => updateField("salesStartDate", e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/40 mb-1 block">Sales End Date</label>
                            <Input
                                type="datetime-local"
                                value={tier.salesEndDate}
                                onChange={(e) => updateField("salesEndDate", e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-white/40 mb-1 block">Max per Purchase</label>
                            <Input
                                type="number"
                                value={tier.maxPerPurchase}
                                onChange={(e) => updateField("maxPerPurchase", parseInt(e.target.value) || 1)}
                                className="bg-black/40 border-white/10 text-white"
                                min={1}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="flex items-center gap-2 p-2 border border-white/10 rounded bg-black/20">
                                <Checkbox
                                    checked={tier.transferable}
                                    onCheckedChange={(val) => updateField("transferable", !!val)}
                                    className="border-white/20 data-[state=checked]:bg-primary"
                                />
                                <span className="text-white text-sm">Transferable</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="flex items-center gap-2 p-2 border border-white/10 rounded bg-black/20">
                                <Checkbox
                                    checked={tier.earlyAccess}
                                    onCheckedChange={(val) => updateField("earlyAccess", !!val)}
                                    className="border-white/20 data-[state=checked]:bg-primary"
                                />
                                <span className="text-white text-sm">Early Access</span>
                            </div>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div>
                        <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">Perks & Benefits</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tier.benefits.map((b, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: tier.badgeColor + "20", color: tier.badgeColor, border: `1px solid ${tier.badgeColor}40` }}
                                >
                                    {b}
                                    <button type="button" onClick={() => removeBenefit(i)} className="ml-1 hover:opacity-70">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newBenefit}
                                onChange={(e) => setNewBenefit(e.target.value)}
                                placeholder="e.g., Free Drink, VIP Lounge..."
                                className="bg-black/40 border-white/10 text-white flex-1"
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                            />
                            <Button type="button" variant="outline" onClick={addBenefit} className="border-white/10 text-white/60 hover:text-white">
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* Included Items */}
                    <div>
                        <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">Included Items</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tier.includedItems.map((item, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/5 text-white/70 border border-white/10"
                                >
                                    {item}
                                    <button type="button" onClick={() => removeIncludedItem(i)} className="ml-1 hover:opacity-70">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="e.g., Welcome Kit, Lanyard..."
                                className="bg-black/40 border-white/10 text-white flex-1"
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIncludedItem())}
                            />
                            <Button type="button" variant="outline" onClick={addIncludedItem} className="border-white/10 text-white/60 hover:text-white">
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function createEmptyTier(preset?: string): TicketTierData {
    const base: TicketTierData = {
        _clientId: crypto.randomUUID(),
        name: "",
        description: "",
        price: 0,
        quantity: 100,
        tierLevel: "standard",
        badgeColor: "#3b82f6",
        benefits: [],
        includedItems: [],
        salesStartDate: "",
        salesEndDate: "",
        maxPerPurchase: 10,
        transferable: true,
        refundable: false,
        earlyAccess: false,
    };

    if (preset && TIER_PRESETS[preset]) {
        return { ...base, ...TIER_PRESETS[preset], _clientId: crypto.randomUUID() };
    }

    return base;
}
