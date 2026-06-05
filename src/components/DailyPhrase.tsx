"use client";

import { useEffect, useState } from "react";
import { localDateKey, phraseForDate } from "@/lib/daily-phrases";

const FALLBACK_PHRASE = "Маленький шаг тоже считается.";

export default function DailyPhrase() {
  const [phrase, setPhrase] = useState(FALLBACK_PHRASE);

  useEffect(() => {
    setPhrase(phraseForDate(localDateKey()));
  }, []);

  return (
    <p className="mb-4 max-w-[18rem] text-[0.82rem] italic leading-6 text-muted/85">
      {phrase}
    </p>
  );
}
