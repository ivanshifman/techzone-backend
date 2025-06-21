import mongoose from 'mongoose';

declare module 'mongoose' {
  export interface PaginateModel<T> extends mongoose.Model<T> {
    paginate: (
      query?: any,
      options?: any,
      callback?: (err: any, result: any) => void,
    ) => Promise<any>;
  }
}
