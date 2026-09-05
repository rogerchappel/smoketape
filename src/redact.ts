const ASSIGNMENT_PATTERN = /[^\s\"']+/g;
const TOKEN_PATTERNS = [/ghp_[A-Za-z0-9_]{20,}/g, /sk-[A-Za-z0-9]{20,}/g];

export function redactText(input: string, redactions: string[] = []): { text: string; redacted: boolean } {
  let text = input;
  let redacted = false;
  for (const value of redactions.filter(Boolean)) {
    if (text.includes(value)) {
      text = text.split(value).join('[REDACTED]');
      redacted = true;
    }
  }
  text = text.replace(ASSIGNMENT_PATTERN, (match) => {
    const separator = match.indexOf('=');
    if (separator < 0) return match;
    const key = match.slice(0, separator);
    if (!/(?:TOKEN|SECRET|PASSWORD)/i.test(key)) return match;
    redacted = true;
    return `${key}=[REDACTED]`;
  });
  for (const pattern of TOKEN_PATTERNS) {
    text = text.replace(pattern, () => {
      redacted = true;
      return '[REDACTED]';
    });
  }
  return { text, redacted };
}

export function redactObject<T>(value: T, redactions: string[]): { value: T; redacted: boolean } {
  let redacted = false;
  const visit = (item: unknown): unknown => {
    if (typeof item === 'string') {
      const result = redactText(item, redactions);
      redacted = redacted || result.redacted;
      return result.text;
    }
    if (Array.isArray(item)) return item.map(visit);
    if (item && typeof item === 'object') {
      return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, visit(child)]));
    }
    return item;
  };
  return { value: visit(value) as T, redacted };
}
