export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // GET all records - API endpoint
        if (path === '/api/records' && request.method === 'GET') {
            try {
                console.log('Fetching records from D1...');
                const result = await env.MY_DB.prepare(
                    "SELECT id, name, email, created_at FROM records ORDER BY id DESC"
                ).all();
                
                console.log('Records found:', result.results.length);
                return new Response(JSON.stringify(result.results), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 200
                });
            } catch (error) {
                console.error('Database error:', error);
                return new Response(JSON.stringify({ error: error.message }), { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // POST new record - API endpoint
        if (path === '/api/records' && request.method === 'POST') {
            try {
                const { name, email } = await request.json();
                
                if (!name || !email) {
                    return new Response(JSON.stringify({ error: 'Name and email required' }), { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                console.log('Inserting record:', name, email);
                await env.MY_DB.prepare(
                    "INSERT INTO records (name, email) VALUES (?, ?)"
                ).bind(name, email).run();
                
                return new Response(JSON.stringify({ success: true }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                console.error('Insert error:', error);
                return new Response(JSON.stringify({ error: error.message }), { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // Serve the HTML form - all other routes go here
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
        h2 {
            margin-top: 0;
            color: #333;
        }
        .form-group {
            margin-bottom: 16px;
        }
        label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #555;
        }
        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
        }
        button {
            background: #0066ff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        button:hover {
            background: #0052cc;
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
            border-left: 3px solid #0066ff;
        }
        .record-name {
            font-weight: 600;
            color: #333;
        }
        .record-email {
            color: #666;
            font-size: 13px;
            margin-top: 4px;
        }
        .empty {
            color: #999;
            text-align: center;
            padding: 20px;
        }
        .error {
            color: #d32f2f;
            font-size: 13px;
            margin-top: 8px;
        }
        .success {
            color: #2e7d32;
            font-size: 13px;
            margin-top: 8px;
        }
        .loading {
            text-align: center;
            color: #666;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Add New Record</h2>
        <div class="form-group">
            <label>Name:</label>
            <input type="text" id="nameInput" placeholder="Enter name">
        </div>
        <div class="form-group">
            <label>Email:</label>
            <input type="email" id="emailInput" placeholder="Enter email">
        </div>
        <button id="addBtn">Add Record</button>
        <div id="addMessage"></div>
    </div>

    <div class="container">
        <h2>Stored Records</h2>
        <div id="recordsContainer">
            <div class="loading">Loading records...</div>
        </div>
    </div>

    <script>
        async function loadRecords() {
            const container = document.getElementById('recordsContainer');
            container.innerHTML = '<div class="loading">Loading records...</div>';
            
            try {
                const response = await fetch('/api/records');
                if (!response.ok) throw new Error('Failed to fetch records');
                
                const records = await response.json();
                
                if (records.length === 0) {
                    container.innerHTML = '<div class="empty">No records yet. Add your first record above!</div>';
                    return;
                }
                
                const list = document.createElement('ul');
                list.className = 'records-list';
                
                records.forEach(record => {
                    const li = document.createElement('li');
                    li.innerHTML = \`
                        <div class="record-name">\${escapeHtml(record.name)}</div>
                        <div class="record-email">\${escapeHtml(record.email)}</div>
                    \`;
                    list.appendChild(li);
                });
                
                container.innerHTML = '';
                container.appendChild(list);
            } catch (error) {
                container.innerHTML = '<div class="error">Error loading records. Please refresh.</div>';
                console.error('Error:', error);
            }
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }

        document.getElementById('addBtn').addEventListener('click', async () => {
            const nameInput = document.getElementById('nameInput');
            const emailInput = document.getElementById('emailInput');
            const messageDiv = document.getElementById('addMessage');
            
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            
            if (!name || !email) {
                messageDiv.innerHTML = '<div class="error">Please fill in both name and email.</div>';
                return;
            }
            
            if (!email.includes('@') || !email.includes('.')) {
                messageDiv.innerHTML = '<div class="error">Please enter a valid email address.</div>';
                return;
            }
            
            messageDiv.innerHTML = '<div class="loading">Adding record...</div>';
            
            try {
                const response = await fetch('/api/records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email }),
                });
                
                if (response.ok) {
                    messageDiv.innerHTML = '<div class="success">Record added successfully!</div>';
                    nameInput.value = '';
                    emailInput.value = '';
                    loadRecords();
                    
                    setTimeout(() => {
                        messageDiv.innerHTML = '';
                    }, 3000);
                } else {
                    const data = await response.json();
                    messageDiv.innerHTML = \`<div class="error">Error: \${data.error || 'Failed to add record'}</div>\`;
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error">Network error. Please try again.</div>';
                console.error('Error:', error);
            }
        });

        loadRecords();
    </script>
</body>
</html>`;

        return new Response(html, { 
            headers: { 'Content-Type': 'text/html' },
            status: 200
        });
    }
};
