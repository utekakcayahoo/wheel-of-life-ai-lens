
import { useState } from 'react';
import { toast } from 'sonner';
import { translateToEnglish } from '@/utils/apiUtils';
import { useUserContext } from '@/context/UserContext';
import { checkDatabaseSetup } from '@/utils/supabase/databaseCheck';

export const useFeedbackSubmission = () => {
  const { currentUser, addFeedback, isLoading } = useUserContext();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const submitFeedback = async (
    recipientId: string,
    feedback: string,
    feedbackDate: Date
  ) => {
    if (!currentUser) {
      toast.error("You must be logged in to submit feedback");
      return;
    }

    if (!recipientId || !feedback.trim() || !feedbackDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Check if database is properly set up
      const isDatabaseSetup = await checkDatabaseSetup();
      if (!isDatabaseSetup) {
        toast.error("Database not properly set up. Unable to save feedback.");
        return false;
      }
      
      // Check if translation is needed
      let processedFeedback = feedback;
      const englishPattern = /^[a-zA-Z0-9\s.,!?'";:\-()]*$/;
      
      if (!englishPattern.test(feedback)) {
        try {
          processedFeedback = await translateToEnglish(feedback);
        } catch (error) {
          console.error("Error translating feedback:", error);
        }
      }

      await addFeedback({
        from: currentUser.id,
        to: recipientId,
        text: processedFeedback,
        date: feedbackDate.toISOString().split('T')[0],
      });

      toast.success("Feedback submitted successfully");
      return true;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitFeedback,
    submitting,
    isLoading
  };
};
