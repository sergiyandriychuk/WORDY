export interface FeedbackEvent {
  feedbackData: FeedbackData;
}

export interface FeedbackData {
  id: string;
  date: number;
  type: string;
  url: string;
  lang: string;
}
