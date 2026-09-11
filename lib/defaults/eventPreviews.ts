import type { LocalizedText } from "@/types/opportunity";

/**
 * What each upcoming event is actually worth turning up for.
 *
 * ## Why this exists
 *
 * The NEXT EVENTS section used to be three lines per event: the name, the date, and how many
 * days away it is. That answers "when", and the reader's question is "why should I care". A
 * player who knows that Grimvale starts tomorrow still does not know that Feroxa only spawns on
 * the 13th, or that fighting her needs three Purple Nightshade Blossoms handed in beforehand,
 * and those are exactly the two facts that decide whether tomorrow is a preparation day.
 *
 * ## Shape
 *
 * One entry per event, matched on the title the wiki's own Upcoming Events gadget prints (see
 * lib/data/wikiContentClient.ts), the same way `eventEmoji` matches. Each carries two or three
 * notes, because this is a preview and not the quest spoiler: enough to decide whether to
 * prepare, never enough to replace the wiki.
 *
 * ## What earns a line
 *
 * Only something specific to, or characteristic of, *this* event: a boss that exists nowhere
 * else, an achievement only this event grants, a mount, an outfit, a reward you cannot buy. An
 * achievement that happens to be obtainable here and in five other places is not a reason to
 * come. I Did My Part is the case that made the rule: it is granted by every world quest going
 * (Rise of Devovorga, the Lightbearer, Bewitched, A Piece of Cake, the Colours of Magic), so
 * listing it under one of them told the reader it was that event's prize.
 *
 * `dayOfMonth` is the one piece of derived data here. An event with a boss or a window on a
 * fixed day of the month (Feroxa, always the 13th) has that day rendered as a real date, worked
 * out from the occurrence's own start date rather than written into the text, so the line reads
 * "Appears on 13 September" in September and "13 October" in October without anyone editing it.
 *
 * ## Evidence
 *
 * Every claim is from TibiaWiki's own article for that event. Where a fact is a schedule the
 * wiki states outright ("Feroxa always spawns on the 13th of each month") it is here; where it
 * would need interpreting, it is not.
 */

export interface EventPreviewNote {
  /**
   * The marker glyph for this line.
   *
   * The bulletin's own vocabulary is reused where a kind fits (👹 a boss, 🐎 a mount, 🏆 an
   * achievement, 👕 an outfit, 🎯 a bestiary entry), so a reader who has learned the markers in
   * the World Changes section reads this one without relearning anything. An event that is
   * *about* something else entirely gets its own symbol, which is why this is a string rather
   * than a `NoteIcon`: the full moon over Grimvale is a moon, and the three wizards are three
   * coloured circles.
   */
  emoji: string;
  /** Bolded and followed by a colon, for a line about one named thing. */
  subject?: string;
  text: LocalizedText;
  /**
   * Day of the month this highlight falls on, when the event has one fixed inside its window.
   * Rendered as a real date against the occurrence's start, never as a bare number.
   */
  dayOfMonth?: number;
}

export interface EventPreview {
  /** Substring of the event title, matched case-sensitively, longest match first. */
  match: string;
  notes: readonly EventPreviewNote[];
  /** Where the claims were verified. */
  sources: readonly string[];
}

const WIKI = "https://tibia.fandom.com/wiki";

export const EVENT_PREVIEWS: readonly EventPreview[] = [
  {
    match: "Grimvale",
    notes: [
      {
        emoji: "🌕",
        text: {
          pt: "A lua cheia transforma os habitantes de Grimvale em were-creatures, abrindo as tarefas da Full Moon e os hunts da ilha.",
          en: "The full moon will transform Grimvale's inhabitants into were-creatures, opening the Full Moon tasks and Grimvale hunting grounds.",
          es: "La luna llena transforma a los habitantes de Grimvale en were-creatures, abriendo las tareas de la Full Moon y los hunts de la isla.",
          pl: "Pełnia zmienia mieszkańców Grimvale w were-creatures, otwierając zadania Full Moon i tereny łowieckie wyspy.",
        },
      },
      {
        emoji: "👹",
        subject: "Feroxa",
        dayOfMonth: 13,
        text: {
          pt: "Prepare os requisitos da Grimvale Quest antes, se quiser enfrentá-la.",
          en: "Prepare the Grimvale Quest requirements beforehand if you want to fight her.",
          es: "Prepara los requisitos de la Grimvale Quest antes si quieres enfrentarla.",
          pl: "Przygotuj wcześniej wymagania Grimvale Quest, jeśli chcesz z nią walczyć.",
        },
      },
    ],
    sources: [`${WIKI}/Grimvale_Mini_World_Change/Spoiler`, `${WIKI}/Feroxa`],
  },
  {
    match: "The Colours of Magic",
    notes: [
      {
        emoji: "🔴🔵🟢",
        text: {
          pt: "Escolha uma cor e ajude seu mago entregando os pós da cor certa. A cor vencedora decide o bônus que o servidor inteiro recebe por uma semana.",
          en: "Choose a colour and help your wizard by delivering colour-specific powders. The winning colour decides the bonus the whole server gets for a week.",
          es: "Elige un color y ayuda a tu mago entregando los polvos de ese color. El color ganador decide el bono que todo el servidor recibe por una semana.",
          pl: "Wybierz kolor i pomóż swojemu magowi, dostarczając proszki w jego barwie. Zwycięski kolor decyduje o bonusie dla całego serwera na tydzień.",
        },
      },
      {
        emoji: "🎁",
        subject: "Zaoan Chess Pieces",
        text: {
          pt: "Entrar em um mago e marcar outros jogadores rende bonus points, que compram peças no representante do seu mago. São 30 por personagem, no máximo.",
          en: "Joining a wizard and tagging other players earns bonus points, which buy pieces at your wizard's representative. 30 per character at most.",
          es: "Unirte a un mago y marcar a otros jugadores da bonus points, que compran piezas en el representante de tu mago. 30 por personaje como máximo.",
          pl: "Dołączenie do maga i oznaczanie innych graczy daje bonus points, za które kupisz figury u przedstawiciela swojego maga. Najwyżej 30 na postać.",
        },
      },
      {
        emoji: "🏆",
        subject: "True Colours",
        text: {
          pt: "Participe do evento três vezes, 3 achievement points.",
          en: "Take part in the event three times, 3 achievement points.",
          es: "Participa en el evento tres veces, 3 achievement points.",
          pl: "Weź udział w wydarzeniu trzy razy, 3 pkt achievement.",
        },
      },
    ],
    sources: [
      `${WIKI}/The_Colours_of_Magic/Spoiler`,
      `${WIKI}/Zaoan_Chess_Piece`,
      `${WIKI}/True_Colours`,
    ],
  },
  {
    match: "Rise of Devovorga",
    notes: [
      {
        emoji: "👹",
        subject: "Devovorga",
        text: {
          pt: "Cinco encarnações espalhadas pelo mundo levam ao boss principal em Ferumbras' Tower, com as Devovorga's Tentacles como loot exclusivo.",
          en: "Five incarnations around the world lead to the main boss at Ferumbras' Tower, with Devovorga's Tentacles as the event's own loot.",
          es: "Cinco encarnaciones por todo el mundo llevan al boss principal en Ferumbras' Tower, con las Devovorga's Tentacles como loot propio del evento.",
          pl: "Pięć wcieleń rozsianych po świecie prowadzi do głównego bossa w Ferumbras' Tower, z Devovorga's Tentacles jako własnym lootem wydarzenia.",
        },
      },
    ],
    sources: [`${WIKI}/Rise_of_Devovorga`],
  },
  {
    match: "Orcsoberfest",
    notes: [
      {
        emoji: "🎯",
        text: {
          pt: "O acampamento orc perto de Rathleton abre com tarefas diárias, e o Orc Rider vira montaria para quem completar a Orcsoberfest Quest.",
          en: "The orc camp near Rathleton opens with daily tasks, and the Orc Rider mount comes from completing the Orcsoberfest Quest.",
          es: "El campamento orco cerca de Rathleton abre con tareas diarias, y la montura Orc Rider viene de completar la Orcsoberfest Quest.",
          pl: "Obóz orków przy Rathleton otwiera się z codziennymi zadaniami, a wierzchowiec Orc Rider pochodzi z ukończenia Orcsoberfest Quest.",
        },
      },
    ],
    sources: [`${WIKI}/Orcsoberfest`],
  },
  {
    match: "The Lightbearer",
    notes: [
      {
        emoji: "🕯️",
        text: {
          pt: "Acenda os braseiros pelo mundo todo para encher a barra do servidor; a recompensa e o Fafnar Statue só valem enquanto o evento durar.",
          en: "Light the braziers across the world to fill the server's bar; the reward room and the Fafnar statue only work while the event runs.",
          es: "Enciende los braseros por todo el mundo para llenar la barra del servidor; la sala de recompensa y la estatua de Fafnar solo valen durante el evento.",
          pl: "Zapalaj znicze na całym świecie, by zapełnić pasek serwera; sala nagród i posąg Fafnar działają tylko w trakcie wydarzenia.",
        },
      },
    ],
    sources: [`${WIKI}/The_Lightbearer`],
  },
  {
    match: "A Pirate's Death to Me",
    notes: [
      {
        emoji: "☠️",
        text: {
          pt: "Duelos de pirata nas ilhas do sul, com recompensas próprias e o achievement do evento.",
          en: "Pirate duels around the southern islands, with their own rewards and the event's achievement.",
          es: "Duelos piratas por las islas del sur, con recompensas propias y el achievement del evento.",
          pl: "Pirackie pojedynki na południowych wyspach, z własnymi nagrodami i osiągnięciem wydarzenia.",
        },
      },
    ],
    sources: [`${WIKI}/A_Pirate's_Death_to_Me`],
  },
  {
    match: "Last Creep Standing",
    notes: [
      {
        emoji: "🏴‍☠️",
        text: {
          pt: "Arena por rodadas em Liberty Bay; quem sobrevive às ondas leva a recompensa do evento.",
          en: "A round-based arena in Liberty Bay; whoever survives the waves takes the event's reward.",
          es: "Arena por rondas en Liberty Bay; quien sobrevive a las oleadas se lleva la recompensa del evento.",
          pl: "Arena rundowa w Liberty Bay; kto przetrwa fale, bierze nagrodę wydarzenia.",
        },
      },
    ],
    sources: [`${WIKI}/Last_Creep_Standing`],
  },
  {
    match: "Annual Autumn Vintage",
    notes: [
      {
        emoji: "🍂",
        text: {
          pt: "Pise as uvas nos vinhedos perto de Carlin e Thais para o achievement da colheita e os prêmios do evento.",
          en: "Stomp the grapes at the vineyards near Carlin and Thais for the harvest achievement and the event's prizes.",
          es: "Pisa las uvas en los viñedos cerca de Carlin y Thais para el achievement de la cosecha y los premios del evento.",
          pl: "Depcz winogrona w winnicach koło Carlin i Thais po osiągnięcie zbiorów i nagrody wydarzenia.",
        },
      },
    ],
    sources: [`${WIKI}/Annual_Autumn_Vintage`],
  },
  {
    match: "Halloween",
    notes: [
      {
        emoji: "🎃",
        text: {
          pt: "O Bewitched world quest abre o caldeirão de Wyda, e a sala de recompensa dá os itens de Halloween do ano.",
          en: "The Bewitched world quest opens Wyda's cauldron, and its reward room holds the year's Halloween items.",
          es: "El world quest Bewitched abre el caldero de Wyda, y su sala de recompensa da los objetos de Halloween del año.",
          pl: "World quest Bewitched otwiera kocioł Wydy, a sala nagród kryje tegoroczne przedmioty na Halloween.",
        },
      },
    ],
    sources: [`${WIKI}/Bewitched`],
  },
  {
    match: "Winterlight Solstice",
    notes: [
      {
        emoji: "❄️",
        text: {
          pt: "As tarefas diárias do evento rodam por toda a janela e liberam os itens de inverno do ano.",
          en: "The event's daily tasks run for the whole window and unlock the year's winter items.",
          es: "Las tareas diarias del evento corren toda la ventana y desbloquean los objetos de invierno del año.",
          pl: "Codzienne zadania wydarzenia trwają przez całe okno i odblokowują zimowe przedmioty tego roku.",
        },
      },
    ],
    sources: [`${WIKI}/Winterlight_Solstice`],
  },
  {
    match: "Christmas",
    notes: [
      {
        emoji: "🎄",
        text: {
          pt: "A vila natalina abre com as tarefas diárias e os presentes do ano; vale garantir o primeiro dia.",
          en: "The Christmas village opens with its daily tasks and the year's presents; the first day is worth catching.",
          es: "La aldea navideña abre con sus tareas diarias y los regalos del año; vale la pena el primer día.",
          pl: "Świąteczna wioska otwiera się z codziennymi zadaniami i prezentami roku; warto złapać pierwszy dzień.",
        },
      },
    ],
    sources: [`${WIKI}/Christmas`],
  },
  {
    match: "Double Experience",
    notes: [
      {
        emoji: "⬆️",
        text: {
          pt: "Experiência e skills em dobro durante toda a janela; guarde os hunts caros para ela.",
          en: "Double experience and skill gain for the whole window; save the expensive hunts for it.",
          es: "Experiencia y skills al doble durante toda la ventana; guarda los hunts caros para ella.",
          pl: "Podwójne doświadczenie i skille przez całe okno; zostaw na nie drogie polowania.",
        },
      },
    ],
    sources: [`${WIKI}/Double_Experience_and_Skill_Events`],
  },
  {
    match: "Double Loot",
    notes: [
      {
        emoji: "🎁",
        text: {
          pt: "Loot em dobro durante toda a janela, incluindo bosses e Bosstiary.",
          en: "Double loot for the whole window, bosses and Bosstiary included.",
          es: "Loot doble durante toda la ventana, bosses y Bosstiary incluidos.",
          pl: "Podwójny loot przez całe okno, wliczając bossów i Bosstiary.",
        },
      },
    ],
    sources: [`${WIKI}/Double_Loot_Event`],
  },
  {
    match: "Rapid Respawn",
    notes: [
      {
        emoji: "⚡",
        text: {
          pt: "Respawn acelerado no mundo todo, o que é a melhor janela do ano para fechar entradas longas do Bestiary.",
          en: "Faster respawn world-wide, which is the year's best window for closing long Bestiary entries.",
          es: "Respawn acelerado en todo el mundo, la mejor ventana del año para cerrar entradas largas del Bestiary.",
          pl: "Przyspieszony respawn na całym świecie, najlepsze okno w roku na domknięcie długich wpisów Bestiary.",
        },
      },
    ],
    sources: [`${WIKI}/Rapid_Respawn_Events`],
  },
];

/** The preview for an event title, or null when none is catalogued. Longest match wins, so a
 * specific title is never shadowed by a shorter one that happens to be a substring of it. */
export function eventPreviewFor(title: string): EventPreview | null {
  const matches = EVENT_PREVIEWS.filter((preview) => title.includes(preview.match));
  if (matches.length === 0) return null;
  return matches.reduce((best, preview) =>
    preview.match.length > best.match.length ? preview : best,
  );
}
