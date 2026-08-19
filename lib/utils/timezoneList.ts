/**
 * The viewer-timezone override list — mirrors the exact city set and "City (GMT±N)"
 * label format used by nesleykent.github.io/tibia-warzones-schedule's own timezone
 * selector, for a consistent experience across both tools. Curitiba and São Paulo share
 * the same IANA zone (Brazil abolished DST in 2019), so both map to America/Sao_Paulo.
 */
export interface TimeZoneOption {
  value: string;
  label: string;
}

export const COMMON_TIME_ZONES: TimeZoneOption[] = [
  { value: "America/Los_Angeles", label: "Los Angeles (PDT, GMT-7)" },
  { value: "America/Tijuana", label: "Tijuana (PDT, GMT-7)" },
  { value: "America/Denver", label: "Denver (MDT, GMT-6)" },
  { value: "America/Mexico_City", label: "Mexico City (CST, GMT-6)" },
  { value: "America/Bogota", label: "Bogotá (GMT-5)" },
  { value: "America/Cancun", label: "Cancún (EST, GMT-5)" },
  { value: "America/Chicago", label: "Chicago (CDT, GMT-5)" },
  { value: "America/Lima", label: "Lima (GMT-5)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
  { value: "America/Caracas", label: "Caracas (GMT-4)" },
  { value: "America/Cuiaba", label: "Cuiabá (GMT-4)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/New_York", label: "New York (EDT, GMT-4)" },
  { value: "America/Porto_Velho", label: "Porto Velho (GMT-4)" },
  { value: "America/Santiago", label: "Santiago (GMT-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/Sao_Paulo", label: "Curitiba (GMT-3)" },
  { value: "America/Bahia", label: "Xique-Xique (GMT-3)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
  { value: "Europe/Lisbon", label: "Lisbon (GMT+1)" },
  { value: "Europe/London", label: "London (GMT+1)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (GMT+2)" },
  { value: "Europe/Berlin", label: "Berlin (GMT+2)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+2)" },
  { value: "Europe/Paris", label: "Paris (GMT+2)" },
  { value: "Europe/Rome", label: "Rome (GMT+2)" },
  { value: "Europe/Stockholm", label: "Stockholm (GMT+2)" },
  { value: "Europe/Warsaw", label: "Warsaw (GMT+2)" },
  { value: "Europe/Athens", label: "Athens (GMT+3)" },
  { value: "Europe/Bucharest", label: "Bucharest (GMT+3)" },
  { value: "Europe/Helsinki", label: "Helsinki (GMT+3)" },
  { value: "Europe/Istanbul", label: "Istanbul (GMT+3)" },
  { value: "Europe/Moscow", label: "Moscow (GMT+3)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Asia/Kolkata", label: "Kolkata (UTC+5, GMT+05:30)" },
  { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
  { value: "Asia/Seoul", label: "Seoul (GMT+9)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
  { value: "Australia/Sydney", label: "Sydney (GMT+10)" },
  { value: "Pacific/Auckland", label: "Auckland (GMT+12)" },
];

export function isKnownTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
