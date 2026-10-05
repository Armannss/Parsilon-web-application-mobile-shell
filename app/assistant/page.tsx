"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import ProductImage from "@/components/product/ProductImage";

type Part = {
  slug: string;
  name: string;
  code: string;
  price: string;
  image: string;
  isAvailable: boolean;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  parts?: Part[];
  isError?: boolean;
};

const STARTERS = [
  "دیسک ترمز جلو برای پراید می‌خواهم",
  "برای پژو ۲۰۶ تیپ ۵ چه قطعاتی دارید؟",
  "هزینه ارسال چقدر است؟",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || isSending) return;

    // Failed turns are shown but not sent back as conversation history.
    const history = [...messages.filter((m) => !m.isError), { role: "user" as const, content }];

    setMessages((prev) => [...prev, { role: "user", content }]);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-24).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json().catch(() => null);

      setMessages((prev) => [
        ...prev,
        response.ok && data?.success
          ? { role: "assistant", content: data.reply, parts: data.parts }
          : {
              role: "assistant",
              content: data?.message || "دستیار پاسخ نداد. دوباره تلاش کنید.",
              isError: true,
            },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "اتصال برقرار نشد. اینترنت را بررسی و دوباره تلاش کنید.",
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <MobileShell>
      <AppHeader title="دستیار قطعات" backHref="/" />

      <main className="flex min-h-[calc(100vh-88px)] flex-col bg-[#F4F7FC] text-right">
        <div className="flex-1 space-y-4 px-4 pb-32 pt-4" aria-live="polite">
          {messages.length === 0 ? (
            <div className="pt-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-800 text-white shadow-float">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
              </div>
              <h1 className="mt-5 text-lg font-black text-slate-900">
                قطعه مناسب خودروتان را پیدا کنید
              </h1>
              <p className="mx-auto mt-2 max-w-[17rem] text-xs leading-6 text-slate-500">
                مدل خودرو و قطعه‌ای که لازم دارید را بنویسید. قیمت و موجودی از
                کاتالوگ خوانده می‌شود.
              </p>

              <div className="mt-6 space-y-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => void send(starter)}
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-[13px] font-bold text-slate-700 shadow-card transition-transform active:scale-[0.98]"
                  >
                    {starter}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-[11px] leading-5 text-slate-400">
                پاسخ‌ها را هوش مصنوعی می‌نویسد و ممکن است اشتباه باشد. برای
                موارد ایمنی ترمز با تعمیرکار مشورت کنید.
              </p>
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div key={index} className={message.role === "user" ? "flex justify-start" : "flex justify-end"}>
              <div className="max-w-[85%]">
                <div
                  className={`whitespace-pre-line rounded-3xl px-4 py-3 text-[13px] leading-7 ${
                    message.role === "user"
                      ? "rounded-tr-lg bg-brand-800 text-white"
                      : message.isError
                        ? "rounded-tl-lg border border-red-100 bg-red-50 text-red-700"
                        : "rounded-tl-lg bg-white text-slate-800 shadow-card"
                  }`}
                >
                  {message.content}
                </div>

                {message.parts?.length ? (
                  <ul className="mt-2 space-y-2">
                    {message.parts.map((part) => (
                      <li key={part.slug}>
                        <Link
                          href={`/products/${part.slug}`}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-card transition-transform active:scale-[0.98]"
                        >
                          <ProductImage
                            src={part.image}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-xl bg-slate-50 object-contain p-1"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-black text-slate-900">
                              {part.name}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-slate-400">
                              کد فنی <span dir="ltr">{part.code}</span>
                            </span>
                            <span className="mt-0.5 block text-xs font-bold text-brand-800">
                              {part.isAvailable ? part.price : "ناموجود"}
                            </span>
                          </span>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ))}

          {isSending ? (
            <div className="flex justify-end" role="status" aria-label="دستیار در حال نوشتن است">
              <div className="flex gap-1.5 rounded-3xl rounded-tl-lg bg-white px-4 py-4 shadow-card">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-2 w-2 animate-bounce rounded-full bg-slate-300"
                    style={{ animationDelay: `${dot * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
          className="pb-safe fixed bottom-0 left-1/2 z-30 w-full max-w-sm -translate-x-1/2 border-t border-slate-100 bg-white/95 px-3 pt-3 backdrop-blur-md"
        >
          <div className="flex items-end gap-2">
            <label htmlFor="assistant-input" className="sr-only">
              پیام شما
            </label>
            <textarea
              id="assistant-input"
              rows={1}
              value={draft}
              maxLength={1500}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              placeholder="مثلاً: کاسه چرخ عقب تیبا"
              className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              aria-label="ارسال"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-800 text-white transition-transform active:scale-95 disabled:bg-slate-300"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 -scale-x-100" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.27 3.13a59.77 59.77 0 0 1 18.21 8.87 59.77 59.77 0 0 1-18.21 8.88L6 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </form>
      </main>
    </MobileShell>
  );
}
