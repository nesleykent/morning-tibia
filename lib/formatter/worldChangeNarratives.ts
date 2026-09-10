import type { BriefingLanguage } from "./translations";

export interface WorldChangeNarrative {
  /** Short present-tense fact — what's true right now. */
  headline: string;
  /** A second sentence with extra context (mechanic consequence, what it unlocks). */
  body?: string;
}

type Lang<T> = Record<BriefingLanguage, T>;
function pick<T>(map: Lang<T>, language: BriefingLanguage): T {
  return map[language];
}

/**
 * Resolvers receive the state id itself, so the few states whose wording depends on which
 * side is winning (Demon War) or how far a cycle has gone (Awash, Overhunting, Thornfire)
 * can branch on it — replacing the old free-text "detail" field, which let any string reach
 * the briefing.
 */
type Resolver = (stateId: string, language: BriefingLanguage) => WorldChangeNarrative;
type ChangeNarratives = Record<string, Resolver>;

function simple(map: Lang<WorldChangeNarrative>): Resolver {
  return (_stateId, language) => pick(map, language);
}

const NARRATIVES: Record<string, ChangeNarratives> = {
  horestis: {
    "slumbering": simple({
      pt: { headline: "Horestis dorme em seu túmulo, perto de Ankrahmun." },
      en: { headline: "Horestis is slumbering in his tomb near Ankrahmun." },
      es: { headline: "Horestis duerme en su tumba, cerca de Ankrahmun." },
      pl: { headline: "Horestis śpi w swoim grobowcu w pobliżu Ankrahmun." },
    }),
    "risen": simple({
      // Not "can be fought": reaching him needs a banked Ornate Canopic Jar break, and that
      // condition belongs to the opportunity, where it is typed alongside the prerequisite.
      // The section's job is to say what the world is doing.
      pt: {
        headline: "Horestis despertou de seu sono perto de Ankrahmun.",
        body: "O faraó saiu do túmulo e ataca quem se aproximar.",
      },
      en: {
        headline: "Horestis has risen from his slumber near Ankrahmun.",
        body: "The pharaoh has left his tomb and attacks anyone who gets close.",
      },
      es: {
        headline: "Horestis ha despertado de su sueño cerca de Ankrahmun.",
        body: "El faraón salió de su tumba y ataca a quien se acerque.",
      },
      pl: {
        headline: "Horestis obudził się ze snu w pobliżu Ankrahmun.",
        body: "Faraon opuścił grobowiec i atakuje każdego, kto się zbliży.",
      },
    }),
    "desecrated": simple({
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
    "curse-ended": simple({
      pt: {
        headline: "A maldição de Horestis já passou e seus servos estão se recuperando lentamente.",
      },
      en: { headline: "Horestis's curse has ended and his minions are slowly recovering." },
      es: { headline: "La maldición de Horestis ya terminó y sus sirvientes se recuperan lentamente." },
      pl: { headline: "Klątwa Horestisa już minęła, a jego słudzy powoli się regenerują." },
    }),
  },

  "mage-tower": {
    "portal-open": simple({
      pt: {
        headline: "O Raging Mage está em sua torre em Zao e mantém o portal dimensional aberto.",
        body: "A outra dimensão pode ser visitada enquanto ele viver.",
      },
      en: {
        headline: "The Raging Mage is at his tower in Zao, holding the dimensional portal open.",
        body: "The other dimension can be visited for as long as he lives.",
      },
      es: {
        headline: "El Raging Mage está en su torre de Zao y mantiene abierto el portal dimensional.",
        body: "La otra dimensión puede visitarse mientras él viva.",
      },
      pl: {
        headline: "Raging Mage jest w swojej wieży w Zao i trzyma wymiarowy portal otwarty.",
        body: "Inny wymiar można odwiedzać, dopóki mag żyje.",
      },
    }),
    "mage-slain": simple({
      pt: {
        headline: "O Raging Mage foi derrotado e o portal na torre em Zao está se fechando.",
        body: "Ele só volta a abrir depois do próximo Server Save.",
      },
      en: {
        headline: "The Raging Mage has been slain and the portal in the Zao tower is collapsing.",
        body: "It only opens again after the next server save.",
      },
      es: {
        headline: "El Raging Mage fue derrotado y el portal en la torre de Zao se está cerrando.",
        body: "Solo vuelve a abrirse tras el próximo Server Save.",
      },
      pl: {
        headline: "Raging Mage został pokonany, a portal w wieży w Zao się zamyka.",
        body: "Otworzy się ponownie dopiero po następnym server save.",
      },
    }),
  },

  "masters-voice": {
    "passable": simple({
      pt: {
        headline: "A torre dos servos em Edron está coberta de slime.",
        body: "O fungo precisa ser limpo antes que as ondas de servos comecem.",
      },
      en: {
        headline: "The servants' tower in Edron is covered in slime.",
        body: "The fungus has to be cleared before the servant waves begin.",
      },
      es: {
        headline: "La torre de los sirvientes en Edron está cubierta de slime.",
        body: "Hay que limpiar el hongo antes de que empiecen las oleadas de sirvientes.",
      },
      pl: {
        headline: "Wieża sług w Edron jest pokryta slime'em.",
        body: "Grzyb trzeba usunąć, zanim ruszą fale sług.",
      },
    }),
    "impassable": simple({
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
    "under-control": simple({
      pt: {
        headline: "A febre do pântano em Venore está sob controle — há remédio suficiente para todos.",
      },
      en: {
        headline: "The swamp fever in Venore is under control — there's enough medicine for everyone.",
      },
      es: {
        headline: "La fiebre del pantano en Venore está bajo control — hay medicina suficiente para todos.",
      },
      pl: {
        headline: "Gorączka bagienna w Venore jest pod kontrolą — leków starcza dla wszystkich.",
      },
    }),
  },

  thornfire: {
    "guarded": simple({
      pt: {
        headline: "Os incendiários seguem presos nas celas sob Shadowthorn, ainda sob vigilância segura.",
      },
      en: { headline: "The firestarters remain locked in their cells beneath Shadowthorn, still safely guarded." },
      es: { headline: "Los incendiarios siguen encerrados en sus celdas bajo Shadowthorn, todavía vigilados." },
      pl: { headline: "Podpalacze wciąż siedzą zamknięci w celach pod Shadowthorn, pod pilną strażą." },
    }),
    "breaking-out": (stateId, language) => {
      const recovering = stateId === "being-fought";
      if (recovering) {
        return pick(
          {
            pt: {
              headline: "Shadowthorn ainda está em chamas, mas os Tibianos vêm conseguindo conter o fogo.",
            },
            en: {
              headline: "Shadowthorn still burns, but Tibians have been successfully fighting the fire back.",
            },
            es: {
              headline: "Shadowthorn sigue en llamas, pero los tibianos han logrado contener el fuego.",
            },
            pl: {
              headline: "Shadowthorn wciąż płonie, ale Tibianie skutecznie walczą z ogniem.",
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
    "being-fought": (stateId, language) => {
      const recovering = stateId === "being-fought";
      if (recovering) {
        return pick(
          {
            pt: {
              headline: "Shadowthorn ainda está em chamas, mas os Tibianos vêm conseguindo conter o fogo.",
            },
            en: {
              headline: "Shadowthorn still burns, but Tibians have been successfully fighting the fire back.",
            },
            es: {
              headline: "Shadowthorn sigue en llamas, pero los tibianos han logrado contener el fuego.",
            },
            pl: {
              headline: "Shadowthorn wciąż płonie, ale Tibianie skutecznie walczą z ogniem.",
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
    "burning": simple({
      pt: {
        headline: "Shadowthorn está em chamas!",
      },
      en: {
        headline: "Shadowthorn burns!",
      },
      es: {
        headline: "¡Shadowthorn está en llamas!",
      },
      pl: {
        headline: "Shadowthorn płonie!",
      },
    }),
  },

  "twisted-waters": {
    "clean": simple({
      pt: { headline: "O grande lago perto de Port Hope está limpo." },
      en: { headline: "The great lake near Port Hope is clean." },
      es: { headline: "El gran lago cerca de Port Hope está limpio." },
      pl: { headline: "Wielkie jezioro w pobliżu Port Hope jest czyste." },
    }),
    "turning": simple({
      pt: {
        headline: "Corpos se acumulam no lago perto de Port Hope — a água está prestes a ficar contaminada.",
      },
      en: { headline: "Corpses are piling up in the lake near Port Hope — the water is about to turn dirty." },
      es: { headline: "Los cadáveres se acumulan en el lago cerca de Port Hope — el agua está por contaminarse." },
      pl: { headline: "W jeziorze koło Port Hope gromadzą się zwłoki — woda zaraz się zabrudzi." },
    }),
    "dirty-swimmers": simple({
      pt: {
        headline: "O Lago Equívoco está contaminado.",
      },
      en: {
        headline: "The lake near Port Hope is polluted.",
      },
      es: {
        headline: "El lago cerca de Port Hope está contaminado.",
      },
      pl: {
        headline: "Jezioro w pobliżu Port Hope jest zanieczyszczone.",
      },
    }),
    "dirty-exhausted": simple({
      pt: {
        headline: "O lago segue contaminado, mas os Shimmer Swimmers não são vistos há um bom tempo.",
      },
      en: { headline: "The lake is still dirty, but no Shimmer Swimmers have been seen for quite a while." },
      es: { headline: "El lago sigue contaminado, pero hace tiempo que no se ven Shimmer Swimmers." },
      pl: { headline: "Jezioro wciąż jest brudne, ale od dłuższego czasu nie widziano Shimmer Swimmers." },
    }),
  },

  awash: {
    "flooded": simple({
      pt: { headline: "As minas sob Kazordoon estão inundadas — é preciso entregar carvão para religar as bombas." },
      en: { headline: "The tunnels beneath Kazordoon are flooded — coal is needed to get the pumps running again." },
      es: { headline: "Los túneles bajo Kazordoon están inundados — se necesita carbón para reactivar las bombas." },
      pl: { headline: "Tunele pod Kazordoon są zalane — potrzebny jest węgiel, by uruchomić pompy." },
    }),
    "flooded-coal-delivered": simple({
      pt: { headline: "As minas sob Kazordoon seguem inundadas, mas carvão suficiente já foi entregue para manter as bombas funcionando." },
      en: { headline: "The tunnels beneath Kazordoon are still flooded, but enough coal has been delivered to keep the pumps running." },
      es: { headline: "Los túneles bajo Kazordoon siguen inundados, pero ya se entregó suficiente carbón para mantener las bombas funcionando." },
      pl: { headline: "Tunele pod Kazordoon są nadal zalane, ale dostarczono już wystarczająco węgla, by pompy działały." },
    }),
    "drained-quota-met": simple({
      pt: {
        headline: "A água das minas foi drenada — o acesso aos Deepling Scouts está liberado.",
        body: "Deeplings suficientes já foram mortos hoje, então a mina continuará aberta após o próximo Server Save.",
      },
      en: {
        headline: "The mine water has been drained — Deepling Scouts are accessible.",
        body: "Enough Deeplings have already been killed today, so the mine will stay open after the next server save.",
      },
      es: {
        headline: "El agua de la mina fue drenada — hay acceso a los Deepling Scouts.",
        body: "Ya se mataron suficientes Deeplings hoy, así que la mina seguirá abierta tras el próximo Server Save.",
      },
      pl: {
        headline: "Woda w kopalni została odpompowana — dostępni są Deepling Scouts.",
        body: "Dziś zabito już wystarczająco Deeplingów, więc kopalnia pozostanie otwarta po następnym server save.",
      },
    }),
    "drained-quota-open": simple({
      pt: {
        headline: "A água das minas foi drenada — o acesso aos Deepling Scouts está liberado.",
        body: "Ainda é preciso matar mais Deeplings hoje para a mina continuar aberta após o próximo Server Save.",
      },
      en: {
        headline: "The mine water has been drained — Deepling Scouts are accessible.",
        body: "More Deeplings still need to be killed today for the mine to stay open after the next server save.",
      },
      es: {
        headline: "El agua de la mina fue drenada — hay acceso a los Deepling Scouts.",
        body: "Aún hace falta matar más Deeplings hoy para que la mina siga abierta tras el próximo Server Save.",
      },
      pl: {
        headline: "Woda w kopalni została odpompowana — dostępni są Deepling Scouts.",
        body: "Trzeba dziś zabić jeszcze więcej Deeplingów, by kopalnia została otwarta po następnym server save.",
      },
    }),
    "overrun": simple({
      pt: { headline: "Deeplings demais sobreviveram nos últimos cinco dias — eles vão inundar os túneis novamente e nada pode impedir." },
      en: { headline: "Too many Deeplings survived over the last five days — they will flood the tunnels again and nothing can stop them." },
      es: { headline: "Demasiados Deeplings sobrevivieron en los últimos cinco días — inundarán los túneles de nuevo y nada puede evitarlo." },
      pl: { headline: "W ciągu ostatnich pięciu dni przetrwało zbyt wiele Deeplingów — ponownie zaleją tunele i nic tego nie powstrzyma." },
    }),
  },

  steamship: {
    "not-running": simple({
      pt: { headline: "O barco a vapor entre Thais e Kazordoon não está operando — é preciso entregar carvão para reativar o serviço." },
      en: { headline: "The steamship between Thais and Kazordoon isn't running — coal is needed to restart the service." },
      es: { headline: "El barco a vapor entre Thais y Kazordoon no está operando — se necesita carbón para reactivar el servicio." },
      pl: { headline: "Parowiec między Thais a Kazordoon nie kursuje — potrzebny jest węgiel, by wznowić usługę." },
    }),
    "coal-delivered": simple({
      pt: { headline: "O barco a vapor ainda não está operando, mas carvão suficiente já foi entregue para retomar o serviço amanhã." },
      en: { headline: "The steamship still isn't running, but enough coal has been delivered to start the service again tomorrow." },
      es: { headline: "El barco a vapor todavía no opera, pero ya se entregó suficiente carbón para reanudar el servicio mañana." },
      pl: { headline: "Parowiec wciąż nie kursuje, ale dostarczono już wystarczająco węgla, by jutro wznowić usługę." },
    }),
  },

  "horse-station": {
    "escaped": simple({
      pt: {
        headline: "Os cavalos escaparam dos estábulos perto de Thais — o aluguel está suspenso enquanto não voltarem.",
      },
      en: {
        headline: "Horses have escaped near Thais — rentals are on hold until enough are chased back.",
      },
      es: {
        headline: "Los caballos escaparon cerca de Thais — el alquiler está suspendido hasta que vuelvan.",
      },
      pl: {
        headline: "Konie uciekły w pobliżu Thais — wynajem jest wstrzymany, dopóki nie wrócą.",
      },
    }),
    "normal": simple({
      pt: {
        headline: "Os serviços de cavalo perto de Thais e Venore estão funcionando normalmente.",
        body: "Com os cavalos no cercado, nenhum Wild Horse aparece para ser domado.",
      },
      en: {
        headline: "The horse services near Thais and Venore are working normally.",
        body: "With the horses penned, no Wild Horse spawns to be tamed.",
      },
      es: {
        headline: "Los servicios de caballos cerca de Thais y Venore funcionan con normalidad.",
        body: "Con los caballos en el corral, no aparece ningún Wild Horse para domar.",
      },
      pl: {
        headline: "Usługi końskie przy Thais i Venore działają normalnie.",
        body: "Przy koniach w zagrodzie żaden Wild Horse nie pojawia się do oswojenia.",
      },
    }),
  },

  overhunting: {
    "stable": simple({
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
    "dwindling": (stateId, language) => {
      const leaving = stateId === "leaving";
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
    "leaving": (stateId, language) => {
      const leaving = stateId === "leaving";
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
    "wolves": simple({
      pt: {
        headline: "Starving Wolves rondam a região de Ab'Dendriel.",
        body: "Não há White Deer na região enquanto os lobos estiverem lá.",
      },
      en: {
        headline: "Starving Wolves are roaming the Ab'Dendriel region.",
        body: "No White Deer are in the region while the wolves are there.",
      },
      es: {
        headline: "Los Starving Wolves rondan la región de Ab'Dendriel.",
        body: "No hay White Deer en la región mientras los lobos estén ahí.",
      },
      pl: {
        headline: "Starving Wolves krążą po okolicach Ab'Dendriel.",
        body: "Dopóki wilki tam są, w regionie nie ma White Deer.",
      },
    }),
  },

  "demon-war": {
    "stalemate": simple({
      pt: {
        headline: "A guerra entre os demônios está em impasse — nenhuma facção tem vantagem.",
        body: "Sem vantagem, nenhum Lord ou Prince nasce nas torres.",
      },
      en: {
        headline: "The demon war is in a stalemate — neither faction has the advantage.",
        body: "With no advantage, no Lords or Princes spawn in either tower.",
      },
      es: {
        headline: "La guerra entre demonios está estancada — ninguna facción tiene ventaja.",
        body: "Sin ventaja, no aparece ningún Lord ni Prince en las torres.",
      },
      pl: {
        headline: "Wojna demonów utknęła w martwym punkcie — żadna frakcja nie ma przewagi.",
        body: "Bez przewagi w wieżach nie pojawiają się żadni Lordowie ani Princes.",
      },
    }),
    "shaburak-advantage": (stateId, language) => {
      const shaburak = stateId.startsWith("shaburak-");
      const winner = shaburak ? "Shaburak" : "Askarak";
      const loser = shaburak ? "Askarak" : "Shaburak";
      const tower = shaburak ? { pt: "oeste", en: "western", es: "oeste", pl: "zachodniej" } : { pt: "leste", en: "eastern", es: "este", pl: "wschodniej" };
      return pick(
        {
          pt: {
            headline: `Os ${winner} estão em vantagem sobre os ${loser}.`,
            body: `${winner} Lords nascem nos andares superiores da torre ${tower.pt}; os Princes ainda não.`,
          },
          en: {
            headline: `The ${winner} have the advantage over the ${loser}.`,
            body: `${winner} Lords spawn on the upper floors of the ${tower.en} tower; the Princes do not yet.`,
          },
          es: {
            headline: `Los ${winner} tienen ventaja sobre los ${loser}.`,
            body: `Los ${winner} Lords aparecen en los pisos superiores de la torre ${tower.es}; los Princes todavía no.`,
          },
          pl: {
            headline: `${winner} mają przewagę nad ${loser}.`,
            body: `${winner} Lordowie pojawiają się na górnych piętrach ${tower.pl} wieży; Princes jeszcze nie.`,
          },
        },
        language,
      );
    },
    "askarak-advantage": (stateId, language) => {
      const shaburak = stateId.startsWith("shaburak-");
      const winner = shaburak ? "Shaburak" : "Askarak";
      const loser = shaburak ? "Askarak" : "Shaburak";
      const tower = shaburak ? { pt: "oeste", en: "western", es: "oeste", pl: "zachodniej" } : { pt: "leste", en: "eastern", es: "este", pl: "wschodniej" };
      return pick(
        {
          pt: {
            headline: `Os ${winner} estão em vantagem sobre os ${loser}.`,
            body: `${winner} Lords nascem nos andares superiores da torre ${tower.pt}; os Princes ainda não.`,
          },
          en: {
            headline: `The ${winner} have the advantage over the ${loser}.`,
            body: `${winner} Lords spawn on the upper floors of the ${tower.en} tower; the Princes do not yet.`,
          },
          es: {
            headline: `Los ${winner} tienen ventaja sobre los ${loser}.`,
            body: `Los ${winner} Lords aparecen en los pisos superiores de la torre ${tower.es}; los Princes todavía no.`,
          },
          pl: {
            headline: `${winner} mają przewagę nad ${loser}.`,
            body: `${winner} Lordowie pojawiają się na górnych piętrach ${tower.pl} wieży; Princes jeszcze nie.`,
          },
        },
        language,
      );
    },
    "shaburak-dominant": (stateId, language) => {
      const shaburak = stateId.startsWith("shaburak-");
      const winner = shaburak ? "Shaburak" : "Askarak";
      const tower = shaburak ? { pt: "oeste", en: "western", es: "oeste", pl: "zachodniej" } : { pt: "leste", en: "eastern", es: "este", pl: "wschodniej" };
      return pick(
        {
          pt: {
            headline: `Os ${winner} convocaram seus líderes e dominam o complexo.`,
            body: `${winner} Lords e Princes nascem nos andares superiores da torre ${tower.pt}.`,
          },
          en: {
            headline: `The ${winner} have summoned their leaders and dominate the complex.`,
            body: `${winner} Lords and Princes spawn on the upper floors of the ${tower.en} tower.`,
          },
          es: {
            headline: `Los ${winner} invocaron a sus líderes y dominan el complejo.`,
            body: `Los ${winner} Lords y Princes aparecen en los pisos superiores de la torre ${tower.es}.`,
          },
          pl: {
            headline: `${winner} przywołali swoich przywódców i dominują w kompleksie.`,
            body: `${winner} Lordowie i Princes pojawiają się na górnych piętrach ${tower.pl} wieży.`,
          },
        },
        language,
      );
    },
    "askarak-dominant": (stateId, language) => {
      const shaburak = stateId.startsWith("shaburak-");
      const winner = shaburak ? "Shaburak" : "Askarak";
      const tower = shaburak ? { pt: "oeste", en: "western", es: "oeste", pl: "zachodniej" } : { pt: "leste", en: "eastern", es: "este", pl: "wschodniej" };
      return pick(
        {
          pt: {
            headline: `Os ${winner} convocaram seus líderes e dominam o complexo.`,
            body: `${winner} Lords e Princes nascem nos andares superiores da torre ${tower.pt}.`,
          },
          en: {
            headline: `The ${winner} have summoned their leaders and dominate the complex.`,
            body: `${winner} Lords and Princes spawn on the upper floors of the ${tower.en} tower.`,
          },
          es: {
            headline: `Los ${winner} invocaron a sus líderes y dominan el complejo.`,
            body: `Los ${winner} Lords y Princes aparecen en los pisos superiores de la torre ${tower.es}.`,
          },
          pl: {
            headline: `${winner} przywołali swoich przywódców i dominują w kompleksie.`,
            body: `${winner} Lordowie i Princes pojawiają się na górnych piętrach ${tower.pl} wieży.`,
          },
        },
        language,
      );
    },
  },

  "sea-serpent": {
    "asleep": simple({
      pt: { headline: "A Fire-Feathered Serpent está profundamente adormecida." },
      en: { headline: "The Fire-Feathered Serpent is fast asleep." },
      es: { headline: "La Fire-Feathered Serpent está profundamente dormida." },
      pl: { headline: "Fire-Feathered Serpent jest pogrążony w głębokim śnie." },
    }),
    "dreaming": simple({
      pt: { headline: "A Serpent sonha e a terra sangra lava." },
      en: { headline: "The Serpent dreams and the earth bleeds lava." },
      es: { headline: "La Serpent sueña y la tierra sangra lava." },
      pl: { headline: "Serpent śni, a ziemia krwawi lawą." },
    }),
    "awake": simple({
      pt: {
        headline: "A Serpent está desperta.",
      },
      en: {
        headline: "The Serpent is awake.",
      },
      es: {
        headline: "La Serpent está despierta.",
      },
      pl: {
        headline: "Serpent się obudził.",
      },
    }),
  },

  deeplings: {
    "hiding": simple({
      pt: { headline: "As criaturas do fundo do mar estão escondidas nas águas negras, longe da superfície." },
      en: { headline: "The creatures of the deep are hiding in the black waters below." },
      es: { headline: "Las criaturas de las profundidades se esconden en las aguas negras del fondo." },
      pl: { headline: "Stworzenia z głębin ukrywają się w czarnych wodach poniżej." },
    }),
    "floodgates-open": simple({
      pt: {
        headline: "God-king Qjell parece satisfeito — as comportas para a Drowned Library foram abertas.",
      },
      en: { headline: "God-king Qjell seems pleased — the floodgates to the Drowned Library have opened." },
      es: { headline: "El God-king Qjell parece complacido — se abrieron las compuertas hacia la Drowned Library." },
      pl: { headline: "God-king Qjell wydaje się zadowolony — bramy do Drowned Library zostały otwarte." },
    }),
    "arcanum-breached": simple({
      pt: {
        headline: "O Inner Arcanum das profundezas foi rompido.",
      },
      en: {
        headline: "The inner arcanum of the deep has been breached.",
      },
      es: {
        headline: "El Inner Arcanum de las profundidades ha sido violado.",
      },
      pl: {
        headline: "Inner Arcanum głębin zostało przełamane.",
      },
    }),
  },

  "hive-born": {
    "defended": simple({
      pt: { headline: "A Hive está bem defendida e preparada para a guerra." },
      en: { headline: "The hive is well defended and prepared for war." },
      es: { headline: "La Hive está bien defendida y preparada para la guerra." },
      pl: { headline: "Hive jest dobrze broniona i przygotowana do wojny." },
    }),
    "breached": simple({
      pt: {
        headline: "As defesas da Hive foram rompidas — a estrutura a leste está aberta.",
      },
      en: { headline: "The hive's defences are breached — the structure to the east is open." },
      es: { headline: "Las defensas de la Hive fueron rotas — la estructura al este está abierta." },
      pl: { headline: "Obrona Hive została przełamana — struktura na wschodzie jest otwarta." },
    }),
    "fallen": simple({
      pt: {
        headline: "As defesas da Hive caíram e todas as estruturas estão abertas.",
        body: "Os exércitos estão em polvorosa; leste e oeste da Hive interna podem ser percorridos.",
      },
      en: {
        headline: "The hive's defences have fallen and every structure is open.",
        body: "The armies are in disarray; both the eastern and western inner Hive can be walked.",
      },
      es: {
        headline: "Las defensas de la Hive cayeron y todas las estructuras están abiertas.",
        body: "Los ejércitos están en desorden; el este y el oeste de la Hive interna pueden recorrerse.",
      },
      pl: {
        headline: "Obrona Hive upadła i wszystkie struktury są otwarte.",
        body: "Armie są w rozsypce; wschodnią i zachodnią część wewnętrznego Hive da się przejść.",
      },
    }),
  },
};

/**
 * Returns the narrative for a World Change's confirmed state, or null when that pair has no
 * authored text yet (the caller then falls back to the state's plain label). `stateId` is
 * always a documented state — a World Change with no Guide reply recorded is simply not
 * passed here at all.
 */
export function getWorldChangeNarrative(
  changeId: string,
  stateId: string,
  language: BriefingLanguage,
): WorldChangeNarrative | null {
  const resolver = NARRATIVES[changeId]?.[stateId];
  return resolver ? resolver(stateId, language) : null;
}
