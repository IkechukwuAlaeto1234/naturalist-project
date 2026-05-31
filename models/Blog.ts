import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlogSection {
  heading?: string;
  body: string;
  image?: string;
  imageAlt?: string;
}

export interface IBlogComment {
  name: string;
  message: string;
  createdAt: Date;
}

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  coverImageAlt?: string;
  authorName: string;
  authorRole?: string;
  publishedAt: Date;
  readTime: string;
  tags: string[];
  featured: boolean;
  sections: IBlogSection[];
  comments: IBlogComment[];
  createdAt: Date;
  updatedAt: Date;
}

const BlogSectionSchema = new Schema<IBlogSection>(
  {
    heading: { type: String },
    body: { type: String, required: true },
    image: { type: String },
    imageAlt: { type: String },
  },
  { _id: false }
);

const BlogCommentSchema = new Schema<IBlogComment>(
  {
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BlogSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true },
    coverImage: { type: String, required: true },
    coverImageAlt: { type: String },
    authorName: { type: String, required: true },
    authorRole: { type: String },
    publishedAt: { type: Date, required: true, default: Date.now },
    readTime: { type: String, required: true },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    sections: { type: [BlogSectionSchema], default: [] },
    comments: { type: [BlogCommentSchema], default: [] },
  },
  { timestamps: true }
);

export const Blog: Model<IBlogPost> =
  mongoose.models.Blog || mongoose.model<IBlogPost>("Blog", BlogSchema);

export default Blog;