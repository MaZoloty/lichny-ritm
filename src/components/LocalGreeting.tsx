"use client";

import { useEffect, useState } from "react";

export default function LocalGreeting({ name }: { name?: string | null }) {
  const [greeting, setGreeting] = useState("Привет");

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) setGreeting("Доброе утро");
    else if (hour >= 12 && hour < 17) setGreeting("Добрый день");
    else if (hour >= 17 && hour < 23) setGreeting("Добрый вечер");
    else setGreeting("Доброй ночи");
  }, []);

  return (
    <>
      {greeting}
      {name ? `, ${name}` : ""}
    </>
  );
}
