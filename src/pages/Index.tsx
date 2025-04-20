
import { UserProvider } from "@/context/UserContext";
import UserSelector from "@/components/UserSelector";
import Dashboard from "@/components/Dashboard";
import { useUserContext } from "@/context/UserContext";

const IndexContent = () => {
  const { currentUser } = useUserContext();

  return (
    <div className="container mx-auto py-6 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Wheel of Life AI Lens
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your life balance and receive personalized insights
        </p>
      </header>

      <UserSelector />

      {currentUser && (
        <div className="mt-6">
          <Dashboard />
        </div>
      )}
    </div>
  );
};

const Index = () => {
  return (
    <UserProvider>
      <IndexContent />
    </UserProvider>
  );
};

export default Index;
