// TruthLens Application JavaScript

// Sample data from the application data
const sampleData = {
  factChecks: [
    {
      id: 1,
      claim: "Vaccines cause autism in children",
      verdict: "FALSE",
      confidence: 95,
      sources: [
        "CDC - Centers for Disease Control",
        "WHO - World Health Organization", 
        "American Academy of Pediatrics",
        "Lancet Medical Journal"
      ],
      analysis: "Extensive scientific research involving millions of children has found no link between vaccines and autism. The original study suggesting this link was retracted due to fraud.",
      lastChecked: "2025-10-07"
    },
    {
      id: 2,
      claim: "Climate change is primarily caused by human activities",
      verdict: "TRUE", 
      confidence: 97,
      sources: [
        "IPCC - Intergovernmental Panel on Climate Change",
        "NASA Climate Change",
        "National Academy of Sciences",
        "Nature Climate Change Journal"
      ],
      analysis: "Overwhelming scientific consensus based on decades of research confirms that current climate change is primarily driven by human greenhouse gas emissions.",
      lastChecked: "2025-10-06"
    }
  ],
  quizQuestions: [
    {
      id: 1,
      category: "Source Evaluation",
      question: "Which of the following is the most reliable indicator of a credible news source?",
      options: [
        "Large social media following",
        "Colorful, eye-catching headlines", 
        "Transparent editorial policies and corrections policy",
        "Emotional language that resonates with readers"
      ],
      correct: 2,
      explanation: "Credible news sources maintain transparency about their editorial processes, publish corrections when errors occur, and follow journalistic standards."
    },
    {
      id: 2,
      category: "Bias Detection",
      question: "What is the primary purpose of lateral reading when evaluating information?",
      options: [
        "To read articles from left to right",
        "To verify claims by consulting multiple independent sources",
        "To read only headlines without full articles",
        "To focus on emotional responses to content"
      ],
      correct: 1,
      explanation: "Lateral reading involves leaving the original source to check claims against multiple independent sources, helping verify accuracy and identify bias."
    },
    {
      id: 3,
      category: "Misinformation Detection",
      question: "Which red flag suggests an article might contain misinformation?",
      options: [
        "Multiple expert quotes and citations",
        "Publication date within the last week",
        "Sensational headlines with ALL CAPS and exclamation points",
        "Author byline with contact information"
      ],
      correct: 2,
      explanation: "Sensational headlines designed to provoke strong emotional reactions are often used in misinformation to bypass critical thinking."
    }
  ],
  sourceAnalysis: [
    {
      domain: "reuters.com",
      trustScore: 92,
      category: "News Media",
      founded: "1851",
      headquarters: "London, UK",
      ownership: "Thomson Reuters Corporation",
      editorialPolicy: "Available",
      factCheckRecord: "High accuracy",
      biasRating: "Center",
      funding: "Corporate revenue, subscriptions"
    },
    {
      domain: "example-fake-news.com",
      trustScore: 15,
      category: "Questionable Source",
      founded: "2023",
      headquarters: "Unknown",
      ownership: "Hidden/Anonymous",
      editorialPolicy: "Not available",
      factCheckRecord: "Multiple false claims",
      biasRating: "Strong bias",
      funding: "Ad revenue, unclear funding"
    }
  ],
  forumPosts: [
    {
      id: 1,
      title: "How to identify deepfake videos",
      author: "MediaExpert2025",
      category: "Technology",
      replies: 23,
      views: 456,
      lastActivity: "2 hours ago",
      excerpt: "With AI-generated videos becoming more sophisticated, here are key indicators to watch for..."
    },
    {
      id: 2, 
      title: "Fact-checking the latest health claims on social media",
      author: "HealthFactChecker",
      category: "Health",
      replies: 18,
      views: 342,
      lastActivity: "5 hours ago",
      excerpt: "Several viral health claims have been circulating. Let's examine the evidence..."
    },
    {
      id: 3,
      title: "Election misinformation: What to watch for in 2025",
      author: "ElectionWatcher",
      category: "Politics",
      replies: 67,
      views: 1234,
      lastActivity: "1 hour ago",
      excerpt: "As we approach election season, here are common types of misinformation patterns..."
    }
  ]
};

// Application state
let currentQuiz = null;
let currentQuestion = 0;
let quizAnswers = [];
let selectedCategory = 'all';

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupFactChecker();
    setupSourceAnalysis();
    setupQuiz();
    setupForum();
    populateForumPosts();
}

// Navigation System
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    
    // Handle navigation clicks
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.getAttribute('data-section');
            showSection(targetSection);
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Handle hero action buttons
    const heroButtons = document.querySelectorAll('[data-section]');
    heroButtons.forEach(btn => {
        if (!btn.classList.contains('nav-item')) {
            btn.addEventListener('click', () => {
                const targetSection = btn.getAttribute('data-section');
                showSection(targetSection);
                
                // Update nav
                navItems.forEach(nav => nav.classList.remove('active'));
                const targetNav = document.querySelector(`[data-section="${targetSection}"].nav-item`);
                if (targetNav) targetNav.classList.add('active');
            });
        }
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Fact Checker System
function setupFactChecker() {
    const factCheckBtn = document.getElementById('fact-check-btn');
    const factCheckInput = document.getElementById('fact-check-input');
    
    factCheckBtn.addEventListener('click', performFactCheck);
    factCheckInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            performFactCheck();
        }
    });
}

function performFactCheck() {
    const input = document.getElementById('fact-check-input').value.trim();
    if (!input) {
        alert('Please enter a claim or URL to fact-check.');
        return;
    }
    
    const resultsSection = document.getElementById('fact-check-results');
    const loading = document.getElementById('fact-check-loading');
    const result = document.getElementById('fact-check-result');
    
    // Show loading
    resultsSection.style.display = 'block';
    loading.style.display = 'block';
    result.style.display = 'none';
    
    // Simulate API call
    setTimeout(() => {
        const factCheck = findSimilarFactCheck(input);
        displayFactCheckResult(factCheck);
        
        loading.style.display = 'none';
        result.style.display = 'block';
    }, 2000);
}

function findSimilarFactCheck(input) {
    const lowerInput = input.toLowerCase();
    
    // Check for keywords to match with sample data
    for (let factCheck of sampleData.factChecks) {
        const keywords = factCheck.claim.toLowerCase().split(' ');
        if (keywords.some(keyword => lowerInput.includes(keyword))) {
            return factCheck;
        }
    }
    
    // Generate a simulated response for unknown claims
    return generateSimulatedFactCheck(input);
}

function generateSimulatedFactCheck(claim) {
    const verdicts = ['TRUE', 'FALSE', 'MIXED'];
    const randomVerdict = verdicts[Math.floor(Math.random() * verdicts.length)];
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
    
    return {
        claim: claim,
        verdict: randomVerdict,
        confidence: confidence,
        sources: [
            "Reuters Fact Check",
            "Associated Press",
            "Snopes",
            "PolitiFact"
        ],
        analysis: `This claim has been analyzed using our AI-powered fact-checking system. Based on available evidence from multiple trusted sources, we have determined this claim to be ${randomVerdict.toLowerCase()}.`,
        lastChecked: new Date().toISOString().split('T')[0]
    };
}

function displayFactCheckResult(factCheck) {
    const verdictBadge = document.getElementById('verdict-badge');
    const confidenceScore = document.getElementById('confidence-score');
    const analysisText = document.getElementById('analysis-text');
    const sourcesList = document.getElementById('sources-list');
    const lastChecked = document.getElementById('last-checked');
    
    // Set verdict badge
    verdictBadge.textContent = factCheck.verdict;
    verdictBadge.className = `verdict-badge verdict-${factCheck.verdict.toLowerCase()}`;
    
    // Set confidence score
    confidenceScore.textContent = factCheck.confidence;
    
    // Set analysis text
    analysisText.textContent = factCheck.analysis;
    
    // Populate sources
    sourcesList.innerHTML = '';
    factCheck.sources.forEach(source => {
        const li = document.createElement('li');
        li.textContent = source;
        sourcesList.appendChild(li);
    });
    
    // Set last checked date
    lastChecked.textContent = factCheck.lastChecked;
}

// Source Analysis System
function setupSourceAnalysis() {
    const analyzeBtn = document.getElementById('source-analyze-btn');
    const sourceInput = document.getElementById('source-input');
    
    analyzeBtn.addEventListener('click', performSourceAnalysis);
    sourceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSourceAnalysis();
        }
    });
}

function performSourceAnalysis() {
    const input = document.getElementById('source-input').value.trim();
    if (!input) {
        alert('Please enter a website URL to analyze.');
        return;
    }
    
    const resultsSection = document.getElementById('source-results');
    const loading = document.getElementById('source-loading');
    const result = document.getElementById('source-result');
    
    // Show loading
    resultsSection.style.display = 'block';
    loading.style.display = 'block';
    result.style.display = 'none';
    
    // Simulate API call
    setTimeout(() => {
        const analysis = analyzeSource(input);
        displaySourceAnalysis(analysis);
        
        loading.style.display = 'none';
        result.style.display = 'block';
    }, 1500);
}

function analyzeSource(url) {
    // Extract domain from URL
    let domain;
    try {
        domain = new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace('www.', '');
    } catch {
        domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
    
    // Check if we have data for this domain
    const existingAnalysis = sampleData.sourceAnalysis.find(item => 
        item.domain === domain || domain.includes(item.domain.split('.')[0])
    );
    
    if (existingAnalysis) {
        return existingAnalysis;
    }
    
    // Generate simulated analysis
    return generateSimulatedSourceAnalysis(domain);
}

function generateSimulatedSourceAnalysis(domain) {
    const trustScore = Math.floor(Math.random() * 40) + 60; // 60-100
    const categories = ['News Media', 'Blog', 'Corporate Site', 'Government', 'Academic'];
    const biasRatings = ['Left', 'Left-Center', 'Center', 'Right-Center', 'Right'];
    
    return {
        domain: domain,
        trustScore: trustScore,
        category: categories[Math.floor(Math.random() * categories.length)],
        founded: Math.floor(Math.random() * 50) + 1970,
        headquarters: "Various locations",
        ownership: "Information being analyzed",
        editorialPolicy: trustScore > 75 ? "Available" : "Limited information",
        factCheckRecord: trustScore > 80 ? "Good accuracy" : trustScore > 60 ? "Mixed record" : "Questionable accuracy",
        biasRating: biasRatings[Math.floor(Math.random() * biasRatings.length)],
        funding: "Mixed funding sources"
    };
}

function displaySourceAnalysis(analysis) {
    document.getElementById('score-number').textContent = analysis.trustScore;
    document.getElementById('source-category').textContent = analysis.category;
    document.getElementById('bias-rating').textContent = analysis.biasRating;
    document.getElementById('founded-year').textContent = analysis.founded;
    document.getElementById('ownership').textContent = analysis.ownership;
    document.getElementById('headquarters').textContent = analysis.headquarters;
    document.getElementById('funding').textContent = analysis.funding;
    document.getElementById('editorial-policy').textContent = analysis.editorialPolicy;
    document.getElementById('fact-check-record').textContent = analysis.factCheckRecord;
    
    // Update score circle color based on trust score
    const scoreCircle = document.querySelector('.score-circle');
    if (analysis.trustScore >= 80) {
        scoreCircle.style.background = `conic-gradient(var(--color-success) ${analysis.trustScore * 3.6}deg, var(--color-secondary) ${analysis.trustScore * 3.6}deg)`;
    } else if (analysis.trustScore >= 60) {
        scoreCircle.style.background = `conic-gradient(var(--color-warning) ${analysis.trustScore * 3.6}deg, var(--color-secondary) ${analysis.trustScore * 3.6}deg)`;
    } else {
        scoreCircle.style.background = `conic-gradient(var(--color-error) ${analysis.trustScore * 3.6}deg, var(--color-secondary) ${analysis.trustScore * 3.6}deg)`;
    }
}

// Quiz System
function setupQuiz() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    const submitBtn = document.getElementById('submit-answer');
    const retakeBtn = document.getElementById('retake-quiz');
    
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCategory = btn.getAttribute('data-category');
            startQuiz();
        });
    });
    
    submitBtn.addEventListener('click', submitAnswer);
    retakeBtn.addEventListener('click', resetQuiz);
}

function startQuiz() {
    const filteredQuestions = selectedCategory === 'all' 
        ? sampleData.quizQuestions 
        : sampleData.quizQuestions.filter(q => q.category === selectedCategory);
    
    currentQuiz = [...filteredQuestions];
    currentQuestion = 0;
    quizAnswers = [];
    
    document.getElementById('quiz-start').style.display = 'none';
    document.getElementById('quiz-active').style.display = 'block';
    document.getElementById('quiz-results').style.display = 'none';
    
    document.getElementById('total-questions').textContent = currentQuiz.length;
    showQuestion();
}

function showQuestion() {
    const question = currentQuiz[currentQuestion];
    
    document.getElementById('current-question').textContent = currentQuestion + 1;
    document.getElementById('question-category').textContent = question.category;
    document.getElementById('question-text').textContent = question.question;
    
    const progressFill = document.getElementById('progress-fill');
    const progress = ((currentQuestion + 1) / currentQuiz.length) * 100;
    progressFill.style.width = progress + '%';
    
    const optionsContainer = document.getElementById('question-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = option;
        optionDiv.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionDiv);
    });
    
    document.getElementById('submit-answer').disabled = true;
}

function selectOption(index) {
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.classList.remove('selected'));
    options[index].classList.add('selected');
    
    document.getElementById('submit-answer').disabled = false;
    
    // Store the selected answer
    quizAnswers[currentQuestion] = index;
}

function submitAnswer() {
    currentQuestion++;
    
    if (currentQuestion < currentQuiz.length) {
        showQuestion();
    } else {
        showQuizResults();
    }
}

function showQuizResults() {
    document.getElementById('quiz-active').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'block';
    
    let correctAnswers = 0;
    const breakdown = document.getElementById('results-breakdown');
    breakdown.innerHTML = '';
    
    currentQuiz.forEach((question, index) => {
        const isCorrect = quizAnswers[index] === question.correct;
        if (isCorrect) correctAnswers++;
        
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${isCorrect ? 'correct' : 'incorrect'}`;
        
        resultItem.innerHTML = `
            <h4>${question.question}</h4>
            <p><strong>Your answer:</strong> ${question.options[quizAnswers[index]]}</p>
            <p><strong>Correct answer:</strong> ${question.options[question.correct]}</p>
            <p><strong>Explanation:</strong> ${question.explanation}</p>
        `;
        
        breakdown.appendChild(resultItem);
    });
    
    document.getElementById('final-score').textContent = correctAnswers;
    document.getElementById('final-total').textContent = currentQuiz.length;
}

function resetQuiz() {
    document.getElementById('quiz-start').style.display = 'block';
    document.getElementById('quiz-active').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'none';
    
    currentQuiz = null;
    currentQuestion = 0;
    quizAnswers = [];
}

// Forum System
function setupForum() {
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(cat => cat.classList.remove('active'));
            item.classList.add('active');
            
            const category = item.getAttribute('data-category');
            filterForumPosts(category);
        });
    });
}

function populateForumPosts() {
    const forumPosts = document.getElementById('forum-posts');
    forumPosts.innerHTML = '';
    
    sampleData.forumPosts.forEach(post => {
        const postElement = createForumPostElement(post);
        forumPosts.appendChild(postElement);
    });
}

function createForumPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'forum-post';
    
    postDiv.innerHTML = `
        <div class="post-header">
            <h3 class="post-title">${post.title}</h3>
            <span class="post-category">${post.category}</span>
        </div>
        <div class="post-meta">
            <span>By ${post.author}</span>
            <span>${post.replies} replies</span>
            <span>${post.views} views</span>
            <span>Last: ${post.lastActivity}</span>
        </div>
        <p class="post-excerpt">${post.excerpt}</p>
    `;
    
    return postDiv;
}

function filterForumPosts(category) {
    const filteredPosts = category === 'all' 
        ? sampleData.forumPosts 
        : sampleData.forumPosts.filter(post => post.category === category);
    
    const forumPosts = document.getElementById('forum-posts');
    forumPosts.innerHTML = '';
    
    filteredPosts.forEach(post => {
        const postElement = createForumPostElement(post);
        forumPosts.appendChild(postElement);
    });
}

// Utility Functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M+';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K+';
    }
    return num.toString();
}

// Initialize smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading states for better UX
function addLoadingState(element) {
    element.disabled = true;
    const originalText = element.textContent;
    element.textContent = 'Loading...';
    
    return () => {
        element.disabled = false;
        element.textContent = originalText;
    };
}

// Error handling for form submissions
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    alert(`An error occurred while ${context}. Please try again.`);
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Escape key to close modals/reset states
    if (e.key === 'Escape') {
        // Add escape key functionality if needed
    }
    
    // Arrow keys for navigation in quiz
    if (document.getElementById('quiz-active').style.display !== 'none') {
        const options = document.querySelectorAll('.option');
        const selected = document.querySelector('.option.selected');
        
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            let currentIndex = -1;
            
            if (selected) {
                currentIndex = Array.from(options).indexOf(selected);
            }
            
            if (e.key === 'ArrowDown') {
                currentIndex = (currentIndex + 1) % options.length;
            } else {
                currentIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
            }
            
            selectOption(currentIndex);
        }
        
        if (e.key === 'Enter' && !document.getElementById('submit-answer').disabled) {
            submitAnswer();
        }
    }
});

// Performance optimization: Lazy load heavy content
function lazyLoadContent() {
    // Implement lazy loading for forum posts, images, etc.
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Load content when it comes into view
                entry.target.classList.add('loaded');
            }
        });
    });
    
    // Observe elements that should be lazy loaded
    document.querySelectorAll('.lazy-load').forEach(el => {
        observer.observe(el);
    });
}

// Initialize lazy loading when DOM is ready
document.addEventListener('DOMContentLoaded', lazyLoadContent);