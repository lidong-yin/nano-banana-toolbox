
export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrls: string[];
  likedBy: string[]; // Array of user IDs
  views: number;
  date: string;
  timestamp: number;
  prompt: string;
  authorId: string;
  authorName: string;
  isPublic: boolean; // true = in gallery, false = private history
}

export type AspectRatio = 'auto' | '1:1' | '2:3' | '3:4' | '4:5' | '9:16' | '16:9' | '3:2' | '4:3' | '5:4' | '21:9';
export type ImageResolution = '1K' | '2K' | '4K';
export type OutputFormat = 'JPEG' | 'PNG';

export interface GenerationConfig {
  prompt: string;
  sourceImage?: string; // base64
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  format: OutputFormat;
}
