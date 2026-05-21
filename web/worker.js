export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve static HTML for root path
    if (path === '/' || path === '/index.html') {
      const html = await env.ASSETS.fetch(request);
      return html;
    }

    // API endpoint to get all records
    if (path === '/api/records' && request.method === 'GET') {
      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM records ORDER BY id DESC'
        ).all();
        
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Database error' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

    // API endpoint to add a new record
    if (path === '/api/records' && request.method === 'POST') {
      try {
        const { name, email } = await request.json();
        
        if (!name || !email) {
          return new Response(JSON.stringify({ error: 'Name and email are required' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
          });
        }

        // Basic email validation
        if (!email.includes('@') || !email.includes('.')) {
          return new Response(JSON.stringify({ error: 'Invalid email format' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
          });
        }

        const result = await env.DB.prepare(
          'INSERT INTO records (name, email) VALUES (?, ?)'
        ).bind(name, email).run();

        return new Response(JSON.stringify({ 
          success: true, 
          id: result.meta.last_row_id 
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 201,
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to add record' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

    // 404 for any other routes
    return new Response('Not Found', { status: 404 });
  },
};