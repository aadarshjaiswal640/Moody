import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { connectGoogleFit, syncHealthData } from "@/lib/google-fit";
import { useTheme } from "../App";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [googleFitConnected, setGoogleFitConnected] = useState(false);
  const { darkMode, setDarkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    // Reset Google Fit connection status - it should not persist
    setGoogleFitConnected(false);
    localStorage.setItem('googleFitConnected', 'false');
  }, [isOpen]);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast({
          title: "Notifications enabled",
          description: "You'll receive mood check-in reminders.",
        });
      } else {
        toast({
          title: "Notifications denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } else {
      setNotificationsEnabled(enabled);
    }
  };

  const handleGoogleFitConnect = async () => {
    try {
      const connected = await connectGoogleFit();
      if (connected) {
        setGoogleFitConnected(true);
        localStorage.setItem('googleFitConnected', 'true');
        // Start syncing health data
        await syncHealthData();
        toast({
          title: "Google Fit connected!",
          description: "Your health data will now sync automatically.",
        });
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Unable to connect to Google Fit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleFitDisconnect = () => {
    setGoogleFitConnected(false);
    localStorage.setItem('googleFitConnected', 'false');
    toast({
      title: "Google Fit disconnected",
      description: "Health data sync has been disabled.",
    });
  };

  const handleExportData = () => {
    // In a real app, this would generate and download a CSV/PDF
    toast({
      title: "Export started",
      description: "Your data export will begin shortly.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">
                Get reminded to log your mood
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          {/* Google Fit Integration */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Google Fit Integration</p>
              <p className="text-xs text-muted-foreground">
                Sync health data automatically
              </p>
            </div>
            {googleFitConnected ? (
              <div className="flex items-center gap-2">
                <div className="text-xs text-green-600 font-medium">Connected</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGoogleFitDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleGoogleFitConnect}
              >
                Connect
              </Button>
            )}
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">
                Switch to dark theme
              </p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </div>

        <div className="pt-6 border-t">
          <Button
            onClick={handleExportData}
            variant="destructive"
            className="w-full"
          >
            Export Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
