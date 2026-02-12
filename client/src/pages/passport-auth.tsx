import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LogoImg from "@/assets/passport-hero.png";
import carnivalVideo from "@assets/Caribbean_Nightlife_Loop_Animation_1763081047699.mp4";

// Schema definitions
const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number");

const registerSchema = loginSchema.extend({
    email: z.string().email("Please enter a valid email address"),
    displayName: z.string().min(3, "Display name must be at least 3 characters"),
    password: passwordSchema,
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function PassportAuth() {
    // ... existing hooks ...
    const [, setLocation] = useLocation();
    const { login, user } = useUser();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");

    // Redirect if already logged in
    useEffect(() => {
        if (user && !user.isGuest) {
            setLocation("/passport");
        }
    }, [user, setLocation]);

    const loginForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    const registerForm = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { username: "", email: "", displayName: "", password: "", confirmPassword: "" },
    });

    const loginMutation = useMutation({
        mutationFn: async (data: LoginFormValues) => {
            const res = await apiRequest("POST", "/api/auth/login", data);
            return res.json();
        },
        onSuccess: (data) => {
            login(data);
            toast({ title: "Welcome back!", description: "Continuing your carnival journey..." });
            setLocation("/passport"); // Direct redirection
        },
        onError: (error: Error) => {
            toast({
                title: "Login Failed",
                description: error.message || "Please check your credentials",
                variant: "destructive",
            });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (data: RegisterFormValues) => {
            const { confirmPassword, ...registerData } = data;
            const res = await apiRequest("POST", "/api/auth/register", registerData);
            return res.json();
        },
        onSuccess: (data) => {
            login(data);
            toast({ title: "Welcome!", description: "Your passport has been created." });
            setLocation("/passport");
        },
        onError: (error: Error) => {
            toast({
                title: "Registration Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2c3e50] to-[#34495e] flex items-center justify-center p-4 relative overflow-hidden text-foreground">
            {/* Video Background */}
            <div className="absolute inset-0 overflow-hidden z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-20"
                >
                    <source src={carnivalVideo} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-[#2c3e50]/90 via-[#34495e]/50 to-[#2c3e50]/95" />
            </div>

            {/* Hyper-Realistic Lighting Layers - Matching Socapassport */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(230,126,34,0.15),transparent_50%)] pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(52,152,219,0.12),transparent_55%)] pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(230,126,34,0.1),transparent_40%)] pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_60%,rgba(52,152,219,0.08),transparent_45%)] pointer-events-none z-0" />

            <Helmet>
                <title>Soca Passport Login</title>
                <meta name="description" content="Sign in to your Soca Passport" />
            </Helmet>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />

            <Card className="w-full max-w-md bg-black/60 border-primary/20 backdrop-filter backdrop-blur-md relative z-10 shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-24 h-24 rounded-full bg-black/40 flex items-center justify-center border-2 border-cyan-500/50 p-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                        <img src={LogoImg} alt="Soca Passport" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Soca Passport
                        </CardTitle>
                        <CardDescription className="text-gray-300 text-lg">
                            Your Digital Carnival Identity
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/40">
                            <TabsTrigger value="login" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-bold">Login</TabsTrigger>
                            <TabsTrigger value="register" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-bold">Register</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <Form {...loginForm}>
                                <form onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
                                    <FormField
                                        control={loginForm.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-300">Username</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your username" {...field} className="bg-black/40 border-gray-600 focus:border-primary text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={loginForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-300">Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Enter your password" {...field} className="bg-black/40 border-gray-600 focus:border-primary text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-bold text-lg h-12 shadow-[0_0_15px_rgba(34,211,238,0.4)]" disabled={loginMutation.isPending}>
                                        {loginMutation.isPending ? "Authenticating..." : "Access Passport"}
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>

                        <TabsContent value="register">
                            <Form {...registerForm}>
                                <form onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))} className="space-y-4">
                                    <FormField
                                        control={registerForm.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-300">Username</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Choose a username" {...field} className="bg-black/40 border-gray-600 focus:border-primary text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={registerForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-300">Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="Enter your email" {...field} className="bg-black/40 border-gray-600 focus:border-primary text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={registerForm.control}
                                        name="displayName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-300">Display Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Your carnival name" {...field} className="bg-black/40 border-gray-600 focus:border-primary text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={registerForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-300">Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Create password" {...field} className="bg-black/40 border-gray-600 focus:border-primary text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={registerForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-300">Confirm Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Confirm password" {...field} className="bg-black/40 border-gray-600 focus:border-primary text-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-primary/80 hover:to-orange-600/80 text-black font-bold text-lg h-12" disabled={registerMutation.isPending}>
                                        {registerMutation.isPending ? "Creating Passport..." : "Create My Passport"}
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t border-white/10 pt-6">
                    <Link href="/socapassport">
                        <a className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                            Return to Soca Passport Home
                        </a>
                    </Link>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">Are you an event organizer?</p>
                        <Link href="/passport-promoters">
                            <a className="inline-flex items-center gap-2 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 hover:to-white transition-all">
                                <span className="uppercase tracking-wider">Access Promoter Portal</span>
                                <span className="text-pink-500">&rarr;</span>
                            </a>
                        </Link>
                    </div>
                </CardFooter>
            </Card>

            <div className="absolute bottom-4 text-gray-500 text-xs text-center z-10">
                &copy; {new Date().getFullYear()} Savage Gentlemen. All rights reserved.
            </div>
        </div>
    );
}
