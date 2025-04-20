
import { format } from "date-fns";
import { useUserContext } from "@/context/UserContext";
import { Calendar } from "@/components/ui/calendar";
import WheelOfLifeChart from "@/components/WheelOfLifeChart";
import ProgressChart from "@/components/ProgressChart";
import FeedbackForm from "@/components/FeedbackForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMostRecentWheelData, calculateAverageWheelScore } from "@/utils/wheelOfLifeUtils";

const Dashboard = () => {
  const { currentUser, selectedDate, setSelectedDate } = useUserContext();

  if (!currentUser) {
    return null;
  }

  const wheelData = currentUser.wheelHistory[format(selectedDate, "yyyy-MM-dd")] || 
    getMostRecentWheelData(currentUser.wheelHistory, selectedDate);
  
  const averageScore = calculateAverageWheelScore(wheelData);
  
  const latestFeedback = [...currentUser.feedbackReceived]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Calendar and Score */}
        <div className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="mx-auto pointer-events-auto"
              />
            </CardContent>
          </Card>

          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Score</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="text-center">
                <div className="inline-flex h-28 w-28 items-center justify-center rounded-full bg-primary">
                  <span className="text-4xl font-bold text-primary-foreground">
                    {averageScore ? averageScore.toFixed(1) : "N/A"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {latestFeedback.length > 0 ? (
                <div className="space-y-4">
                  {latestFeedback.map((feedback) => (
                    <div key={feedback.id} className="border-b pb-3 last:border-0">
                      <p className="text-sm font-medium">
                        From: {
                          currentUser.username === feedback.from 
                            ? "You" 
                            : feedback.from
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(feedback.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm">{feedback.text}</p>
                      {feedback.categories && feedback.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {feedback.categories.map((category) => (
                            <span
                              key={category}
                              className="text-xs px-2 py-0.5 bg-muted rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No feedback received yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Wheel Chart and Progress Chart */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="wheel" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="wheel">Wheel of Life</TabsTrigger>
              <TabsTrigger value="progress">Progress Chart</TabsTrigger>
            </TabsList>
            <TabsContent value="wheel" className="mt-6">
              <WheelOfLifeChart
                wheelData={wheelData}
                username={currentUser.username}
                date={selectedDate}
              />
            </TabsContent>
            <TabsContent value="progress" className="mt-6">
              <ProgressChart wheelHistory={currentUser.wheelHistory} />
            </TabsContent>
          </Tabs>

          <FeedbackForm />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
