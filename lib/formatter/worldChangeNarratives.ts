import type { WorldChangeState } from "@/types/worldChange";
import type { BriefingLanguage } from "./translations";

export interface WorldChangeNarrative {
  /** Short present-tense fact — what's true right now. */
  headline: string;
  /** A second sentence with extra context (mechanic consequence, what it unlocks). */
  body?: string;
  /** A third, fact-only line — e.g. what creature/boss is reachable — with its own emoji. */
  extra?: { emoji: string; text: string };
}

type Lang<T> = Record<BriefingLanguage, T>;
function pick<T>(map: Lang<T>, language: BriefingLanguage): T {
  return map[language];
}

type Resolver = (detail: string, language: BriefingLanguage) => WorldChangeNarrative;
type ChangeNarratives = Partial<Record<WorldChangeState, Resolver>>;

function simple(map: Lang<WorldChangeNarrative>): Resolver {
  return (_detail, language) => pick(map, language);
}

const NARRATIVES: Record<string, ChangeNarratives> = {
  horestis: {
    inactive: simple({
      pt: { headline: "Horestis dorme em seu túmulo, perto de Ankrahmun." },
      en: { headline: "Horestis is slumbering in his tomb near Ankrahmun." },
      es: { headline: "Horestis duerme en su tumba, cerca de Ankrahmun." },
      pl: { headline: "Horestis śpi w swoim grobowcu w pobliżu Ankrahmun." },
    }),
    stage1: simple({
      pt: {
        headline: "Horestis despertou e está disponível para ser enfrentado.",
        body: "O faraó saiu do túmulo perto de Ankrahmun e ataca quem se aproximar.",
      },
      en: {
        headline: "Horestis has risen and can be fought.",
        body: "The pharaoh has left his tomb near Ankrahmun and attacks anyone who gets close.",
      },
      es: {
        headline: "Horestis ha despertado y puede ser enfrentado.",
        body: "El faraón salió de su tumba cerca de Ankrahmun y ataca a quien se acerque.",
      },
      pl: {
        headline: "Horestis obudził się i można z nim walczyć.",
        body: "Faraon opuścił swój grobowiec w pobliżu Ankrahmun i atakuje każdego, kto się zbliży.",
      },
    }),
    stage2: simple({
      pt: {
        headline: "Todos os Ornate Canopic Jars foram quebrados — o corpo de Horestis foi profanado.",
        body: "Uma maldição paira sobre Ankrahmun enquanto o efeito persistir.",
      },
      en: {
        headline: "Every Ornate Canopic Jar has been shattered — Horestis's body has been desecrated.",
        body: "A curse hangs over Ankrahmun while the effect lasts.",
      },
      es: {
        headline: "Todas las Ornate Canopic Jars fueron destruidas — el cuerpo de Horestis fue profanado.",
        body: "Una maldición pesa sobre Ankrahmun mientras dure el efecto.",
      },
      pl: {
        headline: "Wszystkie Ornate Canopic Jars zostały zniszczone — ciało Horestisa zbezczeszczono.",
        body: "Nad Ankrahmun wisi klątwa, dopóki efekt się utrzymuje.",
      },
    }),
    stage3: simple({
      pt: {
        headline: "A maldição de Horestis já passou e seus servos estão se recuperando lentamente.",
      },
      en: { headline: "Horestis's curse has ended and his minions are slowly recovering." },
      es: { headline: "La maldición de Horestis ya terminó y sus sirvientes se recuperan lentamente." },
      pl: { headline: "Klątwa Horestisa już minęła, a jego słudzy powoli się regenerują." },
    }),
  },

  "mage-tower": {
    active: simple({
      pt: {
        headline: "O portal dimensional está aberto na torre em Zao.",
        body: "O Raging Mage pode ser enfrentado por quem cumprir os requisitos da World Change.",
        extra: { emoji: "👹", text: "Boss disponível: Raging Mage" },
      },
      en: {
        headline: "The dimensional portal is open in the tower at Zao.",
        body: "The Raging Mage can be fought by whoever meets the World Change's requirements.",
        extra: { emoji: "👹", text: "Boss available: Raging Mage" },
      },
      es: {
        headline: "El portal dimensional está abierto en la torre de Zao.",
        body: "El Raging Mage puede ser enfrentado por quien cumpla los requisitos de la World Change.",
        extra: { emoji: "👹", text: "Jefe disponible: Raging Mage" },
      },
      pl: {
        headline: "Wymiarowy portal w wieży w Zao jest otwarty.",
        body: "Z Raging Mage może zmierzyć się każdy, kto spełnia wymagania tej World Change.",
        extra: { emoji: "👹", text: "Dostępny boss: Raging Mage" },
      },
    }),
    inactive: simple({
      pt: { headline: "O Raging Mage foi derrotado e o portal na torre em Zao está fechado." },
      en: { headline: "The Raging Mage has been slain and the portal in the Zao tower is closed." },
      es: { headline: "El Raging Mage fue derrotado y el portal en la torre de Zao está cerrado." },
      pl: { headline: "Raging Mage został pokonany, a portal w wieży w Zao jest zamknięty." },
    }),
  },

  "masters-voice": {
    active: simple({
      pt: {
        headline: "A torre estranha com os servos em Edron está acessível.",
        body: "A World Change está na fase dos Golden Servants — ainda é preciso avançar pelas invasões para liberar o Mad Mage.",
        extra: { emoji: "👹", text: "Boss ao fim da invasão: Mad Mage" },
      },
      en: {
        headline: "The strange tower with the servants in Edron is accessible.",
        body: "The World Change is in the Golden Servants phase — the invasions still need clearing to reach the Mad Mage.",
        extra: { emoji: "👹", text: "Boss at the end: Mad Mage" },
      },
      es: {
        headline: "La torre extraña con los sirvientes en Edron está accesible.",
        body: "La World Change está en la fase de los Golden Servants — aún hay que superar las invasiones para liberar al Mad Mage.",
        extra: { emoji: "👹", text: "Jefe al final: Mad Mage" },
      },
      pl: {
        headline: "Dziwna wieża ze sługami w Edron jest dostępna.",
        body: "World Change jest w fazie Golden Servants — trzeba jeszcze przejść przez inwazje, by dotrzeć do Mad Mage.",
        extra: { emoji: "👹", text: "Boss na końcu: Mad Mage" },
      },
    }),
    inactive: simple({
      pt: {
        headline: "A torre estranha com os servos em Edron está impassável.",
        body: "Um surto grave de slimes bloqueia o acesso por enquanto.",
      },
      en: {
        headline: "The strange tower with the servants in Edron is impassable.",
        body: "A severe slime outbreak is blocking access for now.",
      },
      es: {
        headline: "La torre extraña con los sirvientes en Edron es infranqueable.",
        body: "Un brote severo de slimes bloquea el acceso por ahora.",
      },
      pl: {
        headline: "Dziwna wieża ze sługami w Edron jest nie do przejścia.",
        body: "Poważny wysyp slime'ów blokuje na razie dostęp.",
      },
    }),
  },

  "swamp-fever": {
    inactive: simple({
      pt: {
        headline: "A febre do pântano em Venore está sob controle — há remédio suficiente para todos.",
        extra: { emoji: "🤒", text: "Feverish Citizens disponíveis para entrega de Medicine Pouches" },
      },
      en: {
        headline: "The swamp fever in Venore is under control — there's enough medicine for everyone.",
        extra: { emoji: "🤒", text: "Feverish Citizens available for Medicine Pouch deliveries" },
      },
      es: {
        headline: "La fiebre del pantano en Venore está bajo control — hay medicina suficiente para todos.",
        extra: { emoji: "🤒", text: "Feverish Citizens disponibles para entregar Medicine Pouches" },
      },
      pl: {
        headline: "Gorączka bagienna w Venore jest pod kontrolą — leków starcza dla wszystkich.",
        extra: { emoji: "🤒", text: "Feverish Citizens dostępni do dostarczania Medicine Pouch" },
      },
    }),
    active: simple({
      pt: { headline: "Venore está sofrendo com a epidemia de febre do pântano." },
      en: { headline: "Venore is suffering from the swamp fever epidemic." },
      es: { headline: "Venore está sufriendo la epidemia de fiebre del pantano." },
      pl: { headline: "Venore zmaga się z epidemią gorączki bagiennej." },
    }),
  },

  thornfire: {
    stage1: simple({
      pt: {
        headline: "Os incendiários seguem presos nas celas sob Shadowthorn, ainda sob vigilância segura.",
      },
      en: { headline: "The firestarters remain locked in their cells beneath Shadowthorn, still safely guarded." },
      es: { headline: "Los incendiarios siguen encerrados en sus celdas bajo Shadowthorn, todavía vigilados." },
      pl: { headline: "Podpalacze wciąż siedzą zamknięci w celach pod Shadowthorn, pod pilną strażą." },
    }),
    stage2: (detail, language) => {
      const recovering = detail.toLowerCase().includes("recover");
      if (recovering) {
        return pick(
          {
            pt: {
              headline: "Shadowthorn ainda está em chamas, mas os Tibianos vêm conseguindo conter o fogo.",
              extra: { emoji: "🐺", text: "Thornfire Wolf disponível (pode virar Crystal Wolf para tentativa de tame)" },
            },
            en: {
              headline: "Shadowthorn still burns, but Tibians have been successfully fighting the fire back.",
              extra: { emoji: "🐺", text: "Thornfire Wolf available (can turn into a Crystal Wolf to attempt taming)" },
            },
            es: {
              headline: "Shadowthorn sigue en llamas, pero los tibianos han logrado contener el fuego.",
              extra: { emoji: "🐺", text: "Thornfire Wolf disponible (puede volverse Crystal Wolf para intentar domar)" },
            },
            pl: {
              headline: "Shadowthorn wciąż płonie, ale Tibianie skutecznie walczą z ogniem.",
              extra: { emoji: "🐺", text: "Dostępny Thornfire Wolf (może zmienić się w Crystal Wolf do oswojenia)" },
            },
          },
          language,
        );
      }
      return pick(
        {
          pt: {
            headline: "A maioria dos guardas e elfos que continham os incendiários foi derrotada.",
            body: "Shadowthorn corre risco de ser incendiada.",
          },
          en: {
            headline: "Most of the guards and elves holding back the firestarters have been slain.",
            body: "Shadowthorn is in danger of being set ablaze.",
          },
          es: {
            headline: "La mayoría de los guardias y elfos que contenían a los incendiarios fueron derrotados.",
            body: "Shadowthorn corre el riesgo de ser incendiada.",
          },
          pl: {
            headline: "Większość strażników i elfów powstrzymujących podpalaczy została pokonana.",
            body: "Shadowthorn jest zagrożone podpaleniem.",
          },
        },
        language,
      );
    },
    stage3: simple({
      pt: {
        headline: "Shadowthorn está em chamas!",
        extra: { emoji: "🐺", text: "Thornfire Wolf disponível (pode virar Crystal Wolf para tentativa de tame)" },
      },
      en: {
        headline: "Shadowthorn burns!",
        extra: { emoji: "🐺", text: "Thornfire Wolf available (can turn into a Crystal Wolf to attempt taming)" },
      },
      es: {
        headline: "¡Shadowthorn está en llamas!",
        extra: { emoji: "🐺", text: "Thornfire Wolf disponible (puede volverse Crystal Wolf para intentar domar)" },
      },
      pl: {
        headline: "Shadowthorn płonie!",
        extra: { emoji: "🐺", text: "Dostępny Thornfire Wolf (może zmienić się w Crystal Wolf do oswojenia)" },
      },
    }),
  },

  "twisted-waters": {
    inactive: simple({
      pt: { headline: "O grande lago perto de Port Hope está limpo." },
      en: { headline: "The great lake near Port Hope is clean." },
      es: { headline: "El gran lago cerca de Port Hope está limpio." },
      pl: { headline: "Wielkie jezioro w pobliżu Port Hope jest czyste." },
    }),
    stage1: simple({
      pt: {
        headline: "Corpos se acumulam no lago perto de Port Hope — a água está prestes a ficar contaminada.",
      },
      en: { headline: "Corpses are piling up in the lake near Port Hope — the water is about to turn dirty." },
      es: { headline: "Los cadáveres se acumulan en el lago cerca de Port Hope — el agua está por contaminarse." },
      pl: { headline: "W jeziorze koło Port Hope gromadzą się zwłoki — woda zaraz się zabrudzi." },
    }),
    stage2: simple({
      pt: {
        headline: "O Lago Equívoco está contaminado.",
        extra: { emoji: "🎣", text: "Shimmer Swimmers disponíveis para pesca" },
      },
      en: {
        headline: "The lake near Port Hope is polluted.",
        extra: { emoji: "🎣", text: "Shimmer Swimmers available to fish" },
      },
      es: {
        headline: "El lago cerca de Port Hope está contaminado.",
        extra: { emoji: "🎣", text: "Shimmer Swimmers disponibles para pescar" },
      },
      pl: {
        headline: "Jezioro w pobliżu Port Hope jest zanieczyszczone.",
        extra: { emoji: "🎣", text: "Dostępne Shimmer Swimmers do złowienia" },
      },
    }),
    stage3: simple({
      pt: {
        headline: "O lago segue contaminado, mas os Shimmer Swimmers não são vistos há um bom tempo.",
      },
      en: { headline: "The lake is still dirty, but no Shimmer Swimmers have been seen for quite a while." },
      es: { headline: "El lago sigue contaminado, pero hace tiempo que no se ven Shimmer Swimmers." },
      pl: { headline: "Jezioro wciąż jest brudne, ale od dłuższego czasu nie widziano Shimmer Swimmers." },
    }),
  },

  awash: {
    inactive: simple({
      pt: { headline: "As minas sob Kazordoon estão inundadas — é preciso entregar carvão para religar as bombas." },
      en: { headline: "The tunnels beneath Kazordoon are flooded — coal is needed to get the pumps running again." },
      es: { headline: "Los túneles bajo Kazordoon están inundados — se necesita carbón para reactivar las bombas." },
      pl: { headline: "Tunele pod Kazordoon są zalane — potrzebny jest węgiel, by uruchomić pompy." },
    }),
    stage1: simple({
      pt: { headline: "As minas sob Kazordoon seguem inundadas, mas carvão suficiente já foi entregue para manter as bombas funcionando." },
      en: { headline: "The tunnels beneath Kazordoon are still flooded, but enough coal has been delivered to keep the pumps running." },
      es: { headline: "Los túneles bajo Kazordoon siguen inundados, pero ya se entregó suficiente carbón para mantener las bombas funcionando." },
      pl: { headline: "Tunele pod Kazordoon są nadal zalane, ale dostarczono już wystarczająco węgla, by pompy działały." },
    }),
    stage2: (detail, language) => {
      const quotaMet = detail.toLowerCase().includes("met") && !detail.toLowerCase().includes("not");
      return pick(
        {
          pt: {
            headline: "A água das minas foi drenada — o acesso aos Deepling Scouts está liberado.",
            body: quotaMet
              ? "Deeplings suficientes já foram mortos hoje, então a mina continuará aberta após o próximo Server Save."
              : "Ainda é preciso matar mais Deeplings hoje para a mina continuar aberta após o próximo Server Save.",
          },
          en: {
            headline: "The mine water has been drained — Deepling Scouts are accessible.",
            body: quotaMet
              ? "Enough Deeplings have already been killed today, so the mine will stay open after the next server save."
              : "More Deeplings still need to be killed today for the mine to stay open after the next server save.",
          },
          es: {
            headline: "El agua de la mina fue drenada — hay acceso a los Deepling Scouts.",
            body: quotaMet
              ? "Ya se mataron suficientes Deeplings hoy, así que la mina seguirá abierta tras el próximo Server Save."
              : "Aún hace falta matar más Deeplings hoy para que la mina siga abierta tras el próximo Server Save.",
          },
          pl: {
            headline: "Woda w kopalni została odpompowana — dostępni są Deepling Scouts.",
            body: quotaMet
              ? "Dziś zabito już wystarczająco Deeplingów, więc kopalnia pozostanie otwarta po następnym server save."
              : "Trzeba dziś zabić jeszcze więcej Deeplingów, by kopalnia została otwarta po następnym server save.",
          },
        },
        language,
      );
    },
    stage3: simple({
      pt: { headline: "Deeplings demais sobreviveram nos últimos cinco dias — eles vão inundar os túneis novamente e nada pode impedir." },
      en: { headline: "Too many Deeplings survived over the last five days — they will flood the tunnels again and nothing can stop them." },
      es: { headline: "Demasiados Deeplings sobrevivieron en los últimos cinco días — inundarán los túneles de nuevo y nada puede evitarlo." },
      pl: { headline: "W ciągu ostatnich pięciu dni przetrwało zbyt wiele Deeplingów — ponownie zaleją tunele i nic tego nie powstrzyma." },
    }),
  },

  steamship: {
    inactive: simple({
      pt: { headline: "O barco a vapor entre Thais e Kazordoon não está operando — é preciso entregar carvão para reativar o serviço." },
      en: { headline: "The steamship between Thais and Kazordoon isn't running — coal is needed to restart the service." },
      es: { headline: "El barco a vapor entre Thais y Kazordoon no está operando — se necesita carbón para reactivar el servicio." },
      pl: { headline: "Parowiec między Thais a Kazordoon nie kursuje — potrzebny jest węgiel, by wznowić usługę." },
    }),
    stage1: simple({
      pt: { headline: "O barco a vapor ainda não está operando, mas carvão suficiente já foi entregue para retomar o serviço amanhã." },
      en: { headline: "The steamship still isn't running, but enough coal has been delivered to start the service again tomorrow." },
      es: { headline: "El barco a vapor todavía no opera, pero ya se entregó suficiente carbón para reanudar el servicio mañana." },
      pl: { headline: "Parowiec wciąż nie kursuje, ale dostarczono już wystarczająco węgla, by jutro wznowić usługę." },
    }),
  },

  "horse-station": {
    active: simple({
      pt: {
        headline: "Os cavalos escaparam dos estábulos perto de Thais — o aluguel está suspenso enquanto não voltarem.",
        extra: { emoji: "🐎", text: "Wild Horses disponíveis nos arredores de Thais para tentativa de tame" },
      },
      en: {
        headline: "Horses have escaped near Thais — rentals are on hold until enough are chased back.",
        extra: { emoji: "🐎", text: "Wild Horses available around Thais to attempt taming" },
      },
      es: {
        headline: "Los caballos escaparon cerca de Thais — el alquiler está suspendido hasta que vuelvan.",
        extra: { emoji: "🐎", text: "Wild Horses disponibles cerca de Thais para intentar domar" },
      },
      pl: {
        headline: "Konie uciekły w pobliżu Thais — wynajem jest wstrzymany, dopóki nie wrócą.",
        extra: { emoji: "🐎", text: "Dostępne Wild Horses w okolicach Thais do oswojenia" },
      },
    }),
    inactive: simple({
      pt: { headline: "Os cavalos estão nos estábulos perto de Thais e podem ser alugados normalmente." },
      en: { headline: "The horses are back in their stables near Thais and can be rented normally." },
      es: { headline: "Los caballos están en los establos cerca de Thais y pueden alquilarse con normalidad." },
      pl: { headline: "Konie są w stajniach w pobliżu Thais i można je normalnie wynająć." },
    }),
  },

  "overhunting-deer": {
    stage1: simple({
      pt: {
        headline: "White Deer estão disponíveis na região de Ab'Dendriel.",
        body: "A população está estável — evite caçar demais para não afugentá-los.",
      },
      en: {
        headline: "White Deer are available in the Ab'Dendriel region.",
        body: "The population is stable — don't overhunt them or they'll leave the region.",
      },
      es: {
        headline: "Hay White Deer disponibles en la región de Ab'Dendriel.",
        body: "La población está estable — no cacen de más o se irán de la región.",
      },
      pl: {
        headline: "W okolicach Ab'Dendriel dostępne są White Deer.",
        body: "Populacja jest stabilna — nie poluj na nie zbyt intensywnie, bo opuszczą region.",
      },
    }),
    stage2: (detail, language) => {
      const leaving = detail.toLowerCase().includes("leav");
      return pick(
        {
          pt: {
            headline: leaving
              ? "White Deer demais já foram abatidos perto de Ab'Dendriel — a população vai deixar a região em breve."
              : "A população de White Deer perto de Ab'Dendriel está diminuindo.",
            body: leaving ? "Lobos famintos devem aparecer no próximo Server Save." : "Se continuar assim, lobos famintos podem aparecer.",
          },
          en: {
            headline: leaving
              ? "Too many White Deer have already been slain near Ab'Dendriel — the population will leave soon."
              : "The White Deer population near Ab'Dendriel is dwindling.",
            body: leaving ? "Starving wolves are expected at the next server save." : "If that continues, starving wolves may show up.",
          },
          es: {
            headline: leaving
              ? "Ya se han cazado demasiados White Deer cerca de Ab'Dendriel — la población se irá pronto."
              : "La población de White Deer cerca de Ab'Dendriel está disminuyendo.",
            body: leaving ? "Se esperan lobos hambrientos en el próximo Server Save." : "Si continúa así, podrían aparecer lobos hambrientos.",
          },
          pl: {
            headline: leaving
              ? "Zbyt wiele White Deer zostało już zabitych w pobliżu Ab'Dendriel — populacja wkrótce opuści region."
              : "Populacja White Deer w pobliżu Ab'Dendriel maleje.",
            body: leaving ? "Przy najbliższym server save spodziewane są głodne wilki." : "Jeśli tak dalej pójdzie, mogą pojawić się głodne wilki.",
          },
        },
        language,
      );
    },
    stage3: simple({
      pt: { headline: "Lobos famintos rondam a região de Ab'Dendriel — enquanto estiverem lá, nenhum White Deer vai voltar." },
      en: { headline: "Starving wolves are roaming the Ab'Dendriel region — no White Deer will return while they're around." },
      es: { headline: "Lobos hambrientos rondan la región de Ab'Dendriel — mientras estén ahí, ningún White Deer volverá." },
      pl: { headline: "Głodne wilki krążą w okolicach Ab'Dendriel — dopóki tam są, żaden White Deer nie wróci." },
    }),
  },

  "demon-war": {
    inactive: simple({
      pt: { headline: "A guerra entre os demônios está em impasse — nenhuma facção domina a Demonwar Dungeon." },
      en: { headline: "The demon war is in a stalemate — no faction controls the Demonwar Dungeon." },
      es: { headline: "La guerra entre demonios está estancada — ninguna facción domina la Demonwar Dungeon." },
      pl: { headline: "Wojna demonów utknęła w martwym punkcie — żadna frakcja nie kontroluje Demonwar Dungeon." },
    }),
    stage1: (detail, language) => {
      const shaburak = detail.toLowerCase().includes("shaburak");
      const winner = shaburak ? "Shaburak" : "Askarak";
      const loser = shaburak ? "Askarak" : "Shaburak";
      return pick(
        {
          pt: {
            headline: `Os ${winner} estão vencendo a guerra contra os ${loser}.`,
            body: "A vantagem atual determina qual facção ocupa a Demonwar Dungeon e quais criaturas ficam disponíveis.",
          },
          en: {
            headline: `The ${winner} are winning the war against the ${loser}.`,
            body: "The current advantage decides which faction holds the Demonwar Dungeon and which creatures are accessible.",
          },
          es: {
            headline: `Los ${winner} están ganando la guerra contra los ${loser}.`,
            body: "La ventaja actual determina qué facción ocupa la Demonwar Dungeon y qué criaturas están disponibles.",
          },
          pl: {
            headline: `${winner} wygrywają wojnę z ${loser}.`,
            body: "Obecna przewaga decyduje, która frakcja zajmuje Demonwar Dungeon i jakie stworzenia są dostępne.",
          },
        },
        language,
      );
    },
    stage2: (detail, language) => {
      const shaburak = detail.toLowerCase().includes("shaburak");
      const winner = shaburak ? "Shaburak" : "Askarak";
      return pick(
        {
          pt: {
            headline: `Os ${winner} convocaram seus líderes e dominam o complexo.`,
            body: "A Demonwar Dungeon está totalmente sob controle dessa facção por enquanto.",
          },
          en: {
            headline: `The ${winner} have summoned their leaders and dominate the complex.`,
            body: "The Demonwar Dungeon is fully under this faction's control for now.",
          },
          es: {
            headline: `Los ${winner} invocaron a sus líderes y dominan el complejo.`,
            body: "La Demonwar Dungeon está totalmente bajo el control de esta facción por ahora.",
          },
          pl: {
            headline: `${winner} przywołali swoich przywódców i dominują w kompleksie.`,
            body: "Demonwar Dungeon jest obecnie całkowicie pod kontrolą tej frakcji.",
          },
        },
        language,
      );
    },
  },

  "sea-serpent": {
    inactive: simple({
      pt: { headline: "A Fire-Feathered Serpent está profundamente adormecida." },
      en: { headline: "The Fire-Feathered Serpent is fast asleep." },
      es: { headline: "La Fire-Feathered Serpent está profundamente dormida." },
      pl: { headline: "Fire-Feathered Serpent jest pogrążony w głębokim śnie." },
    }),
    stage1: simple({
      pt: { headline: "A Serpent sonha e a terra sangra lava." },
      en: { headline: "The Serpent dreams and the earth bleeds lava." },
      es: { headline: "La Serpent sueña y la tierra sangra lava." },
      pl: { headline: "Serpent śni, a ziemia krwawi lawą." },
    }),
    stage2: simple({
      pt: {
        headline: "A Serpent está desperta.",
        extra: { emoji: "⚔️", text: "Renegade Quara dominam as regiões submersas de Oramond" },
      },
      en: {
        headline: "The Serpent is awake.",
        extra: { emoji: "⚔️", text: "Renegade Quara control the sunken regions of Oramond" },
      },
      es: {
        headline: "La Serpent está despierta.",
        extra: { emoji: "⚔️", text: "Los Renegade Quara dominan las regiones sumergidas de Oramond" },
      },
      pl: {
        headline: "Serpent się obudził.",
        extra: { emoji: "⚔️", text: "Renegade Quara kontrolują zatopione regiony Oramond" },
      },
    }),
  },

  deeplings: {
    stage1: simple({
      pt: { headline: "As criaturas do fundo do mar estão escondidas nas águas negras, longe da superfície." },
      en: { headline: "The creatures of the deep are hiding in the black waters below." },
      es: { headline: "Las criaturas de las profundidades se esconden en las aguas negras del fondo." },
      pl: { headline: "Stworzenia z głębin ukrywają się w czarnych wodach poniżej." },
    }),
    stage2: simple({
      pt: {
        headline: "God-king Qjell parece satisfeito — as comportas para a Drowned Library foram abertas.",
      },
      en: { headline: "God-king Qjell seems pleased — the floodgates to the Drowned Library have opened." },
      es: { headline: "El God-king Qjell parece complacido — se abrieron las compuertas hacia la Drowned Library." },
      pl: { headline: "God-king Qjell wydaje się zadowolony — bramy do Drowned Library zostały otwarte." },
    }),
    stage3: simple({
      pt: {
        headline: "O Inner Arcanum das profundezas foi rompido.",
        extra: { emoji: "🐙", text: "Dark Guardians podem ser enfrentados" },
      },
      en: {
        headline: "The inner arcanum of the deep has been breached.",
        extra: { emoji: "🐙", text: "Dark Guardians can be fought" },
      },
      es: {
        headline: "El Inner Arcanum de las profundidades ha sido violado.",
        extra: { emoji: "🐙", text: "Los Dark Guardians pueden ser enfrentados" },
      },
      pl: {
        headline: "Inner Arcanum głębin zostało przełamane.",
        extra: { emoji: "🐙", text: "Można zmierzyć się z Dark Guardians" },
      },
    }),
  },

  "hive-born": {
    stage1: simple({
      pt: { headline: "A Hive está bem defendida e preparada para a guerra." },
      en: { headline: "The hive is well defended and prepared for war." },
      es: { headline: "La Hive está bien defendida y preparada para la guerra." },
      pl: { headline: "Hive jest dobrze broniona i przygotowana do wojny." },
    }),
    stage2: simple({
      pt: {
        headline: "As defesas da Hive foram rompidas — a estrutura a leste está aberta.",
      },
      en: { headline: "The hive's defences are breached — the structure to the east is open." },
      es: { headline: "Las defensas de la Hive fueron rotas — la estructura al este está abierta." },
      pl: { headline: "Obrona Hive została przełamana — struktura na wschodzie jest otwarta." },
    }),
    stage3: simple({
      pt: {
        headline: "Todas as estruturas da Hive estão abertas.",
        body: "As defesas caíram e os exércitos estão em polvorosa — leste e oeste, bosses da Hive, Ladybugs e reward rooms acessíveis.",
      },
      en: {
        headline: "Every Hive structure is open.",
        body: "Defences have fallen and the armies are in disarray — east and west, Hive bosses, Ladybugs, and reward rooms are all accessible.",
      },
      es: {
        headline: "Todas las estructuras de la Hive están abiertas.",
        body: "Las defensas cayeron y los ejércitos están en desorden — este y oeste, jefes de la Hive, Ladybugs y reward rooms accesibles.",
      },
      pl: {
        headline: "Wszystkie struktury Hive są otwarte.",
        body: "Obrona upadła, a armie są w rozsypce — wschód i zachód, bossowie Hive, Ladybugs i reward roomy są dostępne.",
      },
    }),
  },
};

/** Returns null when there's no narrative content for this exact (changeId, state) pair —
 * callers should fall back to the compact status-line rendering in that case. */
export function getWorldChangeNarrative(
  changeId: string,
  state: WorldChangeState,
  detail: string,
  language: BriefingLanguage,
): WorldChangeNarrative | null {
  const resolver = NARRATIVES[changeId]?.[state];
  return resolver ? resolver(detail, language) : null;
}
