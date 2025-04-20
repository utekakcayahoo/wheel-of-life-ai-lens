
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserContext } from "@/context/UserContext";
import { format } from "date-fns";
import { FeedbackFormHeader } from "./feedback/FeedbackFormHeader";
import { RecipientSelect } from "./feedback/RecipientSelect";
import { useFeedbackSubmission } from "@/hooks/useFeedbackSubmission";

const FeedbackForm = () => {
  const { users, currentUser } = useUserContext();
  const [recipientId, setRecipientId] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [feedbackDate, setFeedbackDate] = useState<Date | undefined>(new Date());
  const [formError, setFormError] = useState<string | null>(null);
  
  const { submitFeedback, submitting, isLoading, error } = useFeedbackSubmission();

  const handleSubmit = async () => {
    if (!feedbackDate) {
      setFormError("Please select a date");
      return;
    }
    
    setFormError(null);
    try {
      await submitFeedback(recipientId, feedback, feedbackDate);
      setRecipientId("");
      setFeedback("");
    } catch (err) {
      // Error is handled by the hook
    }
  };

  // Filter out the current user from the recipients list
  const recipients = users.filter(
    (user) => !currentUser || user.id !== currentUser.id
  );

  return (
    <Card>
      <FeedbackFormHeader />
      <CardContent className="space-y-4">
        {(formError || error) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {formError || error}
            </AlertDescription>
          </Alert>
        )}
        
        <RecipientSelect
          recipients={recipients}
          value={recipientId}
          onChange={setRecipientId}
          disabled={!currentUser || submitting || isLoading}
        />

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="date">
            Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !feedbackDate && "text-muted-foreground"
                )}
                disabled={!currentUser || submitting || isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {feedbackDate ? (
                  format(feedbackDate, "yyyy-MM-dd")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={feedbackDate}
                onSelect={setFeedbackDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Feedback Text Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="feedback">
            Your Feedback
          </label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Enter your feedback here. You can mention multiple Wheel of Life categories in a single feedback (e.g. Career, Health, etc.)."
            className="min-h-[120px]"
            disabled={!currentUser || submitting || isLoading}
          />
          <p className="text-xs text-muted-foreground">
            You can write in any language. The system will automatically translate to English if needed.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={
            !currentUser || !recipientId || !feedback.trim() || !feedbackDate || submitting || isLoading
          }
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeedbackForm;
