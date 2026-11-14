window.VocaLevelContent={
  "levels": [
    {
      "code": "A1",
      "name": "Beginner",
      "title": "Build a foundation",
      "description": "Introduce yourself, ask simple questions and handle familiar words.",
      "availability": "Full A1 realm packs"
    },
    {
      "code": "A2",
      "name": "Elementary",
      "title": "Handle everyday exchanges",
      "description": "Talk about familiar needs, simple plans and past experiences.",
      "availability": "Starter practice"
    },
    {
      "code": "B1",
      "name": "Intermediate",
      "title": "Tell your story",
      "description": "Explain experiences, give reasons and manage common situations independently.",
      "availability": "Starter practice"
    },
    {
      "code": "B2",
      "name": "Upper intermediate",
      "title": "Develop your point of view",
      "description": "Understand more complex texts and express a clear, supported opinion.",
      "availability": "Starter practice"
    },
    {
      "code": "C1",
      "name": "Advanced",
      "title": "Express nuance",
      "description": "Follow demanding texts, recognize implied meaning and choose a flexible register.",
      "availability": "Starter practice"
    },
    {
      "code": "C2",
      "name": "Proficient",
      "title": "Refine precision",
      "description": "Explore subtle meaning, complex arguments and precise expression.",
      "availability": "Starter practice"
    }
  ],
  "bank": {
    "A1": [
      {
        "skill": "Grammar",
        "prompt": "Je ___ étudiante.",
        "options": [
          "suis",
          "es",
          "est",
          "sommes"
        ],
        "answer": 0,
        "explanation": "With je, the present form of être is suis.",
        "text": ""
      },
      {
        "skill": "Vocabulary",
        "prompt": "Quel mot désigne une boisson ?",
        "options": [
          "Un cahier",
          "Une clé",
          "De l’eau",
          "Un billet"
        ],
        "answer": 2,
        "explanation": "De l’eau means water, a drink.",
        "text": ""
      },
      {
        "skill": "Interaction",
        "prompt": "Vous entrez dans un magasin. Que dites-vous ?",
        "options": [
          "Bonjour !",
          "Bonne nuit !",
          "J’ai dix ans.",
          "À hier !"
        ],
        "answer": 0,
        "explanation": "Bonjour is a suitable greeting when you enter a shop.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "À quelle heure ouvre le café ?",
        "options": [
          "À 9 h",
          "À 10 h",
          "À 17 h",
          "À 8 h"
        ],
        "answer": 3,
        "explanation": "The notice says the café opens at 8 h.",
        "text": "Le café est ouvert de 8 h à 17 h, du lundi au samedi."
      },
      {
        "skill": "Grammar",
        "prompt": "Nous ___ à Regina.",
        "options": [
          "habite",
          "habitez",
          "habitent",
          "habitons"
        ],
        "answer": 3,
        "explanation": "The nous form is habitons.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "Que cherche Léa ?",
        "options": [
          "Un taxi",
          "La gare",
          "Un hôtel",
          "Une école"
        ],
        "answer": 1,
        "explanation": "She asks where the station is.",
        "text": "Léa demande : « Excusez-moi, où est la gare, s’il vous plaît ? »"
      }
    ],
    "A2": [
      {
        "skill": "Grammar",
        "prompt": "Hier, nous ___ le musée.",
        "options": [
          "visitions demain",
          "avons visité",
          "allons visiter",
          "visiterons"
        ],
        "answer": 1,
        "explanation": "Hier calls for a past event; avons visité is the completed past visit.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "Pourquoi Sara ne vient-elle pas ?",
        "options": [
          "Elle est malade.",
          "Elle a oublié.",
          "Elle voyage.",
          "Elle travaille demain."
        ],
        "answer": 0,
        "explanation": "Sara says she is ill and will stay home.",
        "text": "Salut Paul, je suis malade. Je vais rester chez moi aujourd’hui. On peut se voir samedi ? Sara"
      },
      {
        "skill": "Grammar",
        "prompt": "Tu vas à la bibliothèque ? Oui, j’___ vais après le cours.",
        "options": [
          "en",
          "le",
          "y",
          "lui"
        ],
        "answer": 2,
        "explanation": "Y replaces the destination à la bibliothèque.",
        "text": ""
      },
      {
        "skill": "Interaction",
        "prompt": "Vous voulez une taille plus grande. Que dites-vous ?",
        "options": [
          "Je n’ai pas faim.",
          "Le magasin est fermé.",
          "Je voudrais une taille plus grande.",
          "Il fait beau."
        ],
        "answer": 2,
        "explanation": "This directly asks for the larger size you need.",
        "text": ""
      },
      {
        "skill": "Grammar",
        "prompt": "Demain, je ___ préparer un pique-nique.",
        "options": [
          "suis",
          "ai",
          "viens",
          "vais"
        ],
        "answer": 3,
        "explanation": "Vais + infinitive expresses a near-future plan.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "Quelle solution est proposée ?",
        "options": [
          "Annuler le voyage",
          "Prendre un bus",
          "Attendre le lendemain",
          "Changer de billet"
        ],
        "answer": 1,
        "explanation": "A replacement bus is announced at 14 h 30.",
        "text": "Le train de 14 h est annulé. Un bus de remplacement partira à 14 h 30 devant la gare."
      }
    ],
    "B1": [
      {
        "skill": "Grammar",
        "prompt": "Si j’avais plus de temps, je ___ davantage.",
        "options": [
          "lirai",
          "lis",
          "lirais",
          "lire"
        ],
        "answer": 2,
        "explanation": "An unreal present condition uses si + imparfait, then conditionnel.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "Pourquoi Camille propose-t-elle une autre date ?",
        "options": [
          "Elle préfère voyager seule.",
          "Le rendez-vous coïncide avec un déplacement.",
          "Elle n’aime pas les réunions.",
          "Le bureau sera fermé."
        ],
        "answer": 1,
        "explanation": "Her business trip conflicts with the scheduled meeting.",
        "text": "La réunion est prévue jeudi, mais je serai en déplacement ce jour-là. Serait-il possible de la reporter à vendredi ? Camille"
      },
      {
        "skill": "Grammar",
        "prompt": "C’est le collègue ___ je t’ai parlé.",
        "options": [
          "que",
          "où",
          "lequel",
          "dont"
        ],
        "answer": 3,
        "explanation": "Parler de quelqu’un leads to the relative pronoun dont.",
        "text": ""
      },
      {
        "skill": "Interaction",
        "prompt": "Vous n’êtes pas d’accord avec un ami. Quelle réponse ouvre la discussion ?",
        "options": [
          "Tu as tort, c’est évident.",
          "Je comprends ton avis, mais je vois les choses autrement.",
          "On ne discutera jamais.",
          "Je ne t’écoute pas."
        ],
        "answer": 1,
        "explanation": "Acknowledging the other view and stating your disagreement invites discussion.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "Quelle est l’intention principale du message ?",
        "options": [
          "Refuser définitivement une invitation",
          "Demander une adresse",
          "Accepter tout en précisant une contrainte",
          "Inviter de nouveaux amis"
        ],
        "answer": 2,
        "explanation": "The writer accepts, but says they must leave before 22 h.",
        "text": "Merci pour l’invitation, je viendrai avec plaisir ! Je devrai toutefois partir avant 22 h, car je travaille tôt le lendemain."
      },
      {
        "skill": "Grammar",
        "prompt": "Il a raté son train ___ il s’est levé trop tard.",
        "options": [
          "bien que",
          "pour que",
          "malgré",
          "parce qu’"
        ],
        "answer": 3,
        "explanation": "Parce que introduces the cause; it contracts to parce qu’ before il.",
        "text": ""
      }
    ],
    "B2": [
      {
        "skill": "Grammar",
        "prompt": "Bien qu’il ___ très occupé, il prend le temps de nous aider.",
        "options": [
          "est",
          "soit",
          "sera",
          "était"
        ],
        "answer": 1,
        "explanation": "Bien que introduces a concession and normally takes the subjunctive.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "Quelle réserve l’auteur exprime-t-il ?",
        "options": [
          "Le projet ne devrait jamais être lancé.",
          "La consultation a été inutile.",
          "L’investissement suffirait à tout résoudre.",
          "Le coût ne garantit pas l’efficacité."
        ],
        "answer": 3,
        "explanation": "The writer distinguishes expenditure from demonstrated improvement.",
        "text": "La mairie présente cet investissement comme une avancée majeure. Encore faut-il que les nouveaux équipements répondent aux besoins réels des habitants : dépenser davantage ne signifie pas nécessairement améliorer le service."
      },
      {
        "skill": "Interaction",
        "prompt": "Quelle phrase convient à une réclamation professionnelle ?",
        "options": [
          "C’est n’importe quoi, votre service.",
          "Vous faites toujours mal votre travail.",
          "Je souhaiterais comprendre ce retard et connaître les solutions possibles.",
          "Tant pis, on n’en parle plus."
        ],
        "answer": 2,
        "explanation": "It describes the issue and requests a solution in an appropriate professional register.",
        "text": ""
      },
      {
        "skill": "Grammar",
        "prompt": "Le dossier est complet ; ___, certaines pièces doivent être actualisées.",
        "options": [
          "néanmoins",
          "donc",
          "puisque",
          "afin que"
        ],
        "answer": 0,
        "explanation": "Néanmoins expresses the contrast between completeness and the need to update documents.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "Que signifie le conditionnel dans ce titre ?",
        "options": [
          "Un fait présenté comme définitivement établi",
          "Une information non encore confirmée",
          "Un ordre adressé au maire",
          "Un événement impossible"
        ],
        "answer": 1,
        "explanation": "The journalistic conditional marks an unconfirmed report.",
        "text": "Le maire envisagerait de reporter le vote, selon plusieurs sources proches du dossier."
      },
      {
        "skill": "Grammar",
        "prompt": "Vous avez remis les documents à la directrice ? Oui, nous ___.",
        "options": [
          "lui les avons remis",
          "les avons lui remis",
          "les lui avons remis",
          "avons les lui remis"
        ],
        "answer": 2,
        "explanation": "The object pronouns precede the auxiliary: les lui avons remis.",
        "text": ""
      }
    ],
    "C1": [
      {
        "skill": "Reading",
        "prompt": "Quelle thèse se dégage du texte ?",
        "options": [
          "Les indicateurs doivent être supprimés.",
          "Toute décision chiffrée est neutre.",
          "Les chiffres sont utiles, mais leur sélection implique des choix.",
          "Seuls les experts peuvent comprendre les politiques publiques."
        ],
        "answer": 2,
        "explanation": "The author challenges the supposed neutrality of which indicators are chosen.",
        "text": "On présente volontiers les indicateurs comme des arbitres impartiaux du débat public. Ils éclairent certes la décision ; encore convient-il de s’interroger sur ce qu’ils laissent hors champ. Choisir de mesurer la rapidité d’un service plutôt que son accessibilité, c’est déjà privilégier une certaine idée de son utilité."
      },
      {
        "skill": "Grammar",
        "prompt": "Pour convaincant qu’il ___, cet argument ne règle pas la question du financement.",
        "options": [
          "soit",
          "est",
          "sera",
          "a été"
        ],
        "answer": 0,
        "explanation": "The concessive construction pour + adjective + que takes the subjunctive here.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "Que suggère « ne saurait tenir lieu de » ?",
        "options": [
          "La transparence remplace avantageusement le contrôle.",
          "La transparence est impossible.",
          "Le contrôle empêche toute transparence.",
          "La transparence ne peut pas se substituer au contrôle."
        ],
        "answer": 3,
        "explanation": "Ne saurait expresses a strong, formal rejection of the proposed equivalence.",
        "text": "La publication des résultats constitue un progrès réel. Elle ne saurait toutefois tenir lieu de contrôle indépendant."
      },
      {
        "skill": "Interaction",
        "prompt": "Quelle reformulation maintient la réserve de l’auteur ?",
        "options": [
          "Le dispositif est inefficace.",
          "Le dispositif pourrait être utile, à condition d’en préciser les modalités.",
          "Le dispositif est déjà parfaitement opérationnel.",
          "Les modalités sont sans importance."
        ],
        "answer": 1,
        "explanation": "This preserves both the possible benefit and the condition.",
        "text": "L’intérêt du dispositif n’est pas exclu, sous réserve que ses modalités soient clarifiées."
      },
      {
        "skill": "Grammar",
        "prompt": "La mesure paraît modeste ; elle n’en est pas moins décisive. Quel rapport est exprimé ?",
        "options": [
          "Une conséquence nécessaire",
          "Une explication chronologique",
          "Une concession",
          "Une comparaison quantitative"
        ],
        "answer": 2,
        "explanation": "N’en… pas moins highlights an effect despite an apparent limitation.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "Quel élément manque pour justifier la conclusion ?",
        "options": [
          "Le nombre de participants satisfaits",
          "Un élément permettant d’attribuer la hausse au dispositif",
          "La date d’ouverture de l’enquête",
          "Le nom du prestataire"
        ],
        "answer": 1,
        "explanation": "A before/after increase alone does not establish that the programme caused it.",
        "text": "Depuis l’introduction du dispositif, la fréquentation a progressé. Le rapport en conclut à son efficacité, sans examiner l’évolution de l’offre de transport ni les changements démographiques intervenus durant la même période."
      }
    ],
    "C2": [
      {
        "skill": "Reading",
        "prompt": "Quelle est la portée ironique de la dernière phrase ?",
        "options": [
          "L’auteur admire la rigueur des restrictions.",
          "Le règlement a été supprimé.",
          "L’auteur réclame davantage d’exceptions.",
          "Les dérogations contredisent la fermeté affichée."
        ],
        "answer": 3,
        "explanation": "The apparent praise exposes the contradiction between strict rules and frequent exceptions.",
        "text": "Le règlement se veut inflexible : aucune dérogation ne sera tolérée, sauf, naturellement, lorsque les circonstances l’exigeront. On appréciera la fermeté de cette position."
      },
      {
        "skill": "Grammar",
        "prompt": "À supposer même que le diagnostic ___ exact, encore faudrait-il que le remède ___ applicable.",
        "options": [
          "soit / soit",
          "est / est",
          "serait / serait",
          "sera / sera"
        ],
        "answer": 0,
        "explanation": "Both à supposer que and the subordinate clause after il faudrait que take the subjunctive.",
        "text": ""
      },
      {
        "skill": "Reading",
        "prompt": "Quelle synthèse respecte les deux textes ?",
        "options": [
          "Les deux auteurs rejettent toute publication.",
          "Les deux auteurs considèrent la transparence comme suffisante.",
          "Ils admettent l’intérêt de la publication, mais divergent sur ce qu’elle suffit à garantir.",
          "Le second auteur conteste l’existence des données."
        ],
        "answer": 2,
        "explanation": "One presents publication as a sufficient guarantee, while the other requires scrutiny as well.",
        "text": "Texte A : Rendre les données accessibles garantit à lui seul la responsabilité des institutions. Texte B : L’accès aux données est indispensable, mais sans moyens d’en contester l’interprétation, la responsabilité demeure largement théorique."
      },
      {
        "skill": "Interaction",
        "prompt": "Quelle reformulation conserve exactement la prudence du constat ?",
        "options": [
          "Les résultats prouvent que l’hypothèse est vraie.",
          "Les résultats sont compatibles avec l’hypothèse, sans suffire à la confirmer.",
          "Les résultats réfutent l’hypothèse.",
          "L’hypothèse est confirmée dans tous les cas."
        ],
        "answer": 1,
        "explanation": "Compatibility does not amount to proof or confirmation.",
        "text": "Les résultats ne sont pas incompatibles avec l’hypothèse, ce qui ne vaut pas validation de celle-ci."
      },
      {
        "skill": "Reading",
        "prompt": "Que fait l’auteur en disant « c’est précisément là que le bât blesse » ?",
        "options": [
          "Il désigne le point problématique de l’argument.",
          "Il apporte une preuve médicale.",
          "Il abandonne son objection.",
          "Il décrit un déplacement à cheval."
        ],
        "answer": 0,
        "explanation": "The idiom singles out the central difficulty in the reasoning.",
        "text": "On nous répond que la procédure est conforme aux règles. C’est précisément là que le bât blesse : la conformité formelle est ici invoquée pour éviter toute discussion sur la pertinence des règles elles-mêmes."
      },
      {
        "skill": "Reading",
        "prompt": "Quelle interprétation évite de renforcer indûment la conclusion ?",
        "options": [
          "La réforme échouera nécessairement.",
          "Tout effet positif est exclu.",
          "Les effets positifs sont déjà démontrés.",
          "Les éléments disponibles ne permettent pas encore d’affirmer un effet positif."
        ],
        "answer": 3,
        "explanation": "A lack of sufficient evidence is not proof of failure or of the absence of any effect.",
        "text": "En l’état des observations, rien n’autorise à conclure que la réforme produira les bénéfices annoncés. Ce constat ne préjuge toutefois pas de ses effets à plus long terme."
      }
    ]
  },
  "practice": {
    "A1": {
      "title": "Your first invitation",
      "text": "Salut Léa ! Tu veux venir au parc samedi à 15 h ? Nous allons jouer au ballon. Apporte une bouteille d’eau. À bientôt ! Sami",
      "qs": [
        {
          "skill": "Reading",
          "prompt": "Où est le rendez-vous ?",
          "options": [
            "Au parc",
            "À l’école",
            "À la gare"
          ],
          "answer": 0,
          "explanation": "Sami invites Léa to the park.",
          "text": ""
        },
        {
          "skill": "Reading",
          "prompt": "À quelle heure ?",
          "options": [
            "À 13 h",
            "À 15 h",
            "À 17 h"
          ],
          "answer": 1,
          "explanation": "The invitation says 15 h.",
          "text": ""
        },
        {
          "skill": "Interaction",
          "prompt": "Vous acceptez. Que répondez-vous ?",
          "options": [
            "Je ne comprends pas le prix.",
            "Le train est annulé.",
            "Oui, avec plaisir !"
          ],
          "answer": 2,
          "explanation": "Oui, avec plaisir politely accepts the invitation.",
          "text": ""
        }
      ]
    },
    "A2": {
      "title": "Change a picnic plan",
      "text": "Le pique-nique de dimanche est reporté à lundi parce qu’il va pleuvoir. Nous nous retrouverons à midi devant le parc. Chacun peut apporter un plat. S’il fait encore mauvais, nous mangerons chez Amina.",
      "qs": [
        {
          "skill": "Reading",
          "prompt": "Pourquoi change-t-on la date ?",
          "options": [
            "Amina travaille dimanche.",
            "La météo annonce de la pluie.",
            "Le parc est fermé."
          ],
          "answer": 1,
          "explanation": "The plan changes because rain is expected.",
          "text": ""
        },
        {
          "skill": "Reading",
          "prompt": "Que fera le groupe s’il pleut lundi ?",
          "options": [
            "Il mangera chez Amina.",
            "Il annulera sans autre solution.",
            "Il ira à la gare."
          ],
          "answer": 0,
          "explanation": "Amina’s home is the backup location.",
          "text": ""
        },
        {
          "skill": "Interaction",
          "prompt": "Vous proposez votre contribution.",
          "options": [
            "J’apportais un plat hier.",
            "Je n’y suis jamais allé.",
            "Je peux apporter une salade."
          ],
          "answer": 2,
          "explanation": "This offers something suitable to bring.",
          "text": ""
        }
      ]
    },
    "B1": {
      "title": "Resolve a disagreement",
      "text": "Paul trouve que ses amis décident toujours des sorties sans lui demander son avis. Amina reconnaît que le groupe manque parfois de temps pour consulter tout le monde. Elle propose de choisir les activités à tour de rôle et de prévoir les sorties quelques jours plus tôt.",
      "qs": [
        {
          "skill": "Reading",
          "prompt": "Quel est le problème principal ?",
          "options": [
            "Paul n’a jamais de temps libre.",
            "Paul ne se sent pas associé aux décisions.",
            "Amina refuse toute sortie."
          ],
          "answer": 1,
          "explanation": "Paul wants his opinion considered.",
          "text": ""
        },
        {
          "skill": "Reading",
          "prompt": "Quel compromis Amina propose-t-elle ?",
          "options": [
            "Renoncer à toutes les sorties",
            "Laisser Paul tout décider",
            "Partager le choix et anticiper les décisions"
          ],
          "answer": 2,
          "explanation": "Taking turns and planning ahead address the disagreement.",
          "text": ""
        },
        {
          "skill": "Interaction",
          "prompt": "Quelle réponse fait avancer la discussion ?",
          "options": [
            "Essayons cette solution pendant un mois.",
            "Vous ne m’écoutez jamais, c’est fini.",
            "Le prix du billet est affiché."
          ],
          "answer": 0,
          "explanation": "A trial period is a concrete way to test the compromise.",
          "text": ""
        }
      ]
    },
    "B2": {
      "title": "Evaluate a news proposal",
      "text": "Pour réduire la circulation, la ville envisage de rendre certains bus gratuits le week-end. Les commerçants soutiennent l’idée, mais craignent une baisse de fréquentation si le stationnement est supprimé trop vite. Une association demande une période d’essai accompagnée d’un bilan public, plutôt qu’une généralisation immédiate.",
      "qs": [
        {
          "skill": "Reading",
          "prompt": "Quelle position résume celle des commerçants ?",
          "options": [
            "Un rejet sans réserve",
            "Un soutien assorti d’une inquiétude",
            "Une demande de fermer les bus"
          ],
          "answer": 1,
          "explanation": "They support the idea but worry about the pace of parking changes.",
          "text": ""
        },
        {
          "skill": "Reading",
          "prompt": "Pourquoi demander une période d’essai ?",
          "options": [
            "Pour supprimer toute évaluation",
            "Pour décider avant toute observation",
            "Pour évaluer les effets avant de généraliser"
          ],
          "answer": 2,
          "explanation": "A pilot period allows evidence to inform a wider decision.",
          "text": ""
        },
        {
          "skill": "Interaction",
          "prompt": "Quelle proposition répond aux réserves ?",
          "options": [
            "Testons la mesure et publions des indicateurs de fréquentation.",
            "Les commerçants n’ont rien à dire.",
            "Généralisons sans attendre les résultats."
          ],
          "answer": 0,
          "explanation": "A pilot and public measures respond to the request for evaluation.",
          "text": ""
        }
      ]
    },
    "C1": {
      "title": "Read a business argument",
      "text": "L’entreprise affiche une réduction spectaculaire du temps de traitement des demandes. Cette amélioration, obtenue par l’automatisation, n’est pas négligeable. Elle ne dit toutefois rien des dossiers que le système écarte d’emblée faute de correspondre aux catégories prévues. Évaluer la qualité du service à l’aune de sa seule rapidité revient ainsi à soustraire au bilan les situations les plus difficiles.",
      "qs": [
        {
          "skill": "Reading",
          "prompt": "Quelle limite l’auteur identifie-t-il ?",
          "options": [
            "Les cas exclus échappent à la mesure annoncée.",
            "Aucun traitement n’est devenu plus rapide.",
            "Les catégories n’existent pas."
          ],
          "answer": 0,
          "explanation": "The metric omits difficult cases the automated system rejects.",
          "text": ""
        },
        {
          "skill": "Reading",
          "prompt": "Quel rôle joue « n’est pas négligeable » ?",
          "options": [
            "Une négation de tout progrès",
            "Une certitude de réussite totale",
            "Une concession avant la critique"
          ],
          "answer": 2,
          "explanation": "The author acknowledges a benefit before limiting its significance.",
          "text": ""
        },
        {
          "skill": "Interaction",
          "prompt": "Quelle recommandation suit le raisonnement ?",
          "options": [
            "Mesurer uniquement les demandes rapides",
            "Intégrer les dossiers exclus à l’évaluation du service",
            "Cesser de répondre aux cas difficiles"
          ],
          "answer": 1,
          "explanation": "Including excluded cases addresses the blind spot in the metric.",
          "text": ""
        }
      ]
    },
    "C2": {
      "title": "Examine an implicit argument",
      "text": "Le comité assure n’avoir rien décidé qui ne soit réversible. Il s’appuie sur cette réversibilité pour présenter les changements comme dénués d’enjeu durable. L’argument aurait quelque force si revenir sur une décision suffisait à effacer les habitudes qu’elle installe, les attentes qu’elle suscite et les possibilités qu’elle referme. Or c’est précisément ce passage, de la révocabilité formelle à l’innocuité pratique, qui demeure sans justification.",
      "qs": [
        {
          "skill": "Reading",
          "prompt": "Quel glissement logique est critiqué ?",
          "options": [
            "Confondre réversibilité juridique et absence de conséquences durables",
            "Confondre décision collective et décision individuelle",
            "Affirmer que toute habitude est irréversible"
          ],
          "answer": 0,
          "explanation": "The author rejects the inference from formal reversibility to practical harmlessness.",
          "text": ""
        },
        {
          "skill": "Reading",
          "prompt": "Que suggère « aurait quelque force si » ?",
          "options": [
            "Une adhésion totale au comité",
            "Une concession hypothétique dont la condition est contestée",
            "L’absence de toute condition"
          ],
          "answer": 1,
          "explanation": "The conditional grants possible force only under an assumption the author challenges.",
          "text": ""
        },
        {
          "skill": "Interaction",
          "prompt": "Quelle reformulation respecte la critique ?",
          "options": [
            "Toute décision réversible est nécessairement nuisible.",
            "Le comité ne peut rien modifier.",
            "Une décision révocable peut néanmoins produire des effets persistants."
          ],
          "answer": 2,
          "explanation": "The critique allows durable effects without asserting that every reversible decision is harmful.",
          "text": ""
        }
      ]
    }
  }
};
