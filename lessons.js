// École — curriculum + lesson engine.
// Public surface used by app.js:
//   window.SCHOOL.start(), .stop(), .isActive(), .onNoteOn(midi)
//   window.SCHOOL_MODULES (data, exposed for inspection)

(function () {
  const NOTE_FR = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
  const FINGER_COLORS = ['#d4a049', '#e8b760', '#f1e6d0', '#7cb6c4', '#5c98a7'];

  function frName(midi) {
    const pc = ((midi % 12) + 12) % 12;
    const oct = Math.floor(midi / 12) - 1;
    return NOTE_FR[pc] + oct;
  }
  function frPc(midi) {
    const pc = ((midi % 12) + 12) % 12;
    return NOTE_FR[pc];
  }

  // ------------------------------------------------------------
  // Curriculum
  // ------------------------------------------------------------

  const MODULES = [
    {
      id: 'm1',
      title: 'Le clavier',
      eyebrow: 'Module I · Découverte',
      blurb: 'Avant de jouer, on apprend à se repérer.',
      lessons: [
        {
          id: 'm1-l1',
          title: 'Le Do central',
          summary: 'Trouver le point de repère du clavier.',
          steps: [
            {
              type: 'intro',
              title: 'Tout part d\'une note',
              text: 'Le piano semble immense, mais tout l\'apprentissage commence par <strong>une seule note</strong> : le Do central. C\'est ton point d\'ancrage. Une fois que tu sais où il est, tu peux retrouver toutes les autres.',
            },
            {
              type: 'highlight',
              title: 'Repère visuel',
              text: 'Regarde les touches noires. Elles vont par <strong>groupes de deux</strong> et <strong>groupes de trois</strong>. Le <em>Do</em> est toujours <strong>juste à gauche d\'un groupe de deux noires</strong>.',
              highlights: [{ midi: 60, color: 'gold', label: 'Do' }],
            },
            {
              type: 'listen',
              title: 'Écoute le Do',
              text: 'Voici son timbre. Tu peux le rejouer autant de fois que tu veux.',
              sequence: [{ midi: 60, dur: 0.8 }],
              highlights: [{ midi: 60, color: 'gold', label: 'Do' }],
            },
            {
              type: 'practice-key',
              title: 'À toi',
              text: 'Appuie sur le <strong>Do central</strong> (touche surlignée). Sur ton clavier MIDI ou en cliquant directement à l\'écran.',
              midi: 60,
            },
            {
              type: 'quiz',
              title: 'Petite vérification',
              question: 'Le Do se trouve juste à gauche d\'un groupe de combien de touches noires ?',
              options: ['1', '2', '3', 'Aucune'],
              correct: 1,
              explain: 'Bravo. Deux noires = Do (à gauche). Trois noires = Fa (à gauche).',
            },
          ],
        },
        {
          id: 'm1-l2',
          title: 'Les sept notes',
          summary: 'La gamme de Do : Do Ré Mi Fa Sol La Si.',
          steps: [
            {
              type: 'intro',
              title: 'Sept lettres, sept couleurs',
              text: 'En français on les nomme : <strong>Do, Ré, Mi, Fa, Sol, La, Si</strong>. Toutes sur les <strong>touches blanches</strong>. Après le Si, ça recommence à Do — c\'est la base de tout.',
            },
            {
              type: 'highlight',
              title: 'Une à une',
              text: 'Voici les sept notes à partir du Do central, dans l\'ordre.',
              highlights: [
                { midi: 60, color: 'gold', label: 'Do' },
                { midi: 62, color: 'gold', label: 'Ré' },
                { midi: 64, color: 'gold', label: 'Mi' },
                { midi: 65, color: 'gold', label: 'Fa' },
                { midi: 67, color: 'gold', label: 'Sol' },
                { midi: 69, color: 'gold', label: 'La' },
                { midi: 71, color: 'gold', label: 'Si' },
              ],
            },
            {
              type: 'listen',
              title: 'La gamme de Do',
              text: 'Écoute la gamme ascendante. C\'est le son le plus familier de la musique occidentale.',
              sequence: [
                { midi: 60, dur: 0.4 }, { midi: 62, dur: 0.4 }, { midi: 64, dur: 0.4 },
                { midi: 65, dur: 0.4 }, { midi: 67, dur: 0.4 }, { midi: 69, dur: 0.4 },
                { midi: 71, dur: 0.4 }, { midi: 72, dur: 0.7 },
              ],
              highlights: [
                { midi: 60, color: 'gold' }, { midi: 62, color: 'gold' }, { midi: 64, color: 'gold' },
                { midi: 65, color: 'gold' }, { midi: 67, color: 'gold' }, { midi: 69, color: 'gold' },
                { midi: 71, color: 'gold' }, { midi: 72, color: 'gold' },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'À toi de monter',
              text: 'Joue les sept notes dans l\'ordre. Chaque touche correcte t\'amène à la suivante.',
              sequence: [60, 62, 64, 65, 67, 69, 71, 72],
            },
            {
              type: 'quiz',
              title: 'La cinquième',
              question: 'Quelle est la <strong>5e</strong> note de la gamme de Do ?',
              options: ['Mi', 'Fa', 'Sol', 'La'],
              correct: 2,
              explain: 'Sol. C\'est la "dominante" — une note très importante en musique.',
            },
          ],
        },
        {
          id: 'm1-l3',
          title: 'Les touches noires',
          summary: 'Dièses et bémols, groupes de 2 et de 3.',
          steps: [
            {
              type: 'intro',
              title: 'Pourquoi groupées ?',
              text: 'Les touches noires sont disposées en <strong>groupes de 2</strong> et <strong>groupes de 3</strong> qui alternent. Ce n\'est pas décoratif : ce motif te permet de te repérer <em>sans regarder</em>.',
            },
            {
              type: 'highlight',
              title: 'Groupe de deux',
              text: 'Voici un groupe de deux touches noires, juste au-dessus du Do et du Ré.',
              highlights: [
                { midi: 61, color: 'petrol', label: 'Do#' },
                { midi: 63, color: 'petrol', label: 'Ré#' },
              ],
            },
            {
              type: 'highlight',
              title: 'Groupe de trois',
              text: 'Et le groupe de trois, au-dessus de Fa, Sol et La.',
              highlights: [
                { midi: 66, color: 'petrol', label: 'Fa#' },
                { midi: 68, color: 'petrol', label: 'Sol#' },
                { midi: 70, color: 'petrol', label: 'La#' },
              ],
            },
            {
              type: 'intro',
              title: 'Dièse et bémol',
              text: 'Une touche noire a <strong>deux noms</strong>. La noire entre Do et Ré s\'appelle <em>Do dièse</em> (Do#) ou <em>Ré bémol</em> (Réb) — c\'est la même touche. <strong>Dièse</strong> = un demi-ton plus haut. <strong>Bémol</strong> = un demi-ton plus bas.',
            },
            {
              type: 'quiz',
              title: 'Entre Mi et Fa',
              question: 'Combien de touches noires entre <strong>Mi</strong> et <strong>Fa</strong> ?',
              options: ['Zéro', 'Une', 'Deux'],
              correct: 0,
              explain: 'Aucune ! Mi et Fa sont collés, comme Si et Do. C\'est ce qui crée les groupes 2/3.',
            },
          ],
        },
        {
          id: 'm1-l4',
          title: 'Les octaves',
          summary: 'Le motif se répète tout au long du clavier.',
          steps: [
            {
              type: 'intro',
              title: 'Une octave, c\'est quoi ?',
              text: 'Le pattern Do-Ré-Mi-Fa-Sol-La-Si se répète à l\'infini. <strong>D\'un Do au Do suivant = une octave</strong>. Toutes les "mêmes notes" sonnent pareil mais plus aigu ou plus grave.',
            },
            {
              type: 'highlight',
              title: 'Deux Do, une octave',
              text: 'Voici le Do central et le Do situé une octave plus haut.',
              highlights: [
                { midi: 60, color: 'gold', label: 'Do' },
                { midi: 72, color: 'gold', label: 'Do' },
              ],
            },
            {
              type: 'listen',
              title: 'Le même son, plus aigu',
              text: 'Écoute : c\'est la "même" note, mais une octave au-dessus.',
              sequence: [{ midi: 60, dur: 0.6 }, { midi: 72, dur: 0.8 }],
              highlights: [{ midi: 60, color: 'gold' }, { midi: 72, color: 'gold' }],
            },
            {
              type: 'practice-sequence',
              title: 'Joue les deux Do',
              text: 'Le grave d\'abord, l\'aigu ensuite.',
              sequence: [60, 72],
            },
          ],
        },
      ],
    },

    {
      id: 'm2',
      title: 'Doigté main droite',
      eyebrow: 'Module II · Geste',
      blurb: 'Cinq doigts, cinq notes. La position de base.',
      lessons: [
        {
          id: 'm2-l1',
          title: 'Numérotation des doigts',
          summary: 'En piano, chaque doigt a un numéro.',
          steps: [
            {
              type: 'intro',
              title: 'Le système universel',
              text: 'En piano, on numérote les doigts <strong>de 1 à 5</strong>, à partir du <strong>pouce</strong>, sur les deux mains. Cette numérotation t\'accompagnera toute ta vie de pianiste.',
            },
            {
              type: 'fingers',
              title: 'Les cinq doigts',
              text: '<strong>1</strong> = pouce · <strong>2</strong> = index · <strong>3</strong> = majeur · <strong>4</strong> = annulaire · <strong>5</strong> = auriculaire',
            },
            {
              type: 'quiz',
              title: 'Vérification',
              question: 'Le doigt <strong>numéro 3</strong>, c\'est lequel ?',
              options: ['Pouce', 'Index', 'Majeur', 'Auriculaire'],
              correct: 2,
              explain: 'Le majeur — celui du milieu.',
            },
            {
              type: 'quiz',
              title: 'Encore une',
              question: 'Le pouce porte le numéro…',
              options: ['1', '5', 'Ça dépend de la main'],
              correct: 0,
              explain: 'Toujours 1, peu importe la main.',
            },
          ],
        },
        {
          id: 'm2-l2',
          title: 'Position de cinq doigts',
          summary: 'Pouce sur Do, auriculaire sur Sol.',
          steps: [
            {
              type: 'intro',
              title: 'La position de référence',
              text: 'Pose ton <strong>pouce droit</strong> sur le <strong>Do central</strong>. Tes cinq doigts couvrent naturellement les cinq notes <strong>Do Ré Mi Fa Sol</strong>. C\'est la position la plus simple — et de loin la plus utilisée pour débuter.',
            },
            {
              type: 'highlight',
              title: 'Une touche par doigt',
              text: 'Chaque doigt a sa note. Les chiffres sur les touches indiquent <strong>quel doigt jouer</strong>.',
              highlights: [
                { midi: 60, color: 'finger', label: '1' },
                { midi: 62, color: 'finger', label: '2' },
                { midi: 64, color: 'finger', label: '3' },
                { midi: 65, color: 'finger', label: '4' },
                { midi: 67, color: 'finger', label: '5' },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'Doigt 1, 2, 3, 4, 5',
              text: 'Joue Do (pouce), Ré (index), Mi (majeur), Fa (annulaire), Sol (auriculaire). Doucement, en regardant tes doigts.',
              sequence: [60, 62, 64, 65, 67],
              fingers: [1, 2, 3, 4, 5],
            },
          ],
        },
        {
          id: 'm2-l3',
          title: 'Monter, descendre',
          summary: 'Aller-retour Do→Sol→Do.',
          steps: [
            {
              type: 'intro',
              title: 'Le premier exercice classique',
              text: 'Tous les pianistes commencent par ça : monter de Do à Sol, redescendre. <strong>Doucement</strong>. Le but n\'est pas la vitesse — c\'est <em>la régularité</em>.',
            },
            {
              type: 'listen',
              title: 'Démo',
              text: 'Écoute le tempo. Note comme chaque touche dure exactement la même durée.',
              sequence: [
                { midi: 60, dur: 0.45 }, { midi: 62, dur: 0.45 }, { midi: 64, dur: 0.45 },
                { midi: 65, dur: 0.45 }, { midi: 67, dur: 0.6 },
                { midi: 65, dur: 0.45 }, { midi: 64, dur: 0.45 }, { midi: 62, dur: 0.45 },
                { midi: 60, dur: 0.7 },
              ],
              highlights: [
                { midi: 60, color: 'finger' }, { midi: 62, color: 'finger' }, { midi: 64, color: 'finger' },
                { midi: 65, color: 'finger' }, { midi: 67, color: 'finger' },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'À toi : aller-retour',
              text: 'Do Ré Mi Fa Sol — Fa Mi Ré Do. Sans précipitation.',
              sequence: [60, 62, 64, 65, 67, 65, 64, 62, 60],
              fingers: [1, 2, 3, 4, 5, 4, 3, 2, 1],
            },
          ],
        },
      ],
    },

    {
      id: 'm3',
      title: 'Premier morceau',
      eyebrow: 'Module III · Mélodie',
      blurb: '« Au clair de la lune » — main droite.',
      lessons: [
        {
          id: 'm3-l1',
          title: 'La phrase de départ',
          summary: '« Au clair de la lu-ne, mon a-mi Pier-rot »',
          steps: [
            {
              type: 'intro',
              title: 'Un classique pour commencer',
              text: 'Cette mélodie tient <strong>uniquement sur tes 5 doigts</strong>, en position de Do. C\'est parfait pour ton premier vrai morceau.',
            },
            {
              type: 'listen',
              title: 'Écoute la phrase',
              text: '« Au clair de la lune, mon ami Pierrot. »',
              sequence: [
                { midi: 60, dur: 0.4 }, { midi: 60, dur: 0.4 }, { midi: 60, dur: 0.4 },
                { midi: 62, dur: 0.4 }, { midi: 64, dur: 0.8 }, { midi: 62, dur: 0.8 },
                { midi: 60, dur: 0.4 }, { midi: 64, dur: 0.4 }, { midi: 62, dur: 0.4 },
                { midi: 62, dur: 0.4 }, { midi: 60, dur: 1.2 },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'À toi',
              text: 'Joue la phrase. Doigts <strong>1-1-1-2-3-2-1-3-2-2-1</strong>.',
              sequence: [60, 60, 60, 62, 64, 62, 60, 64, 62, 62, 60],
              fingers: [1, 1, 1, 2, 3, 2, 1, 3, 2, 2, 1],
            },
          ],
        },
        {
          id: 'm3-l2',
          title: 'La phrase complète',
          summary: 'Tout le couplet.',
          steps: [
            {
              type: 'intro',
              title: 'On enchaîne',
              text: 'Tu connais la première phrase. On ajoute la suite : <em>« Prête-moi ta plume, pour écrire un mot »</em>.',
            },
            {
              type: 'listen',
              title: 'Phrase suivante',
              text: 'Écoute attentivement.',
              sequence: [
                { midi: 60, dur: 0.4 }, { midi: 60, dur: 0.4 }, { midi: 60, dur: 0.4 },
                { midi: 62, dur: 0.4 }, { midi: 64, dur: 0.8 }, { midi: 62, dur: 0.8 },
                { midi: 60, dur: 0.4 }, { midi: 64, dur: 0.4 }, { midi: 62, dur: 0.4 },
                { midi: 62, dur: 0.4 }, { midi: 60, dur: 0.8 },
                { midi: 62, dur: 0.4 }, { midi: 62, dur: 0.4 }, { midi: 62, dur: 0.4 },
                { midi: 62, dur: 0.4 }, { midi: 69, dur: 0.8 }, { midi: 69, dur: 0.8 },
                { midi: 62, dur: 0.4 }, { midi: 60, dur: 0.4 }, { midi: 71, dur: 0.4 },
                { midi: 69, dur: 0.4 }, { midi: 67, dur: 1.2 },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'Le couplet entier',
              text: 'Va à ton rythme. Tu peux relancer si tu te perds.',
              sequence: [
                60, 60, 60, 62, 64, 62, 60, 64, 62, 62, 60,
                62, 62, 62, 62, 69, 69, 62, 60, 71, 69, 67,
              ],
            },
          ],
        },
      ],
    },

    {
      id: 'm4',
      title: 'Main gauche',
      eyebrow: 'Module IV · L\'autre main',
      blurb: 'Symétrie : pouce gauche sur Sol grave, et on descend.',
      lessons: [
        {
          id: 'm4-l1',
          title: 'Position main gauche',
          summary: 'Pouce sur Sol2, auriculaire sur Do2.',
          steps: [
            {
              type: 'intro',
              title: 'Miroir',
              text: 'Pour la main gauche, on inverse : le <strong>pouce gauche</strong> se pose sur <strong>Sol</strong> (en bas du Do central), et l\'<strong>auriculaire</strong> est tout à gauche, sur le <strong>Do grave</strong>. Les doigts couvrent <em>Do-Ré-Mi-Fa-Sol</em>, mais cette fois c\'est l\'auriculaire qui prend le Do.',
            },
            {
              type: 'highlight',
              title: 'Cinq doigts, cinq touches',
              text: 'Chiffres = numéro de doigt main gauche.',
              highlights: [
                { midi: 48, color: 'petrol', label: '5' },
                { midi: 50, color: 'petrol', label: '4' },
                { midi: 52, color: 'petrol', label: '3' },
                { midi: 53, color: 'petrol', label: '2' },
                { midi: 55, color: 'petrol', label: '1' },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'Pouce → auriculaire',
              text: 'Joue Sol, Fa, Mi, Ré, Do — c\'est la descente naturelle main gauche depuis le pouce.',
              sequence: [55, 53, 52, 50, 48],
              fingers: [1, 2, 3, 4, 5],
            },
          ],
        },
      ],
    },

    {
      id: 'm-rythme',
      title: 'Rythme',
      eyebrow: 'Module · Pulsation',
      blurb: 'Sentir le temps. Compter. Jouer en place.',
      lessons: [
        {
          id: 'mr-l1',
          title: 'La pulsation',
          summary: 'Le clic régulier qui guide tout.',
          steps: [
            {
              type: 'intro',
              title: 'Le métronome, ton meilleur ami',
              text: 'En musique, tout repose sur une <strong>pulsation</strong> régulière — un battement qui ne s\'arrête pas. Le <em>métronome</em> matérialise cette pulsation. Il <strong>n\'accélère pas</strong>, ne ralentit pas. À toi de jouer en place dessus.',
            },
            {
              type: 'rhythm-listen',
              title: 'Écoute la pulsation',
              text: 'Quatre clics réguliers. Le <strong>premier</strong> est plus fort — c\'est le début de la mesure.',
              bpm: 80,
              meter: 4,
              demoBeats: 8,
            },
            {
              type: 'rhythm-tap',
              title: 'Tape avec le métronome',
              text: 'Appuie sur <strong>n\'importe quelle touche</strong> sur chaque clic. Vise les noires : <em>une frappe par battement</em>.',
              bpm: 70,
              meter: 4,
              pattern: [1, 1, 1, 1, 1, 1, 1, 1], // 8 noires
              tolerance: 0.25,
            },
          ],
        },
        {
          id: 'mr-l2',
          title: 'Noires et blanches',
          summary: 'Une note pour 1 temps, une pour 2.',
          steps: [
            {
              type: 'intro',
              title: 'Durées',
              text: 'Une <strong>noire</strong> dure <strong>un temps</strong> (un clic). Une <strong>blanche</strong> dure <strong>deux temps</strong> — pendant qu\'elle sonne, le métronome continue, et tu n\'attaques pas de nouvelle note.',
            },
            {
              type: 'rhythm-tap',
              title: 'Noire — Noire — Blanche',
              text: 'Trois battements : tape, tape, tape-et-tiens. (1 - 2 - 3-et-4 sans rejouer en 4)',
              bpm: 70,
              meter: 4,
              pattern: [1, 1, 2, 1, 1, 2], // noire noire blanche × 2
              tolerance: 0.28,
            },
            {
              type: 'quiz',
              title: 'Vérification',
              question: 'Une <strong>blanche</strong> dure combien de temps ?',
              options: ['Un demi-temps', 'Un temps', 'Deux temps', 'Quatre temps'],
              correct: 2,
              explain: 'Deux temps. La <em>ronde</em> en dure quatre, la <em>noire</em> un seul.',
            },
          ],
        },
        {
          id: 'mr-l3',
          title: 'Croches',
          summary: 'Deux notes par temps.',
          steps: [
            {
              type: 'intro',
              title: 'Plus rapide',
              text: 'Une <strong>croche</strong> dure <strong>un demi-temps</strong> — il en faut <em>deux</em> pour remplir un battement. On compte « <strong>un-et deux-et trois-et quatre-et</strong> ».',
            },
            {
              type: 'rhythm-tap',
              title: 'Quatre croches',
              text: 'Tape <strong>deux fois par clic</strong> du métronome. Mets une frappe sur le clic, et une exactement entre deux clics.',
              bpm: 64,
              meter: 4,
              pattern: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // 8 croches sur 4 temps
              tolerance: 0.18,
            },
            {
              type: 'quiz',
              title: 'Compte',
              question: 'Combien de croches dans une <strong>noire</strong> ?',
              options: ['1', '2', '4'],
              correct: 1,
              explain: 'Deux. Croche = demi-noire. Et une <em>double-croche</em> = quart de noire.',
            },
          ],
        },
        {
          id: 'mr-l4',
          title: 'Mélanger les durées',
          summary: 'Le rythme commence ici.',
          steps: [
            {
              type: 'rhythm-tap',
              title: 'Noire — deux croches — noire — blanche',
              text: 'Pattern classique : <strong>1, et-1, 1, 2-2</strong>. Sois précis sur les croches.',
              bpm: 70,
              meter: 4,
              pattern: [1, 0.5, 0.5, 1, 2],
              tolerance: 0.22,
            },
            {
              type: 'rhythm-tap',
              title: 'Pattern long',
              text: 'Quatre mesures de durées variées. Ne te précipite pas après les blanches — laisse-les sonner.',
              bpm: 70,
              meter: 4,
              pattern: [1, 1, 2, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 1, 2],
              tolerance: 0.22,
            },
          ],
        },
      ],
    },

    {
      id: 'm5',
      title: 'Premiers accords',
      eyebrow: 'Module V · Harmonie',
      blurb: 'Trois notes ensemble : la triade.',
      lessons: [
        {
          id: 'm5-l1',
          title: 'Do majeur',
          summary: 'Do + Mi + Sol joués en même temps.',
          steps: [
            {
              type: 'intro',
              title: 'Un accord, c\'est plusieurs notes',
              text: 'Quand tu joues <strong>plusieurs notes en même temps</strong>, c\'est un <em>accord</em>. L\'accord le plus fondamental est <strong>Do majeur</strong> : Do + Mi + Sol.',
            },
            {
              type: 'highlight',
              title: 'Les trois notes',
              text: 'Doigts 1, 3 et 5 main droite. Pouce sur Do, majeur sur Mi, auriculaire sur Sol.',
              highlights: [
                { midi: 60, color: 'gold', label: '1' },
                { midi: 64, color: 'gold', label: '3' },
                { midi: 67, color: 'gold', label: '5' },
              ],
            },
            {
              type: 'listen',
              title: 'L\'accord plein',
              text: 'Voici Do majeur — un son <em>stable, ouvert, joyeux</em>.',
              sequence: [{ midi: 60, dur: 1.5, chord: [60, 64, 67] }],
              highlights: [
                { midi: 60, color: 'gold' }, { midi: 64, color: 'gold' }, { midi: 67, color: 'gold' },
              ],
            },
            {
              type: 'practice-chord',
              title: 'À toi',
              text: 'Joue les trois notes <strong>en même temps</strong>. Pose les doigts ensemble.',
              chord: [60, 64, 67],
            },
          ],
        },
        {
          id: 'm5-l2',
          title: 'Do mineur',
          summary: 'On baisse Mi d\'un demi-ton.',
          steps: [
            {
              type: 'intro',
              title: 'Majeur vs mineur',
              text: 'L\'accord <strong>mineur</strong> a un son plus <em>triste, mélancolique</em>. La recette : on prend l\'accord majeur et on <strong>baisse la note du milieu d\'un demi-ton</strong>.',
            },
            {
              type: 'highlight',
              title: 'Do mineur',
              text: 'Au lieu de Mi, on joue <strong>Mi bémol</strong> (touche noire juste à gauche de Mi).',
              highlights: [
                { midi: 60, color: 'petrol', label: '1' },
                { midi: 63, color: 'petrol', label: '3' },
                { midi: 67, color: 'petrol', label: '5' },
              ],
            },
            {
              type: 'listen',
              title: 'Compare',
              text: 'Do majeur, puis Do mineur. Tu entends la couleur changer ?',
              sequence: [
                { midi: 60, dur: 1.2, chord: [60, 64, 67] },
                { midi: 60, dur: 1.5, chord: [60, 63, 67] },
              ],
            },
            {
              type: 'practice-chord',
              title: 'Joue Do mineur',
              text: 'Do, Mi bémol, Sol — ensemble.',
              chord: [60, 63, 67],
            },
            {
              type: 'quiz',
              title: 'En résumé',
              question: 'Pour passer de majeur à mineur, on…',
              options: [
                'Baisse la note la plus grave d\'un demi-ton',
                'Baisse la note du milieu d\'un demi-ton',
                'Monte la note la plus aiguë',
              ],
              correct: 1,
              explain: 'Exact. La <em>tierce</em> (note du milieu) descend d\'un demi-ton.',
            },
          ],
        },
      ],
    },
  ];

  // ------------------------------------------------------------
  // State + persistence
  // ------------------------------------------------------------

  const STORAGE_KEY = 'etude-school-progress-v1';

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { completed: {}, lastLesson: null };
      const parsed = JSON.parse(raw);
      return {
        completed: parsed.completed || {},
        lastLesson: parsed.lastLesson || null,
      };
    } catch (_) {
      return { completed: {}, lastLesson: null };
    }
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress)); }
    catch (_) {}
  }

  const state = {
    active: false,
    progress: loadProgress(),
    lesson: null,
    stepIndex: 0,
    practice: null,
    listenTimer: null,
  };

  // ------------------------------------------------------------
  // Helpers — DOM lookups
  // ------------------------------------------------------------

  let els = null;
  function getEls() {
    if (els) return els;
    els = {
      modeToggle: document.getElementById('mode-toggle'),
      railTitle: document.getElementById('rail-left-title'),
      atelierPanel: document.getElementById('atelier-panel'),
      schoolPanel: document.getElementById('school-panel'),
      stagePlayfield: document.getElementById('stage-playfield'),
      stageLesson: document.getElementById('stage-lesson'),
      lessonBrowser: document.getElementById('lesson-browser'),
      lessonStepEyebrow: document.getElementById('lesson-step-eyebrow'),
      lessonStepTitle: document.getElementById('lesson-step-title'),
      lessonStepBody: document.getElementById('lesson-step-body'),
      lessonStepExtra: document.getElementById('lesson-step-extra'),
      lessonProgressBar: document.getElementById('lesson-progress-bar'),
      lessonProgressLabel: document.getElementById('lesson-progress-label'),
      lessonPrev: document.getElementById('lesson-prev'),
      lessonNext: document.getElementById('lesson-next'),
      lessonReplay: document.getElementById('lesson-replay'),
      lessonExit: document.getElementById('lesson-exit'),
      schoolHud: document.getElementById('school-hud'),
      stageHead: document.getElementById('stage-head'),
      pianoEl: document.getElementById('piano'),
    };
    return els;
  }

  // ------------------------------------------------------------
  // Module browser (rail)
  // ------------------------------------------------------------

  function renderBrowser() {
    const e = getEls();
    if (!e.lessonBrowser) return;
    e.lessonBrowser.innerHTML = '';

    for (const mod of MODULES) {
      const modEl = document.createElement('section');
      modEl.className = 'module';

      const head = document.createElement('header');
      head.className = 'module-head';
      head.innerHTML = `<span class="module-eyebrow">${mod.eyebrow}</span>
                        <h3>${mod.title}</h3>
                        <p>${mod.blurb}</p>`;
      modEl.appendChild(head);

      const list = document.createElement('ol');
      list.className = 'lesson-list';
      mod.lessons.forEach((les, idx) => {
        const li = document.createElement('li');
        li.className = 'lesson-item';
        const isDone = !!state.progress.completed[les.id];
        const isCurrent = state.lesson && state.lesson.id === les.id;
        if (isDone) li.classList.add('is-done');
        if (isCurrent) li.classList.add('is-current');

        const num = document.createElement('span');
        num.className = 'lesson-num';
        num.textContent = String(idx + 1).padStart(2, '0');

        const body = document.createElement('div');
        body.className = 'lesson-meta';
        body.innerHTML = `<strong>${les.title}</strong><span>${les.summary}</span>`;

        const mark = document.createElement('span');
        mark.className = 'lesson-mark';
        mark.textContent = isDone ? '✓' : (isCurrent ? '●' : '');

        li.appendChild(num);
        li.appendChild(body);
        li.appendChild(mark);
        li.addEventListener('click', () => openLesson(les.id));
        list.appendChild(li);
      });
      modEl.appendChild(list);
      e.lessonBrowser.appendChild(modEl);
    }
  }

  function findLesson(lessonId) {
    for (const mod of MODULES) {
      const les = mod.lessons.find((l) => l.id === lessonId);
      if (les) return { module: mod, lesson: les };
    }
    return null;
  }

  // ------------------------------------------------------------
  // Lesson runner
  // ------------------------------------------------------------

  function openLesson(lessonId) {
    const found = findLesson(lessonId);
    if (!found) return;
    cancelListen();
    state.lesson = { ...found.lesson, _module: found.module };
    state.stepIndex = 0;
    state.practice = null;
    state.progress.lastLesson = lessonId;
    saveProgress();
    showStage();
    renderStep();
    renderBrowser();
  }

  function showStage() {
    const e = getEls();
    if (e.stagePlayfield) e.stagePlayfield.classList.add('is-school');
    if (e.stageLesson) e.stageLesson.hidden = false;
    if (e.stageHead) e.stageHead.hidden = true;
  }

  function hideStage() {
    const e = getEls();
    if (e.stagePlayfield) e.stagePlayfield.classList.remove('is-school');
    if (e.stageLesson) e.stageLesson.hidden = true;
    if (e.stageHead) e.stageHead.hidden = false;
    clearKeyHints();
  }

  function renderStep() {
    const e = getEls();
    const les = state.lesson;
    if (!les) return;
    const step = les.steps[state.stepIndex];
    if (!step) return;

    cancelListen();
    clearKeyHints();
    clearStaff();
    state.practice = null;

    e.lessonStepEyebrow.textContent =
      `${les._module.eyebrow} · ${les.title}`;
    e.lessonStepTitle.textContent = step.title || les.title;
    e.lessonStepBody.innerHTML = step.text || step.question || '';

    const total = les.steps.length;
    const cur = state.stepIndex + 1;
    e.lessonProgressLabel.textContent = `Étape ${cur} sur ${total}`;
    e.lessonProgressBar.style.setProperty('--progress', `${(cur / total) * 100}%`);

    e.lessonStepExtra.innerHTML = '';
    e.lessonStepExtra.className = 'lesson-extra';
    e.lessonNext.hidden = false;
    e.lessonNext.disabled = false;
    e.lessonNext.textContent = (cur === total) ? 'Terminer la leçon' : 'Continuer';
    e.lessonReplay.hidden = true;

    e.lessonPrev.disabled = state.stepIndex === 0;

    switch (step.type) {
      case 'intro':
        // Only text. Nothing else.
        break;

      case 'highlight':
        applyHighlights(step.highlights || []);
        renderStaffFor((step.highlights || []).map((h) => h.midi));
        break;

      case 'listen':
        applyHighlights(step.highlights || []);
        e.lessonReplay.hidden = false;
        e.lessonReplay.textContent = '▶ Réécouter';
        playSequence(step.sequence || []);
        break;

      case 'practice-key':
        applyHighlights([{ midi: step.midi, color: 'gold' }]);
        startPracticeKey(step);
        e.lessonNext.disabled = true;
        e.lessonNext.textContent = 'En attente…';
        renderPracticeStatus(`Joue le <strong>${frName(step.midi)}</strong>.`);
        renderStaffFor([step.midi]);
        break;

      case 'practice-sequence':
        startPracticeSequence(step);
        e.lessonNext.disabled = true;
        e.lessonNext.textContent = 'En attente…';
        e.lessonReplay.hidden = false;
        e.lessonReplay.textContent = '▶ Démo';
        break;

      case 'practice-chord':
        applyHighlights((step.chord || []).map((m) => ({ midi: m, color: 'gold' })));
        startPracticeChord(step);
        e.lessonNext.disabled = true;
        e.lessonNext.textContent = 'En attente…';
        renderPracticeStatus(`Joue les <strong>${step.chord.length}</strong> notes en même temps.`);
        break;

      case 'fingers':
        renderFingerDiagram();
        break;

      case 'quiz':
        renderQuiz(step);
        e.lessonNext.disabled = true;
        e.lessonNext.textContent = 'Choisis une réponse';
        break;

      case 'rhythm-listen':
        renderRhythmListen(step);
        break;

      case 'rhythm-tap':
        renderRhythmTap(step);
        e.lessonNext.disabled = true;
        e.lessonNext.textContent = 'En attente…';
        break;
    }
  }

  function nextStep() {
    const les = state.lesson;
    if (!les) return;
    if (state.stepIndex < les.steps.length - 1) {
      state.stepIndex++;
      renderStep();
    } else {
      // Lesson complete.
      const wasNew = !state.progress.completed[les.id];
      state.progress.completed[les.id] = true;
      saveProgress();
      cancelListen();
      clearKeyHints();
      if (wasNew && window.JOURNAL) window.JOURNAL.recordLessonCompleted(les.id);
      if (window.MASCOT) {
        const xp = wasNew ? 50 : 15;
        window.MASCOT.celebrate('lesson', { xp });
      }
      if (wasNew && window.DAILY) window.DAILY.report('lesson-done');
      renderLessonComplete();
    }
  }

  function prevStep() {
    if (state.stepIndex > 0) {
      state.stepIndex--;
      renderStep();
    }
  }

  function renderLessonComplete() {
    const e = getEls();
    const les = state.lesson;
    e.lessonStepEyebrow.textContent = `${les._module.eyebrow} · Leçon terminée`;
    e.lessonStepTitle.textContent = 'Bien joué.';
    e.lessonStepBody.innerHTML = `Tu as bouclé <strong>${les.title}</strong>. Continue avec la leçon suivante, ou rejoue celle-ci pour la consolider.`;
    e.lessonProgressLabel.textContent = '✓ Acquis';
    e.lessonProgressBar.style.setProperty('--progress', '100%');
    e.lessonStepExtra.innerHTML = '';
    e.lessonReplay.hidden = false;
    e.lessonReplay.textContent = '↻ Refaire la leçon';
    e.lessonNext.hidden = false;
    e.lessonNext.disabled = false;
    e.lessonNext.textContent = 'Leçon suivante →';
    e.lessonPrev.disabled = false;

    state.practice = { kind: 'done' };
    renderBrowser();
  }

  function jumpToNextLesson() {
    const cur = state.lesson;
    if (!cur) return;
    let found = false;
    for (const mod of MODULES) {
      for (const les of mod.lessons) {
        if (found) { openLesson(les.id); return; }
        if (les.id === cur.id) found = true;
      }
    }
    // No next: back to browser.
    closeLesson();
  }

  function closeLesson() {
    state.lesson = null;
    state.stepIndex = 0;
    state.practice = null;
    cancelListen();
    clearKeyHints();
    hideStage();
    renderBrowser();
  }

  // ------------------------------------------------------------
  // Practice handlers
  // ------------------------------------------------------------

  function startPracticeKey(step) {
    state.practice = { kind: 'key', target: step.midi, done: false };
  }

  function startPracticeSequence(step) {
    state.practice = {
      kind: 'sequence',
      seq: step.sequence.slice(),
      fingers: step.fingers ? step.fingers.slice() : null,
      pos: 0,
    };
    refreshSequenceHighlight();
  }

  function startPracticeChord(step) {
    state.practice = {
      kind: 'chord',
      target: new Set(step.chord),
      held: new Set(),
      done: false,
    };
  }

  function refreshSequenceHighlight() {
    const p = state.practice;
    if (!p || p.kind !== 'sequence') return;
    if (p.pos >= p.seq.length) return;
    const m = p.seq[p.pos];
    const f = p.fingers ? p.fingers[p.pos] : null;
    clearKeyHints();
    applyHighlights([{ midi: m, color: f != null ? 'finger' : 'gold', label: f != null ? String(f) : null }]);
    renderPracticeStatus(
      `Note <strong>${p.pos + 1}</strong> / ${p.seq.length} — joue <strong>${frName(m)}</strong>${f != null ? ` (doigt ${f})` : ''}.`
    );
    // Show the current note + next 2 on the staff (lookahead).
    const lookahead = p.seq.slice(p.pos, p.pos + 3);
    renderStaffFor(lookahead);
  }

  function renderStaffFor(midis) {
    if (!window.STAFF || !midis || midis.length === 0) return;
    const e = getEls();
    if (!e.lessonStepBody) return;
    // Insert / replace staff above the body text.
    let staffEl = document.getElementById('lesson-staff');
    if (!staffEl) {
      staffEl = document.createElement('div');
      staffEl.id = 'lesson-staff';
      staffEl.className = 'lesson-staff';
      e.lessonStepBody.parentNode.insertBefore(staffEl, e.lessonStepBody);
    }
    staffEl.innerHTML = window.STAFF.renderMulti(midis, { width: 260, height: 90 });
  }

  function clearStaff() {
    const el = document.getElementById('lesson-staff');
    if (el) el.remove();
  }

  function renderPracticeStatus(html) {
    const e = getEls();
    e.lessonStepExtra.className = 'lesson-extra practice-status';
    e.lessonStepExtra.innerHTML = `<span class="practice-dot" aria-hidden="true"></span><span>${html}</span>`;
  }

  function flashSuccess(msg) {
    const e = getEls();
    e.lessonStepExtra.className = 'lesson-extra practice-status is-success';
    e.lessonStepExtra.innerHTML = `<span class="practice-dot" aria-hidden="true"></span><span>${msg}</span>`;
  }

  function describeMistake(played, expected) {
    const diff = played - expected;
    const playedName = frName(played);
    const expectedName = frName(expected);
    const abs = Math.abs(diff);
    if (diff === 0) return null;
    if (abs % 12 === 0) {
      const oct = abs / 12;
      const dir = diff > 0 ? 'plus haut' : 'plus bas';
      return `Tu as joué <strong>${playedName}</strong>${oct === 1 ? ' une octave' : ` ${oct} octaves`} ${dir} que la cible <strong>${expectedName}</strong>.`;
    }
    if (abs === 1) {
      const dir = diff > 0 ? 'trop haut' : 'trop bas';
      return `Tu as joué <strong>${playedName}</strong>, on attendait <strong>${expectedName}</strong> — un demi-ton ${dir}.`;
    }
    if (abs === 2) {
      const dir = diff > 0 ? 'trop haut' : 'trop bas';
      return `Tu as joué <strong>${playedName}</strong>, on attendait <strong>${expectedName}</strong> — un ton ${dir}.`;
    }
    const dir = diff > 0 ? 'trop haut' : 'trop bas';
    return `Tu as joué <strong>${playedName}</strong>, on attendait <strong>${expectedName}</strong> — ${abs} demi-tons ${dir}.`;
  }

  function renderMistakeHint(played, expected) {
    const msg = describeMistake(played, expected);
    if (!msg) return;
    const e = getEls();
    e.lessonStepExtra.className = 'lesson-extra practice-status is-mistake';
    e.lessonStepExtra.innerHTML = `<span class="practice-dot" aria-hidden="true"></span><span>${msg}</span>`;
    // Restore the in-progress status after a moment.
    setTimeout(() => {
      const p = state.practice;
      if (!p) return;
      if (p.kind === 'sequence') refreshSequenceHighlight();
      else if (p.kind === 'key') renderPracticeStatus(`Joue le <strong>${frName(p.target)}</strong>.`);
    }, 2200);
  }


  function handleNoteOn(midi) {
    if (!state.active || !state.lesson) return;
    const p = state.practice;
    if (!p) return;

    if (p.kind === 'rhythm-tap') {
      handleRhythmTap();
      return;
    }

    if (p.kind === 'key') {
      if (midi === p.target && !p.done) {
        p.done = true;
        flashKey(midi, 'success');
        flashSuccess('Bien joué.');
        if (window.MASCOT) window.MASCOT.cheer('note');
        if (window.DAILY) window.DAILY.report('note-hit');
        const e = getEls();
        e.lessonNext.disabled = false;
        e.lessonNext.textContent = (state.stepIndex === state.lesson.steps.length - 1) ? 'Terminer la leçon' : 'Continuer →';
        // Auto-advance after a beat.
        setTimeout(() => {
          if (state.practice === p) nextStep();
        }, 700);
      } else if (midi !== p.target && !p.done) {
        flashKey(midi, 'wrong');
        renderMistakeHint(midi, p.target);
        if (window.MASCOT) window.MASCOT.oops();
      }
      return;
    }

    if (p.kind === 'sequence') {
      const expected = p.seq[p.pos];
      if (midi === expected) {
        flashKey(midi, 'success');
        p.pos++;
        if (window.MASCOT) window.MASCOT.cheer('note');
        if (window.DAILY) window.DAILY.report('note-hit');
        if (p.pos >= p.seq.length) {
          flashSuccess('Excellent ! Séquence complète.');
          clearKeyHints();
          const e = getEls();
          e.lessonNext.disabled = false;
          e.lessonNext.textContent = (state.stepIndex === state.lesson.steps.length - 1) ? 'Terminer la leçon' : 'Continuer →';
        } else {
          refreshSequenceHighlight();
        }
      } else {
        flashKey(midi, 'wrong');
        renderMistakeHint(midi, expected);
        if (window.MASCOT) window.MASCOT.oops();
      }
      return;
    }

    if (p.kind === 'chord') {
      if (p.target.has(midi)) {
        p.held.add(midi);
        flashKey(midi, 'success');
        if (!p.done && p.held.size === p.target.size) {
          // Ensure all are held simultaneously: small delay check.
          // Since handleNoteOn fires per key, presses within a short window count.
          setTimeout(() => {
            if (p.done) return;
            // Count notes still held in the global `held` set if accessible.
            const heldNow = window.SCHOOL_HELD || p.held;
            const ok = [...p.target].every((m) => heldNow.has(m));
            if (ok || p.held.size === p.target.size) {
              p.done = true;
              flashSuccess('Accord plein, parfait.');
              if (window.MASCOT) window.MASCOT.celebrate('chord', { xp: 8 });
              if (window.DAILY) window.DAILY.report('chord-done');
              const e = getEls();
              e.lessonNext.disabled = false;
              e.lessonNext.textContent = (state.stepIndex === state.lesson.steps.length - 1) ? 'Terminer la leçon' : 'Continuer →';
              setTimeout(() => { if (state.practice === p) nextStep(); }, 900);
            }
          }, 150);
        }
      } else {
        flashKey(midi, 'wrong');
      }
      return;
    }
  }

  // Reset chord-held when user releases (so they can retry).
  function handleNoteOff(midi) {
    if (!state.active) return;
    const p = state.practice;
    if (!p) return;
    if (p.kind === 'chord' && !p.done) {
      p.held.delete(midi);
    }
  }

  // ------------------------------------------------------------
  // Key visual hints
  // ------------------------------------------------------------

  function applyHighlights(list) {
    clearKeyHints();
    for (const h of list) {
      const el = document.querySelector(`.key[data-midi="${h.midi}"]`);
      if (!el) continue;
      el.classList.add('hint');
      if (h.color === 'petrol') el.classList.add('hint-petrol');
      else if (h.color === 'finger') el.classList.add('hint-finger');
      else el.classList.add('hint-gold');
      if (h.label) {
        let badge = el.querySelector('.hint-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'hint-badge';
          el.appendChild(badge);
        }
        badge.textContent = h.label;
      }
    }
  }

  function clearKeyHints() {
    document.querySelectorAll('.key.hint').forEach((el) => {
      el.classList.remove('hint', 'hint-gold', 'hint-petrol', 'hint-finger', 'flash-success', 'flash-wrong');
      const b = el.querySelector('.hint-badge');
      if (b) b.remove();
    });
  }

  function flashKey(midi, kind) {
    const el = document.querySelector(`.key[data-midi="${midi}"]`);
    if (!el) return;
    const cls = kind === 'success' ? 'flash-success' : 'flash-wrong';
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 500);
  }

  // ------------------------------------------------------------
  // Listen player (uses window.triggerNote / releaseNote from app.js)
  // ------------------------------------------------------------

  function playSequence(seq) {
    cancelListen();
    if (!seq || seq.length === 0) return;
    if (typeof window.SCHOOL_PLAY !== 'function') return;
    state.listenTimer = window.SCHOOL_PLAY(seq);
  }

  function cancelListen() {
    if (state.listenTimer && typeof state.listenTimer.cancel === 'function') {
      state.listenTimer.cancel();
    }
    state.listenTimer = null;
    cancelRhythm();
  }

  function cancelRhythm() {
    if (state.practice && (state.practice.kind === 'rhythm-tap' || state.practice.kind === 'rhythm-listen')) {
      if (state.practice.listener && window.METRONOME) {
        window.METRONOME.offTick(state.practice.listener);
      }
    }
    if (window.METRONOME && window.METRONOME.isOn()) window.METRONOME.stop();
  }

  // ------------------------------------------------------------
  // Quiz + finger diagram
  // ------------------------------------------------------------

  function renderQuiz(step) {
    const e = getEls();
    e.lessonStepBody.innerHTML = step.question;
    e.lessonStepExtra.className = 'lesson-extra quiz';
    e.lessonStepExtra.innerHTML = '';
    let answered = false;
    step.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option';
      btn.innerHTML = opt;
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const correct = idx === step.correct;
        btn.classList.add(correct ? 'is-correct' : 'is-wrong');
        // Reveal correct option if wrong.
        if (!correct) {
          const all = e.lessonStepExtra.querySelectorAll('.quiz-option');
          all[step.correct]?.classList.add('is-correct');
        }
        const fb = document.createElement('p');
        fb.className = 'quiz-feedback';
        fb.innerHTML = (correct ? '<strong>Exact.</strong> ' : '<strong>Pas tout à fait.</strong> ') + (step.explain || '');
        e.lessonStepExtra.appendChild(fb);
        e.lessonNext.disabled = false;
        e.lessonNext.textContent = (state.stepIndex === state.lesson.steps.length - 1) ? 'Terminer la leçon' : 'Continuer →';
      });
      e.lessonStepExtra.appendChild(btn);
    });
  }

  // ------------------------------------------------------------
  // Rhythm steps
  // ------------------------------------------------------------

  function renderRhythmListen(step) {
    const e = getEls();
    e.lessonStepExtra.className = 'lesson-extra rhythm-listen';
    e.lessonStepExtra.innerHTML = `
      <div class="rhythm-bar">
        ${Array.from({ length: step.demoBeats || 8 }, (_, i) =>
          `<span class="beat-dot${i % (step.meter || 4) === 0 ? ' is-accent' : ''}"></span>`
        ).join('')}
      </div>
      <p class="rhythm-bpm">${step.bpm} battements / minute</p>
    `;
    e.lessonReplay.hidden = false;
    e.lessonReplay.textContent = '▶ Lancer le métronome';

    state.practice = { kind: 'rhythm-listen', step, listener: null };
    runRhythmDemo(step);
  }

  function runRhythmDemo(step) {
    if (!window.METRONOME) return;
    if (window.METRONOME.isOn()) window.METRONOME.stop();
    window.METRONOME.setBpm(step.bpm);

    let count = 0;
    const total = step.demoBeats || 8;
    const dots = document.querySelectorAll('#lesson-step-extra .beat-dot');
    const onTick = () => {
      const dot = dots[count];
      if (dot) {
        dot.classList.add('is-lit');
        setTimeout(() => dot && dot.classList.remove('is-lit'), 200);
      }
      count++;
      if (count >= total) {
        window.METRONOME.stop();
        window.METRONOME.offTick(onTick);
      }
    };
    window.METRONOME.onTick(onTick);
    if (state.practice) state.practice.listener = onTick;
    window.METRONOME.start(step.bpm, step.meter || 4);
  }

  function renderRhythmTap(step) {
    const e = getEls();
    e.lessonStepExtra.className = 'lesson-extra rhythm-tap';
    const blocks = step.pattern.map((d, i) =>
      `<div class="rhythm-block" data-i="${i}" style="flex-grow:${d}">
         <span class="rhythm-block-dur">${durLabel(d)}</span>
       </div>`
    ).join('');
    e.lessonStepExtra.innerHTML = `
      <div class="rhythm-track">${blocks}</div>
      <div class="rhythm-status" id="rhythm-status">
        <span class="rhythm-countdown">Décompte de 4 temps…</span>
      </div>
    `;
    e.lessonReplay.hidden = false;
    e.lessonReplay.textContent = '↻ Recommencer';

    startRhythmTap(step);
  }

  function durLabel(d) {
    if (d === 0.25) return '𝅘𝅥𝅮𝅮';
    if (d === 0.5) return '♪';
    if (d === 1) return '♩';
    if (d === 2) return '𝅗𝅥';
    if (d === 4) return '𝅝';
    return d + '×';
  }

  function startRhythmTap(step) {
    if (!window.METRONOME) return;
    if (window.METRONOME.isOn()) window.METRONOME.stop();
    window.METRONOME.setBpm(step.bpm);

    const beatMs = 60000 / step.bpm;
    const meter = step.meter || 4;

    // Build cumulative onset positions in beats.
    const onsets = [];
    let acc = 0;
    for (const d of step.pattern) { onsets.push(acc); acc += d; }

    const practice = {
      kind: 'rhythm-tap',
      step,
      onsets,
      pos: 0,
      hits: 0,
      misses: 0,
      tolerance: (step.tolerance || 0.25) * beatMs,
      countdownLeft: meter,
      t0: 0,
      listener: null,
      done: false,
    };
    state.practice = practice;

    const statusEl = document.getElementById('rhythm-status');
    const blockEls = document.querySelectorAll('#lesson-step-extra .rhythm-block');

    const onTick = ({ beat, audioTime }) => {
      if (state.practice !== practice) return;
      if (practice.countdownLeft > 0) {
        statusEl.textContent = String(practice.countdownLeft);
        practice.countdownLeft--;
        if (practice.countdownLeft === 0) {
          // Next tick will be t0.
          statusEl.innerHTML = '<span class="practice-dot"></span> Joue maintenant';
          // Capture t0 at the next downbeat after countdown finishes.
          // The next tick callback will set t0.
          practice._waitingT0 = true;
        }
        return;
      }
      if (practice._waitingT0) {
        practice.t0 = performance.now();
        practice._waitingT0 = false;
      }
      // After last expected onset + cooldown, finish.
      const expectedBeats = practice.onsets[practice.onsets.length - 1] + 1;
      const elapsedBeats = (performance.now() - practice.t0) / beatMs;
      if (elapsedBeats > expectedBeats + 0.5 && !practice.done) {
        finishRhythm(practice, blockEls, statusEl);
      }
    };

    window.METRONOME.onTick(onTick);
    practice.listener = onTick;
    window.METRONOME.start(step.bpm, meter);
  }

  function finishRhythm(practice, blockEls, statusEl) {
    practice.done = true;
    if (practice.listener) window.METRONOME.offTick(practice.listener);
    window.METRONOME.stop();

    // Mark any unhit blocks as missed.
    for (let i = practice.pos; i < practice.onsets.length; i++) {
      blockEls[i]?.classList.add('is-miss');
      practice.misses++;
    }

    const total = practice.onsets.length;
    const acc = total === 0 ? 0 : Math.round((practice.hits / total) * 100);
    const ok = acc >= 70;
    statusEl.innerHTML = `
      <span>${ok ? '✓' : '○'}</span>
      <span><strong>${practice.hits}/${total}</strong> en place — ${acc}% de précision</span>
    `;
    statusEl.classList.toggle('is-success', ok);

    if (ok && window.DAILY) window.DAILY.report('rhythm-pass');

    const e = getEls();
    e.lessonNext.disabled = !ok;
    if (ok) {
      e.lessonNext.textContent = (state.stepIndex === state.lesson.steps.length - 1)
        ? 'Terminer la leçon' : 'Continuer →';
    } else {
      e.lessonNext.textContent = 'Recommence (vise 70%+)';
    }
  }

  function handleRhythmTap() {
    const p = state.practice;
    if (!p || p.kind !== 'rhythm-tap' || p.done) return;
    if (!p.t0) return; // countdown not finished
    if (p.pos >= p.onsets.length) return;

    const beatMs = 60000 / p.step.bpm;
    const now = performance.now();
    const expected = p.t0 + p.onsets[p.pos] * beatMs;
    const delta = now - expected;
    const blockEls = document.querySelectorAll('#lesson-step-extra .rhythm-block');
    const block = blockEls[p.pos];

    if (Math.abs(delta) <= p.tolerance) {
      p.hits++;
      block?.classList.add('is-hit');
      if (window.MASCOT) window.MASCOT.cheer('rhythm');
    } else {
      p.misses++;
      block?.classList.add(delta < 0 ? 'is-early' : 'is-late');
      if (window.MASCOT) window.MASCOT.oops();
    }
    p.pos++;
  }

  function renderFingerDiagram() {
    const e = getEls();
    e.lessonStepExtra.className = 'lesson-extra fingers-diagram';
    e.lessonStepExtra.innerHTML = `
      <div class="hand-row">
        ${[1,2,3,4,5].map((n, i) => `
          <div class="finger" style="--c:${FINGER_COLORS[i]}">
            <span class="finger-num">${n}</span>
            <span class="finger-name">${['Pouce','Index','Majeur','Annulaire','Auriculaire'][i]}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ------------------------------------------------------------
  // Mode toggle
  // ------------------------------------------------------------

  function setMode(mode) {
    const e = getEls();
    state.active = (mode === 'school');
    document.body.dataset.mode = mode;
    if (e.modeToggle) {
      e.modeToggle.classList.toggle('is-on', mode === 'school');
      e.modeToggle.setAttribute('aria-pressed', String(mode === 'school'));
    }
    if (e.railTitle) {
      e.railTitle.textContent = (mode === 'school') ? 'École' : 'Atelier';
    }
    if (e.atelierPanel) e.atelierPanel.hidden = (mode !== 'atelier');
    if (e.schoolPanel) e.schoolPanel.hidden = (mode !== 'school');
    if (mode === 'school') {
      renderBrowser();
      // If user had a lesson in progress, reopen it.
      if (state.progress.lastLesson) {
        const found = findLesson(state.progress.lastLesson);
        if (found && !state.progress.completed[state.progress.lastLesson]) {
          openLesson(state.progress.lastLesson);
          return;
        }
      }
      hideStage();
    } else {
      cancelListen();
      clearKeyHints();
      hideStage();
    }
  }

  // ------------------------------------------------------------
  // Wiring
  // ------------------------------------------------------------

  function attach() {
    const e = getEls();

    if (e.modeToggle) {
      e.modeToggle.addEventListener('click', () => {
        const next = state.active ? 'atelier' : 'school';
        setMode(next);
      });
    }
    if (e.lessonNext) {
      e.lessonNext.addEventListener('click', () => {
        if (state.practice && state.practice.kind === 'done') {
          jumpToNextLesson();
        } else {
          nextStep();
        }
      });
    }
    if (e.lessonPrev) e.lessonPrev.addEventListener('click', prevStep);
    if (e.lessonReplay) {
      e.lessonReplay.addEventListener('click', () => {
        if (!state.lesson) return;
        const step = state.lesson.steps[state.stepIndex];
        if (state.practice && state.practice.kind === 'done') {
          // Refaire la leçon
          state.stepIndex = 0;
          state.progress.completed[state.lesson.id] = false;
          saveProgress();
          renderStep();
          renderBrowser();
          return;
        }
        if (step && step.type === 'rhythm-tap') {
          renderStep();
          return;
        }
        if (step && step.type === 'rhythm-listen') {
          renderStep();
          return;
        }
        if (step && step.sequence) playSequence(step.sequence);
        else if (step && step.type === 'practice-sequence') {
          // Demo from sequence.
          playSequence(step.sequence.map((m) => ({ midi: m, dur: 0.4 })));
        }
      });
    }
    if (e.lessonExit) e.lessonExit.addEventListener('click', closeLesson);

    // Sync everything (title, panels, body data-mode, toggle button) at boot.
    setMode('atelier');
  }

  // ------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------

  window.SCHOOL = {
    init: attach,
    setMode,
    onNoteOn: handleNoteOn,
    onNoteOff: handleNoteOff,
    isActive: () => state.active,
    isLessonRunning: () => state.active && !!state.lesson,
  };
  window.SCHOOL_MODULES = MODULES;

  // Auto-attach when DOM ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
