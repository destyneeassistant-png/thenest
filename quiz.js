// Quiz System JavaScript

const DB_NAME = 'nest_db';
const DB_VERSION = 2;

// Quiz questions database
const quizData = {
    'cognitive-dev': [
        {
            question: "According to Piaget, at what stage do children develop the ability to think abstractly and hypothetically?",
            options: ["Sensorimotor", "Preoperational", "Concrete Operational", "Formal Operational"],
            correct: 3,
            explanation: "The Formal Operational stage (ages 12+) is when abstract thinking and hypothetical reasoning emerge."
        },
        {
            question: "What is the zone of proximal development (ZPD) according to Vygotsky?",
            options: ["The gap between what a child can do alone vs. with help", "The physical growth zone of the brain", "The age range for optimal learning", "The distance between schools and homes"],
            correct: 0,
            explanation: "ZPD refers to what a learner can do with guidance that they cannot do alone."
        },
        {
            question: "Which cognitive process improves significantly during emerging adulthood?",
            options: ["Object permanence", "Executive function", "Language acquisition", "Motor control"],
            correct: 1,
            explanation: "Executive function, including planning and impulse control, continues developing into the mid-20s."
        },
        {
            question: "What is 'scaffolding' in educational psychology?",
            options: ["A teaching method that removes support gradually", "Building physical structures", "Testing memory capacity", "Group learning techniques"],
            correct: 0,
            explanation: "Scaffolding involves providing support that is gradually removed as the learner becomes competent."
        },
        {
            question: "In information processing theory, what is 'working memory'?",
            options: ["Long-term storage of facts", "Short-term processing of current information", "Unconscious memory processing", "Memory during sleep"],
            correct: 1,
            explanation: "Working memory holds and manipulates information for brief periods during cognitive tasks."
        }
    ],
    'lifespan': [
        {
            question: "According to Erikson, what is the primary developmental task of emerging adulthood (ages 18-25)?",
            options: ["Identity vs. Role Confusion", "Intimacy vs. Isolation", "Generativity vs. Stagnation", "Integrity vs. Despair"],
            correct: 1,
            explanation: "Emerging adults face Intimacy vs. Isolation, focusing on forming close relationships."
        },
        {
            question: "What percentage of emerging adults return to their parents' home at least once?",
            options: ["10%", "25%", "40%", "60%"],
            correct: 2,
            explanation: "About 40% of emerging adults experience 'boomeranging' back home."
        },
        {
            question: "Which attachment style is associated with fear of intimacy and difficulty trusting partners?",
            options: ["Secure", "Anxious-preoccupied", "Dismissive-avoidant", "Fearful-avoidant"],
            correct: 3,
            explanation: "Fearful-avoidant attachment combines anxiety about relationships with avoidance of closeness."
        },
        {
            question: "Arnett identified five features of emerging adulthood. Which is NOT one of them?",
            options: ["Identity exploration", "Instability", "Self-focus", "Career establishment"],
            correct: 3,
            explanation: "The five features are identity exploration, instability, self-focus, feeling in-between, and possibilities/optimism."
        },
        {
            question: "At what age does the prefrontal cortex typically reach full maturity?",
            options: ["16", "18", "21", "25"],
            correct: 3,
            explanation: "The prefrontal cortex, responsible for executive function, typically matures around age 25."
        }
    ],
    'learning': [
        {
            question: "In classical conditioning, what is the term for a previously neutral stimulus that comes to elicit a response?",
            options: ["Unconditioned stimulus", "Conditioned stimulus", "Unconditioned response", "Conditioned response"],
            correct: 1,
            explanation: "The conditioned stimulus (CS) acquires the ability to trigger a response through association."
        },
        {
            question: "What type of reinforcement increases behavior by removing an aversive stimulus?",
            options: ["Positive reinforcement", "Negative reinforcement", "Positive punishment", "Negative punishment"],
            correct: 1,
            explanation: "Negative reinforcement strengthens behavior by stopping or avoiding something unpleasant."
        },
        {
            question: "According to Bandura's social learning theory, what is 'vicarious reinforcement'?",
            options: ["Learning from direct experience", "Learning by observing others' consequences", "Self-reward for achievement", "Punishment avoidance"],
            correct: 1,
            explanation: "Vicarious reinforcement occurs when observing others being rewarded strengthens the observer's behavior."
        },
        {
            question: "Which memory system has virtually unlimited capacity and can store information for a lifetime?",
            options: ["Sensory memory", "Working memory", "Short-term memory", "Long-term memory"],
            correct: 3,
            explanation: "Long-term memory has enormous capacity and can retain information indefinitely."
        },
        {
            question: "What is 'metacognition'?",
            options: ["Thinking about thinking", "Learning motor skills", "Group decision making", "Emotional intelligence"],
            correct: 0,
            explanation: "Metacognition involves awareness and understanding of one's own thought processes."
        }
    ],
    'social': [
        {
            question: "What is the 'fundamental attribution error'?",
            options: ["Overestimating situational factors", "Overestimating dispositional factors in others", "Underestimating our own abilities", "Overestimating group consensus"],
            correct: 1,
            explanation: "We tend to attribute others' behavior to their character while ignoring situational factors."
        },
        {
            question: "In Asch's conformity experiments, what percentage of participants conformed to the incorrect majority at least once?",
            options: ["25%", "50%", "75%", "95%"],
            correct: 2,
            explanation: "About 75% of participants conformed to the incorrect majority at least once."
        },
        {
            question: "What is 'groupthink'?",
            options: ["Thinking independently in groups", "Desire for conformity leading to poor decisions", "Brainstorming effectively", "Conflict resolution in teams"],
            correct: 1,
            explanation: "Groupthink occurs when the desire for harmony overrides realistic appraisal of alternatives."
        },
        {
            question: "According to the bystander effect, when are people LESS likely to help?",
            options: ["When alone", "When others are present", "During emergencies", "When asked directly"],
            correct: 1,
            explanation: "The presence of others diffuses responsibility, making individuals less likely to help."
        },
        {
            question: "What is cognitive dissonance?",
            options: ["Mental fatigue", "Discomfort from conflicting beliefs/actions", "Difficulty concentrating", "Social anxiety"],
            correct: 1,
            explanation: "Cognitive dissonance is the mental discomfort from holding contradictory beliefs or behaviors."
        }
    ]
};

// Database class
class QuizDatabase {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('quiz_scores')) {
                    db.createObjectStore('quiz_scores', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async saveScore(topic, score, total) {
        const data = {
            topic,
            score,
            total,
            percentage: Math.round((score / total) * 100),
            date: new Date().toISOString()
        };
        return this.put('quiz_scores', data);
    }

    async getScores() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['quiz_scores'], 'readonly');
            const store = transaction.objectStore('quiz_scores');
            const request = store.openCursor(null, 'prev');
            const scores = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && scores.length < 10) {
                    scores.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(scores);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// Quiz class
class Quiz {
    constructor(db) {
        this.db = db;
        this.currentTopic = null;
        this.questions = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.answered = false;
    }

    init() {
        this.setupEventListeners();
        this.loadScoreHistory();
    }

    setupEventListeners() {
        // Topic selection
        document.querySelectorAll('.topic-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTopic(e.currentTarget.dataset.topic));
        });

        // Navigation
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });

        document.getElementById('quit-btn').addEventListener('click', () => this.quitQuiz());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartQuiz());
    }

    selectTopic(topic) {
        this.currentTopic = topic;
        this.questions = [...quizData[topic]].sort(() => Math.random() - 0.5).slice(0, 5);
        this.currentQuestion = 0;
        this.score = 0;

        document.getElementById('topic-selection').style.display = 'none';
        document.getElementById('quiz-area').style.display = 'block';
        document.getElementById('results-area').style.display = 'none';

        this.loadQuestion();
    }

    loadQuestion() {
        this.answered = false;
        const question = this.questions[this.currentQuestion];

        document.getElementById('current-q').textContent = this.currentQuestion + 1;
        document.getElementById('total-q').textContent = this.questions.length;
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('question-text').textContent = question.question;

        const optionsContainer = document.getElementById('answer-options');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => this.selectAnswer(index));
            optionsContainer.appendChild(btn);
        });

        document.getElementById('feedback').style.display = 'none';
        document.getElementById('next-btn').disabled = true;
    }

    selectAnswer(index) {
        if (this.answered) return;
        this.answered = true;

        const question = this.questions[this.currentQuestion];
        const buttons = document.querySelectorAll('.answer-btn');
        const feedback = document.getElementById('feedback');

        buttons.forEach((btn, i) => {
            btn.disabled = true;
            if (i === question.correct) {
                btn.classList.add('correct');
            } else if (i === index && i !== question.correct) {
                btn.classList.add('incorrect');
            }
        });

        if (index === question.correct) {
            this.score++;
            document.getElementById('current-score').textContent = this.score;
            feedback.className = 'feedback correct';
            feedback.textContent = '✓ Correct! ' + question.explanation;
        } else {
            feedback.className = 'feedback incorrect';
            feedback.textContent = '✗ Incorrect. ' + question.explanation;
        }

        feedback.style.display = 'block';
        document.getElementById('next-btn').disabled = false;

        if (this.currentQuestion === this.questions.length - 1) {
            document.getElementById('next-btn').textContent = 'See Results →';
        }
    }

    nextQuestion() {
        this.currentQuestion++;

        if (this.currentQuestion >= this.questions.length) {
            this.showResults();
        } else {
            document.getElementById('next-btn').textContent = 'Next Question →';
            this.loadQuestion();
        }
    }

    async showResults() {
        document.getElementById('quiz-area').style.display = 'none';
        document.getElementById('results-area').style.display = 'block';

        const percentage = Math.round((this.score / this.questions.length) * 100);
        document.getElementById('final-score').textContent = percentage + '%';

        let message = '';
        if (percentage >= 80) message = 'Excellent! You really know your psychology! 🎉';
        else if (percentage >= 60) message = 'Good job! Keep studying! 📚';
        else message = 'Keep practicing! You\'ll get there! 💪';
        document.getElementById('score-message').textContent = message;

        // Save score
        await this.db.saveScore(this.currentTopic, this.score, this.questions.length);
        await this.loadScoreHistory();
    }

    async loadScoreHistory() {
        const scores = await this.db.getScores();
        const container = document.getElementById('score-list');

        if (scores.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No previous scores</p>';
            return;
        }

        const topicNames = {
            'cognitive-dev': 'Cognitive Dev',
            'lifespan': 'Lifespan',
            'learning': 'Learning',
            'social': 'Social Psych'
        };

        container.innerHTML = scores.map(s => {
            const date = new Date(s.date);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `
                <div class="score-item">
                    <span class="topic">${topicNames[s.topic] || s.topic} <small>(${dateStr})</small></span>
                    <span class="result">${s.score}/${s.total} (${s.percentage}%)</span>
                </div>
            `;
        }).join('');
    }

    quitQuiz() {
        if (confirm('Are you sure you want to quit this quiz?')) {
            this.restartQuiz();
        }
    }

    restartQuiz() {
        this.currentTopic = null;
        this.questions = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.answered = false;

        document.getElementById('topic-selection').style.display = 'block';
        document.getElementById('quiz-area').style.display = 'none';
        document.getElementById('results-area').style.display = 'none';
        document.getElementById('next-btn').textContent = 'Next Question →';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const db = new QuizDatabase();
    await db.init();
    const quiz = new Quiz(db);
    quiz.init();
});
