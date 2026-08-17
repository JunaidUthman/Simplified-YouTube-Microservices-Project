export interface VideoProps {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  userId: string;
  viewsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  userId: string;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: VideoProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description || '';
    this.videoUrl = props.videoUrl;
    this.thumbnailUrl = props.thumbnailUrl || '';
    this.userId = props.userId;
    this.viewsCount = props.viewsCount || 0;
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
  }
}
