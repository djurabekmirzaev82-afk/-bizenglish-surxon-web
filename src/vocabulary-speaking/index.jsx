import React, { useState } from 'react';
import './vocabularySpeaking.css';

const data = [
  {
    id: 1,
    topic: "Technology",
    icon: "💻",
    vocabulary: [
      { word: "State-of-the-art", meaning: "eng zamonaviy" },
      { word: "Cutting-edge technology", meaning: "ilg'or texnologiya" },
      { word: "User-friendly", meaning: "foydalanuvchiga qulay" },
      { word: "Artificial intelligence", meaning: "sun'iy intellekt" },
      { word: "Digital native", meaning: "raqamli avlod" },
    ],
    speaking: {
      questions: [
        "How has technology changed the way we communicate?",
        "What are the advantages and disadvantages of social media?",
        "Do you think artificial intelligence will replace human jobs?",
      ],
      answers: [
        {
          q: "How has technology changed the way we communicate?",
          a: "Technology has revolutionized communication. With state-of-the-art smartphones and social media platforms, we can now connect with anyone instantly. However, this has reduced face-to-face interaction.",
          useful_phrases: [
            "revolutionized communication",
            "state-of-the-art",
            "connect instantly",
            "face-to-face interaction",
          ],
        },
        {
          q: "What are the advantages and disadvantages of social media?",
          a: "On the one hand, social media allows us to stay in touch with friends and family. On the other hand, it can lead to addiction and privacy issues.",
          useful_phrases: [
            "stay in touch",
            "lead to addiction",
            "privacy issues",
          ],
        },
        {
          q: "Do you think AI will replace human jobs?",
          a: "While AI can automate repetitive tasks, it cannot replace human creativity and emotional intelligence. I believe AI will create new job opportunities rather than eliminate them.",
          useful_phrases: [
            "automate repetitive tasks",
            "human creativity",
            "emotional intelligence",
            "create new job opportunities",
          ],
        },
      ],
    },
  },
  {
    id: 2,
    topic: "Education",
    icon: "📖",
    vocabulary: [
      { word: "Lifelong learning", meaning: "umrbod o'qish" },
      { word: "Academic performance", meaning: "akademik ko'rsatkich" },
      { word: "Distance learning", meaning: "masofaviy ta'lim" },
      { word: "Critical thinking", meaning: "tanqidiy fikrlash" },
      { word: "Student engagement", meaning: "talabalar faolligi" },
    ],
    speaking: {
      questions: [
        "What is the importance of education in today's world?",
        "Should students be required to study foreign languages?",
        "What are the benefits of online learning?",
      ],
      answers: [
        {
          q: "What is the importance of education in today's world?",
          a: "Education is crucial because it equips people with the skills needed for the job market. It also promotes critical thinking and helps individuals contribute to society.",
          useful_phrases: [
            "crucial",
            "equips with skills",
            "job market",
            "critical thinking",
            "contribute to society",
          ],
        },
        {
          q: "Should students be required to study foreign languages?",
          a: "Yes, learning foreign languages is essential in our interconnected world. It improves cognitive abilities and opens up career opportunities.",
          useful_phrases: [
            "interconnected world",
            "cognitive abilities",
            "career opportunities",
          ],
        },
        {
          q: "What are the benefits of online learning?",
          a: "Online learning offers flexibility and accessibility. Students can study at their own pace and access a wide range of resources. However, it requires self-discipline.",
          useful_phrases: [
            "flexibility",
            "accessibility",
            "own pace",
            "self-discipline",
          ],
        },
      ],
    },
  },
  {
    id: 3,
    topic: "Environment",
    icon: "🌍",
    vocabulary: [
      { word: "Climate crisis", meaning: "iqlim inqirozi" },
      { word: "Carbon footprint", meaning: "uglerod izi" },
      { word: "Renewable energy", meaning: "qayta tiklanadigan energiya" },
      { word: "Sustainable development", meaning: "barqaror rivojlanish" },
      { word: "Biodiversity", meaning: "biologik xilma-xillik" },
    ],
    speaking: {
      questions: [
        "What are the main environmental problems today?",
        "How can individuals help protect the environment?",
        "Should governments invest more in renewable energy?",
      ],
      answers: [
        {
          q: "What are the main environmental problems today?",
          a: "The most pressing issues are global warming, deforestation, and pollution. These problems are caused by human activities such as burning fossil fuels and cutting down forests.",
          useful_phrases: [
            "pressing issues",
            "global warming",
            "deforestation",
            "burning fossil fuels",
          ],
        },
        {
          q: "How can individuals help protect the environment?",
          a: "Individuals can reduce their carbon footprint by using public transport, recycling, and conserving water. Small actions can collectively make a big difference.",
          useful_phrases: [
            "carbon footprint",
            "public transport",
            "recycling",
            "collectively make a big difference",
          ],
        },
        {
          q: "Should governments invest more in renewable energy?",
          a: "Absolutely. Governments should invest heavily in renewable energy sources like solar and wind power. This will reduce dependence on fossil fuels and combat climate change.",
          useful_phrases: [
            "invest heavily",
            "renewable energy sources",
            "dependence on fossil fuels",
            "combat climate change",
          ],
        },
      ],
    },
  },
  {
    id: 4,
    topic: "Health",
    icon: "🏥",
    vocabulary: [
      { word: "Healthy lifestyle", meaning: "sog'lom turmush tarzi" },
      { word: "Mental health", meaning: "ruhiy salomatlik" },
      { word: "Well-being", meaning: "farovonlik" },
      { word: "Balanced diet", meaning: "muvozanatli ovqatlanish" },
      { word: "Physical activity", meaning: "jismoniy faollik" },
    ],
    speaking: {
      questions: [
        "Why is it important to have a healthy lifestyle?",
        "What are the causes of stress in modern life?",
        "Should healthcare be free for everyone?",
      ],
      answers: [
        {
          q: "Why is it important to have a healthy lifestyle?",
          a: "A healthy lifestyle prevents chronic diseases and improves quality of life. It includes eating a balanced diet, doing physical activity, and taking care of mental health.",
          useful_phrases: [
            "prevents chronic diseases",
            "quality of life",
            "balanced diet",
            "physical activity",
            "mental health",
          ],
        },
        {
          q: "What are the causes of stress in modern life?",
          a: "Stress is caused by work pressure, financial problems, and social expectations. It is important to manage stress through relaxation techniques.",
          useful_phrases: [
            "work pressure",
            "financial problems",
            "social expectations",
            "relaxation techniques",
          ],
        },
        {
          q: "Should healthcare be free for everyone?",
          a: "I believe healthcare should be accessible to all, but free healthcare may lead to long waiting times. A balanced approach with public and private options is ideal.",
          useful_phrases: [
            "accessible to all",
            "long waiting times",
            "public and private options",
            "ideal",
          ],
        },
      ],
    },
  },
  {
    id: 5,
    topic: "Travel",
    icon: "✈️",
    vocabulary: [
      { word: "Off the beaten track", meaning: "mashhur bo'lmagan yo'nalish" },
      { word: "Exotic destinations", meaning: "ekzotik manzillar" },
      { word: "Travelling light", meaning: "yengil sayohat qilish" },
      { word: "Magnificent landscapes", meaning: "ajoyib manzaralar" },
      { word: "Cultural immersion", meaning: "madaniy singish" },
    ],
    speaking: {
      questions: [
        "What are the benefits of traveling?",
        "Do you prefer traveling alone or with others?",
        "How has tourism affected your country?",
      ],
      answers: [
        {
          q: "What are the benefits of traveling?",
          a: "Traveling exposes you to new cultures and broadens your horizons. It also provides opportunities for cultural immersion and personal growth.",
          useful_phrases: [
            "exposes to new cultures",
            "broadens horizons",
            "cultural immersion",
            "personal growth",
          ],
        },
        {
          q: "Do you prefer traveling alone or with others?",
          a: "I prefer traveling with friends because it is more enjoyable and safer. However, traveling alone allows for complete independence and self-reflection.",
          useful_phrases: [
            "more enjoyable",
            "safer",
            "complete independence",
            "self-reflection",
          ],
        },
        {
          q: "How has tourism affected your country?",
          a: "Tourism has boosted the economy by creating jobs. However, it has also led to environmental issues and overcrowding in popular destinations.",
          useful_phrases: [
            "boosted the economy",
            "creating jobs",
            "environmental issues",
            "overcrowding",
          ],
        },
      ],
    },
  },
  {
    id: 6,
    topic: "Work",
    icon: "💼",
    vocabulary: [
      { word: "Work-life balance", meaning: "ish va hayot muvozanati" },
      { word: "Job satisfaction", meaning: "ishdan qoniqish" },
      { word: "Career development", meaning: "karyera rivojlanishi" },
      { word: "Flexible working hours", meaning: "moslashuvchan ish vaqti" },
      { word: "Remote work", meaning: "masofaviy ish" },
    ],
    speaking: {
      questions: [
        "What makes a good job?",
        "Is it better to work for a large company or a small one?",
        "What are the advantages of remote work?",
      ],
      answers: [
        {
          q: "What makes a good job?",
          a: "A good job offers job satisfaction, opportunities for career development, and a healthy work-life balance. It should also provide a supportive environment.",
          useful_phrases: [
            "job satisfaction",
            "career development",
            "work-life balance",
            "supportive environment",
          ],
        },
        {
          q: "Is it better to work for a large company or a small one?",
          a: "Large companies often offer better benefits and career growth, while small companies provide more flexibility and a closer team environment. It depends on personal preference.",
          useful_phrases: [
            "better benefits",
            "career growth",
            "more flexibility",
            "closer team environment",
          ],
        },
        {
          q: "What are the advantages of remote work?",
          a: "Remote work offers flexibility and saves commuting time. It can improve productivity and allows employees to work from anywhere.",
          useful_phrases: [
            "flexibility",
            "saves commuting time",
            "improve productivity",
            "work from anywhere",
          ],
        },
      ],
    },
  },
];

const VocabularySpeaking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const topics = data.map((item) => item.topic);

  const filteredData = data
    .filter((item) => selectedTopic === 'all' || item.topic === selectedTopic)
    .map((item) => ({
      ...item,
      vocabulary: item.vocabulary.filter(
        (v) =>
          v.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.meaning.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((item) => item.vocabulary.length > 0);

  return (
    <div className="vs-container">
      <h1>📚 IELTS Vocabulary & Speaking</h1>
      <p className="subtitle">6 ta mavzu bo'yicha lug'at va speaking savol-javoblari</p>

      <div className="vs-controls">
        <input
          type="text"
          placeholder="So'z yoki ma'no bo'yicha qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="topic-filter"
        >
          <option value="all">Barcha mavzular</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div className="vs-grid">
        {filteredData.map((item) => (
          <div key={item.id} className="vs-card">
            <h2>
              {item.icon} {item.topic}
            </h2>

            <div className="vocab-section">
              <h3>📝 Vocabulary</h3>
              <ul>
                {item.vocabulary.map((v, idx) => (
                  <li key={idx}>
                    <strong className="collocation">{v.word}</strong>
                    <span className="meaning"> — {v.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="speaking-section">
              <h3>🗣️ Speaking</h3>
              <div className="questions">
                {item.speaking.questions.map((q, idx) => (
                  <div key={idx} className="question-item">
                    <button
                      className="question-btn"
                      onClick={() =>
                        setSelectedQuestion(
                          selectedQuestion === idx ? null : idx
                        )
                      }
                    >
                      {q}
                    </button>
                    {selectedQuestion === idx && (
                      <div className="answer-box">
                        <p>
                          <strong>Javob:</strong>{' '}
                          {item.speaking.answers.find((a) => a.q === q)?.a}
                        </p>
                        <div className="useful-phrases">
                          <strong>Foydali iboralar:</strong>
                          <ul>
                            {item.speaking.answers
                              .find((a) => a.q === q)
                              ?.useful_phrases.map((phrase, pi) => (
                                <li key={pi}>🔹 {phrase}</li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="vs-footer">
        <p>© 2026 BizEnglish Surxon. Barcha huquqlar himoyalangan.</p>
        <p>IELTS tayyorlov markazi | 6 ta dolzarb mavzu</p>
      </footer>
    </div>
  );
};

export default VocabularySpeaking;
