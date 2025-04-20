
import { useState } from 'react';
import { toast } from 'sonner';
import { translateToEnglish } from '@/utils/apiUtils';
import { useUserContext } from '@/context/UserContext';
import { checkDatabaseSetup } from '@/utils/supabase';

export const useFeedbackSubmission = () => {
  const { currentUser, addFeedback, isLoading } = useUserContext();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = async (
    recipientId: string,
    feedback: string,
    feedbackDate: Date
  ) => {
    if (!currentUser) {
      const error = new Error("You must be logged in to submit feedback");
      toast.error(error.message);
      setError(error.message);
      throw error;
    }

    if (!recipientId || !feedback.trim() || !feedbackDate) {
      const error = new Error("Please fill in all required fields");
      toast.error(error.message);
      setError(error.message);
      throw error;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Check if database is properly set up
      await checkDatabaseSetup();
      
      // Check if translation is needed
      let processedFeedback = feedback;
      const englishPattern = /^[a-zA-Z0-9\s.,!?'";:\-()]*$/;
      
      if (!englishPattern.test(feedback)) {
        try {
          processedFeedback = await translateToEnglish(feedback);
        } catch (error) {
          console.error("Error translating feedback:", error);
          // Continue with original feedback if translation fails
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
      const errorMessage = error instanceof Error ? error.message : "Failed to submit feedback. Please try again.";
      console.error("Error submitting feedback:", error);
      toast.error(errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitFeedback,
    submitting,
    isLoading,
    error
  };
};
