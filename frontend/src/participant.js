// Participant Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let timerInterval = null;
    let startTime = null;
    let participantData = null;
    let hasSubmitted = false;

    // Initialize
    init();

    function init() {
        // Get participant data
        participantData = JSON.parse(localStorage.getItem('participantData'));
        
        if (!participantData) {
            window.location.href = 'index.html';
            return;
        }

        // Display participant name
        document.getElementById('participantName').textContent = participantData.name;

        // Check competition status
        checkCompetitionStatus();

        // Set up event listeners
        setupEventListeners();

        // Start status checking interval
        setInterval(checkCompetitionStatus, 2000);
    }

    function setupEventListeners() {
        // File upload handling
        const fileInput = document.getElementById('modelFile');
        const fileLabel = document.getElementById('fileLabel');
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                fileLabel.textContent = file.name;
                validateFile(file);
            }
        });

        // Form submission
        document.getElementById('uploadForm').addEventListener('submit', handleSubmission);

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', function() {
            if (confirm('Are you sure you want to exit the competition?')) {
                localStorage.removeItem('participantData');
                window.location.href = 'index.html';
            }
        });
    }

    function checkCompetitionStatus() {
        const competitionState = JSON.parse(localStorage.getItem('competitionState')) || {};
        const statusText = document.getElementById('statusText');
        const statusDot = document.querySelector('.status-dot');
        
        if (competitionState.started && !competitionState.stopped) {
            // Competition is active
            statusText.textContent = 'Competition is active - Start modeling!';
            statusDot.className = 'status-dot active';
            
            if (!startTime) {
                startTime = new Date();
                startTimer();
            }
            
            // Show drawing and upload sections
            if (competitionState.drawingRevealed) {
                showDrawing();
                showUploadSection();
            }
            
        } else if (competitionState.stopped) {
            // Competition stopped
            statusText.textContent = 'Competition has ended';
            statusDot.className = 'status-dot stopped';
            stopTimer();
            
        } else {
            // Waiting to start
            statusText.textContent = 'Waiting for competition to start...';
            statusDot.className = 'status-dot waiting';
        }
    }

    function startTimer() {
        if (timerInterval) return; // Already running
        
        timerInterval = setInterval(() => {
            if (hasSubmitted) return;
            
            const now = new Date();
            const elapsed = Math.floor((now - startTime) / 1000);
            updateTimerDisplay(elapsed);
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = timeString;
    }

    function showDrawing() {
        const drawingSection = document.getElementById('drawingSection');
        drawingSection.style.display = 'block';
        
        // Get drawing and material info from competition state
        const competitionState = JSON.parse(localStorage.getItem('competitionState')) || {};
        
        if (competitionState.drawingUrl) {
            document.getElementById('drawingImage').src = competitionState.drawingUrl;
            document.getElementById('drawingImage').style.display = 'block';
            document.getElementById('drawingPlaceholder').style.display = 'none';
        }
        
        if (competitionState.material) {
            const materialInfo = getMaterialInfo(competitionState.material);
            document.getElementById('materialInfo').textContent = materialInfo;
        }
    }

    function showUploadSection() {
        document.getElementById('uploadSection').style.display = 'block';
    }

    function getMaterialInfo(material) {
        const materials = {
            aluminum: 'Aluminum (Density: 2.70 g/cm³)',
            steel: 'Steel (Density: 7.85 g/cm³)',
            abs: 'ABS Plastic (Density: 1.04 g/cm³)',
            brass: 'Brass (Density: 8.50 g/cm³)'
        };
        return materials[material] || 'Material information will be announced';
    }

    function validateFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50 MB
        const allowedExtensions = ['.step', '.iges', '.sldprt', '.prt', '.dwg', '.x_t'];
        
        // Check file size
        if (file.size > maxSize) {
            showMessage('File size exceeds 50 MB limit', 'error');
            return false;
        }
        
        // Check file extension
        const fileName = file.name.toLowerCase();
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
            showMessage('Invalid file format. Please upload a CAD file (.step, .iges, .sldprt, .prt, .dwg, .x_t)', 'error');
            return false;
        }
        
        return true;
    }

    function handleSubmission(e) {
        e.preventDefault();
        
        if (hasSubmitted) {
            showMessage('You have already submitted your model', 'error');
            return;
        }
        
        const fileInput = document.getElementById('modelFile');
        const massInput = document.getElementById('calculatedMass');
        
        const file = fileInput.files[0];
        const mass = parseFloat(massInput.value);
        
        // Validation
        if (!file) {
            showMessage('Please select a CAD file to upload', 'error');
            return;
        }
        
        if (!mass || mass <= 0) {
            showMessage('Please enter a valid mass value', 'error');
            return;
        }
        
        if (!validateFile(file)) {
            return;
        }
        
        // Stop timer
        const endTime = new Date();
        const totalTime = Math.floor((endTime - startTime) / 1000);
        stopTimer();
        
        // Create submission data
        const submissionData = {
            participantId: participantData.participantId,
            name: participantData.name,
            email: participantData.email,
            fileName: file.name,
            fileSize: file.size,
            mass: mass,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            totalTime: totalTime,
            submissionTime: endTime.toISOString()
        };
        
        // Save submission
        saveSubmission(submissionData);
        
        // Show completion screen
        showCompletionScreen(submissionData);
        
        hasSubmitted = true;
    }

    function saveSubmission(submissionData) {
        let submissions = JSON.parse(localStorage.getItem('submissions')) || [];
        
        // Remove any existing submission from this participant
        submissions = submissions.filter(s => s.email !== submissionData.email);
        
        // Add new submission
        submissions.push(submissionData);
        
        // Sort by submission time
        submissions.sort((a, b) => new Date(a.submissionTime) - new Date(b.submissionTime));
        
        localStorage.setItem('submissions', JSON.stringify(submissions));
    }

    function showCompletionScreen(submissionData) {
        // Hide other sections
        document.getElementById('drawingSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'none';
        
        // Show completion section
        const completionSection = document.getElementById('completionSection');
        completionSection.style.display = 'block';
        
        // Fill in completion data
        document.getElementById('finalTime').textContent = formatTime(submissionData.totalTime);
        document.getElementById('uploadedFileName').textContent = submissionData.fileName;
        document.getElementById('submittedMass').textContent = submissionData.mass.toFixed(3);
        
        // Calculate rank
        const submissions = JSON.parse(localStorage.getItem('submissions')) || [];
        const rank = submissions.findIndex(s => s.email === submissionData.email) + 1;
        document.getElementById('submissionRank').textContent = rank;
        
        showMessage('Submission successful! Thank you for participating.', 'success');
    }

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function showMessage(text, type = 'info') {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = text;
        messageDiv.className = `message ${type} show`;
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
        }, 5000);
    }
});