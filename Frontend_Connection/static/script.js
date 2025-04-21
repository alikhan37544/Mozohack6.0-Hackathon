document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded, initializing medical query system...");
    
    // Get references to critical buttons
    const submitButton = document.getElementById('submit-query');
    const queryOptions = document.querySelectorAll('.query-option');
    const queryTypeInput = document.getElementById('query-type');
    const medicalForm = document.getElementById('medical-form');
    const generalForm = document.getElementById('general-form');
    
    // Setup query type selection
    queryOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            queryOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input with the selected query type
            const selectedType = this.getAttribute('data-type');
            queryTypeInput.value = selectedType;
            
            // Show/hide appropriate form based on selected type
            if (selectedType === 'general') {
                if (medicalForm) medicalForm.style.display = 'none';
                if (generalForm) generalForm.style.display = 'block';
            } else {
                if (medicalForm) medicalForm.style.display = 'block';
                if (generalForm) generalForm.style.display = 'none';
                
                // Update medical form fields based on query type
                updateMedicalFormFields(selectedType);
            }
            
            console.log(`Query type changed to: ${selectedType}`);
        });
    });

    // Function to update medical form fields based on query type
    function updateMedicalFormFields(queryType) {
        const symptomsLabel = document.querySelector('label[for="symptoms-input"]');
        const detailsLabel = document.querySelector('label[for="patient-details-input"]');
        const symptomsInput = document.getElementById('symptoms-input');
        const patientDetailsInput = document.getElementById('patient-details-input');
        
        switch(queryType) {
            case 'disease':
                if (symptomsLabel) symptomsLabel.textContent = 'Symptoms:';
                if (detailsLabel) detailsLabel.textContent = 'Patient Details:';
                if (symptomsInput) symptomsInput.placeholder = 'Describe your symptoms in detail...';
                if (patientDetailsInput) patientDetailsInput.placeholder = 'Age, gender, medical history, etc.';
                break;
            case 'recovery':
                if (symptomsLabel) symptomsLabel.textContent = 'Current Condition:';
                if (detailsLabel) detailsLabel.textContent = 'Recovery Goals:';
                if (symptomsInput) symptomsInput.placeholder = 'Describe your current health condition...';
                if (patientDetailsInput) patientDetailsInput.placeholder = 'What recovery outcomes are you seeking?';
                break;
            case 'resources':
                if (symptomsLabel) symptomsLabel.textContent = 'Medical Need:';
                if (detailsLabel) detailsLabel.textContent = 'Location Details:';
                if (symptomsInput) symptomsInput.placeholder = 'What medical resources are you looking for?';
                if (patientDetailsInput) patientDetailsInput.placeholder = 'Your location and accessibility requirements...';
                break;
            default:
                if (symptomsLabel) symptomsLabel.textContent = 'Medical Query:';
                if (detailsLabel) detailsLabel.textContent = 'Additional Details:';
                if (symptomsInput) symptomsInput.placeholder = 'Enter your medical question...';
                if (patientDetailsInput) patientDetailsInput.placeholder = 'Any relevant patient information...';
        }
    }
    
    if (submitButton) {
        console.log("Found medical query submit button");
        
        // Important: Use proper event binding
        submitButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Medical query button clicked");
            
            const queryType = document.getElementById('query-type') ? 
                document.getElementById('query-type').value : 'general';
            const symptomsInput = document.getElementById('symptoms-input');
            const patientDetailsInput = document.getElementById('patient-details-input');
            
            // Get form values
            const symptoms = symptomsInput ? symptomsInput.value.trim() : '';
            const patientDetails = patientDetailsInput ? patientDetailsInput.value.trim() : '';
            
            console.log(`Processing ${queryType} query with symptoms: "${symptoms}" and details: "${patientDetails}"`);
            
            // Show loading indicator
            const resultContainer = document.getElementById('result-container');
            if (resultContainer) {
                resultContainer.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Analyzing medical information...</p></div>';
                resultContainer.style.display = 'block';
            }
            
            // Send request to backend
            fetch('/api/medical-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    queryType: queryType,
                    symptoms: symptoms,
                    patientDetails: patientDetails
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log("Response received:", data);
                
                if (resultContainer) {
                    if (data.error) {
                        resultContainer.innerHTML = `<div class="error-message">${data.error}</div>`;
                    } else {
                        // Format and display the response with highlighting
                        resultContainer.innerHTML = formatMedicalResponse(data.result, queryType);
                        
                        // Apply highlighting after render
                        applyMedicalHighlighting();
                    }
                }
            })
            .catch(error => {
                console.error("Error:", error);
                if (resultContainer) {
                    resultContainer.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
                }
            });
        });
    } else {
        console.warn("Medical query submit button not found!");
    }

    // Other event handlers and initializations...
});

// Add the missing highlighting function
function applyMedicalHighlighting() {
    console.log("Applying medical highlighting");
    
    // Get all elements that need highlighting
    const medicalContent = document.querySelectorAll('.result-body p, .result-body li');
    
    // Medical terms to highlight (common terms that should be visually distinct)
    const medicalTerms = [
        // Diagnoses
        'diagnosis', 'condition', 'disease', 'disorder', 'syndrome',
        // Symptoms
        'symptom', 'pain', 'discomfort', 'acute', 'chronic',
        // Treatments
        'treatment', 'therapy', 'medication', 'prescription', 'dosage',
        // Clinical terms
        'clinical', 'prognosis', 'etiology', 'pathology', 'assessment'
    ];
    
    // Create regex pattern for all terms (case insensitive)
    const medicalTermPattern = new RegExp(`\\b(${medicalTerms.join('|')})\\b`, 'gi');
    
    // Highlight medical terms
    medicalContent.forEach(el => {
        // Don't process elements that are already styled
        if (el.classList.contains('processed-highlight')) return;
        
        // Replace medical terms with highlighted spans
        el.innerHTML = el.innerHTML.replace(medicalTermPattern, 
            '<span class="medical-term-highlight">$1</span>');
        
        // Mark as processed
        el.classList.add('processed-highlight');
    });
    
    // Highlight important sections (already marked with highlighted-point class)
    document.querySelectorAll('.highlighted-point').forEach(point => {
        // Add pulsing effect to important points
        point.classList.add('pulse-highlight');
    });
    
    // Add CSS if it doesn't exist
    if (!document.getElementById('medical-highlight-styles')) {
        const style = document.createElement('style');
        style.id = 'medical-highlight-styles';
        style.textContent = `
            .medical-term-highlight {
                background-color: rgba(255, 217, 102, 0.3);
                border-radius: 3px;
                padding: 0 3px;
                font-weight: 500;
            }
            
            .pulse-highlight {
                animation: pulse-bg 2s ease-in-out;
                border-left: 3px solid #4caf50;
                padding-left: 10px;
                background-color: rgba(76, 175, 80, 0.1);
                margin: 8px 0;
                padding: 8px 12px;
                border-radius: 4px;
            }
            
            .highlighted-point {
                position: relative;
                margin: 10px 0;
                padding: 8px 12px;
                background-color: rgba(66, 133, 244, 0.1);
                border-left: 3px solid #4285f4;
                border-radius: 4px;
            }
            
            @keyframes pulse-bg {
                0% { background-color: rgba(76, 175, 80, 0); }
                50% { background-color: rgba(76, 175, 80, 0.2); }
                100% { background-color: rgba(76, 175, 80, 0.1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log("Medical highlighting applied");
}

// Improved medical response formatter
function formatMedicalResponse(text, queryType) {
    // Extract sources if they exist
    let formattedText = text;
    let sourceSection = '';
    let sources = [];
    
    if (text.includes('References:')) {
        const parts = text.split('References:');
        formattedText = parts[0].trim();
        sourceSection = parts[1].trim();
        
        // Extract individual sources
        sources = sourceSection.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.trim());
    }
    
    // Add formatting based on query type
    let icon = '';
    let title = 'Medical Analysis';
    
    switch(queryType) {
        case 'disease':
            icon = '<i class="fas fa-heartbeat"></i>';
            title = 'Disease Assessment';
            break;
        case 'recovery':
            icon = '<i class="fas fa-procedures"></i>';
            title = 'Recovery Plan';
            break;
        case 'resources':
            icon = '<i class="fas fa-medkit"></i>';
            title = 'Medical Resources';
            break;
        default:
            icon = '<i class="fas fa-notes-medical"></i>';
            title = 'Medical Analysis';
    }
    
    // Format the response with sections
    let sectionsHtml = '';
    
    // Parse sections from markdown headings or bullet points
    const sections = parseResponseSections(formattedText);
    
    if (sections.length > 0) {
        sectionsHtml = sections.map(section => {
            const iconClass = getSectionIcon(section.title);
            return `
                <div class="result-section">
                    <div class="section-header">
                        <i class="fas ${iconClass}"></i>
                        <h4>${section.title}</h4>
                    </div>
                    <div class="section-content">
                        ${formatSectionContent(section.content)}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        // If no sections were found, format the whole text
        sectionsHtml = `
            <div class="result-section">
                <div class="section-content">
                    ${formatSectionContent(formattedText)}
                </div>
            </div>
        `;
    }
    
    // Format sources
    let sourcesHtml = '';
    if (sources.length > 0) {
        sourcesHtml = `
            <div class="sources-section">
                <div class="section-header">
                    <i class="fas fa-book-medical"></i>
                    <h4>References</h4>
                </div>
                <div class="section-content">
                    <ul class="sources-list">
                        ${sources.map(source => `<li>${source}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
    
    // Wrap in HTML structure with new styling
    const resultHtml = `
        <div class="medical-result animated-entrance">
            <div class="result-header">
                ${icon} 
                <h3>${title}</h3>
            </div>
            <div class="result-body">
                ${sectionsHtml}
                ${sourcesHtml}
            </div>
        </div>
    `;
    
    // Schedule highlighting after rendering
    setTimeout(() => {
        applyMedicalHighlighting();
    }, 100);
    
    return resultHtml;
}

// Format section content with special formatting
function formatSectionContent(content) {
    let formatted = content
        // Format list items
        .replace(/^\s*[•*-]\s+(.*?)$/gm, '<li>$1</li>')
        // Format important points - expand the pattern to catch more medical emphasis
        .replace(/(!{1,3}|IMPORTANT:?|NOTE:?|CAUTION:?|WARNING:?|KEY FINDING:?)\s+(.*?)(?:\r?\n|\r|$)/g, 
                '<div class="highlighted-point">$2</div>')
        // Highlight medical terms in parentheses
        .replace(/\(([^)]+)\)/g, '<span class="term-in-parens">($1)</span>')
        // Format paragraph breaks
        .replace(/\n\n/g, '</p><p>')
        // Format line breaks
        .replace(/\n/g, '<br>');
    
    // Wrap content in paragraph tags if it doesn't already contain list items
    if (!formatted.includes('<li>')) {
        formatted = `<p>${formatted}</p>`;
    } else {
        // If it contains list items, wrap them in a ul
        formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    }
    
    return formatted;
}