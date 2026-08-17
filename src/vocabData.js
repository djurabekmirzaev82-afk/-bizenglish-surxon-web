// ============================================
// VOCABULARY DATA - TO'LIQ VERSIYA
// IELTS Speaking + Writing uchun
// ============================================

export const VOCAB_TOPICS = [
  // ... sizning mavjud TOPIClaringiz (o'zgarishsiz) ...
  { id: "job_interviews", icon: "🧑‍💼", name: "Ish suhbati", category: "business" },
  { id: "meetings", icon: "🗓", name: "Yig'ilishlar", category: "business" },
  { id: "negotiations", icon: "🤝", name: "Muzokaralar", category: "business" },
  { id: "presentations", icon: "📊", name: "Taqdimotlar", category: "business" },
  { id: "emails", icon: "📧", name: "Elektron yozishmalar", category: "business" },
  { id: "marketing", icon: "📣", name: "Marketing", category: "business" },
  { id: "sales", icon: "💰", name: "Sotuv", category: "business" },
  { id: "finance", icon: "🏦", name: "Moliya", category: "business" },
  { id: "hr", icon: "👥", name: "Kadrlar boshqaruvi", category: "business" },
  { id: "management", icon: "🧭", name: "Boshqaruv va liderlik", category: "business" },
  { id: "customer_service", icon: "🎧", name: "Mijozlarga xizmat", category: "business" },
  { id: "business_travel", icon: "✈️", name: "Ish safarlari", category: "business" },
  { id: "networking", icon: "🌐", name: "Aloqalar o'rnatish", category: "business" },
  { id: "startups", icon: "🚀", name: "Startaplar", category: "business" },
  { id: "logistics", icon: "📦", name: "Ta'minot va logistika", category: "business" },
  { id: "technology", icon: "💻", name: "Texnologiya va IT", category: "business" },
  { id: "project_management", icon: "📋", name: "Loyiha boshqaruvi", category: "business" },
  { id: "legal", icon: "⚖️", name: "Huquq va shartnomalar", category: "business" },
  { id: "strategy", icon: "♟", name: "Strategiya", category: "business" },
  { id: "workplace_culture", icon: "🏢", name: "Ofis madaniyati", category: "business" },
  // 2-bosqich: umumiy nutq (Speaking) mavzulari
  { id: "friends_family", icon: "👨‍👩‍👧‍👦", name: "Do'stlar va oila", category: "speaking" },
  { id: "food_nutrition", icon: "🍽", name: "Ovqat va oziqlanish", category: "speaking" },
  { id: "travel_tourism", icon: "🧳", name: "Sayohat va turizm", category: "speaking" },
  { id: "modern_technology", icon: "📱", name: "Zamonaviy texnologiya", category: "speaking" },
  { id: "coronavirus", icon: "😷", name: "Koronavirus lug'ati", category: "speaking" },
  { id: "pollution_environment", icon: "🌍", name: "Ifloslanish va atrof-muhit", category: "speaking" },
  { id: "people_personalities", icon: "🎭", name: "Odamlar va xarakterlar", category: "speaking" },
  { id: "fitness_health", icon: "💪", name: "Jismoniy tarbiya va salomatlik", category: "speaking" },
  { id: "school_education", icon: "🏫", name: "Maktab va ta'lim", category: "speaking" },
  { id: "work_careers", icon: "🧑‍💻", name: "Ish va martaba", category: "speaking" },
  { id: "university_student_life", icon: "🎓", name: "Universitet va talabalik hayoti", category: "speaking" },
  { id: "accommodation", icon: "🏠", name: "Turar joy", category: "speaking" },
  { id: "books_film_art", icon: "🎨", name: "Kitoblar, filmlar va san'at", category: "speaking" },
  { id: "climate_change", icon: "🌡", name: "Iqlim o'zgarishi", category: "speaking" },
  { id: "working_from_home", icon: "🏡", name: "Uydan ishlash", category: "speaking" },
  { id: "social_media", icon: "📲", name: "Ijtimoiy tarmoqlar", category: "speaking" },
  { id: "advertising", icon: "📢", name: "Reklama", category: "speaking" },
  { id: "fashion_shopping", icon: "👗", name: "Moda va xarid qilish", category: "speaking" },
];

// ============================================
// IELTS SPEAKING TOPIC VOCABULARY + SAMPLES
// ============================================

export const IELTS_CONTENT = {
  // 1. FRIENDS AND FAMILY
  friends_family: {
    collocations: [
      { phrase: "bad at keeping in touch with", translation: "aloqada bo'lishni yaxshi bilmaslik", def: "not good at maintaining contact with someone" },
      { phrase: "get back in touch", translation: "qayta aloqaga chiqmoq", def: "contact someone again" },
      { phrase: "have a lot in common", translation: "ko'p umumiy jihatlarga ega bo'lmq", def: "share the same interests" },
      { phrase: "hit it off", translation: "bir-biriga yoqmoq", def: "to like each other straight away" },
      { phrase: "a shoulder to cry on", translation: "yig'lab bo'shatish uchun yelka", def: "someone to sympathize with you" },
      { phrase: "close-knit family", translation: "hamjihat oila", def: "a close family with common interests" },
      { phrase: "extended family", translation: "katta oila (qarindoshlar)", def: "uncles, aunts and cousins form part of the extended family" },
      { phrase: "nurture our friendships", translation: "do'stlikni mustahkamlash", def: "looking after our relationships with friends" },
      { phrase: "stand the test of time", translation: "vaqt sinovidan o'tmoq", def: "to last a long time" },
      { phrase: "lose touch with", translation: "aloqani uzmoq", def: "to lose contact" },
    ],
    part1: [
      { q: "Do you come from a large family?", a: "My immediate family is not very big. I have a large extended family that includes many uncles, aunts, and cousins. We are a close-knit family, and we like to keep in touch with one another." },
      { q: "When was the last time you had a family function?", a: "Our extended family got together last year to celebrate my grandfather's eightieth birthday. He is very dear to my heart." },
      { q: "Would you take a friend on a family holiday?", a: "I have. My family believes that we should nurture our friendships, so they encouraged me to bring my friend along when we took a seaside holiday last year." },
    ],
    part2: {
      cue: "Describe your best friend.",
      bullets: ["who the person is", "the circumstances of your meeting", "what it is that you like about them"],
      answer: "My best friend and I got to know each other when we were still very young. We lived in neighbouring houses. We had a lot in common, so we soon hit it off. As we have grown older, we have moved apart, but anyone who has had a lifelong friend would understand that she will always be dear to my heart."
    },
    part3: [
      { q: "Do you think that after-hour friendships between working colleagues are appropriate?", a: "I think that it is important to have a good working relationship. Colleagues should extend the hand of friendship to newcomers in the workplace. I don't believe, however, that professional relationships should extend into the domestic domain." },
      { q: "Do you think that social media is changing the way that we relate to our friends and family?", a: "In some ways yes. Social media allows us to build up relationships with distant cousins, even with those that live on foreign soil. It also helps us to make connections with long lost friends." },
    ]
  },

  // 2. FOOD AND NUTRITION
  food_nutrition: {
    collocations: [
      { phrase: "a balanced diet", translation: "muvozanatli ovqatlanish", def: "a diet with the right amounts of different foods" },
      { phrase: "nutritious food", translation: "to'yimli ovqat", def: "food containing substances the body needs" },
      { phrase: "home-cooked meal", translation: "uy taomi", def: "a meal prepared at home rather than bought" },
      { phrase: "packed with vitamins", translation: "vitaminlarga boy", def: "containing a lot of vitamins" },
      { phrase: "daily consumption", translation: "kundalik iste'mol", def: "the amount eaten every day" },
      { phrase: "processed food", translation: "qayta ishlangan ovqat", def: "food altered from its natural state" },
      { phrase: "junk food", translation: "zararli ovqat", def: "food that is unhealthy but tasty" },
      { phrase: "dietary requirement", translation: "ovqatlanish talabi", def: "specific food needs of a person" },
      { phrase: "organic produce", translation: "organik mahsulot", def: "food grown without artificial chemicals" },
      { phrase: "food security", translation: "oziq-ovqat xavfsizligi", def: "reliable access to sufficient affordable food" },
    ],
    part1: [
      { q: "What kind of food do you like?", a: "I really enjoy home-cooked meals, especially those packed with vegetables. My mother always insisted on a balanced diet, so I grew up eating nutritious food." },
      { q: "Is it important to eat healthy food?", a: "Absolutely. A balanced diet is essential for maintaining good health. These days, many people rely on processed food or junk food, which can lead to health problems in the long run." },
      { q: "Do you think people in your country eat healthily?", a: "It varies. In cities, people often eat processed food because it's quick and convenient. However, in rural areas, home-cooked meals are still the norm, and they tend to be much healthier." },
    ],
    part2: {
      cue: "Describe a traditional dish in your country.",
      bullets: ["what it is", "what ingredients are used", "how it is prepared"],
      answer: "One of the most traditional dishes in my country is plov. It's a rice-based dish packed with vitamins and flavour. It's usually home-cooked for celebrations and gatherings. The recipe includes rice, carrots, onions, and meat, all cooked slowly. I think it's a very nutritious food because it contains a good balance of carbohydrates, protein, and vegetables."
    },
    part3: [
      { q: "How has eating habits changed in recent decades?", a: "They've changed dramatically. Fast food and processed food have become much more common, especially among young people. At the same time, there's a growing awareness of the importance of a balanced diet and organic produce." },
      { q: "What role should governments play in promoting healthy eating?", a: "Governments should implement policies to ensure food security and promote dietary requirements through education. They could also regulate advertising of junk food, especially aimed at children." },
    ]
  },

  // 3. TRAVEL AND TOURISM
  travel_tourism: {
    collocations: [
      { phrase: "travel abroad", translation: "chet elga sayohat", def: "to travel to a foreign country" },
      { phrase: "holiday destinations", translation: "dam olish joylari", def: "places people visit for vacation" },
      { phrase: "off the beaten track", translation: "kam boriladigan joy", def: "a place not commonly visited by tourists" },
      { phrase: "exotic destinations", translation: "ekzotik joylar", def: "unusual, attractive foreign places" },
      { phrase: "self-catering accommodation", translation: "o'z-o'ziga xizmat turarjoy", def: "lodging where you cook your own meals" },
      { phrase: "travelling light", translation: "yengil sayohat qilish", def: "to travel with very little luggage" },
      { phrase: "magnificent landscapes", translation: "go'zal manzaralar", def: "beautiful natural scenery" },
      { phrase: "package tour", translation: "tayyor sayohat paketi", def: "a pre-arranged trip including transport and hotels" },
      { phrase: "sustainable tourism", translation: "barqaror turizm", def: "tourism that minimizes negative environmental impact" },
      { phrase: "cultural immersion", translation: "madaniyatga singib ketish", def: "deeply experiencing a foreign culture" },
    ],
    part1: [
      { q: "Do you like travelling?", a: "Yes, I love travelling abroad. I've been to several countries in Europe and Asia. I especially enjoy visiting exotic destinations and experiencing different cultures." },
      { q: "What kind of places do you prefer for holidays?", a: "I prefer off the beaten track places rather than crowded tourist resorts. I like to discover magnificent landscapes and enjoy authentic local experiences." },
      { q: "Do you prefer package tours or independent travel?", a: "Definitely independent travel. I like to travel light and decide my own schedule. Package tours can be convenient, but they often don't allow for cultural immersion." },
    ],
    part2: {
      cue: "Describe a memorable trip you have taken.",
      bullets: ["where you went", "who you went with", "what you did there"],
      answer: "Last year I travelled abroad to Thailand. I went with a couple of friends, and we decided to stay in self-catering accommodation to save money. We visited several holiday destinations, but the highlight was definitely a small island off the beaten track. The magnificent landscapes, white beaches and clear water were unforgettable. I'd recommend sustainable tourism there because the ecosystem is very fragile."
    },
    part3: [
      { q: "How has tourism changed in recent years?", a: "Mass tourism has increased significantly, which has had both positive and negative effects. On the positive side, more people can afford to travel abroad. However, some popular holiday destinations are suffering from overtourism, which damages local communities and the environment." },
      { q: "What are the benefits of travelling abroad for young people?", a: "It broadens their horizons. They get to experience cultural immersion, learn new languages, and become more independent. It can also be a great way to practice English in real-life situations." },
    ]
  },

  // 4. MODERN TECHNOLOGY
  modern_technology: {
    collocations: [
      { phrase: "state-of-the-art technology", translation: "eng zamonaviy texnologiya", def: "the most advanced technology available" },
      { phrase: "labour-saving devices", translation: "mehnatni yengillashtiruvchi asboblar", def: "devices that reduce human effort" },
      { phrase: "computer literate", translation: "kompyuter savodli", def: "having the ability to use computers" },
      { phrase: "artificial intelligence", translation: "sun'iy intellekt", def: "machines that can perform tasks that normally require human intelligence" },
      { phrase: "wireless hotspots", translation: "simsiz ulanish nuqtalari", def: "public places with Wi-Fi access" },
      { phrase: "digital detox", translation: "raqamli dam olish", def: "a period of avoiding electronic devices" },
      { phrase: "screen time", translation: "ekran vaqti", def: "time spent using a screen device" },
      { phrase: "data privacy", translation: "ma'lumotlar maxfiyligi", def: "protection of personal information online" },
      { phrase: "digital footprint", translation: "raqamli iz", def: "the trail of data a person leaves online" },
      { phrase: "cybersecurity", translation: "kiberxavfsizlik", def: "protection of computer systems from digital attacks" },
    ],
    part1: [
      { q: "How often do you use technology?", a: "I use it every day, both for work and leisure. I'm quite computer literate, so I feel comfortable using various devices and software." },
      { q: "What do you use the internet for?", a: "For almost everything! Work, communication, entertainment, and research. Wireless hotspots make it easy to stay connected wherever I am." },
      { q: "Do you think technology has made our lives easier?", a: "Definitely. Labour-saving devices like washing machines and dishwashers save us so much time. But at the same time, we need to be aware of the importance of data privacy and cybersecurity." },
    ],
    part2: {
      cue: "Describe a piece of technology you find useful.",
      bullets: ["what it is", "how you use it", "why you find it useful"],
      answer: "One piece of technology I find extremely useful is my smartphone. It's a state-of-the-art device that I use for multiple purposes. I use it to stay in touch with family and friends, for work emails, to navigate with maps, and even to monitor my health and fitness. It has so many labour-saving features that it's become essential in my daily life. The only downside is that it increases my screen time significantly."
    },
    part3: [
      { q: "What are the disadvantages of modern technology?", a: "One of the biggest concerns is that people, especially young people, are spending too much time on screens. This can lead to health issues and reduce face-to-face interaction. Another issue is data privacy – we leave a digital footprint everywhere we go." },
      { q: "How is technology likely to change in the future?", a: "I think artificial intelligence will become even more integrated into our lives. We might also see more advanced wearable technology. However, we'll also need to find ways to protect our privacy and security in an increasingly digital world." },
    ]
  },

  // 5. CORONAVIRUS VOCABULARY
  coronavirus: {
    collocations: [
      { phrase: "global health emergency", translation: "global sog'liqni saqlash favqulodda holati", def: "an internationally declared serious health threat" },
      { phrase: "public health crisis", translation: "sog'liqni saqlash inqirozi", def: "a situation threatening the health of a population" },
      { phrase: "social distancing", translation: "ijtimoiy masofa saqlash", def: "keeping physical distance to prevent disease spread" },
      { phrase: "herd immunity", translation: "ommaviy immunitet", def: "resistance when most of a population is immune" },
      { phrase: "frontline workers", translation: "old qatordagi xodimlar", def: "workers directly dealing with a crisis" },
      { phrase: "contact tracing", translation: "aloqalarni kuzatish", def: "identifying people exposed to an infected person" },
      { phrase: "containment measures", translation: "cheklov choralari", def: "actions taken to stop the spread of disease" },
      { phrase: "vaccine hesitancy", translation: "vaksinaga ishonchsizlik", def: "reluctance to be vaccinated" },
      { phrase: "mutation", translation: "mutatsiya", def: "a change in the genetic structure of a virus" },
      { phrase: "quarantine", translation: "karantin", def: "isolation to prevent the spread of disease" },
    ],
    part1: [
      { q: "How did the pandemic change your daily routine?", a: "It changed my routine completely. Social distancing became the norm, and we had to wear masks in public. Working from home became a permanent arrangement for me." },
      { q: "What do you think was the most effective measure?", a: "I think a combination of social distancing and contact tracing worked well. These containment measures helped slow the spread significantly." },
      { q: "Were you worried about catching the virus?", a: "Yes, especially in the early days when not much was known about it. I was particularly worried for frontline workers like doctors and nurses who were exposed to higher risks." },
    ],
    part2: {
      cue: "Describe how the pandemic affected your country.",
      bullets: ["what the impact was on daily life", "how the government responded", "what the long-term effects might be"],
      answer: "The pandemic was a public health crisis like no other in our generation. The government introduced strict containment measures, including social distancing, a lockdown, and mandatory mask-wearing. These measures helped manage the outbreak. Frontline workers, especially medical staff, worked tirelessly under immense pressure. In the long term, I think the pandemic will change how we approach global health emergencies and vaccine development."
    },
    part3: [
      { q: "Should governments invest more in preventing future pandemics?", a: "Absolutely. A global health emergency like COVID-19 shows that we need to be better prepared. Investment in healthcare, contact tracing systems, and vaccine development is crucial for future pandemic preparedness." },
      { q: "How has the pandemic changed people's attitudes towards remote working?", a: "It has accelerated the acceptance of remote working. Many people now prefer to work from home, and companies have adapted too. This shift will probably continue, although we still need to ensure that employees' mental health is not neglected." },
    ]
  },

  // 6. POLLUTION AND THE ENVIRONMENT
  pollution_environment: {
    collocations: [
      { phrase: "air quality", translation: "havo sifati", def: "the condition of the air, especially cleanliness" },
      { phrase: "carbon emissions", translation: "uglerod chiqindilari", def: "the release of carbon dioxide into the air" },
      { phrase: "environmental problems", translation: "atrof-muhit muammolari", def: "issues affecting the natural environment" },
      { phrase: "sustainable development", translation: "barqaror rivojlanish", def: "growth that meets needs without harming the future" },
      { phrase: "fossil fuel dependency", translation: "fossil yoqilg'iga qaramlik", def: "reliance on coal, oil, and gas for energy" },
      { phrase: "single-use plastic", translation: "bir martalik plastik", def: "plastic items used once and thrown away" },
      { phrase: "biodiversity loss", translation: "biologik xilma-xillikning yo'qolishi", def: "the decline in variety of living species" },
      { phrase: "carbon footprint", translation: "uglerod izi", def: "the total greenhouse gas emissions caused by a person or activity" },
      { phrase: "greenhouse gas", translation: "issiqxona gazi", def: "a gas that traps heat in the atmosphere" },
      { phrase: "renewable energy", translation: "qayta tiklanadigan energiya", def: "energy from sources that don't run out" },
    ],
    part1: [
      { q: "Is air pollution a problem in your city?", a: "Yes, unfortunately, air quality in my city is quite poor, especially during winter. The main cause is high carbon emissions from vehicles." },
      { q: "What do you do to protect the environment?", a: "I try to reduce my carbon footprint by using public transport and avoiding single-use plastic. I also support renewable energy by using energy-efficient appliances." },
      { q: "Do you think young people care about the environment?", a: "Yes, I think young people are much more aware of environmental problems than previous generations. They are actively involved in movements promoting sustainable development." },
    ],
    part2: {
      cue: "Describe an environmental problem in your country.",
      bullets: ["what the problem is", "what causes it", "what could be done to solve it"],
      answer: "One major environmental problem in my country is air pollution. It's mainly caused by carbon emissions from transport, industry, and fossil fuel dependency. The government has taken steps to improve air quality by promoting renewable energy and electric vehicles, but more needs to be done. Reducing our fossil fuel dependency and investing in renewable energy would go a long way. Another important measure is reducing single-use plastic, which is a significant source of pollution."
    },
    part3: [
      { q: "Who has the biggest responsibility to reduce pollution?", a: "I think it's a shared responsibility. Governments need to implement stricter environmental policies, businesses need to invest in sustainable development, and individuals should reduce their carbon footprint. However, governments have the power to regulate and set targets for reducing carbon emissions." },
      { q: "Will environmental problems get worse in the future?", a: "Unless we take urgent action, yes. However, with increasing awareness and technological advancements, there is hope. The transition to renewable energy and sustainable development is happening, but we need to accelerate it to prevent further biodiversity loss and climate change." },
    ]
  },

  // 7. PEOPLE, PERSONALITIES AND CHARACTERS
  people_personalities: {
    collocations: [
      { phrase: "outgoing personality", translation: "ochiq ko'ngil xarakter", def: "a sociable and extroverted nature" },
      { phrase: "easy-going", translation: "yumshoq xarakterli", def: "relaxed and not easily upset" },
      { phrase: "strong-willed", translation: "qat'iyatli", def: "determined and not easily swayed" },
      { phrase: "good sense of humour", translation: "yaxshi hazil tuyg'usi", def: "the ability to make people laugh" },
      { phrase: "reliable person", translation: "ishonchli odam", def: "someone you can trust and depend on" },
      { phrase: "empathetic", translation: "hamdard", def: "able to understand others' feelings" },
      { phrase: "self-confident", translation: "o'ziga ishongan", def: "sure of oneself and one's abilities" },
      { phrase: "meticulous", translation: "juda ehtiyotkor", def: "showing great attention to detail" },
      { phrase: "tenacious", translation: "qat'iyatli", def: "persistent in pursuing a goal" },
      { phrase: "temperamental", translation: "kayfiyati o'zgaruvchan", def: "having frequent, unpredictable mood changes" },
    ],
    part1: [
      { q: "How would you describe yourself?", a: "I'd say I'm an outgoing personality, but I also value quiet time. I'm generally easy-going and can adapt to different situations. People often tell me I have a good sense of humour, which I appreciate." },
      { q: "What qualities do you look for in a friend?", a: "Reliability is the most important quality for me. I prefer friends who are supportive and can keep secrets. I also value people who are empathetic and understand others' feelings." },
      { q: "Do you think people's personalities change over time?", a: "Yes, to some extent. Life experiences, education, and relationships all shape who we are. However, some core traits, like being tenacious or temperamental, often remain quite stable." },
    ],
    part2: {
      cue: "Describe a person you admire.",
      bullets: ["who they are", "what they are like", "why you admire them"],
      answer: "I admire my former school teacher. She was very self-confident and had a strong presence in the classroom. She was also empathetic and could understand students' problems easily. Above all, she was meticulous in her work, preparing lessons with great attention to detail. Her tenacious attitude motivated many students to work harder. She had a good sense of humour too, which made even the most difficult lessons enjoyable."
    },
    part3: [
      { q: "Are we born with our personality or do we develop it?", a: "Both. There is certainly a genetic component, but our personalities are heavily influenced by our upbringing, culture, and life experiences. For example, someone born introverted may become more outgoing through social experiences." },
      { q: "What qualities do you think are important for a good leader?", a: "A good leader should be self-confident and have a clear vision. They should also be empathetic, so they can understand their team's needs. Being a reliable person is also key because followers need to trust their leader." },
    ]
  },

  // 8. FITNESS AND HEALTH
  fitness_health: {
    collocations: [
      { phrase: "physical fitness", translation: "jismoniy tayyorgarlik", def: "the condition of being physically healthy and strong" },
      { phrase: "regular exercise", translation: "muntazam mashq", def: "physical activity done on a consistent basis" },
      { phrase: "balanced diet", translation: "muvozanatli ovqatlanish", def: "eating a variety of foods in correct proportions" },
      { phrase: "mental health", translation: "ruhiy salomatlik", def: "a person's psychological and emotional well-being" },
      { phrase: "sedentary lifestyle", translation: "harakatsiz turmush tarzi", def: "a lifestyle involving little physical activity" },
      { phrase: "cardio workout", translation: "yurak mashqi", def: "exercise that raises heart rate" },
      { phrase: "chronic illness", translation: "surunkali kasallik", def: "a long-lasting health condition" },
      { phrase: "overexertion", translation: "haddan ortiq zo'riqish", def: "excessive physical effort that can cause harm" },
      { phrase: "preventive healthcare", translation: "profilaktik tibbiy yordam", def: "medical care aimed at preventing illness" },
      { phrase: "well-being", translation: "farovonlik", def: "the state of being healthy and comfortable" },
    ],
    part1: [
      { q: "Do you exercise regularly?", a: "Yes, I try to do regular exercise at least three times a week. I enjoy cardio workouts like running and swimming because they improve my physical fitness." },
      { q: "What do you think is more important: a balanced diet or exercise?", a: "Both are important, but I'd say a balanced diet is the foundation. You can't outrun a bad diet. Eating nutritious food combined with regular exercise gives the best results for health." },
      { q: "How can people stay healthy in a busy life?", a: "Even with a busy schedule, people can incorporate physical activity into their daily routine, like walking or cycling to work. A balanced diet is also easier if you plan your meals in advance. And of course, don't neglect mental health – take breaks and manage stress." },
    ],
    part2: {
      cue: "Describe something you do to stay healthy.",
      bullets: ["what it is", "how often you do it", "what benefits it brings"],
      answer: "I do regular exercise by going to the gym three times a week. I focus on a combination of cardio workout and strength training. This improves my physical fitness and helps prevent chronic illness. In addition, I try to follow a balanced diet with plenty of vegetables and protein. Regular exercise also improves my mental health, helping me to relax and sleep better. I believe that staying active is a key part of well-being and preventive healthcare."
    },
    part3: [
      { q: "What are the biggest health problems in your country?", a: "Chronic illnesses such as heart disease and diabetes are very common, largely due to a sedentary lifestyle and poor diet. Obesity rates are increasing among young people, which is a worrying trend." },
      { q: "Should governments do more to promote healthy living?", a: "Yes, definitely. Governments should invest in preventive healthcare campaigns and make it easier for people to access fitness facilities. They could also introduce policies to promote a balanced diet in schools and public institutions." },
    ]
  },

  // 9. SCHOOL AND EDUCATION
  school_education: {
    collocations: [
      { phrase: "academic pressure", translation: "o'quv bosimi", def: "stress related to school performance" },
      { phrase: "rote learning", translation: "yodlab olish orqali o'qish", def: "learning by memorization without understanding" },
      { phrase: "critical thinking", translation: "tanqidiy fikrlash", def: "the objective analysis of facts" },
      { phrase: "formative assessment", translation: "shakllantiruvchi baholash", def: "ongoing assessment to guide learning" },
      { phrase: "curriculum reform", translation: "o'quv dasturi islohoti", def: "changes made to improve education" },
      { phrase: "extracurricular activity", translation: "darsdan tashqari faoliyat", def: "an activity outside the regular curriculum" },
      { phrase: "educational attainment", translation: "ta'lim darajasi", def: "the highest level of education completed" },
      { phrase: "discipline", translation: "intizom", def: "training to follow rules or a code of behavior" },
      { phrase: "vocational training", translation: "kasb-hunar ta'limi", def: "training for a specific trade" },
      { phrase: "academic rigor", translation: "ilmiy talabchanlik", def: "high standards of intellectual challenge" },
    ],
    part1: [
      { q: "Where do you study or work?", a: "I studied at a university, but now I'm working. I really enjoyed the academic rigor of university life." },
      { q: "What subject were you best at at school?", a: "I was good at English and literature. I enjoyed subjects that required critical thinking rather than just rote learning." },
      { q: "What type of school did you go to?", a: "I went to a public school. It had a good balance between academic subjects and extracurricular activities like sports and music." },
    ],
    part2: {
      cue: "Describe a memorable teacher you had.",
      bullets: ["who they were", "what they taught", "why you remember them"],
      answer:
