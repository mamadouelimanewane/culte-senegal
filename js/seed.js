/* ════════════════════════════════════════════════════════════════
   CULTE — Données de démonstration africaines / sénégalaises
   Exécuté une seule fois (flag culte_demo_seeded)
   ════════════════════════════════════════════════════════════════ */
(function seedDemo() {
  'use strict';
  if (localStorage.getItem('culte_demo_seeded') === '5') return; // version tag

  /* ── Images Unsplash – thèmes africains ──────────────────────── */
  const IMG = {
    // Galeries / art
    galAtiss1:  'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800&q=80',
    galAtiss2:  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
    galAtiss3:  'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=800&q=80',
    galAtiss4:  'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=800&q=80',
    // Cinéma / spectacle
    cinema1:    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    cinema2:    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80',
    cinema3:    'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
    // Culture / danse / musique africaine
    culture1:   'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
    culture2:   'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
    culture3:   'https://images.unsplash.com/photo-1612965607446-25e1332775ae?w=800&q=80',
    culture4:   'https://images.unsplash.com/photo-1576153192621-7a3be10b356e?w=800&q=80',
    // Musée / art contemporain africain
    musee1:     'https://images.unsplash.com/photo-1580181013706-63d5c0f21e98?w=800&q=80',
    musee2:     'https://images.unsplash.com/photo-1564449572462-2c7bba9d3e25?w=800&q=80',
    musee3:     'https://images.unsplash.com/photo-1503479327422-1db85f1b46fe?w=800&q=80',
    // Sénégal / Dakar
    dakar1:     'https://images.unsplash.com/photo-1627552244573-fc77c028e74f?w=800&q=80',
    dakar2:     'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800&q=80',
    // Tissu wax / artisanat
    wax1:       'https://images.unsplash.com/photo-1573166475912-1ed8b4f093d2?w=800&q=80',
    wax2:       'https://images.unsplash.com/photo-1614622958289-f70a91e2b55e?w=800&q=80',
    // Musique africaine
    music1:     'https://images.unsplash.com/photo-1583912267550-d974498571e4?w=800&q=80',
    music2:     'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    // Portrait africain
    portrait1:  'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=800&q=80',
    portrait2:  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=800&q=80',
    // Art contemporain / peintures africaines
    artContemp1:   'https://images.unsplash.com/photo-1596449879634-9da7e98a4572?w=800&q=80',
    artContemp2:   'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=800&q=80',
    // Expositions / galeries (murs blancs + œuvres)
    expo1:         'https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=800&q=80',
    expo2:         'https://images.unsplash.com/photo-1503479327422-1db85f1b46fe?w=800&q=80',
    // Sculpture / céramique africaine
    sculpture1:    'https://images.unsplash.com/photo-1564449572462-2c7bba9d3e25?w=800&q=80',
    sculpture2:    'https://images.unsplash.com/photo-1580181013706-63d5c0f21e98?w=800&q=80',
    // Cinéma / salle de projection intérieur
    cinemaSalle:   'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80',
    cinemaFoyer:   'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
    cinemaPublic:  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
    // Spectacle / danse / ballet africain sur scène
    spectacle1:    'https://images.unsplash.com/photo-1576153192621-7a3be10b356e?w=800&q=80',
    spectacle2:    'https://images.unsplash.com/photo-1473177104440-ac316b21d68a?w=800&q=80',
    spectacle3:    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80',
    // Atelier / workshop arts plastiques
    atelier1:      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    // Textile africain / peinture sous verre / batik
    textile1:      'https://images.unsplash.com/photo-1614622958289-f70a91e2b55e?w=800&q=80',
    textile2:      'https://images.unsplash.com/photo-1573166475912-1ed8b4f093d2?w=800&q=80',
    // Architecture bâtiment culturel
    archi1:        'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80',
    // Jardins / espaces extérieurs culturels
    jardin1:       'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=800&q=80',
  };

  const now  = new Date();
  const d    = s => new Date(Date.now() + s * 86400000).toISOString().slice(0, 10);
  const ts   = (minus = 0) => new Date(Date.now() - minus * 3600000).toISOString();

  /* ══════════════════════════════════════════════════════════════
     RESPONSABLES (4 comptes approuvés)
  ══════════════════════════════════════════════════════════════ */
  const responsables = [
    {
      id: 'resp_demo_001',
      nom: 'Fatou Diallo',
      email: 'fatou@culte.sn',
      tel: '+221 77 345 67 89',
      pwd: 'demo2024',
      infraId: 856,
      infraNom: 'GALERIE ATISS DAKAR',
      region: 'DAKAR',
      statut: 'active',
      dateCreation: ts(720),
    },
    {
      id: 'resp_demo_002',
      nom: 'Mamadou Ndiaye',
      email: 'mamadou@culte.sn',
      tel: '+221 76 234 56 78',
      pwd: 'demo2024',
      infraId: 858,
      infraNom: 'CINÉMA MÉDINA',
      region: 'DAKAR',
      statut: 'active',
      dateCreation: ts(600),
    },
    {
      id: 'resp_demo_003',
      nom: 'Aminata Sarr',
      email: 'aminata@culte.sn',
      tel: '+221 70 123 45 67',
      pwd: 'demo2024',
      infraId: 860,
      infraNom: 'MAISON DE LA CULTURE DOUTA SECK',
      region: 'DAKAR',
      statut: 'active',
      dateCreation: ts(480),
    },
    {
      id: 'resp_demo_004',
      nom: 'Ibrahima Thiaw',
      email: 'ibrahima@culte.sn',
      tel: '+221 78 567 89 01',
      pwd: 'demo2024',
      infraId: 868,
      infraNom: 'MUSÉE BORIBANA ART CONTEMPORAIN AFRICAIN',
      region: 'DAKAR',
      statut: 'active',
      dateCreation: ts(360),
    },
  ];

  /* ══════════════════════════════════════════════════════════════
     REGISTRATIONS (demandes approuvées + 1 en attente)
  ══════════════════════════════════════════════════════════════ */
  const registrations = [
    {
      id: 'reg_demo_001', nom: 'Fatou Diallo', email: 'fatou@culte.sn',
      tel: '+221 77 345 67 89', pwd: 'demo2024',
      infraId: 856, infraNom: 'GALERIE ATISS DAKAR', region: 'DAKAR',
      justification: 'Je suis directrice artistique de la Galerie ATISS Dakar depuis 2018. Cette galerie spécialisée dans l\'art contemporain africain accueille des artistes sénégalais et de toute l\'Afrique subsaharienne. Je souhaite promouvoir nos expositions et événements via cette plateforme.',
      statut: 'approved', dateInscription: ts(720), noteAdmin: 'Dossier complet, bienvenue !',
    },
    {
      id: 'reg_demo_002', nom: 'Mamadou Ndiaye', email: 'mamadou@culte.sn',
      tel: '+221 76 234 56 78', pwd: 'demo2024',
      infraId: 858, infraNom: 'CINÉMA MÉDINA', region: 'DAKAR',
      justification: 'Gérant du Cinéma Médina depuis 2015, l\'un des cinémas historiques de Dakar. Nous organisons régulièrement le Festival du Film Africain de Dakar et des projections spéciales pour la jeunesse sénégalaise.',
      statut: 'approved', dateInscription: ts(600), noteAdmin: 'Approuvé. Bon courage pour la saison !',
    },
    {
      id: 'reg_demo_003', nom: 'Aminata Sarr', email: 'aminata@culte.sn',
      tel: '+221 70 123 45 67', pwd: 'demo2024',
      infraId: 860, infraNom: 'MAISON DE LA CULTURE DOUTA SECK', region: 'DAKAR',
      justification: 'Coordinatrice culturelle à la Maison de la Culture Douta Seck. Ce centre est un pilier de la vie culturelle dakaroise depuis sa création. Nous accueillons concerts, spectacles de danse, ateliers pour enfants et expositions tout au long de l\'année.',
      statut: 'approved', dateInscription: ts(480), noteAdmin: 'Institution de référence. Approuvé.',
    },
    {
      id: 'reg_demo_004', nom: 'Ibrahima Thiaw', email: 'ibrahima@culte.sn',
      tel: '+221 78 567 89 01', pwd: 'demo2024',
      infraId: 868, infraNom: 'MUSÉE BORIBANA ART CONTEMPORAIN AFRICAIN', region: 'DAKAR',
      justification: 'Conservateur du Musée Boribana, dédié à l\'art contemporain africain. Le musée présente des œuvres d\'artistes africains émergents et établis dans un écrin moderne face à l\'Atlantique à Ngor.',
      statut: 'approved', dateInscription: ts(360), noteAdmin: 'Musée de qualité internationale. Bienvenue !',
    },
    {
      id: 'reg_demo_005', nom: 'Aissatou Balde', email: 'aissatou@culte.sn',
      tel: '+221 77 891 23 45', pwd: 'demo2024',
      infraId: 863, infraNom: 'ATELIER D\'ARTS', region: 'DAKAR',
      justification: 'Fondatrice et responsable de l\'Atelier d\'Arts de Mermoz Sacré-Cœur. Nous proposons des cours de peinture, sculpture et arts plastiques ouverts à tous les âges, en valorisant les techniques artistiques africaines traditionnelles et contemporaines.',
      statut: 'pending', dateInscription: ts(48), noteAdmin: '',
    },
  ];

  /* ══════════════════════════════════════════════════════════════
     CONTENU PUBLIÉ (culte_site_content)
  ══════════════════════════════════════════════════════════════ */
  const siteContent = {

    /* ── GALERIE ATISS DAKAR (856) ───────────────────────────── */
    '856': {
      description: `La Galerie ATISS (Association pour le Développement de la Technologie, de l'Innovation, des Sciences et des Savoirs) est l'une des plus importantes galeries d'art contemporain africain à Dakar.

Fondée en 1991, ATISS s'est imposée comme un carrefour incontournable de la création artistique sénégalaise et africaine. Notre espace de 450 m² accueille des expositions temporaires, des installations et des performances d'artistes émergents et confirmés du continent.

Nous défendons une vision de l'art africain ancré dans son temps : dialogue entre traditions ancestrales et modernité, entre le local et le global. Chaque exposition est pensée comme une invitation au voyage intérieur et à la découverte de nouvelles perspectives sur le monde contemporain africain.`,
      horaires: 'Mardi – Samedi : 10h00 – 18h00 | Dimanche : 14h00 – 18h00 | Lundi : Fermé',
      telephone: '+221 33 821 45 78',
      email: 'contact@atiss-dakar.sn',
      website: 'https://atiss-dakar.sn',
      gallery: [
        { id: 'gal_856_1', url: IMG.galAtiss1, caption: 'Exposition "Regards d\'Afrique" — Peintures contemporaines sénégalaises', dateAdded: ts(200) },
        { id: 'gal_856_2', url: IMG.galAtiss2, caption: 'Sculptures en bronze — Artistes de l\'Afrique de l\'Ouest', dateAdded: ts(180) },
        { id: 'gal_856_3', url: IMG.galAtiss3, caption: 'Installation "Mémoires du Fleuve" — Ibou Diallo, 2024', dateAdded: ts(120) },
        { id: 'gal_856_4', url: IMG.wax1, caption: 'Tissages et textiles wax — Collection permanente', dateAdded: ts(90) },
        { id: 'gal_856_5', url: IMG.portrait1, caption: 'Portraits d\'Afrique — Série photographique de Seydou Diao', dateAdded: ts(45) },
        { id: 'gal_856_6', url: IMG.expo1,        caption: 'Vue d\'ensemble de la grande salle — 45 œuvres exposées', dateAdded: ts(30) },
        { id: 'gal_856_7', url: IMG.artContemp1,  caption: 'Peintures acryliques grand format — Collection "Négritude Urbaine"', dateAdded: ts(20) },
        { id: 'gal_856_8', url: IMG.textile1,     caption: 'Peinture sous verre souwèr — Artistes de l\'école de Dakar', dateAdded: ts(10) },
        { id: 'gal_856_9', url: IMG.atelier1,     caption: 'Atelier pédagogique ouvert au public — Samedi créatif', dateAdded: ts(5) },
      ],
      events: [
        {
          id: 'ev_856_1',
          titre: 'Vernissage "Dakar Demain" — Art Urbain Africain',
          dateDebut: d(5),
          dateFin: d(35),
          lieu: 'Galerie ATISS — Médina, Dakar',
          description: 'Grande exposition collective réunissant 18 artistes urbains de 12 pays africains. Graffs, peintures murales, sculptures et installations explorent les mutations des métropoles africaines. Vernissage le 15 mars avec présence des artistes, DJ set afro-électronique et cocktail dinatoire.',
          photos: [IMG.galAtiss1, IMG.dakar1],
        },
        {
          id: 'ev_856_2',
          titre: 'Atelier Initiation à la Peinture sur Verre (Souwèr)',
          dateDebut: d(12),
          dateFin: d(12),
          lieu: 'Espace ateliers — Galerie ATISS, 1er étage',
          description: 'Découvrez la peinture sous verre, technique emblématique de l\'art populaire sénégalais. L\'artiste Khady Sylla vous guidera dans la réalisation de votre propre œuvre en 3 heures. Matériel fourni. Places limitées à 15 participants — Réservation obligatoire.',
          photos: [IMG.galAtiss2],
        },
        {
          id: 'ev_856_3',
          titre: 'Table ronde : "L\'Art Africain à l\'Ère Numérique"',
          dateDebut: d(-10),
          dateFin: d(-10),
          lieu: 'Salle de conférence ATISS',
          description: 'Débat passionnant avec des artistes, galeristes et collectionneurs sur l\'impact du numérique sur la création et le marché de l\'art africain. NFT, expositions virtuelles, réseaux sociaux : opportunités et risques.',
          photos: [],
        },
      ],
      actus: [
        {
          id: 'ac_856_1',
          titre: 'ATISS récompensée au Prix de l\'Excellence Culturelle Africaine 2024',
          contenu: 'C\'est avec une immense fierté que la Galerie ATISS a reçu le Prix de l\'Excellence Culturelle Africaine lors de la cérémonie tenue à Abidjan. Cette distinction récompense 30 ans d\'engagement pour la promotion des arts visuels africains et le soutien aux artistes émergents du continent.',
          photo: IMG.galAtiss4,
          date: ts(72),
        },
        {
          id: 'ac_856_2',
          titre: 'Acquisition de 12 nouvelles œuvres pour la collection permanente',
          contenu: 'Grâce au soutien du Ministère de la Culture et du Tourisme, la Galerie ATISS enrichit sa collection permanente avec 12 œuvres majeures d\'artistes sénégalais des générations 1970-2000. Ces acquisitions seront visibles dès le mois d\'avril.',
          photo: IMG.wax2,
          date: ts(168),
        },
      ],
      updatedAt: ts(24),
    },

    /* ── CINÉMA MÉDINA (858) ─────────────────────────────────── */
    '858': {
      description: `Le Cinéma Médina est l'un des fleurons du patrimoine cinématographique dakarois. Inauguré en 1961, cet espace emblématique de la Médina a accompagné des générations de Dakarois dans leur découverte du 7e art.

Entièrement rénové en 2019, le cinéma dispose aujourd'hui de deux salles modernes (380 et 120 places) offrant une expérience audio-visuelle de qualité tout en conservant l'âme et l'histoire du lieu.

Le Cinéma Médina se distingue par son engagement fort pour le cinéma africain : projections hebdomadaires de films sénégalais et africains, partenariats avec les écoles de cinéma, séances scolaires à tarif réduit et organisation annuelle du Festival du Film Africain de Dakar (FFAD).`,
      horaires: 'Du Lundi au Dimanche : 15h00, 18h00 et 21h00 | Matinées le week-end : 11h00',
      telephone: '+221 33 822 67 90',
      email: 'billetterie@cinema-medina.sn',
      website: 'https://cinema-medina.sn',
      gallery: [
        { id: 'gal_858_1', url: IMG.cinema1, caption: 'La grande salle du Cinéma Médina rénovée (380 places)', dateAdded: ts(300) },
        { id: 'gal_858_2', url: IMG.cinema2, caption: 'Séance de projection lors du Festival du Film Africain', dateAdded: ts(200) },
        { id: 'gal_858_3', url: IMG.cinema3, caption: 'Façade historique du Cinéma Médina — Monument de la Médina', dateAdded: ts(150) },
        { id: 'gal_858_4', url: IMG.dakar2, caption: 'Soirée de gala en plein air sur le parvis', dateAdded: ts(60) },
        { id: 'gal_858_5', url: IMG.cinemaSalle,  caption: 'Salle de projection principale — 380 fauteuils VIP en cuir', dateAdded: ts(120) },
        { id: 'gal_858_6', url: IMG.cinemaPublic, caption: 'Public enthousiaste lors du Festival du Film Africain de Dakar', dateAdded: ts(80) },
        { id: 'gal_858_7', url: IMG.cinemaFoyer,  caption: 'Hall d\'entrée historique — Mosaïques originales de 1961 restaurées', dateAdded: ts(40) },
        { id: 'gal_858_8', url: IMG.dakar1,       caption: 'Projection en plein air sur le parvis — Cinéma sous les étoiles', dateAdded: ts(15) },
      ],
      events: [
        {
          id: 'ev_858_1',
          titre: '11e Festival du Film Africain de Dakar (FFAD 2026)',
          dateDebut: d(20),
          dateFin: d(27),
          lieu: 'Cinéma Médina + Plein air Place de la Médina',
          description: '7 jours de cinéma africain avec 45 films en compétition représentant 28 pays du continent. La sélection 2026 met à l\'honneur les nouvelles voix du cinéma féminin africain. Invités d\'honneur : Maïmouna Doucouré (France/Sénégal) et Léonie Boro (Burkina Faso). Entrée libre pour certaines projections.',
          photos: [IMG.cinema1, IMG.cinema2],
        },
        {
          id: 'ev_858_2',
          titre: 'Séance Spéciale : "Hyènes" de Djibril Diop Mambéty — Version restaurée 4K',
          dateDebut: d(3),
          dateFin: d(3),
          lieu: 'Grande Salle — Cinéma Médina',
          description: 'Projection exceptionnelle de la version restaurée 4K du chef-d\'œuvre de Djibril Diop Mambéty (1992), réalisée par la Fondation Mambéty et le Centre National du Cinéma. Débat en présence de la sœur du réalisateur, Mati Diop, cinéaste et Lion d\'Or à Cannes. Réservation conseillée.',
          photos: [IMG.cinema3],
        },
        {
          id: 'ev_858_3',
          titre: 'Ciné-Club Jeunes : "Yaaba" de Idrissa Ouédraogo',
          dateDebut: d(-5),
          dateFin: d(-5),
          lieu: 'Petite Salle (120 places) — Cinéma Médina',
          description: 'Dans le cadre de notre programme d\'éducation à l\'image, projection du film burkinabè "Yaaba" (1989) suivie d\'un atelier d\'analyse filmique animé par des étudiants de l\'ISCA (Institut Supérieur des Arts et de la Culture). Ouvert aux 13-25 ans. Entrée gratuite.',
          photos: [],
        },
      ],
      actus: [
        {
          id: 'ac_858_1',
          titre: 'Réouverture après 3 mois de rénovation — Un écrin modernisé',
          contenu: 'Le Cinéma Médina rouvre ses portes après une rénovation complète de ses équipements de projection : nouveau système son Dolby Atmos, écrans LED 4K, climatisation silencieuse et sièges ergonomiques. L\'histoire du cinéma sénégalais reprend vie dans un écrin contemporain.',
          photo: IMG.cinema2,
          date: ts(240),
        },
        {
          id: 'ac_858_2',
          titre: 'Le FFAD 2026 annonce sa sélection officielle',
          contenu: '45 films retenus sur 380 soumissions du monde entier. Le jury international 2026, présidé par le réalisateur guinéen Gahité Fofana, rendra son verdict le 27 mars. La Compétition Officielle inclut 8 premiers films — un record pour le festival.',
          photo: IMG.dakar1,
          date: ts(120),
        },
      ],
      updatedAt: ts(48),
    },

    /* ── MAISON DE LA CULTURE DOUTA SECK (860) ──────────────── */
    '860': {
      description: `La Maison de la Culture Douta Seck est le principal centre culturel de la Médina et l'un des hauts lieux de la vie artistique dakaroise. Baptisée en hommage au grand comédien sénégalais Douta Seck (1922-2003), pionnier du théâtre africain moderne, la maison perpétue son héritage d'excellence et d'accessibilité culturelle.

Dotée d'une grande salle de spectacle (600 places), d'une salle polyvalente, d'ateliers et d'un espace extérieur, la Maison de la Culture Douta Seck accueille chaque année plus de 200 événements : concerts de musique mbalax, sabar et jazz afro, spectacles de danse contemporaine et traditionnelle, pièces de théâtre, festivals, expositions et ateliers pour enfants.

Notre mission : rendre la culture accessible à tous les Dakarois, préserver et transmettre les arts vivants sénégalais, et offrir une scène de qualité aux artistes locaux.`,
      horaires: 'Lundi – Vendredi : 9h00 – 20h00 | Samedi : 10h00 – 22h00 | Dimanche : 14h00 – 20h00',
      telephone: '+221 33 823 11 55',
      email: 'info@maisondoutaseck.sn',
      website: 'https://maisondoutaseck.sn',
      gallery: [
        { id: 'gal_860_1', url: IMG.culture1, caption: 'Spectacle de danse contemporaine africaine — Compagnie Jant-Bi', dateAdded: ts(250) },
        { id: 'gal_860_2', url: IMG.culture2, caption: 'Concert de musique mbalax — Grande Salle Douta Seck (600 places)', dateAdded: ts(200) },
        { id: 'gal_860_3', url: IMG.music1, caption: 'Percussions sabar — Festival Rythmes d\'Afrique', dateAdded: ts(140) },
        { id: 'gal_860_4', url: IMG.culture3, caption: 'Atelier de théâtre pour enfants — Programme éducatif', dateAdded: ts(80) },
        { id: 'gal_860_5', url: IMG.culture4, caption: 'Soirée de gala annuelle — Hommage à Douta Seck', dateAdded: ts(30) },
        { id: 'gal_860_6', url: IMG.spectacle1,   caption: 'Grande salle Douta Seck (600 places) — Soirée de gala nationale', dateAdded: ts(25) },
        { id: 'gal_860_7', url: IMG.spectacle2,   caption: 'Répétition du Ballet National du Sénégal — Lumières de scène', dateAdded: ts(18) },
        { id: 'gal_860_8', url: IMG.spectacle3,   caption: 'Festival Panafricain de Danse — Compagnies de 8 pays africains', dateAdded: ts(10) },
        { id: 'gal_860_9', url: IMG.music2,       caption: 'Atelier de chant traditionnel — Griottes et voix du terroir', dateAdded: ts(4) },
      ],
      events: [
        {
          id: 'ev_860_1',
          titre: 'Festival "Rythmes d\'Afrique" — Édition 2026',
          dateDebut: d(8),
          dateFin: d(11),
          lieu: 'Maison de la Culture Douta Seck & Esplanade extérieure',
          description: '4 jours de musiques et danses africaines avec 22 compagnies de 15 pays. Au programme : concerts de kora, balafon, sabar, djembé, soirées dansantes afrobeat, ateliers percussions ouverts au public et conférence sur les rythmes traditionnels du Sahel. Entrée libre pour les moins de 18 ans.',
          photos: [IMG.music1, IMG.culture2, IMG.culture1],
        },
        {
          id: 'ev_860_2',
          titre: 'Spectacle : "Ndëpp" — Compagnie Jant-Bi',
          dateDebut: d(16),
          dateFin: d(17),
          lieu: 'Grande Salle Douta Seck',
          description: 'La compagnie Jant-Bi présente "Ndëpp", une création chorégraphique inspirée des rituels de guérison lébou. Ce spectacle mêle danse contemporaine, transe théâtrale et musique live pour explorer les liens entre corps, mémoire collective et spiritualité africaine. Chorégraphie de Germaine Acogny.',
          photos: [IMG.culture1],
        },
        {
          id: 'ev_860_3',
          titre: 'Hommage à Youssou Ndour — Concert de gala',
          dateDebut: d(-20),
          dateFin: d(-20),
          lieu: 'Grande Salle Douta Seck',
          description: 'Soirée exceptionnelle en hommage au génie musical de Youssou Ndour avec des reprises par des artistes de la nouvelle génération. Un voyage à travers 40 ans de mbalax, world music et jazz afro. Sold out en 48h — liste d\'attente ouverte.',
          photos: [IMG.music2, IMG.culture2],
        },
      ],
      actus: [
        {
          id: 'ac_860_1',
          titre: 'La Maison Douta Seck labellisée "Patrimoine Culturel Vivant du Sénégal"',
          contenu: 'Le Ministère de la Culture et du Patrimoine Historique a officiellement labellisé la Maison de la Culture Douta Seck "Patrimoine Culturel Vivant du Sénégal" lors de la Journée Nationale de la Culture. Cette reconnaissance témoigne de l\'importance de cet espace dans la vie artistique et sociale du pays.',
          photo: IMG.culture4,
          date: ts(360),
        },
        {
          id: 'ac_860_2',
          titre: 'Nouveau programme d\'ateliers gratuits pour la jeunesse dakaroise',
          contenu: 'À partir du 1er avril, la Maison de la Culture Douta Seck propose 8 ateliers hebdomadaires gratuits pour les 8-18 ans : théâtre, danse sabar, percussion, conte africain, arts plastiques, chant choral, capoeira africaine et initiation au cinéma. Inscriptions ouvertes jusqu\'au 28 mars.',
          photo: IMG.culture3,
          date: ts(96),
        },
        {
          id: 'ac_860_3',
          titre: 'Rénovation de la Grande Salle : retour en fanfare en janvier 2026',
          contenu: 'Après 8 mois de travaux, la Grande Salle de 600 places a été entièrement rénovée : nouvelle sonorisation L-Acoustics, éclairage scénique LED, gradins réaménagés et loges artistes modernisées. La réouverture a eu lieu le 15 janvier avec un concert de Waly Seck.',
          photo: IMG.culture2,
          date: ts(480),
        },
      ],
      updatedAt: ts(12),
    },

    /* ── MUSÉE BORIBANA (868) ────────────────────────────────── */
    '868': {
      description: `Le Musée Boribana est un espace d'art contemporain africain unique en son genre, niché dans le quartier de Ngor face à l'Atlantique. Fondé en 2012 par le collectionneur et mécène Boubou Boribana, le musée présente en permanence plus de 300 œuvres d'artistes africains du 20e et 21e siècle.

Réparti sur trois niveaux d'un bâtiment aux lignes architecturales remarquables, Boribana offre un parcours chronologique et thématique à travers les grands courants de l'art africain moderne : du modernisme des indépendances aux avant-gardes contemporaines, en passant par les mouvements Négritude et les arts visuels de la diaspora.

Le musée dispose également d'un espace de recherche, d'une médiathèque spécialisée et d'un programme de résidences d'artistes accueillant 6 créateurs africains par an.`,
      horaires: 'Mardi – Dimanche : 10h00 – 18h00 | Nocturnes les jeudis jusqu\'à 21h00 | Lundi : Fermé',
      telephone: '+221 33 820 89 34',
      email: 'boribana@musee-boribana.sn',
      website: 'https://musee-boribana.sn',
      gallery: [
        { id: 'gal_868_1', url: IMG.musee1, caption: 'Salle d\'exposition permanente — Œuvres majeures du 20e siècle africain', dateAdded: ts(400) },
        { id: 'gal_868_2', url: IMG.musee2, caption: 'Sculpture monumentale "Ubuntu" — Cour intérieure du Musée Boribana', dateAdded: ts(300) },
        { id: 'gal_868_3', url: IMG.galAtiss3, caption: 'Galerie des artistes en résidence 2024-2025', dateAdded: ts(200) },
        { id: 'gal_868_4', url: IMG.musee3, caption: 'Terrasse panoramique — Vue sur l\'Atlantique et l\'île de Gorée', dateAdded: ts(100) },
        { id: 'gal_868_5', url: IMG.portrait2, caption: 'Vernissage de la collection "Voix des Sans-Voix"', dateAdded: ts(50) },
        { id: 'gal_868_6', url: IMG.expo2,        caption: 'Salle des installations lumineuses — Art vidéo et digital africain', dateAdded: ts(80) },
        { id: 'gal_868_7', url: IMG.sculpture1,   caption: 'Galerie de sculptures contemporaines — Bois, bronze et résine', dateAdded: ts(60) },
        { id: 'gal_868_8', url: IMG.jardin1,      caption: 'Jardin de sculptures en plein air — Face à l\'Atlantique', dateAdded: ts(40) },
        { id: 'gal_868_9', url: IMG.artContemp2,  caption: 'Collection "Afrique en couleurs" — 30 artistes, 30 pays', dateAdded: ts(20) },
      ],
      events: [
        {
          id: 'ev_868_1',
          titre: 'Vernissage : "Archipel" — 6 artistes africains en dialogue',
          dateDebut: d(7),
          dateFin: d(60),
          lieu: 'Niveau 2 & 3 — Musée Boribana, Ngor',
          description: '"Archipel" réunit six artistes de six îles africaines — Zanzibar, Gorée, La Réunion, São Tomé, Nosy Be, Cap-Vert — autour du thème de l\'insularité et de l\'identité. Sculptures, peintures, vidéos et installations créent un dialogue poétique sur l\'appartenance, l\'exil et la beauté des lisières. Vernissage avec performance musicale de Ballaké Sissoko.',
          photos: [IMG.musee1, IMG.galAtiss4],
        },
        {
          id: 'ev_868_2',
          titre: 'Conférences "Grands Maîtres de l\'Art Africain" — Série printemps 2026',
          dateDebut: d(14),
          dateFin: d(49),
          lieu: 'Médiathèque Boribana (entrée gratuite sur réservation)',
          description: 'Chaque samedi de mars et avril, une conférence de 2h animée par un historien de l\'art sur un grand maître de l\'art africain : Twins Seven-Seven, Chéri Samba, Ouattara Watts, El Loko, Romuald Hazoumè… Illustrated de projections et accompagnée d\'un regard sur les œuvres de la collection.',
          photos: [IMG.musee3],
        },
        {
          id: 'ev_868_3',
          titre: 'Nocturne Spéciale : Jazz & Art Contemporain',
          dateDebut: d(-15),
          dateFin: d(-15),
          lieu: 'Terrasse panoramique & Halls d\'exposition',
          description: 'Une soirée inoubliable avec le quartet de piano Manu Dibango revisitant les classiques de l\'afrojazz, sur fond d\'œuvres illuminées. Cocktail dinatoire, visite nocturne des collections et rencontre avec les artistes en résidence.',
          photos: [IMG.musee2, IMG.music2],
        },
      ],
      actus: [
        {
          id: 'ac_868_1',
          titre: 'Boribana entre dans le Top 10 des musées africains du Guardian',
          contenu: 'Le journal britannique The Guardian place le Musée Boribana dans son palmarès des 10 musées africains incontournables en 2025. Une reconnaissance internationale qui conforte Dakar dans son statut de capitale culturelle du continent africain.',
          photo: IMG.dakar2,
          date: ts(144),
        },
        {
          id: 'ac_868_2',
          titre: 'Partenariat avec le Musée du Quai Branly — Échanges d\'œuvres et de savoir',
          contenu: 'Signature d\'un accord de coopération scientifique et culturelle avec le Musée du Quai Branly - Jacques Chirac (Paris). Ce partenariat prévoit des échanges d\'œuvres, des co-publications académiques et un programme de formation pour les conservateurs africains. 3 œuvres de Boribana partiront en tournée européenne en 2027.',
          photo: IMG.musee1,
          date: ts(336),
        },
      ],
      updatedAt: ts(6),
    },

  }; // end siteContent

  /* ══════════════════════════════════════════════════════════════
     PENDING — Soumissions en attente pour démo admin
  ══════════════════════════════════════════════════════════════ */
  const pending = [
    // Aissatou (en attente d'inscription) — pas de contenu
    {
      id: 'pend_demo_001',
      respId: 'resp_demo_001', respNom: 'Fatou Diallo',
      infraId: 856, infraNom: 'GALERIE ATISS DAKAR',
      type: 'gallery_add',
      data: {
        url: IMG.wax2,
        caption: 'Nouvelle acquisition — Tissu kente ghanaéen intégré dans une installation contemporaine',
      },
      statut: 'pending',
      dateSubmit: ts(2),
      noteAdmin: '',
    },
    {
      id: 'pend_demo_002',
      respId: 'resp_demo_003', respNom: 'Aminata Sarr',
      infraId: 860, infraNom: 'MAISON DE LA CULTURE DOUTA SECK',
      type: 'event',
      data: {
        titre: 'Masterclass Danse Contemporaine avec Germaine Acogny',
        dateDebut: d(30),
        dateFin: d(31),
        lieu: 'Studio de danse — Maison Douta Seck',
        description: 'La légendaire Germaine Acogny, surnommée la "Mère de la danse contemporaine africaine", animera deux jours de masterclass intensifs. Ouvert aux danseurs professionnels et semi-professionnels. 20 places disponibles.',
        photos: [IMG.culture1],
      },
      statut: 'pending',
      dateSubmit: ts(6),
      noteAdmin: '',
    },
    {
      id: 'pend_demo_003',
      respId: 'resp_demo_004', respNom: 'Ibrahima Thiaw',
      infraId: 868, infraNom: 'MUSÉE BORIBANA ART CONTEMPORAIN AFRICAIN',
      type: 'actu',
      data: {
        titre: 'Appel à candidatures — Résidence d\'artiste Boribana 2026-2027',
        contenu: 'Le Musée Boribana lance son appel annuel à candidatures pour les résidences d\'artistes 2026-2027. 6 places disponibles pour des artistes visuels africains ou de la diaspora. Résidence de 3 mois à Dakar, studio équipé, bourse de création et exposition finale garantie.',
        photo: IMG.musee2,
      },
      statut: 'pending',
      dateSubmit: ts(12),
      noteAdmin: '',
    },
    {
      id: 'pend_demo_004',
      respId: 'resp_demo_002', respNom: 'Mamadou Ndiaye',
      infraId: 858, infraNom: 'CINÉMA MÉDINA',
      type: 'profile',
      data: {
        description: 'Mise à jour : Le Cinéma Médina vient de recevoir la certification "Cinéma Art et Essai" délivrée par le Ministère de la Culture. Cette labellisation confirme notre engagement pour la diversité cinématographique.',
        horaires: 'Lundi – Vendredi : 15h00, 18h00, 21h00 | Week-end : 11h00, 14h00, 17h00, 20h00',
        telephone: '+221 33 822 67 90',
        email: 'billetterie@cinema-medina.sn',
        website: 'https://cinema-medina.sn',
      },
      statut: 'rejected',
      dateSubmit: ts(72),
      noteAdmin: 'Merci pour la mise à jour ! Nous avons cependant besoin du justificatif officiel de la labellisation. Merci de le joindre à votre prochaine soumission.',
    },
  ];

  /* ══════════════════════════════════════════════════════════════
     SAVE TO LOCALSTORAGE
  ══════════════════════════════════════════════════════════════ */
  const existing_resp = JSON.parse(localStorage.getItem('culte_responsables') || '[]');
  const existing_reg  = JSON.parse(localStorage.getItem('culte_registrations') || '[]');
  const existing_pend = JSON.parse(localStorage.getItem('culte_pending') || '[]');

  // Merge (don't overwrite user-created data)
  const mergeById = (existing, demo) => {
    const ids = new Set(existing.map(r => r.id));
    return [...existing, ...demo.filter(r => !ids.has(r.id))];
  };

  localStorage.setItem('culte_responsables',   JSON.stringify(mergeById(existing_resp, responsables)));
  localStorage.setItem('culte_registrations',  JSON.stringify(mergeById(existing_reg, registrations)));
  localStorage.setItem('culte_pending',        JSON.stringify(mergeById(existing_pend, pending)));

  // Force-update demo site content (4 known demo sites)
  const DEMO_SITE_IDS = ['856', '858', '860', '868'];
  const existingContent = JSON.parse(localStorage.getItem('culte_site_content') || '{}');
  Object.keys(siteContent).forEach(key => {
    if (DEMO_SITE_IDS.includes(key) || !existingContent[key]) {
      existingContent[key] = siteContent[key];
    }
  });
  localStorage.setItem('culte_site_content', JSON.stringify(existingContent));

  localStorage.setItem('culte_demo_seeded', '5');
  console.log('[Culte] Données de démonstration initialisées ✓');
})();
