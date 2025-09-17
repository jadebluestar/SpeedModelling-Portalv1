// src/utils/participant.js
document.getElementById("name").innerText = localStorage.getItem("participantName");

document.getElementById("submitForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const mass = document.getElementById("massInput").value;
  if (!mass) return alert("Enter mass.");

  // Save submission timestamp and mass to Supabase
  try {
    const { data, error } = await supabase
      .from("submissions")
      .insert([{ name: localStorage.getItem("participantName"), email: localStorage.getItem("participantEmail"), mass, timestamp: new Date() }]);

    if (error) throw error;
    document.getElementById("message").innerText = "Submission successful!";
  } catch (err) {
    document.getElementById("message").innerText = "Error submitting: " + err.message;
  }
});
