document.addEventListener('DOMContentLoaded', function() {
    // MediGuard initialization with animation
    console.log("MediGuard RAG System initialized");
    animateEntrance();
    
    // DOM Elements
    const queryInput = document.getElementById('query-input');
    const submitButton = document.getElementById('submit-query');
    const resultContainer = document.getElementById('result-container');
    const loader = document.getElementById('query-loader');
    const queryTypeSelect = document.getElementById('query-type');
    const symptomsInput = document.getElementById('symptoms-input');
    const patientDetailsInput = document.getElementById('patient-details-input');
    const queryOptions = document.querySelectorAll('.query-option');
    
    // Dark mode toggle
    setupDarkModeToggle();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Setup medical term highlighting
    setupMedicalTermHighlighting();
    
    // Initialize symptom suggestions
    initializeSymptomSuggestions();
    
    // Initialize patient case history system
    initializePatientHistory();
    
    // Animated flash messages
    animateFlashMessages();
    
    // Query type selection with animation
    if (queryOptions.length > 0) {
        queryOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class from all options
                queryOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.style.transform = 'scale(0.95)';
                });
                
                // Add selected class to clicked option with animation
                this.classList.add('selected');
                this.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);
                
                // Update hidden input value
                document.getElementById('query-type').value = this.dataset.type;
                
                // Show/hide appropriate form sections based on query type
                updateFormFields(this.dataset.type);
            });
        });
    }
    
    // Form submission with advanced loading animation
    if (submitButton) {
        submitButton.addEventListener('click', async function() {
            // Get form values
            const queryType = queryTypeSelect ? queryTypeSelect.value : 'general';
            const symptoms = symptomsInput ? symptomsInput.value.trim() : '';
            const patientDetails = patientDetailsInput ? patientDetailsInput.value.trim() : '';
            const generalQuery = queryInput ? queryInput.value.trim() : '';
            
            // Validation
            if (queryType === 'medical' && (!symptoms && !patientDetails)) {
                showNotification('Please enter patient symptoms or details', 'error');
                shakeElement(symptomsInput);
                return;
            }
            
            if (queryType === 'general' && !generalQuery) {
                showNotification('Please enter your query', 'error');
                shakeElement(queryInput);
                return;
            }
            
            // Show advanced loader
            startProgressAnimation();
            
            // Hide previous results with fade out
            if (resultContainer) {
                resultContainer.style.opacity = '0';
                setTimeout(() => {
                    resultContainer.style.display = 'none';
                    resultContainer.textContent = '';
                }, 300);
            }
            
            try {
                let endpoint = '/api/query';
                let payload = { query: generalQuery };
                
                if (queryType !== 'general' && document.getElementById('medical-form')) {
                    endpoint = '/api/medical-query';
                    payload = {
                        queryType: queryType,
                        symptoms: symptoms,
                        patientDetails: patientDetails
                    };
                    
                    // Save to patient history if enabled
                    if (document.getElementById('save-to-history')?.checked) {
                        saveToPatientHistory(queryType, symptoms, patientDetails);
                    }
                }
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                
                // Display the result with animation
                if (resultContainer) {
                    if (data.error) {
                        resultContainer.innerHTML = `<div class="error-message animated-entrance">${data.error}</div>`;
                    } else {
                        // Format the response with enhanced visualization
                        resultContainer.innerHTML = formatMedicalResponse(data.result, queryType);
                        
                        // Generate visual data if available
                        generateVisualizations(data.result, queryType);
                    }
                    
                    // Show with fade in
                    setTimeout(() => {
                        resultContainer.style.display = 'block';
                        setTimeout(() => {
                            resultContainer.style.opacity = '1';
                        }, 50);
                    }, 300);
                }
            } catch (error) {
                if (resultContainer) {
                    resultContainer.style.display = 'block';
                    resultContainer.innerHTML = `<div class="error-message animated-entrance">Error: ${error.message}</div>`;
                    resultContainer.style.opacity = '1';
                }
            } finally {
                // Stop progress animation
                stopProgressAnimation();
            }
        });
    }
    
    // Enhanced drag and drop file upload
    setupDragAndDropUpload();
    
    // Document list with filter and sort capabilities
    setupDocumentFiltering();
    
    // Initialize collapsible sections
    initializeCollapsibleSections();
    
    // Function to animate entrance of UI elements
    function animateEntrance() {
        document.querySelectorAll('.card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 + (index * 150));
        });
        
        const header = document.querySelector('header');
        if (header) {
            header.style.opacity = '0';
            header.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                header.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                header.style.opacity = '1';
                header.style.transform = 'translateY(0)';
            }, 100);
        }
    }
    
    // Function to set up dark mode toggle
    function setupDarkModeToggle() {
        // Create dark mode toggle button
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'dark-mode-toggle';
        toggleContainer.innerHTML = `
            <label class="switch">
                <input type="checkbox" id="dark-mode-checkbox">
                <span class="slider round"></span>
            </label>
            <span class="toggle-label">Dark Mode</span>
        `;
        
        document.querySelector('.container').appendChild(toggleContainer);
        
        // Check for saved preference
        const darkModePref = localStorage.getItem('darkMode') === 'true';
        document.getElementById('dark-mode-checkbox').checked = darkModePref;
        if (darkModePref) {
            document.body.classList.add('dark-mode');
        }
        
        // Add event listener
        document.getElementById('dark-mode-checkbox').addEventListener('change', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', this.checked);
            
            // Animate transition
            document.body.style.transition = 'background-color 0.5s, color 0.5s';
        });
    }
    
    // Function for animating flash messages
    function animateFlashMessages() {
        const flashMessages = document.querySelectorAll('.flash-message');
        if (flashMessages.length > 0) {
            flashMessages.forEach((message, index) => {
                message.style.opacity = '0';
                message.style.transform = 'translateX(-20px)';
                
                setTimeout(() => {
                    message.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    message.style.opacity = '1';
                    message.style.transform = 'translateX(0)';
                    
                    // Auto-hide after delay
                    setTimeout(() => {
                        message.style.opacity = '0';
                        message.style.transform = 'translateX(20px)';
                        setTimeout(() => message.remove(), 500);
                    }, 5000);
                }, 100 + (index * 150));
            });
        }
    }
    
    // Progress bar animation for loading
    function startProgressAnimation() {
        // Create an animated progress bar if it doesn't exist
        let progressContainer = document.getElementById('progress-container');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'progress-container';
            progressContainer.className = 'progress-container';
            progressContainer.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">Processing medical query...</div>
            `;
            document.querySelector('.medical-result, #result-container').before(progressContainer);
        }
        
        // Show and animate
        progressContainer.style.display = 'block';
        setTimeout(() => {
            progressContainer.style.opacity = '1';
        }, 10);
        
        // Simulate progress
        const progressFill = progressContainer.querySelector('.progress-fill');
        progressFill.style.width = '0%';
        
        let width = 0;
        const interval = setInterval(() => {
            if (width < 90) { // Only go to 90% until complete
                width += Math.random() * 15;
                width = Math.min(width, 90);
                progressFill.style.width = width + '%';
            }
        }, 300);
        
        // Store interval ID
        window.progressInterval = interval;
    }
    
    function stopProgressAnimation() {
        clearInterval(window.progressInterval);
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            const progressFill = progressContainer.querySelector('.progress-fill');
            progressFill.style.width = '100%';
            
            // Fade out after completion
            setTimeout(() => {
                progressContainer.style.opacity = '0';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 500);
            }, 600);
        }
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 3000);
        }, 100);
    }
    
    // Shake element for validation errors
    function shakeElement(element) {
        if (!element) return;
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }
    
    // Setup drag and drop file upload
    function setupDragAndDropUpload() {
        const dropArea = document.createElement('div');
        dropArea.className = 'drop-area';
        dropArea.innerHTML = `
            <div class="drop-message">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag & drop medical PDF files here<br>or click to browse</p>
            </div>
        `;
        
        const fileInput = document.getElementById('file');
        if (fileInput) {
            const fileForm = fileInput.closest('form');
            if (fileForm) {
                const formRow = fileForm.querySelector('.form-row');
                if (formRow) {
                    formRow.appendChild(dropArea);
                    
                    // Hide original file input
                    fileInput.style.display = 'none';
                    
                    // Click to browse
                    dropArea.addEventListener('click', () => {
                        fileInput.click();
                    });
                    
                    // Drag & drop events
                    dropArea.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        dropArea.classList.add('active');
                    });
                    
                    dropArea.addEventListener('dragleave', () => {
                        dropArea.classList.remove('active');
                    });
                    
                    dropArea.addEventListener('drop', (e) => {
                        e.preventDefault();
                        dropArea.classList.remove('active');
                        
                        if (e.dataTransfer.files.length) {
                            fileInput.files = e.dataTransfer.files;
                            updateFileLabel(e.dataTransfer.files[0].name);
                            
                            // Show preview if PDF
                            showFilePreview(e.dataTransfer.files[0]);
                        }
                    });
                    
                    // File selection feedback
                    fileInput.addEventListener('change', () => {
                        if (fileInput.files.length > 0) {
                            updateFileLabel(fileInput.files[0].name);
                            showFilePreview(fileInput.files[0]);
                        }
                    });
                }
            }
        }
    }
    
    // Update file label
    function updateFileLabel(filename) {
        const dropArea = document.querySelector('.drop-area');
        if (dropArea) {
            dropArea.innerHTML = `
                <div class="file-selected">
                    <i class="fas fa-file-pdf"></i>
                    <p>${filename}</p>
                    <span class="remove-file"><i class="fas fa-times"></i></span>
                </div>
            `;
            
            // Add remove button functionality
            dropArea.querySelector('.remove-file').addEventListener('click', (e) => {
                e.stopPropagation();
                resetFileInput();
            });
        }
    }
    
    // Reset file input
    function resetFileInput() {
        const fileInput = document.getElementById('file');
        if (fileInput) {
            fileInput.value = '';
        }
        
        const dropArea = document.querySelector('.drop-area');
        if (dropArea) {
            dropArea.innerHTML = `
                <div class="drop-message">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & drop medical PDF files here<br>or click to browse</p>
                </div>
            `;
        }
        
        // Remove preview
        const previewContainer = document.getElementById('pdf-preview');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    }
    
    // Show PDF preview
    function showFilePreview(file) {
        if (!file || file.type !== 'application/pdf') return;
        
        let previewContainer = document.getElementById('pdf-preview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'pdf-preview';
            previewContainer.className = 'pdf-preview';
            
            const fileForm = document.getElementById('file').closest('form');
            fileForm.appendChild(previewContainer);
        }
        
        // Create a file URL and embed the PDF
        const fileUrl = URL.createObjectURL(file);
        previewContainer.innerHTML = `
            <div class="preview-header">
                <h4>Document Preview</h4>
                <button type="button" class="close-preview"><i class="fas fa-times"></i></button>
            </div>
            <div class="preview-content">
                <iframe src="${fileUrl}#toolbar=0" width="100%" height="300px"></iframe>
            </div>
        `;
        
        // Show with animation
        previewContainer.style.display = 'block';
        setTimeout(() => {
            previewContainer.style.opacity = '1';
        }, 10);
        
        // Close button functionality
        previewContainer.querySelector('.close-preview').addEventListener('click', () => {
            previewContainer.style.opacity = '0';
            setTimeout(() => {
                previewContainer.style.display = 'none';
            }, 300);
        });
    }
    
    // Setup document filtering
    function setupDocumentFiltering() {
        const documentList = document.querySelector('.document-list');
        if (!documentList) return;
        
        // Add search and sort controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'document-controls';
        controlsContainer.innerHTML = `
            <div class="search-container">
                <input type="text" placeholder="Search documents..." class="doc-search">
                <i class="fas fa-search"></i>
            </div>
            <div class="sort-container">
                <select class="doc-sort">
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="date-desc">Date (Newest)</option>
                    <option value="date-asc">Date (Oldest)</option>
                </select>
                <i class="fas fa-sort"></i>
            </div>
        `;
        
        documentList.parentNode.insertBefore(controlsContainer, documentList);
        
        // Search functionality
        const searchInput = controlsContainer.querySelector('.doc-search');
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            Array.from(documentList.children).forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? '' : 'none';
                
                // Animation
                if (text.includes(searchTerm)) {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(-10px)';
                }
            });
        });
    }
    
    // Initialize tooltip system
    function initializeTooltips() {
        // Find all elements with data-tooltip attribute
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.classList.add('tooltip');
            
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltip-text';
            tooltipText.textContent = element.getAttribute('data-tooltip');
            element.appendChild(tooltipText);
        });
        
        // Dynamically added tooltips
        window.addTooltip = function(element, text) {
            element.classList.add('tooltip');
            
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltip-text';
            tooltipText.textContent = text;
            element.appendChild(tooltipText);
        };
    }
    
    // Setup medical term highlighting
    function setupMedicalTermHighlighting() {
        // Medical terminology dictionary
        const medicalTerms = {
            'hypertension': 'High blood pressure condition',
            'diabetes': 'Condition affecting how your body processes blood sugar',
            'myocardial infarction': 'Heart attack',
            'dyspnea': 'Shortness of breath',
            'tachycardia': 'Abnormally rapid heart rate',
            'arrhythmia': 'Irregular heartbeat',
            'stroke': 'Brain damage caused by interrupted blood supply',
            'hyperlipidemia': 'High levels of fat particles in the blood',
            'bronchitis': 'Inflammation of the bronchial tubes',
            'pneumonia': 'Infection that inflames air sacs in the lungs'
        };
        
        // Highlight function for dynamically added content
        window.highlightMedicalTerms = function(element) {
            if (!element) return;
            
            let content = element.innerHTML;
            
            Object.keys(medicalTerms).forEach(term => {
                const regex = new RegExp(`\\b${term}\\b`, 'gi');
                content = content.replace(regex, `<span class="medical-term" data-tooltip="${medicalTerms[term]}">$&</span>`);
            });
            
            element.innerHTML = content;
            
            // Initialize tooltips for new terms
            element.querySelectorAll('.medical-term').forEach(term => {
                term.classList.add('tooltip');
                
                if (!term.querySelector('.tooltip-text')) {
                    const tooltipText = document.createElement('span');
                    tooltipText.className = 'tooltip-text';
                    tooltipText.textContent = term.getAttribute('data-tooltip');
                    term.appendChild(tooltipText);
                }
            });
        };
    }
    
    // Initialize symptom suggestions system
    function initializeSymptomSuggestions() {
        const symptomsInput = document.getElementById('symptoms-input');
        if (!symptomsInput) return;
        
        // Common symptom suggestions
        const commonSymptoms = [
            'fever', 'cough', 'headache', 'nausea', 'vomiting', 
            'diarrhea', 'fatigue', 'chest pain', 'shortness of breath',
            'dizziness', 'abdominal pain', 'joint pain', 'muscle pain',
            'sore throat', 'rash', 'back pain', 'chills', 'loss of appetite'
        ];
        
        // Create suggestions container
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'symptom-suggestions';
        suggestionsContainer.innerHTML = `
            <div class="suggestions-header">Common symptoms:</div>
            <div class="suggestions-list"></div>
        `;
        
        symptomsInput.parentNode.insertBefore(suggestionsContainer, symptomsInput.nextSibling);
        
        // Add common symptom chips
        const suggestionsList = suggestionsContainer.querySelector('.suggestions-list');
        commonSymptoms.forEach(symptom => {
            const chip = document.createElement('div');
            chip.className = 'symptom-chip';
            chip.textContent = symptom;
            suggestionsList.appendChild(chip);
            
            // Click to add to input
            chip.addEventListener('click', () => {
                const currentValue = symptomsInput.value;
                const newValue = currentValue ? 
                    (currentValue.endsWith(',') || currentValue.endsWith(', ') ? 
                        `${currentValue} ${symptom}` : 
                        `${currentValue}, ${symptom}`) : 
                    symptom;
                
                symptomsInput.value = newValue;
                
                // Animate chip selection
                chip.classList.add('selected');
                setTimeout(() => {
                    chip.classList.remove('selected');
                }, 500);
            });
        });
    }
    
    // Initialize patient history system
    function initializePatientHistory() {
        // Create patient history UI
        const historyContainer = document.createElement('div');
        historyContainer.className = 'patient-history-container';
        historyContainer.innerHTML = `
            <div class="history-toggle">
                <button class="btn-history"><i class="fas fa-history"></i> Patient Case History</button>
            </div>
            <div class="history-panel">
                <div class="history-header">
                    <h3>Patient Case History</h3>
                    <button class="history-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="history-content">
                    <div class="no-history">No saved cases yet.</div>
                </div>
            </div>
        `;
        
        document.querySelector('.container').appendChild(historyContainer);
        
        // Toggle history panel
        const toggleBtn = historyContainer.querySelector('.btn-history');
        const historyPanel = historyContainer.querySelector('.history-panel');
        const closeBtn = historyContainer.querySelector('.history-close');
        
        toggleBtn.addEventListener('click', () => {
            historyPanel.classList.toggle('show');
            renderPatientHistory();
        });
        
        closeBtn.addEventListener('click', () => {
            historyPanel.classList.remove('show');
        });
        
        // Add checkbox to save current query
        const medicalForm = document.getElementById('medical-form');
        if (medicalForm) {
            const saveOption = document.createElement('div');
            saveOption.className = 'save-history-option';
            saveOption.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" id="save-to-history" checked>
                    <span class="checkmark"></span>
                    Save this case to patient history
                </label>
            `;
            medicalForm.appendChild(saveOption);
        }
    }
    
    // Save to patient history
    function saveToPatientHistory(queryType, symptoms, patientDetails) {
        const savedCases = JSON.parse(localStorage.getItem('patientCases') || '[]');
        
        const newCase = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            queryType,
            symptoms,
            patientDetails
        };
        
        savedCases.push(newCase);
        localStorage.setItem('patientCases', JSON.stringify(savedCases));
        
        showNotification('Case saved to history', 'success');
    }
    
    // Render patient history
    function renderPatientHistory() {
        const historyContent = document.querySelector('.history-content');
        if (!historyContent) return;
        
        const savedCases = JSON.parse(localStorage.getItem('patientCases') || '[]');
        
        if (savedCases.length === 0) {
            historyContent.innerHTML = `<div class="no-history">No saved cases yet.</div>`;
            return;
        }
        
        let html = `<div class="history-cases">`;
        savedCases.forEach(case_ => {
            html += `
                <div class="history-case" data-id="${case_.id}">
                    <div class="case-header">
                        <div class="case-type">
                            <i class="fas ${getIconForType(case_.queryType)}"></i> ${capitalizeFirstLetter(case_.queryType)}
                        </div>
                        <div class="case-date">${case_.date}</div>
                    </div>
                    <div class="case-details">
                        <div class="case-symptoms"><strong>Symptoms:</strong> ${case_.symptoms || 'None'}</div>
                        <div class="case-patient"><strong>Patient details:</strong> ${case_.patientDetails || 'None'}</div>
                    </div>
                    <div class="case-actions">
                        <button class="btn-reuse" data-id="${case_.id}">Use this case</button>
                        <button class="btn-delete" data-id="${case_.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        
        historyContent.innerHTML = html;
        
        // Add event listeners for buttons
        historyContent.querySelectorAll('.btn-reuse').forEach(btn => {
            btn.addEventListener('click', function() {
                const caseId = this.getAttribute('data-id');
                reuseCase(caseId);
            });
        });
        
        historyContent.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const caseId = this.getAttribute('data-id');
                deleteCase(caseId);
            });
        });
    }
    
    // Reuse a case from history
    function reuseCase(caseId) {
        const savedCases = JSON.parse(localStorage.getItem('patientCases') || '[]');
        const case_ = savedCases.find(c => c.id.toString() === caseId.toString());
        
        if (case_) {
            // Fill the form
            document.getElementById('symptoms-input').value = case_.symptoms;
            document.getElementById('patient-details-input').value = case_.patientDetails;
            
            // Select the query type
            document.querySelectorAll('.query-option').forEach(opt => {
                if (opt.dataset.type === case_.queryType) {
                    opt.click();
                }
            });
            
            // Close history panel
            document.querySelector('.history-panel').classList.remove('show');
            
            showNotification('Case loaded from history', 'success');
        }
    }
    
    // Delete a case from history
    function deleteCase(caseId) {
        const savedCases = JSON.parse(localStorage.getItem('patientCases') || '[]');
        const newCases = savedCases.filter(c => c.id.toString() !== caseId.toString());
        
        localStorage.setItem('patientCases', JSON.stringify(newCases));
        
        // Remove from UI with animation
        const caseElement = document.querySelector(`.history-case[data-id="${caseId}"]`);
        if (caseElement) {
            caseElement.style.opacity = '0';
            caseElement.style.height = '0';
            setTimeout(() => {
                renderPatientHistory();
            }, 300);
        }
        
        showNotification('Case deleted from history', 'info');
    }
    
    // Initialize collapsible sections
    function initializeCollapsibleSections() {
        document.querySelectorAll('.card h2, .card h3').forEach(header => {
            if (header.parentNode.classList.contains('card')) {
                // Make it collapsible
                header.classList.add('collapsible');
                header.innerHTML += `<span class="collapse-icon"><i class="fas fa-chevron-up"></i></span>`;
                
                header.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    const icon = this.querySelector('.collapse-icon i');
                    
                    // Toggle collapse state with animation
                    if (content.style.maxHeight) {
                        content.style.maxHeight = null;
                        icon.className = 'fas fa-chevron-up';
                    } else {
                        content.style.maxHeight = content.scrollHeight + 'px';
                        icon.className = 'fas fa-chevron-down';
                    }
                });
            }
        });
    }
    
    // Update form fields based on query type
    function updateFormFields(queryType) {
        const symptomsContainer = document.getElementById('symptoms-input').parentNode;
        const patientDetailsContainer = document.getElementById('patient-details-input').parentNode;
        
        switch(queryType) {
            case 'disease':
                symptomsContainer.querySelector('label').textContent = 'Patient Symptoms:';
                patientDetailsContainer.querySelector('label').textContent = 'Patient Details (age, history, etc):';
                submitButton.innerHTML = '<i class="fas fa-disease"></i> Identify Possible Diseases';
                break;
                
            case 'recovery':
                symptomsContainer.querySelector('label').textContent = 'Current Condition & Symptoms:';
                patientDetailsContainer.querySelector('label').textContent = 'Treatment & Medical History:';
                submitButton.innerHTML = '<i class="fas fa-heartbeat"></i> Estimate Recovery Timeline';
                break;
                
            case 'resources':
                symptomsContainer.querySelector('label').textContent = 'Required Treatment:';
                patientDetailsContainer.querySelector('label').textContent = 'Patient Condition & Needs:';
                submitButton.innerHTML = '<i class="fas fa-hospital"></i> Identify Required Resources';
                break;
                
            case 'general':
                symptomsContainer.querySelector('label').textContent = 'Medical Question:';
                patientDetailsContainer.querySelector('label').textContent = 'Additional Context (optional):';
                submitButton.innerHTML = '<i class="fas fa-search"></i> Search Medical Knowledge';
                break;
        }
        
        // Animate label changes
        [symptomsContainer, patientDetailsContainer].forEach(container => {
            const label = container.querySelector('label');
            label.classList.add('label-changed');
            setTimeout(() => {
                label.classList.remove('label-changed');
            }, 500);
        });
    }
    
    // Generate visualizations based on results
    function generateVisualizations(resultText, queryType) {
        if (!resultText || !queryType) return;
        
        let visualContainer = document.querySelector('.visualization-container');
        if (!visualContainer) {
            visualContainer = document.createElement('div');
            visualContainer.className = 'visualization-container';
            document.getElementById('result-container').appendChild(visualContainer);
        }
        
        visualContainer.innerHTML = '';
        
        try {
            // Different visualizations based on query type
            switch(queryType) {
                case 'disease':
                    createDiseaseVisualization(resultText, visualContainer);
                    break;
                    
                case 'recovery':
                    createRecoveryTimeline(resultText, visualContainer);
                    break;
                    
                case 'resources':
                    createResourcesVisualization(resultText, visualContainer);
                    break;
            }
        } catch (error) {
            console.error('Error generating visualizations:', error);
        }
    }
    
    // Create disease probability visualization
    function createDiseaseVisualization(text, container) {
        // Extract potential diseases and their likelihood
        const diseases = extractDiseases(text);
        
        if (diseases.length === 0) return;
        
        const chartHtml = `
            <div class="chart-container">
                <h4>Disease Probability Analysis</h4>
                <div class="disease-chart">
                    ${diseases.map(disease => `
                        <div class="disease-item">
                            <div class="disease-name">${disease.name}</div>
                            <div class="disease-bar-container">
                                <div class="disease-bar" style="width: ${disease.probability}%"></div>
                                <span>${disease.probability}%</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = chartHtml;
        
        // Animate bars
        setTimeout(() => {
            container.querySelectorAll('.disease-bar').forEach(bar => {
                bar.classList.add('animate-bar');
            });
        }, 100);
    }
    
    // Create recovery timeline visualization
    function createRecoveryTimeline(text, container) {
        // Extract recovery stages
        const stages = extractRecoveryStages(text);
        
        if (stages.length === 0) return;
        
        const timelineHtml = `
            <div class="timeline-container">
                <h4>Recovery Timeline Estimate</h4>
                <div class="recovery-timeline">
                    ${stages.map((stage, index) => `
                        <div class="timeline-item ${index === 0 ? 'current' : ''}">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <div class="timeline-title">${stage.title}</div>
                                <div class="timeline-time">${stage.time}</div>
                                <div class="timeline-description">${stage.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = timelineHtml;
        
        // Animate timeline
        setTimeout(() => {
            container.querySelectorAll('.timeline-item').forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('show');
                }, index * 200);
            });
        }, 100);
    }
    
    // Create resources visualization
    function createResourcesVisualization(text, container) {
        // Extract required resources
        const resources = extractResources(text);
        
        if (Object.keys(resources).length === 0) return;
        
        const resourcesHtml = `
            <div class="resources-container">
                <h4>Required Medical Resources</h4>
                <div class="resources-grid">
                    ${Object.entries(resources).map(([category, items]) => `
                        <div class="resource-category">
                            <div class="category-title">${category}</div>
                            <ul class="resource-list">
                                ${items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = resourcesHtml;
        
        // Animate resources
        setTimeout(() => {
            container.querySelectorAll('.resource-category').forEach((category, index) => {
                setTimeout(() => {
                    category.classList.add('show');
                }, index * 150);
            });
        }, 100);
    }
    
    // Helper functions for visualizations
    
    // Extract diseases from text
    function extractDiseases(text) {
        // This is a placeholder - in a real app, you would use better parsing logic
        // or get structured data from your API
        const diseases = [];
        const lines = text.split('\n');
        
        const diseasesFound = [];
        let capturingDiseases = false;
        
        for (const line of lines) {
            if (line.match(/possible diagnos(es|is)|differential diagnos(es|is)|potential conditions/i)) {
                capturingDiseases = true;
                continue;
            }
            
            if (capturingDiseases) {
                // Look for patterns like "Disease name: description" or "1. Disease name"
                const diseaseMatch = line.match(/^(?:\d+\.|\-|\*)\s*([^:]+)(?::|$)|^([^:]+):\s/);
                
                if (diseaseMatch && line.trim().length > 0) {
                    const diseaseName = (diseaseMatch[1] || diseaseMatch[2]).trim();
                    
                    // Skip if it's not actually a disease
                    if (diseaseName.length < 3 || 
                        diseaseName.toLowerCase().includes('conclusion') ||
                        diseaseName.toLowerCase().includes('summary')) {
                        continue;
                    }
                    
                    diseasesFound.push(diseaseName);
                }
                
                // Stop after finding a few diseases or when hitting conclusion
                if (diseasesFound.length >= 5 || line.toLowerCase().includes('conclusion')) {
                    break;
                }
            }
        }
        
        // Assign probabilities - in a real app, these would be provided by your model
        let probabilitySum = 0;
        
        // Generate realistic-looking probabilities that sum to 100
        const rawProbabilities = diseasesFound.map((_, index) => {
            // First disease should have highest probability
            return 100 / (index + 1.5);
        });
        
        // Normalize to sum to 100
        const sum = rawProbabilities.reduce((a, b) => a + b, 0);
        const normalizedProbabilities = rawProbabilities.map(p => Math.round((p / sum) * 100));
        
        // Ensure they sum exactly to 100 by adjusting first value if needed
        const adjustedSum = normalizedProbabilities.reduce((a, b) => a + b, 0);
        if (adjustedSum !== 100 && normalizedProbabilities.length > 0) {
            normalizedProbabilities[0] += (100 - adjustedSum);
        }
        
        // Create the disease objects
        diseasesFound.forEach((disease, index) => {
            diseases.push({
                name: disease,
                probability: normalizedProbabilities[index] || 0
            });
        });
        
        return diseases;
    }
    
    // Extract recovery stages from text
    function extractRecoveryStages(text) {
        // Placeholder - would be better to get structured data from API
        const stages = [];
        const possibleStages = [
            {
                title: "Acute Phase",
                time: "Week 1-2",
                description: "Initial treatment and symptom management"
            },
            {
                title: "Early Recovery",
                time: "Week 3-4",
                description: "Reduced symptoms, initial physical activity"
            },
            {
                title: "Mid Recovery",
                time: "Month 2",
                description: "Returning to mild activities, continued treatment"
            },
            {
                title: "Late Recovery",
                time: "Month 3-4",
                description: "Gradual return to normal activities, follow-up care"
            },
            {
                title: "Full Recovery",
                time: "Month 5-6",
                description: "Minimal or no symptoms, routine check-ups only"
            }
        ];
        
        // Try to extract time frames from the text
        const timeMatches = text.match(/(\d+(?:-\d+)?)\s+(day|week|month|year)s?/gi);
        const hasTimeframes = timeMatches && timeMatches.length > 2;
        
        // If we found enough time references, create custom stages
        if (hasTimeframes) {
            const recoveryLines = text.split('\n').filter(line => 
                line.match(/recovery|healing|treatment|phase|timeline|stage/i) &&
                line.match(/\d+/)
            );
            
            // If we found enough structured recovery information, use it
            if (recoveryLines.length >= 3) {
                recoveryLines.slice(0, 5).forEach(line => {
                    const timeMatch = line.match(/(\d+(?:-\d+)?)\s+(day|week|month|year)s?/i);
                    const titleMatch = line.match(/^([^:\.]+)[:\.]/);
                    
                    if (timeMatch) {
                        stages.push({
                            title: titleMatch ? titleMatch[1].trim() : "Recovery Stage",
                            time: timeMatch[0],
                            description: line.replace(titleMatch ? titleMatch[0] : "", "").trim()
                        });
                    }
                });
            }
        }
        
        // If we couldn't extract stages, use the default ones
        if (stages.length < 3) {
            return possibleStages;
        }
        
        return stages;
    }
    
    // Extract resources from text
    function extractResources(text) {
        // Placeholder - would be better with structured data from API
        const resources = {};
        
        // Define possible categories
        const categories = {
            "Medications": ["medications", "medicine", "drugs", "prescription", "antibiotics", "painkillers"],
            "Equipment": ["equipment", "device", "machine", "monitor", "ventilator"],
            "Staff": ["staff", "doctor", "nurse", "specialist", "physician", "surgeon"],
            "Facilities": ["facility", "room", "ward", "icu", "unit", "hospital"]
        };
        
        // Look for lines that might contain resources
        const lines = text.split('\n');
        
        for (const line of lines) {
            // Check if line matches any category
            for (const [category, keywords] of Object.entries(categories)) {
                if (keywords.some(keyword => line.toLowerCase().includes(keyword))) {
                    if (!resources[category]) {
                        resources[category] = [];
                    }
                    
                    // Extract the resource from the line
                    let item = line.trim();
                    
                    // Remove numbers/bullets at start
                    item = item.replace(/^\d+[\.\)]\s*|\*\s+|\-\s+/, '');
                    
                    // Remove category name if it's at the start
                    item = item.replace(new RegExp(`^${category}:\\s*`, 'i'), '');
                    
                    // Truncate long items
                    if (item.length > 60) {
                        item = item.substring(0, 57) + '...';
                    }
                    
                    // Add if not duplicate
                    if (!resources[category].includes(item)) {
                        resources[category].push(item);
                    }
                    
                    // Don't add the same line to multiple categories
                    break;
                }
            }
        }
        
        // If we couldn't extract resources, use placeholders
        if (Object.keys(resources).length === 0) {
            resources["Medications"] = ["Antibiotics", "Pain management medication", "Anti-inflammatory drugs"];
            resources["Equipment"] = ["Monitoring equipment", "IV supplies", "Specialized medical devices"];
            resources["Staff"] = ["General practitioner", "Specialist consultation", "Nursing staff"];
            resources["Facilities"] = ["Outpatient clinic", "Hospital bed (if required)", "Diagnostic lab"];
        }
        
        return resources;
    }
    
    // Helper function to get icon for query type
    function getIconForType(type) {
        switch (type) {
            case 'disease': return 'fa-disease';
            case 'recovery': return 'fa-heartbeat';
            case 'resources': return 'fa-hospital';
            default: return 'fa-notes-medical';
        }
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Format medical response with enhanced styling
    function formatMedicalResponse(text, queryType) {
        // Extract sources if they exist
        let formattedText = text;
        let sourceSection = '';
        
        if (text.includes('Sources:')) {
            const parts = text.split('Sources:');
            formattedText = parts[0].trim();
            sourceSection = `<div class="source-list"><strong>Sources:</strong> ${parts[1].trim()}</div>`;
        }
        
        // Add formatting based on query type
        let icon = '';
        let title = 'Medical Analysis';
        
        switch(queryType) {
            case 'disease':
                icon = '<i class="fas fa-disease"></i>';
                title = 'Disease Analysis';
                break;
            case 'recovery':
                icon = '<i class="fas fa-heartbeat"></i>';
                title = 'Recovery Assessment';
                break;
            case 'resources':
                icon = '<i class="fas fa-hospital"></i>';
                title = 'Required Medical Resources';
                break;
            default:
                icon = '<i class="fas fa-notes-medical"></i>';
        }
        
        // Format paragraphs
        formattedText = formattedText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
        
        // Highlight key terms
        setTimeout(() => {
            window.highlightMedicalTerms(document.querySelector('.medical-result p'));
        }, 100);
        
        // Wrap in HTML structure
        return `
            <div class="medical-result animated-entrance">
                <h3>${icon} ${title}</h3>
                <p>${formattedText}</p>
                ${sourceSection}
            </div>
        `;
    }
});