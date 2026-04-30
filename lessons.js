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
    // ÉCHAUFFEMENT — routine quotidienne
    {
      id: 'warmup',
      level: 'warmup',
      title: 'Échauffement',
      eyebrow: 'Routine · Avant chaque session',
      blurb: '5 minutes pour réveiller les doigts. À faire avant chaque leçon ou pratique.',
      lessons: [
        {
          id: 'warmup-l1',
          title: 'Étirement 5 doigts — main droite',
          summary: 'Do-Ré-Mi-Fa-Sol-Fa-Mi-Ré-Do — 4 fois.',
          steps: [
            { type: 'intro', title: 'Le geste fondamental', text: 'Pose tes 5 doigts main D sur Do-Ré-Mi-Fa-Sol et fais monter / descendre régulièrement.' },
            { type: 'practice-sequence', title: 'Aller-retour ×4', text: 'Quatre tours. Cherche l\'égalité, pas la vitesse.', sequence: [60, 62, 64, 65, 67, 65, 64, 62, 60], fingers: [1, 2, 3, 4, 5, 4, 3, 2, 1], repeat: 4 },
          ],
        },
        {
          id: 'warmup-l2',
          title: 'Étirement 5 doigts — main gauche',
          summary: 'Sol-Fa-Mi-Ré-Do — 4 fois.',
          steps: [
            { type: 'intro', title: 'L\'autre main', text: 'Pouce main G sur Sol2, auriculaire sur Do2. Même mouvement, inversé.' },
            { type: 'practice-sequence', title: 'Aller-retour ×4', text: 'Quatre tours main gauche.', sequence: [55, 53, 52, 50, 48, 50, 52, 53, 55], fingers: [1, 2, 3, 4, 5, 4, 3, 2, 1], repeat: 4 },
          ],
        },
        {
          id: 'warmup-l3',
          title: 'Mouvement contraire',
          summary: 'Mains qui s\'écartent et se rapprochent — 3 fois chaque main.',
          steps: [
            { type: 'intro', title: 'Symétrie pure', text: 'Les deux mains partent du <strong>Do central</strong> et s\'écartent en miroir, puis reviennent. Excellent pour la coordination.' },
            { type: 'practice-sequence', title: 'Main D ×3', text: 'Do-Ré-Mi-Fa-Sol-Fa-Mi-Ré-Do, trois fois.', sequence: [60, 62, 64, 65, 67, 65, 64, 62, 60], fingers: [1, 2, 3, 4, 5, 4, 3, 2, 1], repeat: 3 },
            { type: 'practice-sequence', title: 'Main G ×3 (miroir)', text: 'Do-Si-La-Sol-Fa-Sol-La-Si-Do, trois fois.', sequence: [60, 59, 57, 55, 53, 55, 57, 59, 60], fingers: [1, 2, 3, 4, 5, 4, 3, 2, 1], repeat: 3 },
          ],
        },
        {
          id: 'warmup-l4',
          title: 'Arpèges Do majeur',
          summary: 'Aller simple ×4, aller-retour ×3.',
          steps: [
            { type: 'intro', title: 'Décomposer l\'accord', text: 'On joue les notes de Do majeur l\'<strong>une après l\'autre</strong> — fluide, doré, indispensable.' },
            { type: 'practice-sequence', title: 'Arpège ascendant ×4', text: 'Do-Mi-Sol-Do. Doigtés 1-2-3-5.', sequence: [60, 64, 67, 72], fingers: [1, 2, 3, 5], repeat: 4 },
            { type: 'practice-sequence', title: 'Aller-retour ×3', text: 'Do-Mi-Sol-Do-Sol-Mi-Do.', sequence: [60, 64, 67, 72, 67, 64, 60], fingers: [1, 2, 3, 5, 3, 2, 1], repeat: 3 },
          ],
        },
        {
          id: 'warmup-l5',
          title: 'Trilles',
          summary: 'Alternance rapide — 5 fois chaque paire.',
          steps: [
            { type: 'intro', title: 'Léger, vif', text: 'Alterne rapidement deux notes voisines. Cherche l\'<strong>égalité</strong> entre les deux.' },
            { type: 'practice-sequence', title: 'Trille Do-Ré (1-2) ×5', text: 'Cinq tours.', sequence: [60, 62, 60, 62, 60, 62, 60, 62], fingers: [1, 2, 1, 2, 1, 2, 1, 2], repeat: 5 },
            { type: 'practice-sequence', title: 'Trille Ré-Mi (2-3) ×5', text: 'Index-majeur, cinq tours.', sequence: [62, 64, 62, 64, 62, 64, 62, 64], fingers: [2, 3, 2, 3, 2, 3, 2, 3], repeat: 5 },
          ],
        },
        {
          id: 'warmup-l6',
          title: 'Gamme de Do — finale',
          summary: 'Octave montante — 3 fois.',
          steps: [
            { type: 'intro', title: 'Pour finir', text: 'Tu es prêt. Trois gammes propres pour signer la fin.' },
            { type: 'practice-sequence', title: 'Gamme ascendante ×3', text: 'Do-Ré-Mi-Fa-Sol-La-Si-Do. Pouce-passant après Mi.', sequence: [60, 62, 64, 65, 67, 69, 71, 72], fingers: [1, 2, 3, 1, 2, 3, 4, 5], repeat: 3 },
          ],
        },
      ],
    },

    {
      id: 'm1',
      level: 'beginner',
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
      level: 'beginner',
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
      level: 'beginner',
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
      level: 'beginner',
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
      level: 'beginner',
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
      level: 'beginner',
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

    // =========================================================
    // Module VII — Mains ensemble
    // =========================================================
    {
      id: 'm6',
      level: 'beginner',
      title: 'Mains ensemble',
      eyebrow: 'Module · Coordination',
      blurb: 'Les deux mains, un cerveau. La vraie sensation du piano.',
      lessons: [
        {
          id: 'm6-l1',
          title: 'Tenir une basse',
          summary: 'Main G tient un Do, main D joue la mélodie.',
          steps: [
            {
              type: 'intro',
              title: 'Le geste fondateur',
              text: 'La forme la plus simple de jeu à deux mains : la main gauche <strong>tient un seul Do grave</strong> qui résonne, pendant que la main droite joue une mélodie au-dessus. C\'est la base de centaines de chansons.',
            },
            {
              type: 'highlight',
              title: 'Position de départ',
              text: 'Auriculaire main gauche sur Do2, pouce main droite sur Do central.',
              highlights: [
                { midi: 36, color: 'petrol', label: '5' },
                { midi: 60, color: 'gold', label: '1' },
              ],
            },
            {
              type: 'listen',
              title: 'Écoute',
              text: 'On tient le Do grave une mesure entière, on joue Do-Mi-Sol au-dessus.',
              sequence: [
                { midi: 36, dur: 0.4, chord: [36, 60] },
                { midi: 64, dur: 0.4 },
                { midi: 67, dur: 0.4 },
                { midi: 64, dur: 0.4 },
                { midi: 60, dur: 0.6 },
              ],
            },
            {
              type: 'practice-chord',
              title: 'À toi : pose les deux notes',
              text: 'Pose le Do grave (main G) et le Do central (main D) <strong>en même temps</strong>.',
              chord: [36, 60],
            },
            {
              type: 'practice-sequence',
              title: 'La mélodie au-dessus',
              text: 'Maintenant joue Do-Mi-Sol-Mi-Do main droite seule.',
              sequence: [60, 64, 67, 64, 60],
              fingers: [1, 3, 5, 3, 1],
            },
          ],
        },
        {
          id: 'm6-l2',
          title: 'Au clair de la lune — 2 mains',
          summary: 'Mélodie main D + basse en pédale main G.',
          steps: [
            {
              type: 'intro',
              title: 'Premier vrai morceau à 2 mains',
              text: 'Tu connais déjà la mélodie de <em>Au clair de la lune</em> main droite. On y ajoute une basse simple en main gauche : un seul Do tenu pendant chaque phrase.',
            },
            {
              type: 'listen',
              title: 'Écoute la phrase complète',
              text: 'Main G tient Do2, main D fait la mélodie.',
              sequence: [
                { midi: 36, dur: 4.5, chord: [36] },
                { midi: 60, dur: 0.4 }, { midi: 60, dur: 0.4 }, { midi: 60, dur: 0.4 },
                { midi: 62, dur: 0.4 }, { midi: 64, dur: 0.8 }, { midi: 62, dur: 0.8 },
                { midi: 60, dur: 0.4 }, { midi: 64, dur: 0.4 }, { midi: 62, dur: 0.4 },
                { midi: 62, dur: 0.4 }, { midi: 60, dur: 1.0 },
              ],
            },
            {
              type: 'practice-chord',
              title: 'D\'abord la basse',
              text: 'Pose ton auriculaire gauche sur Do2 et tiens-le.',
              chord: [36],
            },
            {
              type: 'practice-sequence',
              title: 'Avec la mélodie',
              text: 'Une fois Do2 posé, joue la mélodie main D : Do Do Do Ré Mi Ré Do Mi Ré Ré Do.',
              sequence: [60, 60, 60, 62, 64, 62, 60, 64, 62, 62, 60],
            },
          ],
        },
        {
          id: 'm6-l3',
          title: 'Pulse de croches main G',
          summary: 'Main G tape le rythme, main D chante.',
          steps: [
            {
              type: 'intro',
              title: 'Marteler la pulsation',
              text: 'Au lieu de tenir une note, la main gauche peut <strong>répéter le Do grave</strong> sur chaque temps — comme une horloge. Pendant ce temps la main droite joue librement.',
            },
            {
              type: 'listen',
              title: 'Écoute',
              text: 'Pulse Do-Do-Do-Do main G + Do-Mi-Sol-Mi main D.',
              sequence: [
                { midi: 36, dur: 0.5 }, { midi: 60, dur: 0.5 },
                { midi: 36, dur: 0.5 }, { midi: 64, dur: 0.5 },
                { midi: 36, dur: 0.5 }, { midi: 67, dur: 0.5 },
                { midi: 36, dur: 0.5 }, { midi: 64, dur: 0.5 },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'À toi de pulser',
              text: 'Joue cette suite — alternance basse Do2 et notes de la gamme.',
              sequence: [36, 60, 36, 64, 36, 67, 36, 64],
            },
          ],
        },
      ],
    },

    // =========================================================
    // Module VIII — Plus d'accords
    // =========================================================
    {
      id: 'm7',
      level: 'intermediate',
      title: 'Plus d\'accords majeurs',
      eyebrow: 'Module · Harmonie',
      blurb: 'Fa, Sol et le trio des accords parfaits de Do.',
      lessons: [
        {
          id: 'm7-l1',
          title: 'Fa majeur',
          summary: 'Fa + La + Do, joués ensemble.',
          steps: [
            {
              type: 'intro',
              title: 'Le 4e degré',
              text: 'Après Do majeur, voici <strong>Fa majeur</strong> : <em>Fa + La + Do</em>. Doigté main D : 1 (Fa), 3 (La), 5 (Do).',
            },
            {
              type: 'highlight',
              title: 'Les trois notes',
              text: 'Pouce sur Fa, majeur sur La, auriculaire sur Do.',
              highlights: [
                { midi: 65, color: 'gold', label: '1' },
                { midi: 69, color: 'gold', label: '3' },
                { midi: 72, color: 'gold', label: '5' },
              ],
            },
            {
              type: 'listen',
              title: 'L\'accord plein',
              text: 'Couleur de Fa majeur — un peu plus sombre, plus rond que Do majeur.',
              sequence: [{ midi: 65, dur: 1.5, chord: [65, 69, 72] }],
            },
            {
              type: 'practice-chord',
              title: 'À toi',
              text: 'Plaque Fa, La et Do en même temps.',
              chord: [65, 69, 72],
            },
          ],
        },
        {
          id: 'm7-l2',
          title: 'Sol majeur',
          summary: 'Sol + Si + Ré, le 5e degré.',
          steps: [
            {
              type: 'intro',
              title: 'La dominante',
              text: 'Sol majeur est l\'accord <em>de tension</em>. Il a envie de retourner sur Do. Tu vas l\'utiliser tout le temps.',
            },
            {
              type: 'highlight',
              title: 'Les trois notes',
              text: 'Pouce sur Sol, majeur sur Si, auriculaire sur Ré (octave au-dessus).',
              highlights: [
                { midi: 67, color: 'gold', label: '1' },
                { midi: 71, color: 'gold', label: '3' },
                { midi: 74, color: 'gold', label: '5' },
              ],
            },
            {
              type: 'listen',
              title: 'Écoute la tension',
              text: 'Sol majeur seul, puis qui se résout sur Do majeur. Sens-tu le soulagement ?',
              sequence: [
                { midi: 67, dur: 1.2, chord: [67, 71, 74] },
                { midi: 60, dur: 1.5, chord: [60, 64, 67] },
              ],
            },
            {
              type: 'practice-chord',
              title: 'Plaque Sol majeur',
              text: 'Sol, Si, Ré — ensemble.',
              chord: [67, 71, 74],
            },
          ],
        },
        {
          id: 'm7-l3',
          title: 'Le trio I-IV-V',
          summary: 'Do, Fa, Sol — les 3 piliers de toute chanson en Do majeur.',
          steps: [
            {
              type: 'intro',
              title: 'Trois accords, mille chansons',
              text: 'Avec ces <strong>trois accords seulement</strong> (Do, Fa, Sol majeur), tu peux accompagner des centaines de chansons populaires. C\'est ce qu\'on appelle la <em>cadence parfaite</em>.',
            },
            {
              type: 'listen',
              title: 'Écoute la progression',
              text: 'Do → Fa → Sol → Do. La résolution sonne très naturelle.',
              sequence: [
                { midi: 60, dur: 1.2, chord: [60, 64, 67] },
                { midi: 65, dur: 1.2, chord: [65, 69, 72] },
                { midi: 67, dur: 1.2, chord: [67, 71, 74] },
                { midi: 60, dur: 1.8, chord: [60, 64, 67] },
              ],
            },
            {
              type: 'practice-chord',
              title: 'Étape 1 : Do majeur',
              text: 'Do-Mi-Sol.',
              chord: [60, 64, 67],
            },
            {
              type: 'practice-chord',
              title: 'Étape 2 : Fa majeur',
              text: 'Fa-La-Do.',
              chord: [65, 69, 72],
            },
            {
              type: 'practice-chord',
              title: 'Étape 3 : Sol majeur',
              text: 'Sol-Si-Ré.',
              chord: [67, 71, 74],
            },
            {
              type: 'practice-chord',
              title: 'Retour à Do majeur',
              text: 'Et on referme.',
              chord: [60, 64, 67],
            },
            {
              type: 'quiz',
              title: 'Vérification',
              question: 'L\'accord <strong>Sol majeur</strong> donne envie de revenir sur quel autre accord ?',
              options: ['Fa majeur', 'Do majeur', 'Ré mineur'],
              correct: 1,
              explain: 'Do — Sol est la <em>dominante</em>, Do est la <em>tonique</em>. La résolution V → I est l\'âme de la musique tonale.',
            },
          ],
        },
        {
          id: 'm7-l4',
          title: 'Premier renversement',
          summary: 'Do majeur version Mi-Sol-Do (basse Mi).',
          steps: [
            {
              type: 'intro',
              title: 'Même accord, autre disposition',
              text: 'Un accord peut se jouer dans plusieurs <em>renversements</em>. Le premier renversement de Do majeur, c\'est <strong>Mi-Sol-Do</strong> : on prend le Do du bas et on le met en haut. Ça reste Do majeur, mais avec une couleur différente.',
            },
            {
              type: 'highlight',
              title: 'Mi en bas',
              text: 'Pouce sur Mi, index sur Sol, auriculaire sur Do.',
              highlights: [
                { midi: 64, color: 'gold', label: '1' },
                { midi: 67, color: 'gold', label: '2' },
                { midi: 72, color: 'gold', label: '5' },
              ],
            },
            {
              type: 'listen',
              title: 'Compare',
              text: 'Position fondamentale puis premier renversement. C\'est le même accord avec une autre saveur.',
              sequence: [
                { midi: 60, dur: 1.4, chord: [60, 64, 67] },
                { midi: 64, dur: 1.6, chord: [64, 67, 72] },
              ],
            },
            {
              type: 'practice-chord',
              title: 'Plaque le renversement',
              text: 'Mi, Sol, Do — ensemble.',
              chord: [64, 67, 72],
            },
          ],
        },
      ],
    },

    // =========================================================
    // Module IX — Petites mélodies populaires
    // =========================================================
    {
      id: 'm8',
      level: 'beginner',
      title: 'Petites mélodies',
      eyebrow: 'Module · Répertoire',
      blurb: 'Quatre airs que tout le monde reconnaît, à ton tour de les jouer.',
      lessons: [
        {
          id: 'm8-l1',
          title: 'Hot Cross Buns',
          summary: 'Trois notes (Mi-Ré-Do), une comptine entière.',
          steps: [
            {
              type: 'intro',
              title: 'Trois notes seulement',
              text: 'Cette comptine anglaise tient sur <strong>Do, Ré, Mi</strong>. Si tu la maîtrises, tu maîtrises ton positionnement de pouce-index-majeur.',
            },
            {
              type: 'listen',
              title: 'Écoute',
              text: '« Hot cross buns, hot cross buns, one a penny, two a penny, hot cross buns. »',
              sequence: [
                { midi: 64, dur: 0.4 }, { midi: 62, dur: 0.4 }, { midi: 60, dur: 0.8 },
                { midi: 64, dur: 0.4 }, { midi: 62, dur: 0.4 }, { midi: 60, dur: 0.8 },
                { midi: 60, dur: 0.25 }, { midi: 60, dur: 0.25 }, { midi: 60, dur: 0.25 }, { midi: 60, dur: 0.25 },
                { midi: 62, dur: 0.25 }, { midi: 62, dur: 0.25 }, { midi: 62, dur: 0.25 }, { midi: 62, dur: 0.25 },
                { midi: 64, dur: 0.4 }, { midi: 62, dur: 0.4 }, { midi: 60, dur: 0.8 },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'À toi',
              text: 'Doigts 3-2-1 puis répétés. Doucement.',
              sequence: [
                64, 62, 60,
                64, 62, 60,
                60, 60, 60, 60, 62, 62, 62, 62,
                64, 62, 60,
              ],
              fingers: [3, 2, 1, 3, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 2, 1],
            },
          ],
        },
        {
          id: 'm8-l2',
          title: 'Frère Jacques',
          summary: 'Le canon le plus célèbre, main droite.',
          steps: [
            {
              type: 'intro',
              title: 'Tout le monde le connaît',
              text: 'Quatre phrases courtes répétées chacune deux fois. Tient sur 5 notes Do-Sol.',
            },
            {
              type: 'listen',
              title: 'Écoute',
              text: '« Frère Jacques, frère Jacques, dormez-vous ? dormez-vous ? Sonnez les matines… »',
              sequence: [
                { midi: 60, dur: 0.4 }, { midi: 62, dur: 0.4 }, { midi: 64, dur: 0.4 }, { midi: 60, dur: 0.4 },
                { midi: 60, dur: 0.4 }, { midi: 62, dur: 0.4 }, { midi: 64, dur: 0.4 }, { midi: 60, dur: 0.4 },
                { midi: 64, dur: 0.4 }, { midi: 65, dur: 0.4 }, { midi: 67, dur: 0.8 },
                { midi: 64, dur: 0.4 }, { midi: 65, dur: 0.4 }, { midi: 67, dur: 0.8 },
                { midi: 67, dur: 0.25 }, { midi: 69, dur: 0.25 }, { midi: 67, dur: 0.25 }, { midi: 65, dur: 0.25 },
                { midi: 64, dur: 0.4 }, { midi: 60, dur: 0.4 },
                { midi: 67, dur: 0.25 }, { midi: 69, dur: 0.25 }, { midi: 67, dur: 0.25 }, { midi: 65, dur: 0.25 },
                { midi: 64, dur: 0.4 }, { midi: 60, dur: 0.4 },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'Première phrase',
              text: 'Do-Ré-Mi-Do (deux fois).',
              sequence: [60, 62, 64, 60, 60, 62, 64, 60],
              fingers: [1, 2, 3, 1, 1, 2, 3, 1],
            },
            {
              type: 'practice-sequence',
              title: 'Deuxième phrase',
              text: 'Mi-Fa-Sol (deux fois).',
              sequence: [64, 65, 67, 64, 65, 67],
              fingers: [3, 4, 5, 3, 4, 5],
            },
            {
              type: 'practice-sequence',
              title: 'Phrase complète',
              text: 'Tout d\'un coup. Ne te précipite pas.',
              sequence: [
                60, 62, 64, 60, 60, 62, 64, 60,
                64, 65, 67, 64, 65, 67,
                67, 69, 67, 65, 64, 60,
                67, 69, 67, 65, 64, 60,
              ],
            },
          ],
        },
        {
          id: 'm8-l3',
          title: 'Joyeux anniversaire',
          summary: 'L\'air universel — main droite avec sa petite levée.',
          steps: [
            {
              type: 'intro',
              title: 'Anacrouse',
              text: 'Cet air commence par <em>deux notes courtes avant le premier vrai temps</em> — c\'est une <strong>anacrouse</strong>. Compte « et un, deux trois, un, deux trois ».',
            },
            {
              type: 'listen',
              title: 'Écoute la première phrase',
              text: '« Joyeux a-nni-ver-saire »',
              sequence: [
                { midi: 60, dur: 0.3 }, { midi: 60, dur: 0.3 },
                { midi: 62, dur: 0.6 }, { midi: 60, dur: 0.6 },
                { midi: 65, dur: 0.6 }, { midi: 64, dur: 1.2 },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'Première moitié',
              text: 'Do-Do-Ré-Do-Fa-Mi.',
              sequence: [60, 60, 62, 60, 65, 64],
            },
            {
              type: 'practice-sequence',
              title: 'Deuxième moitié',
              text: 'Do-Do-Ré-Do-Sol-Fa.',
              sequence: [60, 60, 62, 60, 67, 65],
            },
          ],
        },
        {
          id: 'm8-l4',
          title: 'Ode à la joie — thème',
          summary: 'Beethoven, simplifié pour 5 doigts.',
          steps: [
            {
              type: 'intro',
              title: 'Le thème universel',
              text: 'Le thème principal de la 9e symphonie de Beethoven tient en <strong>cinq notes côte-à-côte</strong> : Do-Ré-Mi-Fa-Sol. Tu n\'as pas besoin de bouger ta main.',
            },
            {
              type: 'listen',
              title: 'Écoute le thème',
              text: 'La phrase complète A.',
              sequence: [
                { midi: 64, dur: 0.4 }, { midi: 64, dur: 0.4 }, { midi: 65, dur: 0.4 }, { midi: 67, dur: 0.4 },
                { midi: 67, dur: 0.4 }, { midi: 65, dur: 0.4 }, { midi: 64, dur: 0.4 }, { midi: 62, dur: 0.4 },
                { midi: 60, dur: 0.4 }, { midi: 60, dur: 0.4 }, { midi: 62, dur: 0.4 }, { midi: 64, dur: 0.4 },
                { midi: 64, dur: 0.6 }, { midi: 62, dur: 0.2 }, { midi: 62, dur: 0.8 },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'Premier vers',
              text: 'Mi-Mi-Fa-Sol-Sol-Fa-Mi-Ré.',
              sequence: [64, 64, 65, 67, 67, 65, 64, 62],
              fingers: [3, 3, 4, 5, 5, 4, 3, 2],
            },
            {
              type: 'practice-sequence',
              title: 'Phrase complète',
              text: 'Le thème entier.',
              sequence: [
                64, 64, 65, 67, 67, 65, 64, 62,
                60, 60, 62, 64, 64, 62, 62,
              ],
            },
          ],
        },
      ],
    },

    // =========================================================
    // Module X — Gammes
    // =========================================================
    {
      id: 'm9',
      level: 'intermediate',
      title: 'Gammes',
      eyebrow: 'Module · Technique',
      blurb: 'Le pouce qui passe sous, l\'auriculaire qui prend le relais.',
      lessons: [
        {
          id: 'm9-l1',
          title: 'Gamme de Do — main droite',
          summary: 'Une octave montante avec le pouce-passant.',
          steps: [
            {
              type: 'intro',
              title: 'Pouce-passant',
              text: 'Pour jouer une octave entière avec une seule main de 5 doigts, on utilise le <strong>pouce-passant</strong> : le pouce passe sous le majeur après Mi pour atteindre Fa. Doigté : <strong>1-2-3-1-2-3-4-5</strong>.',
            },
            {
              type: 'highlight',
              title: 'La gamme avec doigtés',
              text: 'Tu vois le saut du pouce sous le majeur entre Mi et Fa.',
              highlights: [
                { midi: 60, color: 'finger', label: '1' },
                { midi: 62, color: 'finger', label: '2' },
                { midi: 64, color: 'finger', label: '3' },
                { midi: 65, color: 'finger', label: '1' },
                { midi: 67, color: 'finger', label: '2' },
                { midi: 69, color: 'finger', label: '3' },
                { midi: 71, color: 'finger', label: '4' },
                { midi: 72, color: 'finger', label: '5' },
              ],
            },
            {
              type: 'listen',
              title: 'Démo',
              text: 'Une octave montante.',
              sequence: [
                { midi: 60, dur: 0.35 }, { midi: 62, dur: 0.35 }, { midi: 64, dur: 0.35 },
                { midi: 65, dur: 0.35 }, { midi: 67, dur: 0.35 }, { midi: 69, dur: 0.35 },
                { midi: 71, dur: 0.35 }, { midi: 72, dur: 0.7 },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'À toi',
              text: 'Le pouce passe sous le majeur après Mi. Doucement.',
              sequence: [60, 62, 64, 65, 67, 69, 71, 72],
              fingers: [1, 2, 3, 1, 2, 3, 4, 5],
            },
          ],
        },
        {
          id: 'm9-l2',
          title: 'Gamme descendante main D',
          summary: 'Le majeur passe par-dessus le pouce.',
          steps: [
            {
              type: 'intro',
              title: 'Majeur-passant',
              text: 'En descendant, c\'est l\'inverse : <strong>le majeur passe par-dessus le pouce</strong>. Doigté : 5-4-3-2-1-3-2-1.',
            },
            {
              type: 'practice-sequence',
              title: 'À toi',
              text: 'De Do aigu à Do central.',
              sequence: [72, 71, 69, 67, 65, 64, 62, 60],
              fingers: [5, 4, 3, 2, 1, 3, 2, 1],
            },
          ],
        },
        {
          id: 'm9-l3',
          title: 'Aller-retour fluide',
          summary: 'Une octave montante puis descendante d\'un trait.',
          steps: [
            {
              type: 'intro',
              title: 'Le but',
              text: 'L\'objectif : enchaîner montée + descente <strong>sans arrêt</strong>, à un tempo régulier. C\'est le travail technique de base de tous les pianistes.',
            },
            {
              type: 'practice-sequence',
              title: 'Aller-retour',
              text: 'Do→Do aigu→Do. Sois régulier, pas trop vite.',
              sequence: [
                60, 62, 64, 65, 67, 69, 71, 72,
                71, 69, 67, 65, 64, 62, 60,
              ],
              fingers: [
                1, 2, 3, 1, 2, 3, 4, 5,
                4, 3, 2, 1, 3, 2, 1,
              ],
            },
          ],
        },
      ],
    },

    // =========================================================
    // Module XI — Accords mineurs
    // =========================================================
    {
      id: 'm10',
      level: 'intermediate',
      title: 'Accords mineurs',
      eyebrow: 'Module · Couleur',
      blurb: 'Les trois mineurs naturels de la gamme de Do.',
      lessons: [
        {
          id: 'm10-l1',
          title: 'Ré mineur',
          summary: 'Ré + Fa + La — un accord mélancolique.',
          steps: [
            {
              type: 'intro',
              title: 'Le 2e degré',
              text: 'Dans la gamme de Do majeur, le 2e degré (Ré) donne un accord <strong>mineur</strong>. <em>Ré + Fa + La</em>. Plus mélancolique que les majeurs, il prépare souvent une tension.',
            },
            {
              type: 'highlight',
              title: 'Les trois notes',
              text: 'Pouce sur Ré, majeur sur Fa, auriculaire sur La.',
              highlights: [
                { midi: 62, color: 'petrol', label: '1' },
                { midi: 65, color: 'petrol', label: '3' },
                { midi: 69, color: 'petrol', label: '5' },
              ],
            },
            {
              type: 'listen',
              title: 'La couleur mineure',
              text: 'Ré mineur seul, puis Do majeur. Tu entends la différence d\'humeur ?',
              sequence: [
                { midi: 62, dur: 1.4, chord: [62, 65, 69] },
                { midi: 60, dur: 1.5, chord: [60, 64, 67] },
              ],
            },
            {
              type: 'practice-chord',
              title: 'Plaque Ré mineur',
              text: 'Ré, Fa, La — ensemble.',
              chord: [62, 65, 69],
            },
          ],
        },
        {
          id: 'm10-l2',
          title: 'La mineur',
          summary: 'La + Do + Mi — le mineur le plus connu.',
          steps: [
            {
              type: 'intro',
              title: 'Le 6e degré',
              text: '<strong>La mineur</strong> est l\'accord <em>relatif mineur</em> de Do majeur — ils partagent les mêmes notes de gamme. La + Do + Mi. Tu vas le rencontrer dans presque toutes les chansons pop.',
            },
            {
              type: 'highlight',
              title: 'Les trois notes',
              text: 'Doigté 1-3-5.',
              highlights: [
                { midi: 57, color: 'petrol', label: '1' },
                { midi: 60, color: 'petrol', label: '3' },
                { midi: 64, color: 'petrol', label: '5' },
              ],
            },
            {
              type: 'listen',
              title: 'Écoute',
              text: 'La mineur, puis enchaîné avec Do majeur.',
              sequence: [
                { midi: 57, dur: 1.2, chord: [57, 60, 64] },
                { midi: 60, dur: 1.4, chord: [60, 64, 67] },
              ],
            },
            {
              type: 'practice-chord',
              title: 'Plaque La mineur',
              text: 'La, Do, Mi.',
              chord: [57, 60, 64],
            },
          ],
        },
        {
          id: 'm10-l3',
          title: 'Mi mineur',
          summary: 'Mi + Sol + Si — discret mais essentiel.',
          steps: [
            {
              type: 'intro',
              title: 'Le 3e degré',
              text: '<strong>Mi mineur</strong> : Mi + Sol + Si. Souvent utilisé en passage entre Do majeur et La mineur. Plus rare mais très joli.',
            },
            {
              type: 'highlight',
              title: 'Les trois notes',
              text: 'Doigté 1-3-5.',
              highlights: [
                { midi: 64, color: 'petrol', label: '1' },
                { midi: 67, color: 'petrol', label: '3' },
                { midi: 71, color: 'petrol', label: '5' },
              ],
            },
            {
              type: 'practice-chord',
              title: 'Plaque Mi mineur',
              text: 'Mi, Sol, Si.',
              chord: [64, 67, 71],
            },
            {
              type: 'quiz',
              title: 'Récapitulatif',
              question: 'Combien d\'accords mineurs « naturels » dans la gamme de Do majeur ?',
              options: ['1', '2', '3', '4'],
              correct: 2,
              explain: 'Trois : Ré mineur (II), Mi mineur (III), La mineur (VI). Avec les majeurs Do/Fa/Sol et le diminué Si, on a 7 accords pour 7 degrés.',
            },
          ],
        },
      ],
    },

    // =========================================================
    // Module XII — Cadences populaires
    // =========================================================
    {
      id: 'm11',
      level: 'intermediate',
      title: 'Cadences populaires',
      eyebrow: 'Module · Progressions',
      blurb: 'Quatre accords, et tu peux jouer la moitié de la radio.',
      lessons: [
        {
          id: 'm11-l1',
          title: 'I-V-vi-IV — la grille pop',
          summary: 'Do → Sol → La mineur → Fa.',
          steps: [
            {
              type: 'intro',
              title: 'La progression magique',
              text: '<strong>Do → Sol → La mineur → Fa</strong>. C\'est sans doute la grille d\'accords la plus utilisée dans la pop des 50 dernières années — Beatles, Adele, Coldplay, Taylor Swift l\'ont tous utilisée.',
            },
            {
              type: 'listen',
              title: 'Écoute',
              text: 'La grille en boucle. Sens-tu comme on a envie qu\'elle continue ?',
              sequence: [
                { midi: 60, dur: 1.0, chord: [60, 64, 67] },
                { midi: 67, dur: 1.0, chord: [67, 71, 74] },
                { midi: 57, dur: 1.0, chord: [57, 60, 64] },
                { midi: 65, dur: 1.0, chord: [65, 69, 72] },
                { midi: 60, dur: 1.4, chord: [60, 64, 67] },
              ],
            },
            {
              type: 'practice-chord',
              title: 'Étape 1 — Do majeur',
              text: 'Do-Mi-Sol.',
              chord: [60, 64, 67],
            },
            {
              type: 'practice-chord',
              title: 'Étape 2 — Sol majeur',
              text: 'Sol-Si-Ré.',
              chord: [67, 71, 74],
            },
            {
              type: 'practice-chord',
              title: 'Étape 3 — La mineur',
              text: 'La-Do-Mi.',
              chord: [57, 60, 64],
            },
            {
              type: 'practice-chord',
              title: 'Étape 4 — Fa majeur',
              text: 'Fa-La-Do. Et tu peux recommencer en boucle.',
              chord: [65, 69, 72],
            },
          ],
        },
        {
          id: 'm11-l2',
          title: 'II-V-I — la cadence jazz',
          summary: 'Ré mineur → Sol → Do.',
          steps: [
            {
              type: 'intro',
              title: 'L\'âme du jazz',
              text: 'La cadence <strong>II-V-I</strong> (Ré mineur → Sol majeur → Do majeur) est l\'une des résolutions les plus puissantes de la musique tonale. Tout le jazz est construit dessus.',
            },
            {
              type: 'listen',
              title: 'Écoute la résolution',
              text: 'Ré mineur (préparation) → Sol (tension) → Do (résolution). Note l\'effet d\'arrivée.',
              sequence: [
                { midi: 62, dur: 1.0, chord: [62, 65, 69] },
                { midi: 67, dur: 1.0, chord: [67, 71, 74] },
                { midi: 60, dur: 1.5, chord: [60, 64, 67] },
              ],
            },
            {
              type: 'practice-chord',
              title: 'Ré mineur',
              text: 'Ré-Fa-La.',
              chord: [62, 65, 69],
            },
            {
              type: 'practice-chord',
              title: 'Sol majeur',
              text: 'Sol-Si-Ré.',
              chord: [67, 71, 74],
            },
            {
              type: 'practice-chord',
              title: 'Do majeur',
              text: 'Do-Mi-Sol. Tu sens l\'arrivée à bon port ?',
              chord: [60, 64, 67],
            },
          ],
        },
        {
          id: 'm11-l3',
          title: 'I-vi-IV-V — l\'anatole',
          summary: 'Do → La mineur → Fa → Sol.',
          steps: [
            {
              type: 'intro',
              title: 'Le doo-wop des années 50',
              text: '<strong>Do → La mineur → Fa → Sol</strong>. Cette grille est partout dans le doo-wop et la pop classique : « Stand by Me », « Earth Angel », « Heart and Soul »...',
            },
            {
              type: 'listen',
              title: 'Écoute',
              text: 'On va lentement.',
              sequence: [
                { midi: 60, dur: 1.0, chord: [60, 64, 67] },
                { midi: 57, dur: 1.0, chord: [57, 60, 64] },
                { midi: 65, dur: 1.0, chord: [65, 69, 72] },
                { midi: 67, dur: 1.4, chord: [67, 71, 74] },
              ],
            },
            {
              type: 'practice-chord',
              title: 'Do majeur',
              text: 'Do-Mi-Sol.',
              chord: [60, 64, 67],
            },
            {
              type: 'practice-chord',
              title: 'La mineur',
              text: 'La-Do-Mi.',
              chord: [57, 60, 64],
            },
            {
              type: 'practice-chord',
              title: 'Fa majeur',
              text: 'Fa-La-Do.',
              chord: [65, 69, 72],
            },
            {
              type: 'practice-chord',
              title: 'Sol majeur',
              text: 'Sol-Si-Ré. La grille peut boucler indéfiniment.',
              chord: [67, 71, 74],
            },
          ],
        },
      ],
    },

    // =========================================================
    // Module XIII — Lecture sur portée (clé de sol)
    // =========================================================
    {
      id: 'm12',
      level: 'intermediate',
      title: 'Lire la portée',
      eyebrow: 'Module · Solfège',
      blurb: 'Reconnaître les notes sur les cinq lignes — clé de sol.',
      lessons: [
        {
          id: 'm12-l1',
          title: 'La portée et la clé de sol',
          summary: 'Cinq lignes, quatre interlignes, et un signe qui dit où on est.',
          steps: [
            {
              type: 'intro',
              title: 'Le système universel',
              text: 'Une <strong>portée</strong> est composée de 5 lignes horizontales et 4 interlignes. La <strong>clé de sol</strong> 𝄞 placée au début dit : « la 2e ligne en partant du bas, c\'est Sol ».',
            },
            {
              type: 'highlight',
              title: 'Le Do central, sur la portée',
              text: 'Le Do central se trouve juste en dessous de la portée, sur une <em>ligne supplémentaire</em>. Voici à quoi ça ressemble.',
              highlights: [{ midi: 60, color: 'gold', label: 'Do' }],
            },
            {
              type: 'practice-key',
              title: 'Joue le Do central',
              text: 'La note dessinée sous la portée.',
              midi: 60,
            },
          ],
        },
        {
          id: 'm12-l2',
          title: 'Mi-Sol-Si-Ré-Fa',
          summary: 'Les notes sur les lignes (de bas en haut).',
          steps: [
            {
              type: 'intro',
              title: 'Une mnémonique simple',
              text: 'Sur les <strong>lignes</strong> de la portée (de bas en haut) : <em>Mi-Sol-Si-Ré-Fa</em>. Beaucoup de musiciens retiennent : « <strong>Mi</strong>nuscule <strong>So</strong>uris <strong>Si</strong>fflante <strong>Re</strong>narde <strong>Fa</strong>cétieuse ».',
            },
            {
              type: 'highlight',
              title: 'Les 5 notes des lignes',
              text: 'Mi (1re ligne) — Sol — Si — Ré — Fa (5e ligne).',
              highlights: [
                { midi: 64, color: 'gold', label: 'Mi' },
                { midi: 67, color: 'gold', label: 'Sol' },
                { midi: 71, color: 'gold', label: 'Si' },
                { midi: 74, color: 'gold', label: 'Ré' },
                { midi: 77, color: 'gold', label: 'Fa' },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'Joue les 5 notes des lignes',
              text: 'Mi-Sol-Si-Ré-Fa, dans l\'ordre.',
              sequence: [64, 67, 71, 74, 77],
            },
            {
              type: 'quiz',
              title: 'Vérification',
              question: 'Quelle note se trouve sur la <strong>3e ligne</strong> (du milieu) ?',
              options: ['Sol', 'Si', 'Ré'],
              correct: 1,
              explain: 'Si — Mi (1re), Sol (2e), <strong>Si (3e)</strong>, Ré (4e), Fa (5e).',
            },
          ],
        },
        {
          id: 'm12-l3',
          title: 'Fa-La-Do-Mi',
          summary: 'Les notes dans les interlignes.',
          steps: [
            {
              type: 'intro',
              title: 'L\'autre moitié',
              text: 'Dans les <strong>interlignes</strong> de la portée (de bas en haut) : <em>Fa-La-Do-Mi</em>. Mnémonique courante : <strong>FACE</strong> (en anglais — ça forme le mot « visage »).',
            },
            {
              type: 'highlight',
              title: 'Les 4 notes des interlignes',
              text: 'Fa, La, Do, Mi.',
              highlights: [
                { midi: 65, color: 'gold', label: 'Fa' },
                { midi: 69, color: 'gold', label: 'La' },
                { midi: 72, color: 'gold', label: 'Do' },
                { midi: 76, color: 'gold', label: 'Mi' },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'Joue les 4 interlignes',
              text: 'Fa-La-Do-Mi, dans l\'ordre.',
              sequence: [65, 69, 72, 76],
            },
            {
              type: 'quiz',
              title: 'Récapitulatif',
              question: 'Lignes (Mi-Sol-Si-Ré-Fa) + Interlignes (Fa-La-Do-Mi) = combien de notes différentes sur la portée en clé de sol ?',
              options: ['7', '9', '5'],
              correct: 1,
              explain: '9 positions (sur 5 lignes + 4 interlignes), mais elles couvrent surtout l\'octave entre Mi3 et Fa5.',
            },
          ],
        },
      ],
    },

    // =========================================================
    // Module XIV — Rythmes avancés
    // =========================================================
    {
      id: 'm13',
      level: 'intermediate',
      title: 'Rythmes avancés',
      eyebrow: 'Module · Pulsation+',
      blurb: 'Silences, syncopes, doubles croches.',
      lessons: [
        {
          id: 'm13-l1',
          title: 'Le silence',
          summary: 'Ne rien jouer aussi est de la musique.',
          steps: [
            {
              type: 'intro',
              title: 'Le silence est une note',
              text: 'À chaque durée de note correspond un <strong>silence</strong> de même durée. Une <em>pause</em> = silence d\'une noire. Un <em>demi-soupir</em> = silence d\'une croche. Pendant un silence, tu ne joues rien — mais tu comptes.',
            },
            {
              type: 'rhythm-tap',
              title: 'Noire — silence — noire — silence',
              text: 'Tape, attends 1 temps, tape, attends. Le silence vaut autant qu\'une note.',
              bpm: 70,
              meter: 4,
              pattern: [1, 1, 1, 1], // user taps on 1 and 3, but we accept all 4 for simplicity in the engine
              tolerance: 0.28,
            },
            {
              type: 'rhythm-tap',
              title: 'Pattern syncopé',
              text: 'Noire, croche-croche, silence (compté), noire-noire.',
              bpm: 65,
              meter: 4,
              pattern: [1, 0.5, 0.5, 1, 1],
              tolerance: 0.25,
            },
          ],
        },
        {
          id: 'm13-l2',
          title: 'Doubles croches',
          summary: 'Quatre notes par temps.',
          steps: [
            {
              type: 'intro',
              title: 'Plus rapide encore',
              text: 'Une <strong>double-croche</strong> = un quart de noire. Il en faut <strong>quatre</strong> pour remplir un battement. On compte « <em>un-e-et-a</em> ».',
            },
            {
              type: 'rhythm-tap',
              title: 'Quatre doubles par temps',
              text: 'Tape 4 fois exactement régulières par battement.',
              bpm: 50,
              meter: 4,
              pattern: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
              tolerance: 0.18,
            },
            {
              type: 'rhythm-tap',
              title: 'Mélange croches + doubles',
              text: 'Croche, deux doubles, croche, deux doubles. Garde la pulsation.',
              bpm: 55,
              meter: 4,
              pattern: [0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25],
              tolerance: 0.18,
            },
          ],
        },
        {
          id: 'm13-l3',
          title: 'Syncope',
          summary: 'Accent à contretemps.',
          steps: [
            {
              type: 'intro',
              title: 'Le « contre-temps »',
              text: 'Une <strong>syncope</strong> place l\'accent là où on ne s\'attend pas — sur le « et » entre deux temps. C\'est le moteur du jazz, du funk, du reggae.',
            },
            {
              type: 'rhythm-tap',
              title: 'Pattern syncopé classique',
              text: 'Croche-noire-croche-noire — l\'accent tombe sur le deuxième « et ».',
              bpm: 75,
              meter: 4,
              pattern: [0.5, 1, 0.5, 1, 0.5, 1, 0.5, 0.5],
              tolerance: 0.22,
            },
          ],
        },
      ],
    },

    // =========================================================
    // Module XV — Tonalités voisines
    // =========================================================
    {
      id: 'm14',
      level: 'intermediate',
      title: 'Tonalités voisines',
      eyebrow: 'Module · Au-delà de Do',
      blurb: 'Sortir de Do : les premiers dièses, les premiers bémols.',
      lessons: [
        {
          id: 'm14-l1',
          title: 'Sol majeur',
          summary: 'Une nouvelle tonalité, un nouveau dièse.',
          steps: [
            {
              type: 'intro',
              title: 'Le passage par le dièse',
              text: 'Sol majeur ressemble beaucoup à Do majeur, mais avec une différence essentielle : le <strong>Fa devient Fa#</strong>. C\'est la première tonalité qu\'on apprend après Do.',
            },
            {
              type: 'highlight',
              title: 'La gamme de Sol majeur',
              text: 'Sol-La-Si-Do-Ré-Mi-Fa#-Sol. Le 7e degré est un dièse !',
              highlights: [
                { midi: 67, color: 'gold', label: 'Sol' },
                { midi: 69, color: 'gold', label: 'La' },
                { midi: 71, color: 'gold', label: 'Si' },
                { midi: 72, color: 'gold', label: 'Do' },
                { midi: 74, color: 'gold', label: 'Ré' },
                { midi: 76, color: 'gold', label: 'Mi' },
                { midi: 78, color: 'petrol', label: 'Fa#' },
                { midi: 79, color: 'gold', label: 'Sol' },
              ],
            },
            {
              type: 'listen',
              title: 'Écoute la gamme de Sol',
              text: 'Note le Fa# qui sonne plus tendu que le Fa naturel.',
              sequence: [
                { midi: 67, dur: 0.35 }, { midi: 69, dur: 0.35 }, { midi: 71, dur: 0.35 },
                { midi: 72, dur: 0.35 }, { midi: 74, dur: 0.35 }, { midi: 76, dur: 0.35 },
                { midi: 78, dur: 0.35 }, { midi: 79, dur: 0.7 },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'Joue la gamme de Sol',
              text: 'Tu vas devoir <strong>aller chercher la touche noire</strong> Fa# au lieu du Fa blanc.',
              sequence: [67, 69, 71, 72, 74, 76, 78, 79],
              fingers: [1, 2, 3, 1, 2, 3, 4, 5],
            },
          ],
        },
        {
          id: 'm14-l2',
          title: 'Fa majeur',
          summary: 'Côté bémol, avec Si bémol.',
          steps: [
            {
              type: 'intro',
              title: 'Le passage par le bémol',
              text: 'Fa majeur va dans l\'autre direction du cycle des quintes : il introduit un <strong>Si bémol</strong> à la place du Si naturel. C\'est la 2e tonalité fondamentale après Do.',
            },
            {
              type: 'highlight',
              title: 'La gamme de Fa majeur',
              text: 'Fa-Sol-La-Sib-Do-Ré-Mi-Fa. Le Si est aplati d\'un demi-ton.',
              highlights: [
                { midi: 65, color: 'gold', label: 'Fa' },
                { midi: 67, color: 'gold', label: 'Sol' },
                { midi: 69, color: 'gold', label: 'La' },
                { midi: 70, color: 'petrol', label: 'Sib' },
                { midi: 72, color: 'gold', label: 'Do' },
                { midi: 74, color: 'gold', label: 'Ré' },
                { midi: 76, color: 'gold', label: 'Mi' },
                { midi: 77, color: 'gold', label: 'Fa' },
              ],
            },
            {
              type: 'listen',
              title: 'Écoute la gamme de Fa',
              text: 'Sib donne une couleur plus douce que Si naturel.',
              sequence: [
                { midi: 65, dur: 0.35 }, { midi: 67, dur: 0.35 }, { midi: 69, dur: 0.35 },
                { midi: 70, dur: 0.35 }, { midi: 72, dur: 0.35 }, { midi: 74, dur: 0.35 },
                { midi: 76, dur: 0.35 }, { midi: 77, dur: 0.7 },
              ],
            },
            {
              type: 'practice-sequence',
              title: 'Joue la gamme de Fa',
              text: 'Le pouce passe sous, mais cette fois pour atteindre Sib (touche noire).',
              sequence: [65, 67, 69, 70, 72, 74, 76, 77],
              fingers: [1, 2, 3, 4, 1, 2, 3, 4],
            },
          ],
        },
        {
          id: 'm14-l3',
          title: 'Cycle des quintes',
          summary: 'Comment les tonalités s\'enchaînent.',
          steps: [
            {
              type: 'intro',
              title: 'Le cycle musical',
              text: 'Les tonalités s\'enchaînent par <strong>quintes justes</strong>. Côté <em>dièses</em> : Do (0) → Sol (1#) → Ré (2#) → La (3#) → Mi (4#)... Côté <em>bémols</em> : Do (0) → Fa (1♭) → Sib (2♭) → Mib (3♭)... Chaque cran ajoute une altération.',
            },
            {
              type: 'quiz',
              title: 'Le 1er dièse',
              question: 'Combien de dièses dans la tonalité de <strong>Sol majeur</strong> ?',
              options: ['0', '1', '2', '3'],
              correct: 1,
              explain: 'Un seul : Fa#. C\'est la 1re tonalité « dièse ».',
            },
            {
              type: 'quiz',
              title: 'Le 1er bémol',
              question: 'Combien de bémols dans la tonalité de <strong>Fa majeur</strong> ?',
              options: ['0', '1', '2'],
              correct: 1,
              explain: 'Un seul : Sib. C\'est la 1re tonalité « bémol ».',
            },
            {
              type: 'quiz',
              title: 'Vue d\'ensemble',
              question: 'En allant <strong>du côté des bémols</strong>, l\'ordre est…',
              options: [
                'Fa → Sib → Mib → Lab',
                'Sol → Ré → La → Mi',
                'Do → Mi → Sol → Si',
              ],
              correct: 0,
              explain: 'Côté bémols : Fa → Sib → Mib → Lab → Réb. Chaque cran rajoute un bémol au début.',
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

    // Warmup is shown via the header menu modal, not in the École browser.
    // Beginner & Intermediate groups (curriculum proper) — collapsible.
    const LEVEL_GROUPS = [
      { key: 'beginner',     title: 'Débutant',      desc: 'Les bases : repérage, doigté, premiers morceaux et accords.' },
      { key: 'intermediate', title: 'Intermédiaire', desc: 'Aller plus loin : harmonie, lecture, technique, autres tonalités.' },
    ];

    let collapsed = {};
    try { collapsed = JSON.parse(localStorage.getItem('etude-level-collapsed') || '{}'); }
    catch (_) {}

    function saveCollapsed() {
      try { localStorage.setItem('etude-level-collapsed', JSON.stringify(collapsed)); } catch (_) {}
    }

    for (const grp of LEVEL_GROUPS) {
      const mods = MODULES.filter((m) => (m.level || 'beginner') === grp.key);
      if (mods.length === 0) continue;

      const totalLessons = mods.reduce((acc, m) => acc + m.lessons.length, 0);
      const doneLessons  = mods.reduce(
        (acc, m) => acc + m.lessons.filter((l) => state.progress.completed[l.id]).length,
        0
      );

      const section = document.createElement('div');
      section.className = `level-group level-${grp.key}`;
      if (collapsed[grp.key]) section.classList.add('is-collapsed');

      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'level-header';
      header.setAttribute('aria-expanded', String(!collapsed[grp.key]));
      header.innerHTML = `
        <div class="level-header-text">
          <span class="level-eyebrow">${grp.title}</span>
          <p class="level-desc">${grp.desc}</p>
        </div>
        <span class="level-counter">${doneLessons} / ${totalLessons}</span>
        <span class="level-chevron" aria-hidden="true">▾</span>
      `;
      header.addEventListener('click', () => {
        const isNow = !section.classList.contains('is-collapsed');
        section.classList.toggle('is-collapsed', isNow);
        collapsed[grp.key] = isNow;
        saveCollapsed();
        header.setAttribute('aria-expanded', String(!isNow));
      });
      section.appendChild(header);

      const content = document.createElement('div');
      content.className = 'level-content';

      for (const mod of mods) {
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
        content.appendChild(modEl);
      }
      section.appendChild(content);
      e.lessonBrowser.appendChild(section);
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
      repeats: Math.max(1, step.repeat || 1),
      repeatDone: 0,
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
    const repeatBadge = p.repeats > 1
      ? ` <span class="repeat-badge">Tour ${p.repeatDone + 1} / ${p.repeats}</span>`
      : '';
    renderPracticeStatus(
      `Note <strong>${p.pos + 1}</strong> / ${p.seq.length} — joue <strong>${frName(m)}</strong>${f != null ? ` (doigt ${f})` : ''}.${repeatBadge}`
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
          p.repeatDone++;
          if (p.repeatDone >= p.repeats) {
            flashSuccess(p.repeats > 1
              ? `Excellent ! ${p.repeats} tours bouclés.`
              : 'Excellent ! Séquence complète.');
            clearKeyHints();
            const e = getEls();
            e.lessonNext.disabled = false;
            e.lessonNext.textContent = (state.stepIndex === state.lesson.steps.length - 1) ? 'Terminer la leçon' : 'Continuer →';
            // Offer "↻ Recommencer" right here, without going through the
            // "Bien joué" screen — useful for warm-up routines.
            if (e.lessonReplay) {
              e.lessonReplay.hidden = false;
              e.lessonReplay.textContent = '↻ Recommencer';
              e.lessonReplay.dataset.replayKind = 'sequence-restart';
            }
          } else {
            // Reset for next repetition.
            flashSuccess(`Tour ${p.repeatDone} / ${p.repeats} — bien joué, recommence.`);
            p.pos = 0;
            setTimeout(() => {
              if (state.practice === p) refreshSequenceHighlight();
            }, 900);
          }
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
        // Sequence completed → restart the same exercise without leaving the step.
        if (e.lessonReplay.dataset.replayKind === 'sequence-restart' && step && step.type === 'practice-sequence') {
          delete e.lessonReplay.dataset.replayKind;
          renderStep();
          return;
        }
        if (state.practice && state.practice.kind === 'done') {
          // Refaire toute la leçon depuis le début
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
        // practice-sequence: sequence is an array of midi numbers — wrap into objects.
        if (step && step.type === 'practice-sequence' && step.sequence) {
          // Hide the static "next note" hint while the demo plays so the
          // user sees only the keys actually being played, in sync with audio.
          clearKeyHints();
          const seqObjs = step.sequence.map((m) => ({ midi: m, dur: 0.4 }));
          playSequence(seqObjs);
          // Restore the highlight when the demo is done.
          const totalMs = seqObjs.reduce((acc, s) => acc + (s.dur + 0.03) * 1000, 0);
          setTimeout(() => {
            if (state.practice && state.practice.kind === 'sequence') {
              refreshSequenceHighlight();
            }
          }, totalMs + 250);
          return;
        }
        // listen step: sequence is already an array of {midi, dur, chord?}.
        if (step && step.sequence) {
          playSequence(step.sequence);
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
    openLesson: (lessonId) => { setMode('school'); openLesson(lessonId); },
    findModule: (modId) => MODULES.find((m) => m.id === modId),
    onNoteOn: handleNoteOn,
    onNoteOff: handleNoteOff,
    isActive: () => state.active,
    isLessonRunning: () => state.active && !!state.lesson,
    isCompleted: (lessonId) => !!state.progress.completed[lessonId],
  };
  window.SCHOOL_MODULES = MODULES;

  // Auto-attach when DOM ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
