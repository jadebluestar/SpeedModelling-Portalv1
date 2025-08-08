// STEP 1: List of admin emails
const adminEmails = [
  "shubhankarchin@gmail.com",
  "omkundgolkar@gmail.com",
  "fionadsouza0401@gmail.com",
  "nikhil.bhekane092003@gmail.com"
];

// STEP 2: When the form is submitted
document.getElementById("login-form").addEventListener("submit", function (event) {
  event.preventDefault(); // This stops the page from reloading

  // STEP 3: Grab what the user typed
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();

  // STEP 4: Check if the email is in admin list
  if (adminEmails.includes(email)) {
    // If yes, send to admin dashboard
    window.location.href = "admin.html";
  } else {
    // If no, send to participant dashboard
    window.location.href = "participant.html";
  }
});
