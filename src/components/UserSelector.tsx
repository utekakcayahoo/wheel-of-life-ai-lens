
import { useState } from "react";
import { useUserContext } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn, LogOut, AlertTriangle } from "lucide-react";
import { isSupabaseConfigured } from "@/utils/supabase";

const UserSelector = () => {
  const { users, currentUser, login, logout, isLoading, usingMockData } = useUserContext();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (selectedUserId) {
      try {
        setLoginError(null);
        await login(selectedUserId);
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : "Failed to log in");
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      {usingMockData && (
        <Alert variant="default" className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">Using Mock Data</AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-300">
            Supabase connection not configured or RLS policy issues detected. Please apply the migration script in supabase/migrations folder.
          </AlertDescription>
        </Alert>
      )}
      
      {loginError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Login Error</AlertTitle>
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}
      
      {!currentUser ? (
        <>
          <h2 className="text-xl font-semibold mb-4">Select a User</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Users</SelectLabel>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleLogin} 
              disabled={!selectedUserId || isLoading}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" /> {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              Welcome, {currentUser.username}!
            </h2>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
