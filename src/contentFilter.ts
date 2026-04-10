const PROFANE_WORDS = [
  'anjing',
  'babi',
  'bangsat',
  'kontol',
  'memek',
  'ngentot',
  'kampret',
  'tolol',
  'goblok',
  'bodoh',
  'bangke',
  'bacot',
  'tai',
  'perek',
  'setan',
  'puta',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'idiot',
  'stupid'
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function containsProfanity(text: string): boolean {
  if (!text) return false;

  const normalized = text.toLowerCase();
  return PROFANE_WORDS.some((word) => {
    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
    return pattern.test(normalized);
  });
}
