import { Button } from "@/components/ui/button";
import { 
  Drawer, 
  DrawerClose, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger 
} from "@/components/ui/drawer";
import { 
  Menu, 
  Home, 
  Calendar, 
  Ticket, 
  QrCode, 
  Plus, 
  User, 
  Settings, 
  Info,
  Mail
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppSidebarProps {
  user: any;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
}

export const AppSidebar = ({ user, onNavigate, onSignOut }: AppSidebarProps) => {
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (user) {
      checkUserRole(user.id);
    } else {
      setUserRole('');
    }
  }, [user]);

  const checkUserRole = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }
    } catch (error) {
      console.error('Role check error:', error);
      setUserRole('');
    }
  };

  const isStaffUser = userRole === 'staff' || userRole === 'admin';

  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm">
          <Menu className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-80 fixed inset-y-0 left-0 mt-0 rounded-none">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-blue-600" />
            EventTix
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="flex flex-col p-4 space-y-2">
          <DrawerClose asChild>
            <Button 
              variant="ghost" 
              className="justify-start"
              onClick={() => onNavigate('events')}
            >
              <Home className="h-4 w-4 mr-3" />
              Home
            </Button>
          </DrawerClose>

          <DrawerClose asChild>
            <Button 
              variant="ghost" 
              className="justify-start"
              onClick={() => onNavigate('events')}
            >
              <Calendar className="h-4 w-4 mr-3" />
              Browse Events
            </Button>
          </DrawerClose>

          {user && (
            <>
              <DrawerClose asChild>
                <Button 
                  variant="ghost" 
                  className="justify-start"
                  onClick={() => onNavigate('creator')}
                >
                  <Plus className="h-4 w-4 mr-3" />
                  Create Event
                </Button>
              </DrawerClose>

              {/* Only show QR Scanner for staff/admin users */}
              {isStaffUser && (
                <DrawerClose asChild>
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => onNavigate('scanner')}
                  >
                    <QrCode className="h-4 w-4 mr-3" />
                    QR Scanner
                  </Button>
                </DrawerClose>
              )}
            </>
          )}

          <div className="border-t pt-4 mt-4">
            <DrawerClose asChild>
              <Button variant="ghost" className="justify-start w-full">
                <Info className="h-4 w-4 mr-3" />
                About
              </Button>
            </DrawerClose>
            
            <DrawerClose asChild>
              <Button variant="ghost" className="justify-start w-full">
                <Mail className="h-4 w-4 mr-3" />
                Contact
              </Button>
            </DrawerClose>
          </div>

          {user ? (
            <div className="border-t pt-4 mt-4">
              <div className="px-2 py-2 text-sm text-gray-600">
                Signed in as: {user.email}
                {userRole && (
                  <div className="text-xs text-blue-600 capitalize">
                    Role: {userRole}
                  </div>
                )}
              </div>
              <DrawerClose asChild>
                <Button 
                  variant="ghost" 
                  className="justify-start w-full"
                  onClick={onSignOut}
                >
                  <User className="h-4 w-4 mr-3" />
                  Sign Out
                </Button>
              </DrawerClose>
            </div>
          ) : (
            <div className="border-t pt-4 mt-4">
              <DrawerClose asChild>
                <Button 
                  variant="ghost" 
                  className="justify-start w-full"
                  onClick={() => onNavigate('auth')}
                >
                  <User className="h-4 w-4 mr-3" />
                  Sign In
                </Button>
              </DrawerClose>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
