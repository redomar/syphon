"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  ExclusiveCheckboxGroup,
  ExclusiveCheckboxItem,
} from "../ui/exclusive-checkbox";
import { Label } from "../ui/label";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { toast } from "sonner";

const feedbackSchema = z.object({
  message: z.string().min(1, "Please enter your feedback"),
  type: z.enum(["bug", "feature"]).optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export const Feedback = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Render button during SSR, but initialize Convex hooks only on client
  if (!isClient) {
    return (
      <Button variant="outline" disabled>
        Feedback
      </Button>
    );
  }

  return <FeedbackClient />;
};

function FeedbackClient() {
  const [isOpen, setIsOpen] = useState(false);
  const userEmail = useQuery(api.users.getCurrentUser)?.email || "";
  const createFeedback = useMutation(api.feedback.createFeedback);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      message: "",
      type: undefined,
    },
  });

  const onSubmit = async (data: FeedbackFormValues) => {
    try {
      await createFeedback({
        message: data.message,
        type: data.type,
        email: userEmail,
      });

      toast.success("Thank you for your feedback!");
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Feedback</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
          <DialogDescription>
            We value your feedback! Please let us know your thoughts or any
            issues you've encountered.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Your feedback..."
                      className="h-32 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ExclusiveCheckboxGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex-row gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <ExclusiveCheckboxItem value="bug" id="type-bug" />
                        <Label htmlFor="type-bug">Bug Report</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <ExclusiveCheckboxItem
                          value="feature"
                          id="type-feature"
                        />
                        <Label htmlFor="type-feature">Feature Request</Label>
                      </div>
                    </ExclusiveCheckboxGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600"
              >
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
