// Hotel app content, copied from the original learn.html scripts.

// The five starter realms at A1. Each word is [French, English, example sentence]; each dialog line is
// [prompt, translation, reply options, index of the right reply]. Only Hotel stays inside this app at A1;
// the other realms open their full lesson page.
export const a1Realms = [
  {
    id: 'hotel',
    name: 'Hotel',
    desc: 'Check in. Settle in. Feel at home.',
    mission: 'Check into a hotel and ask about your room.',
    color: '#e8d3b1',
    icon: 'HOTEL',
    words: [
      ['une réservation', 'A reservation', 'J’ai une réservation.'],
      ['une chambre', 'A room', 'Je voudrais une chambre.'],
      ['une clé', 'A key', 'Voici votre clé.'],
    ],
    challenge: ['J’ai ___ réservation.', ['une', 'un', 'des', 'du'], 0],
    dialog: [
      ['Bonjour ! Vous avez une réservation ?', 'Hello! Do you have a reservation?', ['Oui, j’ai une réservation.', 'Un café, merci.', 'Je prends le bus.'], 0],
      ['À quel nom, s’il vous plaît ?', 'Under what name, please?', ['Au nom de Martin.', 'À demain.', 'Il est midi.'], 0],
      ['Voici votre clé. Bon séjour !', 'Here is your key. Enjoy your stay!', ['Merci beaucoup !', 'Un aller simple.', 'Où est mon livre ?'], 0],
    ],
  },
  {
    id: 'cafe',
    name: 'Café',
    desc: 'Your favourite order, in a new language.',
    mission: 'Order a drink and pay in French.',
    color: '#e8c4af',
    icon: 'CAFÉ',
    words: [
      ['un café', 'Coffee', 'Je voudrais un café, s’il vous plaît.'],
      ['l’addition', 'The bill', 'L’addition, s’il vous plaît.'],
      ['de l’eau', 'Water', 'Je voudrais de l’eau.'],
    ],
    challenge: ['Je voudrais ___ thé.', ['un', 'une', 'des', 'du'], 0],
    dialog: [
      ['Bonjour ! Qu’est-ce que vous désirez ?', 'Hello! What would you like?', ['Je voudrais un café.', 'J’ai une réservation.', 'Voici mon livre.'], 0],
      ['Sur place ou à emporter ?', 'For here or to go?', ['À emporter, s’il vous plaît.', 'Je vais à l’école.', 'Il est dans mon sac.'], 0],
      ['Vous payez comment ?', 'How would you like to pay?', ['Par carte, s’il vous plaît.', 'Bonjour !', 'Un billet pour Lyon.'], 0],
    ],
  },
  {
    id: 'school',
    name: 'School',
    desc: 'Find your words, inside the classroom.',
    mission: 'Ask for classroom items and find the library.',
    color: '#cadde6',
    icon: 'ÉCOLE',
    words: [
      ['un cahier', 'A notebook', 'J’ai un cahier dans mon sac.'],
      ['un stylo', 'A pen', 'Je peux emprunter un stylo ?'],
      ['la bibliothèque', 'The library', 'Où est la bibliothèque ?'],
    ],
    challenge: ['Est-ce que je peux ___ un stylo ?', ['emprunter', 'manger', 'dormir', 'partir'], 0],
    dialog: [
      ['Bonjour ! Tu as ton cahier ?', 'Hello! Do you have your notebook?', ['Oui, il est dans mon sac.', 'Un café, merci.', 'Aller simple.'], 0],
      ['De quoi as-tu besoin ?', 'What do you need?', ['Je peux emprunter un stylo ?', 'Une chambre, merci.', 'Par carte.'], 0],
      ['La bibliothèque est à droite.', 'The library is on the right.', ['Merci beaucoup !', 'Je voudrais du pain.', 'Bon séjour !'], 0],
    ],
  },
  {
    id: 'transport',
    name: 'Transport',
    desc: 'Go places. Ask with confidence.',
    mission: 'Buy a ticket and find your platform.',
    color: '#c8d7db',
    icon: 'GARE',
    words: [
      ['un billet', 'A ticket', 'Je voudrais un billet pour Montréal.'],
      ['le quai', 'The platform', 'Le train est au quai deux.'],
      ['un aller-retour', 'A return ticket', 'Un aller-retour, s’il vous plaît.'],
    ],
    challenge: ['Tournez ___ à droite.', ['ensuite', 'hier', 'jamais', 'beaucoup'], 0],
    dialog: [
      ['Bonjour ! Où allez-vous ?', 'Hello! Where are you going?', ['Je vais à Montréal.', 'J’ai un cahier.', 'Un café.'], 0],
      ['Aller simple ou aller-retour ?', 'One way or return?', ['Aller simple, s’il vous plaît.', 'Dans mon sac.', 'Une chambre.'], 0],
      ['Votre train part du quai deux.', 'Your train leaves from platform two.', ['Merci ! À quelle heure ?', 'Je voudrais du lait.', 'Au nom de Martin.'], 0],
    ],
  },
  {
    id: 'life',
    name: 'Everyday Life',
    desc: 'Small moments. Meaningful connections.',
    mission: 'Shop for essentials and ask for help.',
    color: '#cddfc9',
    icon: 'MARCHÉ',
    words: [
      ['le pain', 'Bread', 'Je voudrais du pain, s’il vous plaît.'],
      ['le lait', 'Milk', 'Je voudrais du lait.'],
      ['le magasin', 'The shop', 'Le magasin est ouvert.'],
    ],
    challenge: ['Combien ___ ?', ['ça coûte', 'vous allez', 'il est', 'tu fais'], 0],
    dialog: [
      ['Bonjour ! Je peux vous aider ?', 'Hello! Can I help you?', ['Je voudrais du pain.', 'Un billet pour Lyon.', 'J’ai une réservation.'], 0],
      ['Vous désirez autre chose ?', 'Would you like anything else?', ['Du lait, s’il vous plaît.', 'Au quai deux.', 'Dans mon sac.'], 0],
      ['Vous payez comment ?', 'How are you paying?', ['Par carte, s’il vous plaît.', 'Bon séjour !', 'À l’école.'], 0],
    ],
  },
];

// A2 starter lessons: the same five realms with harder missions, words, challenge and dialog.
export const a2Overrides = [
  {
    mission: 'Explain a hotel problem and arrange a solution.',
    words: [
      ['la climatisation', 'Air conditioning', 'La climatisation ne fonctionne pas.'],
      ['une autre chambre', 'Another room', 'Est-ce que je pourrais avoir une autre chambre ?'],
      ['une nuit supplémentaire', 'An extra night', 'Je voudrais rester une nuit supplémentaire.'],
    ],
    challenge: ['Est-ce que vous ___ m’aider ?', ['pourriez', 'pouvons', 'suis', 'avez'], 0],
    dialog: [
      [
        'Bonsoir. Quel est le problème avec votre chambre ?',
        'Good evening. What is the problem with your room?',
        ['La climatisation ne fonctionne pas.', 'Je commande un billet.', 'La classe est grande.'],
        0,
      ],
      [
        'Nous pouvons vous proposer une autre chambre.',
        'We can offer you another room.',
        ['Est-ce qu’elle est au même étage ?', 'Je voudrais du pain.', 'Je vais en train.'],
        0,
      ],
      [
        'Oui. Souhaitez-vous prolonger votre séjour ?',
        'Yes. Would you like to extend your stay?',
        ['Oui, je voudrais rester une nuit supplémentaire.', 'Non, le café est froid.', 'Je prends le métro.'],
        0,
      ],
    ],
  },
  {
    mission: 'Explain a dietary preference and resolve an order problem.',
    words: [
      ['sans lait', 'Without milk', 'Je voudrais un café sans lait.'],
      ['une allergie', 'An allergy', 'J’ai une allergie aux noix.'],
      ['la commande', 'The order', 'Ce n’est pas ma commande.'],
    ],
    challenge: ['Je suis allergique ___ noix.', ['aux', 'à la', 'du', 'en'], 0],
    dialog: [
      ['Vous avez choisi ?', 'Have you decided?', ['Oui, mais j’ai une allergie aux noix.', 'Le train est parti.', 'Ma chambre est petite.'], 0],
      [
        'Nous avons un gâteau sans noix.',
        'We have a cake without nuts.',
        ['Très bien. Je vais en prendre une part.', 'Voici mon billet.', 'Où est le quai ?'],
        0,
      ],
      [
        'Voici votre café au lait.',
        'Here is your coffee with milk.',
        ['Excusez-moi, j’avais demandé un café sans lait.', 'Je suis à l’école.', 'La clé est ici.'],
        0,
      ],
    ],
  },
  {
    mission: 'Discuss a missed class and ask for help with homework.',
    words: [
      ['les devoirs', 'Homework', 'Je n’ai pas compris les devoirs.'],
      ['une explication', 'An explanation', 'Pourriez-vous donner une explication ?'],
      ['absent', 'Absent', 'J’étais absent hier.'],
    ],
    challenge: ['Hier, je ___ absent.', ['étais', 'suis', 'vais', 'serai'], 0],
    dialog: [
      ['Tu n’étais pas en classe hier ?', 'You weren’t in class yesterday?', ['Non, j’étais malade.', 'Un billet, merci.', 'Je paie par carte.'], 0],
      [
        'Nous avons commencé un nouveau chapitre.',
        'We started a new chapter.',
        ['Est-ce que tu pourrais me prêter tes notes ?', 'Je voudrais une chambre.', 'Je prends du lait.'],
        0,
      ],
      [
        'Bien sûr. Tu as compris les devoirs ?',
        'Of course. Did you understand the homework?',
        ['Pas tout à fait. Peux-tu m’expliquer le premier exercice ?', 'Je vais à Montréal.', 'Bon séjour !'],
        0,
      ],
    ],
  },
  {
    mission: 'Handle a delayed train and change your travel plans.',
    words: [
      ['un retard', 'A delay', 'Le train a vingt minutes de retard.'],
      ['une correspondance', 'A connection', 'Je vais manquer ma correspondance.'],
      ['un remboursement', 'A refund', 'Est-ce que je peux avoir un remboursement ?'],
    ],
    challenge: ['Si le train est annulé, je ___ le bus.', ['prendrai', 'prenais', 'pris', 'prendre'], 0],
    dialog: [
      [
        'Votre train a trente minutes de retard.',
        'Your train is thirty minutes late.',
        ['Je risque de manquer ma correspondance.', 'Ma chambre est froide.', 'Je voudrais du pain.'],
        0,
      ],
      [
        'Il y a un autre train à quinze heures.',
        'There is another train at three o’clock.',
        ['Est-ce que mon billet est valable pour ce train ?', 'Le café est bon.', 'Je suis absent.'],
        0,
      ],
      [
        'Oui, mais vous devez changer à Lyon.',
        'Yes, but you must change in Lyon.',
        ['D’accord. Sur quel quai dois-je aller ?', 'Je voudrais du lait.', 'Voici mes devoirs.'],
        0,
      ],
    ],
  },
  {
    mission: 'Return a purchase and explain what you need.',
    words: [
      ['un reçu', 'A receipt', 'J’ai gardé le reçu.'],
      ['un échange', 'An exchange', 'Je voudrais faire un échange.'],
      ['trop petit', 'Too small', 'Ce pull est trop petit.'],
    ],
    challenge: ['Je l’ai acheté ___.', ['hier', 'demain', 'bientôt', 'la semaine prochaine'], 0],
    dialog: [
      [
        'Bonjour, je peux vous aider ?',
        'Hello, can I help you?',
        ['Oui, je voudrais échanger ce pull.', 'Le train est en retard.', 'Ma chambre est prête.'],
        0,
      ],
      [
        'Quel est le problème ?',
        'What is the problem?',
        ['Il est trop petit. Avez-vous une taille plus grande ?', 'Je prends un billet.', 'J’ai des devoirs.'],
        0,
      ],
      ['Bien sûr. Vous avez le reçu ?', 'Of course. Do you have the receipt?', ['Oui, le voici. Je l’ai acheté hier.', 'Au quai deux.', 'Sans lait.'], 0],
    ],
  },
];

export function realmsFor(level) {
  return a1Realms.map((r, i) => ({ ...r, ...(level === 'A2' ? a2Overrides[i] : {}) }));
}

// The four conversation questions at the end of an A1 Hotel session.
export const hotelDialogues = [
  {
    title: 'Check-in · choose the receptionist’s reply',
    prompt: 'Bonsoir. J’ai une réservation au nom de Martin Dupont.',
    translation: 'Good evening. I have a reservation under the name Martin Dupont.',
    options: ['Bonsoir monsieur. Bienvenue. Je vais vérifier votre réservation.', 'Les toilettes sont à votre gauche.', 'Voici votre facture.'],
    answer: 0,
    example: 'Puis-je voir une pièce d’identité, s’il vous plaît ?',
    type: 'Conversation',
    scene: 'Reception desk',
  },
  {
    title: 'Directions · choose the staff member’s reply',
    prompt: 'Excusez-moi, où sont les toilettes ?',
    translation: 'Excuse me, where are the washrooms?',
    options: ['Les toilettes sont à votre gauche, à côté de l’ascenseur.', 'Voici mon passeport.', 'Je voudrais payer maintenant.'],
    answer: 0,
    example: 'Les toilettes sont à votre gauche, à côté de l’ascenseur.',
    type: 'Conversation',
    scene: 'Elevator / Hallway',
  },
  {
    title: 'Breakfast · choose the receptionist’s reply',
    prompt: 'Est-ce que le petit-déjeuner est inclus ?',
    translation: 'Is breakfast included?',
    options: ['Oui. Le petit-déjeuner est servi de 6 h 30 à 10 h.', 'Je vais vérifier votre passeport.', 'Voici la carte-clé.'],
    answer: 0,
    example: 'Le restaurant est au rez-de-chaussée, près du hall.',
    type: 'Conversation',
    scene: 'Breakfast area / Restaurant',
  },
  {
    title: 'Checkout · choose the receptionist’s reply',
    prompt: 'Bonjour. Je voudrais payer maintenant.',
    translation: 'Hello. I would like to pay now.',
    options: ['Bien sûr. Vous payez par carte ?', 'Votre chambre est au troisième étage.', 'Les toilettes sont à gauche.'],
    answer: 0,
    example: 'Voici votre facture.',
    type: 'Conversation',
    scene: 'Reception desk / Checkout',
  },
];

// The two scripted conversations in the Hotel player. Each line is [speaker, French, English, visual cue].
export const hotelConversations = {
  booking: {
    title: 'Booking a room',
    subtitle: 'Booking a room at reception',
    lines: [
      ['desk', 'Bonjour, Hôtel Bellevue. Comment puis-je vous aider ?', 'Hello, Hotel Bellevue. How can I help you?', 'phone'],
      ['guest', 'Bonjour. Je voudrais réserver une chambre, s’il vous plaît.', 'Hello. I would like to book a room, please.', 'phone'],
      ['desk', 'Pour quelles dates ?', 'For which dates?', 'phone'],
      ['guest', 'Du quinze au dix-sept novembre, pour deux nuits.', 'From November fifteenth to seventeenth, for two nights.', 'phone'],
      ['desk', 'Pour combien de personnes ?', 'For how many people?', 'phone'],
      ['guest', 'Pour deux adultes. Est-ce que le petit-déjeuner est inclus ?', 'For two adults. Is breakfast included?', 'phone'],
      [
        'desk',
        'Oui. La chambre coûte cent vingt dollars par nuit, petit-déjeuner inclus.',
        'Yes. The room costs one hundred and twenty dollars per night, including breakfast.',
        'phone',
      ],
      ['guest', 'Très bien. Je voudrais réserver.', 'Very good. I would like to book.', 'phone'],
      ['desk', 'À quel nom, s’il vous plaît ?', 'Under what name, please?', 'phone'],
      ['guest', 'Au nom de Martin Dupont.', 'Under the name Martin Dupont.', 'phone'],
      [
        'desk',
        'Merci. Votre réservation est confirmée : deux nuits pour deux personnes.',
        'Thank you. Your reservation is confirmed: two nights for two people.',
        'phone',
      ],
      ['guest', 'Merci beaucoup. Au revoir !', 'Thank you very much. Goodbye!', 'wave'],
    ],
  },
  checkin: {
    title: 'Checking in at the hotel',
    subtitle: 'A guest arrives at reception',
    lines: [
      ['desk', 'Bonsoir, bienvenue à l’Hôtel Bellevue !', 'Good evening, welcome to Hotel Bellevue!', 'wave'],
      ['guest', 'Bonsoir. J’ai une réservation au nom de Martin Dupont.', 'Good evening. I have a reservation under the name Martin Dupont.', 'booking'],
      ['desk', 'Un instant, s’il vous plaît. Je vais vérifier votre réservation.', 'One moment, please. I’ll check your reservation.', 'computer'],
      ['desk', 'Oui, une chambre pour deux personnes, pour deux nuits.', 'Yes, a room for two people, for two nights.', 'computer'],
      ['guest', 'Oui, c’est bien ça.', 'Yes, that’s right.', 'nod'],
      ['desk', 'Puis-je voir une pièce d’identité, s’il vous plaît ?', 'May I see a piece of ID, please?', 'id'],
      ['guest', 'Bien sûr. Voici mon passeport.', 'Of course. Here is my passport.', 'passport'],
      [
        'desk',
        'Merci. Votre chambre est au troisième étage. Voici votre carte-clé.',
        'Thank you. Your room is on the third floor. Here is your key card.',
        'key',
      ],
      ['guest', 'Merci. Où est l’ascenseur ?', 'Thank you. Where is the elevator?', 'direction'],
      ['desk', 'L’ascenseur est à votre droite, près de la réception.', 'The elevator is on your right, near reception.', 'direction'],
      ['guest', 'Et à quelle heure est le petit-déjeuner ?', 'And what time is breakfast?', 'breakfast'],
      [
        'desk',
        'Le petit-déjeuner est servi de six heures trente à dix heures, au rez-de-chaussée.',
        'Breakfast is served from six thirty to ten o’clock, on the ground floor.',
        'breakfast',
      ],
      ['guest', 'Parfait. Merci beaucoup !', 'Perfect. Thank you very much!', 'nod'],
      ['desk', 'Avec plaisir. Bon séjour !', 'You’re welcome. Enjoy your stay!', 'wave'],
    ],
  },
};

// Recorded video for the first three check-in turns; other turns use the illustration and system speech.
export const hotelVideoClips = {
  0: '/assets/hotel-video/hotel-checkin-01.mp4',
  1: '/assets/hotel-video/hotel-checkin-02.mp4',
  2: '/assets/hotel-video/hotel-checkin-03.mp4',
};
export const TOTAL_PLANNED_CLIPS = 14;

export const sceneAssets = {
  hotel: '/assets/hotel-conversation-v2.png',
  cafe: '/assets/cafe-scene-v2.png',
  school: '/assets/school-scene-v2.png',
  transport: '/assets/transport-scene-v2.png',
  life: '/assets/life-scene-v2.png',
};

export const sceneDescriptions = {
  hotel: 'A receptionist and guest at a welcoming hotel front desk.',
  cafe: 'A barista serves a customer in a warm café.',
  school: 'A teacher and adult learner share a book in the classroom.',
  transport: 'A ticket agent helps a traveller at the station.',
  life: 'A shopkeeper helps a customer buy groceries.',
};
