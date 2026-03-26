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

export function Login() {
    const [email, setEmail] = useState("admin@lovol.com");
    const [password, setPassword] = useState("admin");
    const [error, setError] = useState<string | null>(null);
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
                navigate("/");
            },
            onError: (err: any) => {
                const message = err.response?.data?.message || "Login failed";
                setError(message);
                toast.error(message);
            }
        });
    };

    const isLoading = loginMutation.isPending;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full p-8 shadow-xl">
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
                    <div>
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError(null);
                            }}
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
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(null);
                            }}
                            className="mt-1"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                            {error}
                        </div>
                    )}

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
