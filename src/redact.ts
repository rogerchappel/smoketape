const DEFAULT_SECRET_PATTERNS = [
  /[A-Za-z0-9_+.-]*TOKEN[A-Za-z0-9_+.-]*=([^\s\"\']+)/gi,
  /[A-Za-z0-9_+.-]*SECRET[A-Za-z0-9_+.-]*=([^\s\"\']+)/gi,
  /[A-Za-z0-9_+.-]*PASSWORD[A-Za-z0-9_+.-]*=([^\s\"\']+)/gi,
  /ghp_[A-Za-z0-9_]{20,}/g,
  /sk-[A-Za-z0-9]{20,}/g
];

export function redactText(input: string, redactions: string[] = []): { text: string; redacted: boolean } {
  let text = input;
  let redacted = false;
  for (const value of redactions.filter(Boolean)) {
    if (text.includes(value)) {
      text = text.split(value).join('[REDACTED]');
      redacted = true;
    }
  }
  for (const pattern of DEFAULT_SECRET_PATTERNS) {
    text = text.replace(pattern, (match, group) => {
      redacted = true;
      return group ? match.replace(group, '[REDACTED]') : '[REDACTED]';
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
