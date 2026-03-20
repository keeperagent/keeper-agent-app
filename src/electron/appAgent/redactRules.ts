export const looksLikeEncryptKey = (text: string): boolean => {
  if (text.length > 128) {
    return false;
  }
  if (text.includes("?")) {
    return false;
  }
  // Multiple sentences suggest conversational text
  if (/[.!]\s+[A-Z]/.test(text)) {
    return false;
  }
  // Real keys are compact — more than 5 words is almost certainly conversational
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 5) {
    return false;
  }
  return true;
};
