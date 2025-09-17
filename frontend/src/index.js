// src/index.js
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = e.target[0].value.trim();
  const email = e.target[1].value.trim();

  // Simple validation
  if (!name || !email) return alert("Please fill all fields.");

  // Check if admin or participant
  const isAdmin = email.endsWith("@admin.com"); // Example
  if (isAdmin) {
    window.location.href = "admin.html";
  } else {
    localStorage.setItem("participantName", name);
    localStorage.setItem("participantEmail", email);
    window.location.href = "participant.html";
  }
});
