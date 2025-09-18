// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let competitionTimer = null;
    let competitionStartTime = null;
    let isLoggedIn = false;

    // Initialize
    init();

    function init() {
        // Check if admin is already logged in
        const adminSession = localStorage.getItem('adminSession');
        if (adminSession) {
            isLoggedIn = true;
            showAdminControls();
            startAdminUpdates();
        } else {
            showAdminLogin();
        }

        setupEventListeners();
    }

    function setupEventListeners() {
        // Admin login form
        document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);

        // Competition controls
        document.getElementById('startCompetition').addEventListener('click', startCompetition);
        document.getElementById('revealDrawing').addEventListener('click', revealDrawing);
        document.getElementById('stopCompetition').addEventListener('click', stopCompetition);
        document.getElementById('resetCompetition').addEventListener('click', resetCompetition);

        // Export and refresh
        document.getElementById('exportResults').addEventListener('click', exportResults);
        document.getElementById('refreshLeaderboard').addEventListener('click', refreshLeaderboard);

        // Drawing upload
        document.getElementById('drawingUpload').addEventListener('change', handleDrawingUpload);

        // Logout
        document.getElementById('adminLogout').addEventListener('click', adminLogout);
    }

    function handleAdminLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        // Simple authentication (in production, use proper backend authentication)
        if (username === 'admin' && password === 'speedmodelling2024') {
            isLoggedIn = true;
            localStorage.setItem('adminSession', 'active');
            showAdminControls();
            startAdminUpdates();
            showMessage('Admin login successful!', 'success');
        } else {
            showMessage('Invalid admin credentials', 'error');
        }
    }

    function showAdminLogin() {
        document.getElementById('adminLogin').style.display = 'block';
        document.getElementById('adminControlsSection').style.display = 'none';
    }

    function showAdminControls() {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminControlsSection').style.display = 'block';
        
        // Load current state
        loadCompetitionState();
        updateParticipantsList();
        updateLeaderboard();
    }

    function startAdminUpdates() {
        // Update dashboard every 2 seconds
        setInterval(() => {
            if (isLoggedIn) {
                updateCompetitionStats();
                updateParticipantsList();
                updateLeaderboard();
            }
        }, 2000);
    }

    function startCompetition() {
        const material = document.getElementById('materialSelect').value;
        const drawingFile = document.getElementById('drawingUpload').files[0];

        if (!material) {
            showMessage('Please select a material for the competition', 'error');
            return;
        }

        // Start competition
        competitionStartTime = new Date();
        
        const competitionState = {
            started: true,
            stopped: false,
            startTime: competitionStartTime.toISOString(),
            material: material,
            drawingRevealed: false,
            drawingUrl: null
        };

        if (drawingFile) {
            // Convert drawing to base64 for storage
            const reader = new FileReader();
            reader.onload = function(e) {
                competitionState.drawingUrl = e.target.result;
                localStorage.setItem('competitionState', JSON.stringify(competitionState));
                updateCompetitionUI();
                showMessage('Competition started successfully!', 'success');
            };
            reader.readAsDataURL(drawingFile);
        } else {
            localStorage.setItem('competitionState', JSON.stringify(competitionState));
            updateCompetitionUI();
            showMessage('Competition started successfully! (No drawing uploaded)', 'success');
        }

        startCompetitionTimer();
    }

    function revealDrawing() {
        const competitionState = JSON.parse(localStorage.getItem('competitionState')) || {};
        
        if (!competitionState.started) {
            showMessage('Please start the competition first', 'error');
            return;
        }

        if (!competitionState.drawingUrl) {
            showMessage('No drawing uploaded. Please upload a drawing first.', 'error');
            return;
        }

        competitionState.drawingRevealed = true;
        localStorage.setItem('competitionState', JSON.stringify(competitionState));
        
        updateCompetitionUI();
        showMessage('Drawing revealed to all participants!', 'success');
    }

    function stopCompetition() {
        if (!confirm('Are you sure you want to stop the competition? This cannot be undone.')) {
            return;
        }

        const competitionState = JSON.parse(localStorage.getItem('competitionState')) || {};
        competitionState.stopped = true;
        competitionState.endTime = new Date().toISOString();
        
        localStorage.setItem('competitionState', JSON.stringify(competitionState));
        
        if (competitionTimer) {
            clearInterval(competitionTimer);
            competitionTimer = null;
        }

        updateCompetitionUI();
        showMessage('Competition stopped successfully!', 'success');
    }

    function resetCompetition() {
        if (!confirm('Are you sure you want to reset the entire competition? This will clear all data!')) {
            return;
        }

        // Clear all competition data
        localStorage.removeItem('competitionState');
        localStorage.removeItem('submissions');
        localStorage.removeItem('participants');

        // Reset UI
        loadCompetitionState();
        updateParticipantsList();
        updateLeaderboard();
        document.getElementById('drawingPreview').innerHTML = '';

        if (competitionTimer) {
            clearInterval(competitionTimer);
            competitionTimer = null;
        }

        showMessage('Competition reset successfully!', 'success');
    }

    function startCompetitionTimer() {
        if (competitionTimer) return; // Already running

        competitionTimer = setInterval(() => {
            const competitionState = JSON.parse(localStorage.getItem('competitionState'));
            if (competitionState && competitionState.started && !competitionState.stopped) {
                const now = new Date();
                const startTime = new Date(competitionState.startTime);
                const elapsed = Math.floor((now - startTime) / 1000);
                
                const hours = Math.floor(elapsed / 3600);
                const minutes = Math.floor((elapsed % 3600) / 60);
                const seconds = elapsed % 60;
                
                const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                document.getElementById('competitionTime').textContent = timeString;
            }
        }, 1000);
    }

    function loadCompetitionState() {
        const competitionState = JSON.parse(localStorage.getItem('competitionState')) || {};
        
        // Update buttons based on state
        const startBtn = document.getElementById('startCompetition');
        const revealBtn = document.getElementById('revealDrawing');
        const stopBtn = document.getElementById('stopCompetition');
        
        if (!competitionState.started) {
            // Not started
            startBtn.disabled = false;
            revealBtn.disabled = true;
            stopBtn.disabled = true;
            updateStatusIndicator('Competition Not Started', 'waiting');
        } else if (competitionState.started && !competitionState.stopped) {
            // Running
            startBtn.disabled = true;
            revealBtn.disabled = false;
            stopBtn.disabled = false;
            updateStatusIndicator('Competition Active', 'active');
            startCompetitionTimer();
        } else if (competitionState.stopped) {
            // Stopped
            startBtn.disabled = true;
            revealBtn.disabled = true;
            stopBtn.disabled = true;
            updateStatusIndicator('Competition Stopped', 'stopped');
        }

        // Set material selection
        if (competitionState.material) {
            document.getElementById('materialSelect').value = competitionState.material;
        }
    }

    function updateStatusIndicator(text, status) {
        const statusText = document.getElementById('adminStatusText');
        const statusDot = document.getElementById('adminStatusDot');
        
        statusText.textContent = text;
        statusDot.className = `status-dot ${status}`;
    }

    function updateCompetitionUI() {
        loadCompetitionState();
        updateCompetitionStats();
    }

    function updateCompetitionStats() {
        const participants = JSON.parse(localStorage.getItem('participants')) || [];
        const submissions = JSON.parse(localStorage.getItem('submissions')) || [];
        
        document.getElementById('participantCount').textContent = participants.length;
        document.getElementById('submissionCount').textContent = submissions.length;
    }

    function updateParticipantsList() {
        const participants = JSON.parse(localStorage.getItem('participants')) || [];
        const submissions = JSON.parse(localStorage.getItem('submissions')) || [];
        const listContainer = document.getElementById('participantsList');
        
        if (participants.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">No participants logged in yet...</p>';
            return;
        }

        const participantItems = participants.map(participant => {
            const hasSubmitted = submissions.some(s => s.email === participant.email);
            const status = hasSubmitted ? 'completed' : 'modeling';
            const statusText = hasSubmitted ? 'Completed' : 'Modeling';
            
            return `
                <div class="participant-item">
                    <div>
                        <div class="participant-name">${participant.name}</div>
                        <div style="font-size: 0.8rem; color: #666;">${participant.email}</div>
                    </div>
                    <div class="participant-status ${status}">${statusText}</div>
                </div>
            `;
        }).join('');

        listContainer.innerHTML = participantItems;
    }

    function updateLeaderboard() {
        const submissions = JSON.parse(localStorage.getItem('submissions')) || [];
        const tbody = document.getElementById('leaderboardBody');
        
        if (submissions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No submissions yet...</td></tr>';
            return;
        }

        // Sort submissions by completion time
        const sortedSubmissions = [...submissions].sort((a, b) => 
            new Date(a.submissionTime) - new Date(b.submissionTime)
        );

        const rows = sortedSubmissions.map((submission, index) => {
            const rank = index + 1;
            const completionTime = formatTime(submission.totalTime);
            const fileSizeMB = (submission.fileSize / (1024 * 1024)).toFixed(2);
            
            return `
                <tr>
                    <td><span class="rank-badge">${rank}</span></td>
                    <td>${submission.name}</td>
                    <td>${submission.email}</td>
                    <td>${completionTime}</td>
                    <td>${submission.mass.toFixed(3)}</td>
                    <td>${submission.fileName} (${fileSizeMB} MB)</td>
                    <td><span class="status-badge submitted">Submitted</span></td>
                    <td>
                        <button class="action-btn" onclick="viewSubmissionDetails('${submission.email}')">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    function handleDrawingUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            showMessage('Please upload a valid image file (JPG, PNG) or PDF', 'error');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewContainer = document.getElementById('drawingPreview');
            
            if (file.type === 'application/pdf') {
                previewContainer.innerHTML = `
                    <div style="padding: 1rem; border: 1px solid #ddd; border-radius: 8px; text-align: center;">
                        <p>📄 PDF uploaded: ${file.name}</p>
                        <small>PDF preview not available</small>
                    </div>
                `;
            } else {
                previewContainer.innerHTML = `
                    <img src="${e.target.result}" alt="Drawing Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">Preview: ${file.name}</p>
                `;
            }
            
            // Enable start button if drawing is uploaded
            const startBtn = document.getElementById('startCompetition');
            const competitionState = JSON.parse(localStorage.getItem('competitionState')) || {};
            if (!competitionState.started) {
                startBtn.disabled = false;
            }
        };
        reader.readAsDataURL(file);
    }

    function exportResults() {
        const submissions = JSON.parse(localStorage.getItem('submissions')) || [];
        const participants = JSON.parse(localStorage.getItem('participants')) || [];
        const competitionState = JSON.parse(localStorage.getItem('competitionState')) || {};
        
        if (submissions.length === 0) {
            showMessage('No submissions to export', 'error');
            return;
        }

        // Sort submissions by rank
        const sortedSubmissions = [...submissions].sort((a, b) => 
            new Date(a.submissionTime) - new Date(b.submissionTime)
        );

        // Create CSV content
        const headers = [
            'Rank',
            'Participant Name',
            'Email',
            'Participant ID',
            'Competition Time (seconds)',
            'Formatted Time',
            'Submitted Mass (g)',
            'File Name',
            'File Size (MB)',
            'Submission Time',
            'Material Used'
        ];

        const csvRows = [headers.join(',')];

        sortedSubmissions.forEach((submission, index) => {
            const rank = index + 1;
            const fileSizeMB = (submission.fileSize / (1024 * 1024)).toFixed(2);
            const formattedTime = formatTime(submission.totalTime);
            const submissionDate = new Date(submission.submissionTime).toLocaleString();
            const material = competitionState.material || 'Not specified';

            const row = [
                rank,
                `"${submission.name}"`,
                submission.email,
                submission.participantId,
                submission.totalTime,
                formattedTime,
                submission.mass.toFixed(3),
                `"${submission.fileName}"`,
                fileSizeMB,
                `"${submissionDate}"`,
                material
            ];

            csvRows.push(row.join(','));
        });

        // Download CSV
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `speedmodelling_results_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        showMessage('Results exported successfully!', 'success');
    }

    function refreshLeaderboard() {
        updateLeaderboard();
        updateParticipantsList();
        updateCompetitionStats();
        showMessage('Leaderboard refreshed!', 'success');
    }

    function adminLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminSession');
            isLoggedIn = false;
            
            if (competitionTimer) {
                clearInterval(competitionTimer);
                competitionTimer = null;
            }
            
            window.location.href = 'index.html';
        }
    }

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function showMessage(text, type = 'info') {
        const messageDiv = document.getElementById('adminMessage');
        messageDiv.textContent = text;
        messageDiv.className = `message ${type} show`;
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
        }, 5000);
    }

    // Global function for viewing submission details
    window.viewSubmissionDetails = function(email) {
        const submissions = JSON.parse(localStorage.getItem('submissions')) || [];
        const submission = submissions.find(s => s.email === email);
        
        if (!submission) {
            showMessage('Submission not found', 'error');
            return;
        }

        const details = `
Participant: ${submission.name}
Email: ${submission.email}
Participant ID: ${submission.participantId}
Competition Time: ${formatTime(submission.totalTime)}
Submitted Mass: ${submission.mass.toFixed(3)} grams
File Name: ${submission.fileName}
File Size: ${(submission.fileSize / (1024 * 1024)).toFixed(2)} MB
Submission Time: ${new Date(submission.submissionTime).toLocaleString()}
        `;

        alert(details);
    };
});

// Additional CSS for better message styling
const additionalCSS = `
.message.success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
.message.error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
.message.info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
.empty-state { text-align: center; color: #999; padding: 2rem; font-style: italic; }
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);