"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card } from "@/app/components/ui/card";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const SUGGESTED_QUESTIONS = [
  "📊 Quel est mon meilleur établissement ce mois-ci ?",
  "💰 Compare mes ratios de masse salariale",
  "📈 Montre-moi l'évolution de mon CA",
  "⚠️ Quels établissements nécessitent mon attention ?",
  "🎯 Donne-moi des recommandations pour améliorer mes performances",
];

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(
    null
  );
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: () => ({
        conversationId,
      }),
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Gérer les erreurs
  useEffect(() => {
    if (error) {
      console.error("Chat error:", error);
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.limit) {
          toast.error(
            `Limite atteinte: ${errorData.current}/${errorData.limit} messages utilisés ce mois-ci. ${errorData.message}`
          );
        } else {
          toast.error("Erreur lors de l'envoi du message");
        }
      } catch {
        toast.error("Erreur lors de l'envoi du message");
      }
    }
  }, [error]);

  // Auto-scroll vers le bas quand nouveaux messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input quand ouvert
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    await sendMessage({ text: inputValue });
    setInputValue("");
  };

  const handleSuggestedQuestion = (question: string) => {
    const cleanQuestion = question.replace(/^[📊💰📈⚠️🎯]\s*/, "");
    setInputValue(cleanQuestion);
    sendMessage({ text: cleanQuestion });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClearConversation = () => {
    setConversationId(null);
    setMessagesRemaining(null);
    window.location.reload();
  };

  // Extraire le texte d'un message UIMessage
  const getMessageText = (message: (typeof messages)[0]): string => {
    if (!message.parts) return "";

    return message.parts
      .map((part) => {
        if (part.type === "text") {
          return part.text;
        }
        return "";
      })
      .join("");
  };

  return (
    <>
      {/* Bouton flottant */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
            >
              <Bot className="h-6 w-6 text-white" />
            </Button>
            <motion.div
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              AI
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="flex flex-col h-[600px] max-h-[calc(100vh-6rem)] shadow-2xl border-2">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bot className="h-6 w-6 text-white" />
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      Chaffy | Chef des finances
                    </h3>
                    <p className="text-xs text-blue-100">
                      Analyse tes données en temps réel
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {messagesRemaining !== null && (
                    <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded-full">
                      {messagesRemaining} restants
                    </span>
                  )}
                  {conversationId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearConversation}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4 mb-4">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-lg mb-2">
                      Salut ! Je suis ton assistant IA
                    </h4>
                    <p className="text-sm text-slate-600 mb-6">
                      Pose-moi des questions sur tes établissements, ton CA, ta
                      masse salariale...
                    </p>
                    <div className="w-full space-y-2">
                      <p className="text-xs font-medium text-slate-500 mb-3">
                        Questions suggérées :
                      </p>
                      {SUGGESTED_QUESTIONS.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedQuestion(question)}
                          className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => {
                  const messageText = getMessageText(message);
                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-white border border-slate-200 text-slate-900"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none prose-slate">
                            <ReactMarkdown
                              components={{
                                p: ({ children }: { children?: ReactNode }) => (
                                  <p className="mb-3 last:mb-0 leading-relaxed text-slate-700">
                                    {children}
                                  </p>
                                ),
                                ul: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <ul className="list-disc pl-5 mb-3 space-y-2 text-slate-700">
                                    {children}
                                  </ul>
                                ),
                                ol: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <ol className="list-decimal pl-5 mb-3 space-y-2 text-slate-700">
                                    {children}
                                  </ol>
                                ),
                                li: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <li className="text-sm leading-relaxed">
                                    {children}
                                  </li>
                                ),
                                strong: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <strong className="font-bold text-slate-900">
                                    {children}
                                  </strong>
                                ),
                                em: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <em className="italic text-slate-700">
                                    {children}
                                  </em>
                                ),
                                code: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <code className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded text-xs font-mono">
                                    {children}
                                  </code>
                                ),
                                pre: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <pre className="bg-slate-800 text-slate-100 p-3 rounded-lg overflow-x-auto mb-3 text-xs">
                                    {children}
                                  </pre>
                                ),
                                h1: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <h1 className="text-xl font-bold mb-3 text-slate-900">
                                    {children}
                                  </h1>
                                ),
                                h2: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <h2 className="text-lg font-bold mb-2 text-slate-900">
                                    {children}
                                  </h2>
                                ),
                                h3: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <h3 className="text-base font-bold mb-2 text-slate-900">
                                    {children}
                                  </h3>
                                ),
                                blockquote: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-3 bg-blue-50 italic text-slate-700">
                                    {children}
                                  </blockquote>
                                ),
                                table: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <div className="overflow-x-auto mb-3">
                                    <table className="min-w-full border border-slate-300 text-sm">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <thead className="bg-slate-100">
                                    {children}
                                  </thead>
                                ),
                                tbody: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => <tbody>{children}</tbody>,
                                tr: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <tr className="border-b border-slate-200">
                                    {children}
                                  </tr>
                                ),
                                th: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <th className="px-3 py-2 text-left font-semibold text-slate-900 border-r border-slate-200 last:border-r-0">
                                    {children}
                                  </th>
                                ),
                                td: ({
                                  children,
                                }: {
                                  children?: ReactNode;
                                }) => (
                                  <td className="px-3 py-2 text-slate-700 border-r border-slate-200 last:border-r-0">
                                    {children}
                                  </td>
                                ),
                                hr: () => (
                                  <hr className="my-4 border-slate-300" />
                                ),
                              }}
                            >
                              {messageText}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {messageText}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analyse en cours...</span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-center">
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
                      {error.message}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                id="chat-form"
                onSubmit={handleSubmit}
                className="p-4 border-t bg-white"
              >
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Pose ta question..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
