// ================================
// Login Page Logic (index.js)
// ================================
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const messageDiv = document.getElementById("message");

    // ================================
    // Utility Functions
    // ================================

    /** Show a temporary status message */
    const showMessage = (text, type = "info") => {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type} show`;

        setTimeout(() => {
            messageDiv.classList.remove("show");
        }, 4000);
    };

    /** Validate email format */
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    /** Generate a unique participant ID */
    const generateParticipantId = (email) =>
        `${email.slice(0, 3)}_${Date.now().toString().slice(-6)}`;

    /** Add or update participant in localStorage */
    const addParticipantToList = (participant) => {
        const participants = JSON.parse(localStorage.getItem("participants")) || [];

        const existingIndex = participants.findIndex((p) => p.email === participant.email);

        if (existingIndex !== -1) {
            participants[existingIndex] = participant; // update existing
        } else {
            participants.push(participant); // add new
        }

        localStorage.setItem("participants", JSON.stringify(participants));
    };

    // ================================
    // Form Submit Handler
    // ================================
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("participantName").value.trim();
        const email = document.getElementById("participantEmail").value.trim();

        // Basic validation
        if (!name || !email) {
            return showMessage("Please fill in all fields", "error");
        }
        if (!isValidEmail(email)) {
            return showMessage("Please enter a valid email address", "error");
        }

        const participant = {
            name,
            email,
            loginTime: new Date().toISOString(),
            participantId: generateParticipantId(email),
            status: "waiting",
        };

        // Save to localStorage
        localStorage.setItem("participantData", JSON.stringify(participant));
        addParticipantToList(participant);

        // Success feedback
        showMessage("Registration successful! Redirecting...", "success");

        // Redirect to dashboard
        setTimeout(() => (window.location.href = "participant.html"), 1200);
    });
});
