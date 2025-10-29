import { HttpResponse } from 'msw';

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// 2. A function to get a random delay time
export const randomDelay = () => {
  // Returns a random time between 200ms and 1200ms
  return Math.floor(Math.random() * (1200 - 200 + 1) + 200);
};

// 3. A function to check if we should return an error
export const shouldError = (errorRate = 0.05) => {
  // Returns true 5% of the time (as required by the PDF)
  return Math.random() < errorRate;
};

// 4. A helper for returning a standard server error
export const serverError = () => {
  return new HttpResponse(null, {
    status: 500,
    statusText: 'Internal Server Error',
  });
};