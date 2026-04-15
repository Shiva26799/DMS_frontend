import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useLoginMutation } from "../hooks/auth/useLoginMutation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import bgImage from "../../images/617-0f8efea56ae44236805db27360998b29.jpg";

export function Login() {
    const [email, setEmail] = useState("admin@lovol.com");
    const [password, setPassword] = useState("admin");
    const navigate = useNavigate();
    const { login } = useAuth();
    const loginMutation = useLoginMutation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        loginMutation.mutate({ email, password }, {
            onSuccess: (data) => {
                const { token, user } = data;
                login(token, user);
                toast.success("Successfully logged in");
                if (user.role === "Warehouse Admin") {
                    navigate("/inventory");
                } else {
                    navigate("/");
                }
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || "Login failed");
            }
        });
    };

    const isLoading = loginMutation.isPending;

    return (
        <div 
            className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative py-12 px-4 sm:px-6 lg:px-8"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <Card className="max-w-md w-full p-8 shadow-2xl relative z-10 bg-white/90 backdrop-blur-sm">
                <div className="text-center mb-8">
                    <div className="w-64 h-24 bg-transparent rounded-lg mx-auto flex items-center justify-center mb-1 overflow-hidden">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                // Fallback if logo.png doesn't exist yet
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        <span className="text-blue-600 font-bold text-lg tracking-wider hidden">LOVOL</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Login</h2>
                    <p className="mt-2 text-sm text-gray-600">Distribution Management System</p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    {loginMutation.isError && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 text-center font-medium">
                            {(loginMutation.error as any)?.response?.data?.message || "Invalid email or password."}
                        </div>
                    )}
                    <div>
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1"
                            placeholder="admin@lovol.com"
                        />
                    </div>

                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1"
                            placeholder="••••••••"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign in"
                        )}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
