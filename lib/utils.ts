export {}

export function toTitleCase(str: string) {
  const smallWords = ["and", "or", "the", "of", "in", "on", "at", "to", "for"]

  return str
    .toLowerCase()
    .split(" ")
    .map((word, index) => {

      // Keep acronyms uppercase (CNC, API, etc)
      if (word.length <= 3 && word === word.toUpperCase()) {
        return word
      }

      // Keep small words lowercase unless first word
      if (index !== 0 && smallWords.includes(word)) {
        return word
      }

      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(" ")
}