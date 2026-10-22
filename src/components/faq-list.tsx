"use client";

import { useState } from "react";

export function FaqList({ items }: { items: { id: string; category: string; question: string; answer: string }[] }) {
  const categories = [...new Set(items.map((item) => item.category))];
  return (
    <div className="grid gap-8">
      {categories.map((category) => (
        <section key={category}>
          <h2 className="display text-4xl text-ink">{category}</h2>
          <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
            {items
              .filter((item) => item.category === category)
              .map((item) => (
                <Item key={item.id} question={item.question} answer={item.answer} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Item({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className="flex w-full items-center justify-between gap-4 py-4 text-left text-lg text-ink" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>{question}</span>
        <span aria-hidden className="display text-3xl text-brand">{open ? "–" : "+"}</span>
      </button>
      {open ? <p className="pb-4 leading-7 text-ink/75">{answer}</p> : null}
    </div>
  );
}
