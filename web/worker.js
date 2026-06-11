export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers (same for all responses)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Helper response function
    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    };

    // =========================
    // GET ALL RECORDS
    // =========================
    if (path === "/api/records" && request.method === "GET") {
      try {
        const result = await env.MY_DB.prepare(
          "SELECT id, name, email, created_at FROM records ORDER BY id DESC"
        ).all();

        return jsonResponse(result.results);
      } catch (error) {
        console.error("GET error:", error);
        return jsonResponse({ error: error.message }, 500);
      }
    }

    // =========================
    // ADD NEW RECORD
    // =========================
    if (path === "/api/records" && request.method === "POST") {
      try {
        let body;

        try {
          body = await request.json();
        } catch {
          return jsonResponse({ error: "Invalid JSON body" }, 400);
        }

        const name = body?.name?.trim();
        const email = body?.email?.trim();

        if (!name || !email) {
          return jsonResponse(
            { error: "Name and email required" },
            400
          );
        }

        await env.MY_DB.prepare(
          "INSERT INTO records (name, email) VALUES (?, ?)"
        )
          .bind(name, email)
          .run();

        return jsonResponse(
          { success: true, message: "Record added successfully" },
          201
        );
      } catch (error) {
        console.error("POST error:", error);
        return jsonResponse({ error: error.message }, 500);
      }
    }

    // =========================
    // FRONTEND (UNCHANGED)
    // =========================
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Record Manager</title>
<style>
body {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: #f5f5f5;
}
.container {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
}
button {
    background: #0066ff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
}
.records-list {
    list-style: none;
    padding: 0;
}
.records-list li {
    background: #f9f9f9;
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 6px;
}
</style>
</head>
<body>

<div class="container">
<h2>Add Record</h2>
<input id="nameInput" placeholder="Name" />
<br><br>
<input id="emailInput" placeholder="Email" />
<br><br>
<button id="addBtn">Add</button>
<div id="msg"></div>
</div>

<div class="container">
<h2>Records</h2>
<button onclick="load()">Refresh</button>
<ul id="list"></ul>
</div>

<script>
async function load() {
  const res = await fetch('/api/records');
  const data = await res.json();

  const list = document.getElementById('list');
  list.innerHTML = '';

  data.forEach(r => {
    const li = document.createElement('li');
    li.innerText = r.name + " - " + r.email;
    list.appendChild(li);
  });
}

document.getElementById('addBtn').onclick = async () => {
  const name = document.getElementById('nameInput').value;
  const email = document.getElementById('emailInput').value;

  const res = await fetch('/api/records', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name, email})
  });

  const data = await res.json();

  document.getElementById('msg').innerText =
    data.success ? "Saved!" : data.error;

  load();
};

load();
</script>

</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
};
