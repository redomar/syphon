"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { tracer } from "@/lib/telemetry";
import { Span } from "@opentelemetry/api";
import React from "react";

interface HttpError extends Error {
  status?: number;
}

// Create a client with OpenTelemetry integration
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors
          const httpError = error as HttpError;
          if (
            httpError?.status &&
            httpError.status >= 400 &&
            httpError.status < 500
          ) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
        onMutate: () => {
          // Start a span for mutation tracking
          return tracer.startActiveSpan("mutation.start", (span) => {
            span.setAttributes({
              "operation.type": "mutation",
              component: "react-query",
            });
            return span;
          });
        },
        onError: (error: unknown, variables, context) => {
          const span = context as Span;
          if (span && span.recordException) {
            span.recordException(error as Error);
            span.setAttributes({
              "mutation.status": "error",
              "error.message": (error as Error).message,
            });
            span.end();
          }
        },
        onSuccess: (data, variables, context) => {
          const span = context as Span;
          if (span && span.setAttributes) {
            span.setAttributes({
              "mutation.status": "success",
            });
            span.end();
          }
        },
      },
    },
  });
};

let clientSingleton: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!clientSingleton) clientSingleton = createQueryClient();
    return clientSingleton;
  }
};

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
