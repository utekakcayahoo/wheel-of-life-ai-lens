
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
import { LogIn, LogOut } from "lucide-react";

const UserSelector = () => {
  const { users, currentUser, login, logout, isLoading } = useUserContext();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const handleLogin = () => {
    if (selectedUserId) {
      login(selectedUserId);
      setSelectedUserId("");
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
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
              <LogIn className="h-4 w-4" /> Log in
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
