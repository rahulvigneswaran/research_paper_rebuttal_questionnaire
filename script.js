// DOM Elements and Variables
let allInputs;
let totalQuestions = 0;
let answeredQuestions = 0;
let paperTitleInput;
let notificationTimeout;
let questionnaireSelect;
let newQuestionnaireBtn;
let deleteQuestionnaireBtn;
let questionnaireData;

// Counters for repeatable items
let commentCounters = {};
let concernCounters = {};

// Progress tracking by section
let sectionProgress = {};

// Create notification element
const notification = document.createElement('div');
notification.className = 'notification';
document.body.appendChild(notification);

// Function to show notification
function showNotification(message, duration = 3000) {
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    notification.textContent = message;
    notification.classList.add('show');
    notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Initialize questionnaire storage structure
function initializeQuestionnaireStorage() {
    if (!localStorage.getItem('rebuttals')) {
        localStorage.setItem('rebuttals', JSON.stringify({}));
        localStorage.setItem('rebuttalsList', JSON.stringify([]));
        localStorage.setItem('currentRebuttal', '');
    }
}

// Create new rebuttal questionnaire
function createNewRebuttal(title = 'Untitled Rebuttal') {
    const rebuttals = JSON.parse(localStorage.getItem('rebuttals'));
    const list = JSON.parse(localStorage.getItem('rebuttalsList'));

    let finalTitle = title;
    let counter = 1;
    while (list.includes(finalTitle)) {
        finalTitle = `${title} ${counter}`;
        counter++;
    }

    rebuttals[finalTitle] = {
        paperTitle: finalTitle,
        answers: {},
        repeatableItems: {
            comments: [],
            concerns: []
        },
        checklist: {}
    };

    list.push(finalTitle);
    localStorage.setItem('rebuttals', JSON.stringify(rebuttals));
    localStorage.setItem('rebuttalsList', JSON.stringify(list));
    localStorage.setItem('currentRebuttal', finalTitle);

    return finalTitle;
}

// Switch to a different rebuttal
function switchRebuttal(title) {
    saveProgress('auto');
    localStorage.setItem('currentRebuttal', title);
    loadCurrentRebuttal();
}

// Delete current rebuttal
function deleteRebuttal(title) {
    const rebuttals = JSON.parse(localStorage.getItem('rebuttals'));
    const list = JSON.parse(localStorage.getItem('rebuttalsList'));

    if (list.length === 1) {
        showNotification('Cannot delete the only rebuttal. Create a new one first.');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
        return;
    }

    delete rebuttals[title];
    const index = list.indexOf(title);
    if (index > -1) {
        list.splice(index, 1);
    }

    localStorage.setItem('rebuttals', JSON.stringify(rebuttals));
    localStorage.setItem('rebuttalsList', JSON.stringify(list));

    if (localStorage.getItem('currentRebuttal') === title) {
        localStorage.setItem('currentRebuttal', list[0]);
    }

    updateRebuttalSelector();
    loadCurrentRebuttal();
    showNotification('Rebuttal deleted');
}

// Update the rebuttal selector dropdown
function updateRebuttalSelector() {
    const selector = document.getElementById('questionnaire-select');
    const list = JSON.parse(localStorage.getItem('rebuttalsList'));
    const currentTitle = localStorage.getItem('currentRebuttal');

    selector.innerHTML = '';

    list.forEach(title => {
        const option = document.createElement('option');
        option.value = title;
        option.textContent = title;
        selector.appendChild(option);
    });

    selector.value = currentTitle;
}

// Load questions from JSON
async function loadQuestionsData() {
    try {
        const response = await fetch('./questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        questionnaireData = await response.json();
        return questionnaireData;
    } catch (error) {
        console.error('Error loading questions:', error);
        showNotification('Error loading questions data. Please refresh the page.', 5000);
        // Fallback: try to load from same directory
        try {
            const response2 = await fetch('questions.json');
            questionnaireData = await response2.json();
            return questionnaireData;
        } catch (error2) {
            console.error('Fallback also failed:', error2);
        }
    }
}

// Generate questionnaire HTML
function generateQuestionnaire(data) {
    const container = document.getElementById('questionnaire-container');
    
    container.innerHTML = '';

    // Add Table of Contents
    let tocHTML = `
        <div class="toc-container">
            <h3>📋 Quick Navigation</h3>
            <ul class="toc-list">
    `;
    
    data.sections.forEach((section, index) => {
        tocHTML += `<li><a href="#section-${section.id}">${index + 1}. ${section.title}</a></li>`;
    });
    
    tocHTML += `</ul></div>`;
    container.innerHTML = tocHTML;

    // Create all sections (visible by default)
    data.sections.forEach((section, index) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';
        sectionDiv.id = `section-${section.id}`;

        let sectionHTML = `<h2><span class="section-number">${index + 1}</span>${section.title}</h2>`;

        // Add instructions if present
        if (section.instructions) {
            sectionHTML += `<div class="section-instructions">${section.instructions}</div>`;
        }

        // Handle regular questions
        if (section.questions) {
            section.questions.forEach((question, qIndex) => {
                sectionHTML += generateQuestionHTML(question, `s${section.id}_q${qIndex}`);
            });
        }

        // Handle repeatable fields (for comments and concerns)
        if (section.fields_per_comment) {
            sectionHTML += `
                <div class="repeatable-section" id="repeatable-comments">
                    <h3>Reviewer Comments</h3>
                    <div id="comments-container"></div>
                    <button class="add-item-button" onclick="addComment()">+ Add Comment</button>
                </div>
            `;
        }

        if (section.fields_per_concern) {
            sectionHTML += `
                <div class="repeatable-section" id="repeatable-concerns">
                    <h3>Consolidated Concerns</h3>
                    <div id="concerns-container"></div>
                    <button class="add-item-button" onclick="addConcern()">+ Add Concern</button>
                </div>
            `;
        }

        // Handle checklist
        if (section.checklist) {
            sectionHTML += `<div class="checklist"><h3>Quality Checklist</h3>`;
            section.checklist.forEach((item, itemIndex) => {
                sectionHTML += `
                    <div class="checklist-item">
                        <input type="checkbox" id="check_${section.id}_${itemIndex}" data-section="${section.id}" data-item="${itemIndex}">
                        <label for="check_${section.id}_${itemIndex}">${item}</label>
                    </div>
                `;
            });
            sectionHTML += `</div>`;
        }

        sectionDiv.innerHTML = sectionHTML;
        container.appendChild(sectionDiv);
    });
}

// Generate HTML for a single question
function generateQuestionHTML(question, id) {
    let html = `<div class="question">`;
    html += `<div class="question-text">${question.q}</div>`;

    if (question.type === 'textarea') {
        html += `<textarea id="${id}" data-question="${question.q}"></textarea>`;
    } else if (question.type === 'text') {
        html += `<input type="text" id="${id}" data-question="${question.q}">`;
    } else if (question.type === 'number') {
        html += `<input type="number" id="${id}" data-question="${question.q}">`;
    } else if (question.type === 'choice') {
        html += `<select id="${id}" data-question="${question.q}">`;
        html += `<option value="">-- Select --</option>`;
        question.options.forEach(option => {
            html += `<option value="${option}">${option}</option>`;
        });
        html += `</select>`;
    }

    html += `</div>`;
    return html;
}

// Add a new comment item
function addComment() {
    const container = document.getElementById('comments-container');
    const commentId = commentCounters['comments'] || 0;
    commentCounters['comments'] = commentId + 1;

    const section = questionnaireData.sections.find(s => s.fields_per_comment);
    if (!section) return;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'repeatable-item';
    itemDiv.id = `comment-${commentId}`;

    let html = `
        <div class="repeatable-item-header">
            <h4>Comment #${commentId + 1}</h4>
            <button class="remove-item-button" onclick="removeComment(${commentId})">Remove</button>
        </div>
    `;

    section.fields_per_comment.forEach((field, idx) => {
        html += generateQuestionHTML(field, `comment_${commentId}_q${idx}`);
    });

    itemDiv.innerHTML = html;
    container.appendChild(itemDiv);

    attachInputListeners();
    saveProgress('auto');
}

// Remove a comment item
function removeComment(id) {
    if (!confirm('Remove this comment?')) return;
    const item = document.getElementById(`comment-${id}`);
    if (item) {
        item.remove();
        saveProgress('auto');
        updateProgressDisplay();
    }
}

// Add a new concern item
function addConcern() {
    const container = document.getElementById('concerns-container');
    const concernId = concernCounters['concerns'] || 0;
    concernCounters['concerns'] = concernId + 1;

    const section = questionnaireData.sections.find(s => s.fields_per_concern);
    if (!section) return;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'repeatable-item';
    itemDiv.id = `concern-${concernId}`;

    let html = `
        <div class="repeatable-item-header">
            <h4>Concern #${concernId + 1}</h4>
            <button class="remove-item-button" onclick="removeConcern(${concernId})">Remove</button>
        </div>
    `;

    section.fields_per_concern.forEach((field, idx) => {
        html += generateQuestionHTML(field, `concern_${concernId}_q${idx}`);
    });

    itemDiv.innerHTML = html;
    container.appendChild(itemDiv);

    attachInputListeners();
    saveProgress('auto');
}

// Remove a concern item
function removeConcern(id) {
    if (!confirm('Remove this concern?')) return;
    const item = document.getElementById(`concern-${id}`);
    if (item) {
        item.remove();
        saveProgress('auto');
        updateProgressDisplay();
    }
}

// Save progress to localStorage
function saveProgress(type = 'manual') {
    const currentTitle = localStorage.getItem('currentRebuttal');
    if (!currentTitle) return;

    const rebuttals = JSON.parse(localStorage.getItem('rebuttals'));
    const answers = {};
    const checklist = {};

    // Save all inputs
    document.querySelectorAll('textarea, input[type="text"], input[type="number"], select').forEach(input => {
        if (input.id && input.id !== 'paper-title' && input.id !== 'questionnaire-select' && input.id !== 'import-file-input') {
            answers[input.id] = input.value;
        }
    });

    // Save checklist
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checklist[checkbox.id] = checkbox.checked;
    });

    rebuttals[currentTitle].answers = answers;
    rebuttals[currentTitle].checklist = checklist;
    rebuttals[currentTitle].paperTitle = paperTitleInput.value || currentTitle;

    localStorage.setItem('rebuttals', JSON.stringify(rebuttals));

    if (type === 'manual') {
        showNotification('Progress saved!');
    }

    updateProgressDisplay();
}

// Load current rebuttal data
function loadCurrentRebuttal() {
    const currentTitle = localStorage.getItem('currentRebuttal');
    if (!currentTitle) return;

    const rebuttals = JSON.parse(localStorage.getItem('rebuttals'));
    const rebuttalData = rebuttals[currentTitle];

    if (!rebuttalData) return;

    // Update paper title
    paperTitleInput.value = rebuttalData.paperTitle || currentTitle;

    // Load answers
    Object.keys(rebuttalData.answers || {}).forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = rebuttalData.answers[id];
            // Trigger styling update
            if (input.tagName === 'TEXTAREA') {
                input.classList.remove('textarea-empty');
            }
        }
    });

    // Load checklist
    Object.keys(rebuttalData.checklist || {}).forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = rebuttalData.checklist[id];
        }
    });

    updateProgressDisplay();
}

// Update progress display
function updateProgressDisplay() {
    const inputs = document.querySelectorAll('textarea, input[type="text"], input[type="number"], select');
    totalQuestions = 0;
    answeredQuestions = 0;

    // Reset section progress
    sectionProgress = {};

    inputs.forEach(input => {
        if (input.id && input.id !== 'paper-title' && input.id !== 'questionnaire-select' && input.id !== 'import-file-input') {
            totalQuestions++;
            
            // Determine which section this input belongs to
            let sectionId = null;
            if (input.id.startsWith('s')) {
                sectionId = input.id.split('_')[0].substring(1); // Extract section number from id like "s0_q1"
            } else if (input.id.startsWith('comment_') || input.id.startsWith('concern_')) {
                // These belong to specific sections
                if (input.id.startsWith('comment_')) {
                    sectionId = '2'; // Decompose Reviewer Criticisms
                } else if (input.id.startsWith('concern_')) {
                    sectionId = '3'; // Consolidate Overlapping Issues
                }
            }
            
            if (sectionId !== null) {
                if (!sectionProgress[sectionId]) {
                    sectionProgress[sectionId] = { total: 0, answered: 0 };
                }
                sectionProgress[sectionId].total++;
                
                if (input.value.trim() !== '') {
                    answeredQuestions++;
                    sectionProgress[sectionId].answered++;
                }
            } else if (input.value.trim() !== '') {
                answeredQuestions++;
            }
        }
    });

    // Update overall progress
    const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    
    document.getElementById('progress-display').textContent = 
        `Progress: ${answeredQuestions}/${totalQuestions} answered`;
    
    document.getElementById('overall-stats').textContent = 
        `${answeredQuestions} / ${totalQuestions} questions answered`;
    
    const progressFill = document.getElementById('overall-progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    
    if (progressFill && progressPercentage) {
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
        
        // Hide percentage text if progress is too low
        if (percentage < 8) {
            progressPercentage.style.display = 'none';
        } else {
            progressPercentage.style.display = 'block';
        }
    }
    
    // Update section progress bars
    updateSectionProgressBars();
}

// Update individual section progress bars
function updateSectionProgressBars() {
    if (!questionnaireData) return;
    
    questionnaireData.sections.forEach((section, index) => {
        const sectionId = section.id;
        const progressData = sectionProgress[sectionId] || { total: 0, answered: 0 };
        const percentage = progressData.total > 0 ? Math.round((progressData.answered / progressData.total) * 100) : 0;
        
        const fillElement = document.getElementById(`section-progress-fill-${sectionId}`);
        const textElement = document.getElementById(`section-progress-text-${sectionId}`);
        
        if (fillElement && textElement) {
            fillElement.style.width = `${percentage}%`;
            textElement.textContent = `${progressData.answered}/${progressData.total} (${percentage}%)`;
            
            // Add complete class if 100%
            if (percentage === 100) {
                fillElement.classList.add('section-complete');
            } else {
                fillElement.classList.remove('section-complete');
            }
        }
    });
}

// Toggle section progress visibility
function toggleSectionProgress() {
    const list = document.getElementById('sections-progress-list');
    const button = document.getElementById('toggle-sections');
    
    if (list.classList.contains('expanded')) {
        list.classList.remove('expanded');
        button.textContent = 'Show ▼';
    } else {
        list.classList.add('expanded');
        button.textContent = 'Hide ▲';
    }
}

// Generate section progress bars
function generateSectionProgressBars() {
    if (!questionnaireData) return;
    
    const container = document.getElementById('sections-progress-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    questionnaireData.sections.forEach((section, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'section-progress-item';
        itemDiv.innerHTML = `
            <div class="section-progress-label">
                <span class="section-progress-number">${index + 1}</span>
                <span>${section.title}</span>
            </div>
            <div class="section-progress-bar">
                <div class="section-progress-fill" id="section-progress-fill-${section.id}" style="width: 0%;"></div>
            </div>
            <div class="section-progress-text" id="section-progress-text-${section.id}">0/0 (0%)</div>
        `;
        container.appendChild(itemDiv);
    });
}

// Attach input listeners for auto-save and styling
function attachInputListeners() {
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.classList.remove('textarea-empty');
            } else {
                this.classList.add('textarea-empty');
            }
            updateProgressDisplay();
        });

        textarea.addEventListener('blur', function() {
            saveProgress('auto');
        });
    });

    document.querySelectorAll('input[type="text"], input[type="number"], select').forEach(input => {
        input.addEventListener('change', function() {
            saveProgress('auto');
        });
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            saveProgress('auto');
        });
    });
}

// Export functionality
function exportRebuttal(format) {
    const currentTitle = localStorage.getItem('currentRebuttal');
    const rebuttals = JSON.parse(localStorage.getItem('rebuttals'));
    const rebuttalData = rebuttals[currentTitle];

    if (format === 'json') {
        const dataStr = JSON.stringify(rebuttalData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentTitle.replace(/[^a-z0-9]/gi, '_')}.json`;
        link.click();
        showNotification('Exported as JSON');
    } else if (format === 'markdown') {
        let markdown = `# ${rebuttalData.paperTitle}\n\n`;
        markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
        markdown += `---\n\n`;
        
        questionnaireData.sections.forEach((section, sectionIndex) => {
            markdown += `## ${sectionIndex + 1}. ${section.title}\n\n`;
            
            if (section.instructions) {
                markdown += `> ${section.instructions}\n\n`;
            }
            
            if (section.questions) {
                section.questions.forEach((question, qIndex) => {
                    const id = `s${section.id}_q${qIndex}`;
                    const answer = rebuttalData.answers[id] || '';
                    if (answer.trim()) {
                        markdown += `**${question.q}**\n\n${answer}\n\n`;
                    }
                });
            }

            // Handle repeatable comments
            if (section.fields_per_comment) {
                const commentAnswers = Object.keys(rebuttalData.answers)
                    .filter(key => key.startsWith('comment_'));
                
                if (commentAnswers.length > 0) {
                    markdown += `### Reviewer Comments\n\n`;
                    const commentIds = [...new Set(commentAnswers.map(key => key.split('_')[1]))];
                    
                    commentIds.forEach(commentId => {
                        markdown += `#### Comment #${parseInt(commentId) + 1}\n\n`;
                        section.fields_per_comment.forEach((field, idx) => {
                            const id = `comment_${commentId}_q${idx}`;
                            const answer = rebuttalData.answers[id] || '';
                            if (answer.trim()) {
                                markdown += `**${field.q}**: ${answer}\n\n`;
                            }
                        });
                    });
                }
            }

            // Handle repeatable concerns
            if (section.fields_per_concern) {
                const concernAnswers = Object.keys(rebuttalData.answers)
                    .filter(key => key.startsWith('concern_'));
                
                if (concernAnswers.length > 0) {
                    markdown += `### Consolidated Concerns\n\n`;
                    const concernIds = [...new Set(concernAnswers.map(key => key.split('_')[1]))];
                    
                    concernIds.forEach(concernId => {
                        markdown += `#### Concern #${parseInt(concernId) + 1}\n\n`;
                        section.fields_per_concern.forEach((field, idx) => {
                            const id = `concern_${concernId}_q${idx}`;
                            const answer = rebuttalData.answers[id] || '';
                            if (answer.trim()) {
                                markdown += `**${field.q}**: ${answer}\n\n`;
                            }
                        });
                    });
                }
            }

            if (section.checklist) {
                markdown += `### Quality Checklist\n\n`;
                section.checklist.forEach((item, itemIndex) => {
                    const checkId = `check_${section.id}_${itemIndex}`;
                    const checked = rebuttalData.checklist[checkId] ? 'x' : ' ';
                    markdown += `- [${checked}] ${item}\n`;
                });
                markdown += '\n';
            }
            
            markdown += `---\n\n`;
        });

        const dataBlob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentTitle.replace(/[^a-z0-9]/gi, '_')}.md`;
        link.click();
        showNotification('Exported as Markdown');
    } else if (format === 'pdf') {
        // For PDF, we'll use the browser's print functionality
        showNotification('Opening print dialog for PDF export...');
        setTimeout(() => {
            window.print();
        }, 500);
    }
}

// Import functionality
function importRebuttal(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            const title = importedData.paperTitle || 'Imported Rebuttal';
            
            const rebuttals = JSON.parse(localStorage.getItem('rebuttals'));
            const list = JSON.parse(localStorage.getItem('rebuttalsList'));
            
            let finalTitle = title;
            let counter = 1;
            while (list.includes(finalTitle)) {
                finalTitle = `${title} (${counter})`;
                counter++;
            }
            
            rebuttals[finalTitle] = importedData;
            rebuttals[finalTitle].paperTitle = finalTitle;
            list.push(finalTitle);
            
            localStorage.setItem('rebuttals', JSON.stringify(rebuttals));
            localStorage.setItem('rebuttalsList', JSON.stringify(list));
            localStorage.setItem('currentRebuttal', finalTitle);
            
            updateRebuttalSelector();
            loadCurrentRebuttal();
            showNotification('Rebuttal imported successfully');
        } catch (error) {
            showNotification('Error importing file', 5000);
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    // Load questions data
    await loadQuestionsData();
    
    // Generate questionnaire UI
    generateQuestionnaire(questionnaireData);
    
    // Get references
    paperTitleInput = document.getElementById('paper-title');
    questionnaireSelect = document.getElementById('questionnaire-select');
    newQuestionnaireBtn = document.getElementById('new-questionnaire');
    deleteQuestionnaireBtn = document.getElementById('delete-questionnaire');

    // Initialize storage
    initializeQuestionnaireStorage();

    // Create first rebuttal if none exist
    const list = JSON.parse(localStorage.getItem('rebuttalsList'));
    if (list.length === 0) {
        createNewRebuttal();
    } else if (!localStorage.getItem('currentRebuttal')) {
        localStorage.setItem('currentRebuttal', list[0]);
    }

    // Update dropdown and load current rebuttal
    updateRebuttalSelector();
    
    // Generate section progress bars
    generateSectionProgressBars();
    
    loadCurrentRebuttal();

    // Attach all input listeners
    attachInputListeners();

    // Introduction section
    const toggleIntroBtn = document.getElementById('toggle-intro');
    const introContent = document.getElementById('intro-content');
    const getStartedBtn = document.getElementById('get-started');

    if (localStorage.getItem('hideIntro') === 'true') {
        introContent.style.display = 'none';
        toggleIntroBtn.textContent = 'Show Details ▼';
    }

    toggleIntroBtn.addEventListener('click', function() {
        if (introContent.style.display === 'none') {
            introContent.style.display = 'block';
            toggleIntroBtn.textContent = 'Hide Details ▲';
            localStorage.setItem('hideIntro', 'false');
        } else {
            introContent.style.display = 'none';
            toggleIntroBtn.textContent = 'Show Details ▼';
            localStorage.setItem('hideIntro', 'true');
        }
    });

    getStartedBtn.addEventListener('click', function() {
        document.querySelector('.toc-container').scrollIntoView({ behavior: 'smooth' });
    });

    // Paper title changes
    paperTitleInput.addEventListener('change', function() {
        const oldTitle = localStorage.getItem('currentRebuttal');
        const newTitle = this.value.trim() || 'Untitled Rebuttal';
        
        if (oldTitle !== newTitle) {
            const rebuttals = JSON.parse(localStorage.getItem('rebuttals'));
            const list = JSON.parse(localStorage.getItem('rebuttalsList'));
            
            let finalTitle = newTitle;
            let counter = 1;
            while (list.includes(finalTitle) && finalTitle !== oldTitle) {
                finalTitle = `${newTitle} (${counter})`;
                counter++;
            }
            
            rebuttals[finalTitle] = rebuttals[oldTitle];
            rebuttals[finalTitle].paperTitle = finalTitle;
            delete rebuttals[oldTitle];
            
            const index = list.indexOf(oldTitle);
            if (index > -1) {
                list[index] = finalTitle;
            }
            
            localStorage.setItem('rebuttals', JSON.stringify(rebuttals));
            localStorage.setItem('rebuttalsList', JSON.stringify(list));
            localStorage.setItem('currentRebuttal', finalTitle);
            
            updateRebuttalSelector();
            showNotification('Rebuttal renamed');
        }
    });

    // Questionnaire selector
    questionnaireSelect.addEventListener('change', function() {
        switchRebuttal(this.value);
    });

    // New rebuttal button
    newQuestionnaireBtn.addEventListener('click', function() {
        const title = prompt('Enter a name for the new rebuttal:', 'New Rebuttal');
        if (title) {
            createNewRebuttal(title);
            updateRebuttalSelector();
            loadCurrentRebuttal();
            showNotification('New rebuttal created');
        }
    });

    // Delete rebuttal button
    deleteQuestionnaireBtn.addEventListener('click', function() {
        const currentTitle = localStorage.getItem('currentRebuttal');
        deleteRebuttal(currentTitle);
    });

    // Save button
    document.getElementById('save-button').addEventListener('click', function() {
        saveProgress('manual');
    });

    // Import button
    document.getElementById('import-button').addEventListener('click', function() {
        document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            importRebuttal(file);
        }
        this.value = ''; // Reset input
    });

    // Auto-save periodically
    setInterval(() => {
        saveProgress('auto');
    }, 30000); // Every 30 seconds

    updateProgressDisplay();
});

// Make toggle function globally available
window.toggleSectionProgress = toggleSectionProgress;
