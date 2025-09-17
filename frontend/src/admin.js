// src/utils/admin.js
async function fetchSubmissions() {
  const { data, error } = await supabase.from("submissions").select("*");
  if (error) return console.error(error);

  const tbody = document.querySelector("#submissionTable tbody");
  tbody.innerHTML = "";
  data.forEach((row) => {
    tbody.innerHTML += `<tr>
      <td>${row.name}</td>
      <td>${row.email}</td>
      <td>${row.mass}</td>
      <td>${new Date(row.timestamp).toLocaleString()}</td>
    </tr>`;
  });
}

document.getElementById("startBtn").addEventListener("click", () => {
  alert("Competition Started!");
});

document.getElementById("stopBtn").addEventListener("click", () => {
  alert("Competition Stopped!");
});

fetchSubmissions();
