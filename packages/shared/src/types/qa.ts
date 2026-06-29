export interface Question {
  id: number;
  title: string;
  content: string;
  category: 'course' | 'internship' | 'career' | 'academic' | 'other';
  tags: string[] | null;
  answerCount: number;
  viewCount: number;
  acceptedAnswerId: number | null;
  status: 'open' | 'resolved' | 'closed';
  authorId: number;
  author?: import('./user').User;
  answers?: Answer[];
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: number;
  content: string;
  questionId: number;
  authorId: number;
  likeCount: number;
  isAccepted: boolean;
  status: 'active' | 'deleted';
  author?: import('./user').User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionRequest {
  title: string;
  content: string;
  category: 'course' | 'internship' | 'career' | 'academic' | 'other';
  tags?: string[];
}

export interface CreateAnswerRequest {
  content: string;
}
