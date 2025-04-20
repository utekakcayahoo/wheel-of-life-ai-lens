
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
import { Input } from "@/components/ui/input";
import { LogIn, LogOut, Key } from "lucide-react";

const UserSelector = () => {
  const { users, currentUser, login, logout, apiKey, setApiKey } = useUserContext();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null);

  const handleLogin = () => {
    if (selectedUserId) {
      login(selectedUserId);
      setSelectedUserId("");
    }
  };

  const validateApiKey = () => {
    if (!apiKey || apiKey.trim() === "") {
      setIsApiKeyValid(false);
      return;
    }
    
    // Quick validation for OpenAI key format (starts with "sk-")
    if (apiKey.startsWith("sk-") && apiKey.length > 20) {
      setIsApiKeyValid(true);
    } else {
      setIsApiKeyValid(false);
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
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
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
              disabled={!selectedUserId}
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

      <div className="pt-3 border-t">
        <div className="flex items-center gap-2 mb-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">OpenAI API Key</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
              className={apiKey && isApiKeyValid !== null 
                ? isApiKeyValid 
                  ? "border-green-500" 
                  : "border-red-500"
                : ""
              }
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowApiKey(!showApiKey)} 
              variant="outline" 
              size="sm"
            >
              {showApiKey ? "Hide" : "Show"}
            </Button>
            <Button 
              onClick={validateApiKey} 
              variant="outline" 
              size="sm"
            >
              Validate
            </Button>
          </div>
        </div>
        {apiKey && isApiKeyValid !== null && (
          <p className={`text-sm mt-1 ${isApiKeyValid ? "text-green-600" : "text-red-600"}`}>
            {isApiKeyValid 
              ? "API key format is valid" 
              : "API key format is invalid. It should start with 'sk-'"}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Your API key is stored locally in your browser and never sent to our servers.
        </p>
      </div>
    </div>
  );
};

export default UserSelector;
