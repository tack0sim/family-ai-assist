"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LetterOfIntentModalProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function LetterOfIntentModal({
  open,
  onOpenChange,
}: LetterOfIntentModalProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && !content) {
      setIsLoading(true);
      fetch("/api/letter-of-intent")
        .then((res) => res.json())
        .then((data) => {
          setContent(data.content);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [open, content]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="no-scrollbar max-h-[75vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Letter of Intent – Beta Testing</DialogTitle>
          <DialogDescription>
            Please review the terms of beta testing before proceeding.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="mt-6 mb-3 font-bold text-2xl">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-5 mb-2 font-bold text-xl">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-4 mb-2 font-semibold text-lg">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 list-inside list-disc space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 list-inside list-decimal space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="ml-2">{children}</li>,
                table: ({ children }) => (
                  <div className="mb-3 overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 bg-gray-100 px-3 py-2 font-semibold dark:border-gray-600 dark:bg-gray-800">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-3 py-2 dark:border-gray-600">
                    {children}
                  </td>
                ),
                hr: () => (
                  <hr className="my-4 border-gray-300 dark:border-gray-600" />
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-3 border-gray-300 border-l-4 pl-4 text-gray-600 italic dark:border-gray-600 dark:text-gray-400">
                    {children}
                  </blockquote>
                ),
                code: ({
                  children,
                  inline,
                }: {
                  children?: React.ReactNode;
                  inline?: boolean;
                }) =>
                  inline ? (
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm dark:bg-gray-800">
                      {children}
                    </code>
                  ) : (
                    <pre className="mb-3 overflow-x-auto rounded bg-gray-100 p-3 dark:bg-gray-800">
                      <code className="font-mono text-sm">{children}</code>
                    </pre>
                  ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
