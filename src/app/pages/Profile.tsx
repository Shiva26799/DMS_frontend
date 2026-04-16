import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Settings as SettingsIcon,
  LogOut,
  MapPin,
  Phone,
  ArrowRight
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useUpdateUserLogo } from "../hooks/useSettings";
import { validateFileSize } from "../utils/file";
import { toast } from "sonner";
import { Upload, Camera } from "lucide-react";
import { useRef, useState } from "react";

export default function Profile() {
  const { user, logout, isSuperAdmin, isDealer, isWarehouseAdmin } = useAuth();
  const navigate = useNavigate();
  const updateUserLogoMutation = useUpdateUserLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      if (!validateFileSize(file)) {
        e.target.value = "";
        return;
      }
      
      setIsUploading(true);
      const formData = new FormData();
      formData.append("logo", file);

      updateUserLogoMutation.mutate({ 
        id: user.id || (user as any)._id, 
        formData 
      }, {
        onSuccess: () => {
          setIsUploading(false);
          // The Sidebar and other components will update because useAuth() is used everywhere
          // and we might need to refresh the session if logoUrl is not updated in the local user object.
          // However, the mutation success usually invalidates queries.
          // For immediate UI update of the Profile page, we depend on the user object being updated.
        },
        onError: () => {
          setIsUploading(false);
        }
      });
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal settings and see your account status.</p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button variant="outline" asChild>
              <Link to="/settings">
                <SettingsIcon className="w-4 h-4 mr-2" />
                System Settings
              </Link>
            </Button>
          )}
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <Card className="p-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg ring-8 ring-blue-50 overflow-hidden">
               {user.role === "Distributor" && (user as any).logoUrl ? (
                <img 
                  src={(user as any).logoUrl} 
                  alt={user.name} 
                  className="w-full h-full object-contain bg-white p-2"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            {user.role === "Distributor" && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all border-4 border-white"
                title="Update Brand Logo"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500 font-medium">{user.email}</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-100 font-semibold border-none rounded-full">
            {user.role}
          </Badge>
          
          <div className="w-full pt-6 mt-6 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Member Since</span>
              <span className="text-gray-900 font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        {/* Right Column: Account Details & Entity Links */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Account Verification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                  <User className="w-4 h-4" /> Full Name
                </div>
                <p className="text-gray-900 font-semibold">{user.name}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                  <Mail className="w-4 h-4" /> Email Address
                </div>
                <p className="text-gray-900 font-semibold">{user.email}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                  <ShieldCheck className="w-4 h-4" /> Role
                </div>
                <p className="text-gray-900 font-semibold">{user.role}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                  <Calendar className="w-4 h-4" /> Account ID
                </div>
                <p className="text-gray-900 font-mono text-xs overflow-hidden text-ellipsis">{user.id}</p>
              </div>
            </div>
          </Card>

          {/* Role-Specific Entity Link */}
          {(isDealer || isWarehouseAdmin) && (
            <Card className="p-6 border-blue-100 bg-blue-50/20">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Linked Organization
              </h3>
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium whitespace-nowrap">You are currently managing:</p>
                    <h4 className="text-xl font-bold text-gray-900 mt-1 whitespace-nowrap">
                      {isDealer 
                        ? (typeof user.dealerId === 'object' ? user.dealerId?.companyName : `Dealer Account (ID: ${user.dealerId})`) 
                        : "Managed Warehouse"}
                    </h4>
                  </div>

                  {isDealer && typeof user.dealerId === 'object' && user.dealerId?.metadata?.DistributorName && (
                    <div className="pt-4 border-t border-blue-100/50">
                      <p className="text-sm text-gray-500 font-medium">Under Distributor:</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-blue-600 text-white border-none px-3 py-1 rounded-md">
                          {user.dealerId.metadata.DistributorName}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1 font-medium italic">
                      <MapPin className="w-4 h-4 text-blue-600" /> 
                      {isDealer ? (user.dealerId?.address || 'Location Not Set') : "Warehouse Storage"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
