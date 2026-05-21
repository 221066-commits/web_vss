export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Serve the HTML form
        if (path === '/') {
            const html = `<!DOCTYPE html>
<html>
<head>
    <title>Record Manager</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        .container { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
        input, button { margin: 10px 0; padding: 8px; width: 100%; }
        .record { border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px; }
        button { background: #0066ff; color: white; border: none; cursor: pointer; }
        button:hover { background: #0052cc; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Add New Record</h2>
        <input type="text" id="name" placeholder="Enter Name">
        <input type="email" id="email" placeholder="Enter Email">
        <button onclick="addRecord()">Add Record</button>
        <div id="message"></div>
    </div>
    
    <div class="container">
        <h2>Stored Records</h2>
        <div id="records">Loading...</div>
    </div>
    
    <script>
        async function loadRecords() {
            try {
                const response = await fetch('/api/records');
                const records = await response.json();
                const container = document.getElementById('records');
                
                if (records.length === 0) {
                    container.innerHTML = 'No records yet. Add your first record above!';
                    return;
                }
                
                container.innerHTML = records.map(r => 
                    \`<div class="record">
                        <strong>\${r.name}</strong><br>
                        \${r.email}<br>
                        <small>Added: \${new Date(r.created_at).toLocaleString()}</small>
                    </div>\`
                ).join('');
            } catch (error) {
                document.getElementById('records').innerHTML = 'Error loading records';
            }
        }
        
        async function addRecord() {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const messageDiv = document.getElementById('message');
            
            if (!name || !email) {
                messageDiv.innerHTML = '<p style="color: red;">Please fill in both fields</p>';
                return;
            }
            
            try {
                const response = await fetch('/api/records', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name, email})
                });
                
                if (response.ok) {
                    messageDiv.innerHTML = '<p style="color: green;">Record added successfully!</p>';
                    document.getElementById('name').value = '';
                    document.getElementById('email').value = '';
                    loadRecords();
                    setTimeout(() => messageDiv.innerHTML = '', 3000);
                } else {
                    messageDiv.innerHTML = '<p style="color: red;">Failed to add record</p>';
                }
            } catch (error) {
                messageDiv.innerHTML = '<p style="color: red;">Network error</p>';
            }
        }
        
        loadRecords();
    </script>
</body>
</html>`;
            return new Response(html, { headers: { 'Content-Type': 'text/html' } });
        }
        
        // GET all records
        if (path === '/api/records' && request.method === 'GET') {
            try {
                const result = await env.MY_DB.prepare(
                    "SELECT id, name, email, created_at FROM records ORDER BY id DESC"
                ).all();
                
                return new Response(JSON.stringify(result.results), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // POST new record
        if (path === '/api/records' && request.method === 'POST') {
            try {
                const { name, email } = await request.json();
                
                if (!name || !email) {
                    return new Response(JSON.stringify({ error: 'Name and email required' }), { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                await env.MY_DB.prepare(
                    "INSERT INTO records (name, email) VALUES (?, ?)"
                ).bind(name, email).run();
                
                return new Response(JSON.stringify({ success: true }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        return new Response('Not Found', { status: 404 });
    }
};
