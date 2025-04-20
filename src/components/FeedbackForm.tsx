
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { User, useUserContext } from "@/context/UserContext";
import { translateToEnglish } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

const FeedbackForm = () => {
  const { users, currentUser, addFeedback, apiKey } = useUserContext();
  const { toast } = useToast();
  const [recipientId, setRecipientId] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [feedbackDate, setFeedbackDate] = useState<Date | undefined>(new Date());
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to submit feedback",
        variant: "destructive",
      });
      return;
    }
    
    if (!apiKey) {
      toast({
        title: "Error",
        description: "OpenAI API key is required",
        variant: "destructive",
      });
      return;
    }

    if (!recipientId) {
      toast({
        title: "Error",
        description: "Please select a recipient",
        variant: "destructive",
      });
      return;
    }

    if (!feedback.trim()) {
      toast({
        title: "Error",
        description: "Please enter feedback",
        variant: "destructive",
      });
      return;
    }

    if (!feedbackDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // If the feedback is not in English, translate it
      let processedFeedback = feedback;
      
      // Simple heuristic to detect if the text might be in a non-English language
      const englishPattern = /^[a-zA-Z0-9\s.,!?'";:\-()]*$/;
      if (!englishPattern.test(feedback)) {
        try {
          processedFeedback = await translateToEnglish(feedback, apiKey);
        } catch (error) {
          console.error("Error translating feedback:", error);
          // Continue with original feedback if translation fails
        }
      }

      // Submit the feedback
      await addFeedback({
        from: currentUser.id,
        to: recipientId,
        text: processedFeedback,
        date: format(feedbackDate, "yyyy-MM-dd"),
      });

      // Reset the form
      setRecipientId("");
      setFeedback("");

      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter out the current user from the recipients list
  const recipients = users.filter(
    (user) => !currentUser || user.id !== currentUser.id
  );

  const getRecipientName = (id: string) => {
    const recipient = users.find((user) => user.id === id);
    return recipient ? recipient.username : "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Give Feedback</CardTitle>
        <CardDescription>
          Provide constructive feedback to help others improve their Wheel of Life
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recipient">
            Recipient
          </label>
          <Select
            value={recipientId}
            onValueChange={setRecipientId}
            disabled={!currentUser || submitting}
          >
            <SelectTrigger id="recipient">
              <SelectValue placeholder="Select a recipient" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Recipients</SelectLabel>
                {recipients.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

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
                disabled={!currentUser || submitting}
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
            disabled={!currentUser || submitting}
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
            !currentUser || !recipientId || !feedback.trim() || !feedbackDate || submitting || !apiKey
          }
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeedbackForm;
