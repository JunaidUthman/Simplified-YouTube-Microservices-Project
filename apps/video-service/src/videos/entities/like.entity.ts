export interface LikeProps {
  id: string;
  videoId: string;
  userId: string;
  isLike?: boolean;
  createdAt?: Date;
}

export class Like {
  id: string;
  videoId: string;
  userId: string;
  isLike: boolean;
  createdAt: Date;

  constructor(props: LikeProps) {
    this.id = props.id;
    this.videoId = props.videoId;
    this.userId = props.userId;
    this.isLike = props.isLike !== undefined ? props.isLike : true;
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
  }
}
