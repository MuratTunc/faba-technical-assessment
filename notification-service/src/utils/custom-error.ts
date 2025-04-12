export class CustomError extends Error {
    constructor(
      public code: string,
      public message: string,
      public statusCode = 500,
      public details: any = {}
    ) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
    }
  }
  