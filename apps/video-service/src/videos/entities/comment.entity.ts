export interface CommentProps {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Comment {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: CommentProps) {
    this.id = props.id;
    this.videoId = props.videoId;
    this.userId = props.userId;
    this.content = props.content;
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
  }
}
