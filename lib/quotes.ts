/**
 * Graduation quotes printed on the QR pass. Each graduate gets one picked
 * deterministically from their register number, so a reprint always carries
 * the same line — and two friends standing together rarely see the same one.
 */
export const GRADUATION_QUOTES: { text: string; author: string }[] = [
  { text: "The engineer has been, and is, a maker of history.", author: "James Kip Finch" },
  { text: "Scientists dream about doing great things. Engineers do them.", author: "James A. Michener" },
  { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "What we know is a drop. What we don't know is an ocean.", author: "Isaac Newton" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "The future belongs to those who believe in their dreams.", author: "Eleanor Roosevelt" },
  { text: "Everything is theoretically impossible until it is done.", author: "Robert A. Heinlein" },
  { text: "Go confidently in the direction of your dreams.", author: "Henry David Thoreau" },
  { text: "Engineering is the closest thing to magic that exists.", author: "Elon Musk" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final; failure is not fatal.", author: "Winston Churchill" },
  { text: "Learn from yesterday, live for today, hope for tomorrow.", author: "Albert Einstein" },
  { text: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda" },
  { text: "You have to dream before your dreams can come true.", author: "A. P. J. Abdul Kalam" },
  { text: "Excellence happens when you strive beyond the ordinary.", author: "A. P. J. Abdul Kalam" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "An engineer can do for one rupee what any fool can for two.", author: "Arthur Wellesley" },
];

/** Stable per-graduate pick — same register number always gives the same quote. */
export function quoteFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADUATION_QUOTES[h % GRADUATION_QUOTES.length];
}
