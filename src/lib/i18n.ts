export const SAVED_MESSAGE = "Spremljeno";
export const UNKNOWN_DISPLAY_NAME = "Nepoznato";
export const DEFAULT_PLAYER_NAME = "Igrač";

export function formatMatchStatus(status: string) {
  const labels: Record<string, string> = {
    scheduled: "Zakazano",
    live: "UŽIVO",
    finished: "Završeno",
    postponed: "Odgođeno",
  };
  return labels[status] ?? status;
}

function pluralize(
  n: number,
  forms: { one: string; few: string; other: string }
) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return `${n} ${forms.other}`;
  }
  if (mod10 === 1) {
    return `${n} ${forms.one}`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${n} ${forms.few}`;
  }
  return `${n} ${forms.other}`;
}

export function formatMatchCount(n: number) {
  return pluralize(n, {
    one: "utakmica",
    few: "utakmice",
    other: "utakmica",
  });
}

export function formatPickCount(n: number) {
  return pluralize(n, {
    one: "prognoza",
    few: "prognoze",
    other: "prognoza",
  });
}

export function formatRoundCount(n: number) {
  return pluralize(n, {
    one: "kolo",
    few: "kola",
    other: "kola",
  });
}

export function formatPointsShort(n: number) {
  return `+${n} b`;
}

export function formatPointsWithLabel(n: number) {
  return pluralize(n, { one: "bod", few: "boda", other: "bodova" });
}
