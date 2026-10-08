import { useEffect, useState } from "react";

export function useDebouncedSearch(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (!value.trim()) {
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
