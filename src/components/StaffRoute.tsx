
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, XCircle } from "lucide-react";

interface StaffRouteProps {
  children: React.ReactNode;
  onBack: () => void;
  requiredRole?: 'admin' | 'staff';
}

export const StaffRoute = ({ children, onBack, requiredRole = 'staff' }: StaffRouteProps) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
        
        // Check if user has required role or higher privileges
        const hasAccess = roleData.role === 'admin' || 
                         (requiredRole === 'staff' && (roleData.role === 'staff' || roleData.role === 'admin'));
        
        setIsAuthorized(hasAccess);
      }
    } catch (error) {
      console.error('Role check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying credentials...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {requiredRole === 'admin' ? 'Admin Access Required' : 'Staff Access Required'}
            </h3>
            <p className="text-gray-600 mb-4">
              This feature is restricted to authorized {requiredRole} members only. 
              Please log in with your {requiredRole} credentials to access this page.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>For {requiredRole === 'admin' ? 'Administrators' : 'Staff'}:</strong> Contact your administrator to get your {requiredRole} account credentials.
                You need to be logged in with a {requiredRole} {requiredRole === 'staff' ? 'or admin ' : ''}account to access this feature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
