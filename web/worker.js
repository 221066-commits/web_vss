const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Employee Management System</title>

    <style>
      body {
        font-family: system-ui, sans-serif;
        padding: 3rem 1rem;
        background: #f4f6f9;
        color: #263238;
      }

      .container {
        max-width: 700px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid #e0e0e0;
      }

      h1 {
        margin-bottom: 1.5rem;
        color: #4a5ab0;
      }

      .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.2rem;
        flex-wrap: wrap;
      }

      label {
        display: block;
        font-size: 0.9rem;
        margin-bottom: 0.4rem;
        color: #263238;
      }

      input[type="text"] {
        width: 100%;
        padding: 0.7rem 0.9rem;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        outline: none;
      }

      input[type="text"]:focus {
        border-color: #5c6bc0;
        box-shadow: 0 0 0 3px rgba(92, 107, 192, 0.15);
      }

      .btn {
        padding: 0.7rem 1.2rem;
        border: none;
        border-radius: 6px;
        background: #5c6bc0;
        color: white;
        font-weight: 500;
        cursor: pointer;
      }

      .btn:hover {
        background: #4a5ab0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1.2rem;
        font-size: 0.95rem;
      }

      th {
        text-align: left;
        padding: 0.9rem 1rem;
        background: #f0f4fa;
        border-bottom: 2px solid #e0e0e0;
        color: #5c6bc0;
      }

      td {
        padding: 0.8rem 1rem;
        border-bottom: 1px solid #e0e0e0;
        color: #263238;
      }

      tbody tr:nth-child(even) {
        background: #f9fbfd;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <h1>Employee Management System</h1>

      <div class="form-row">
        <div style="flex: 1">
          <label for="empName">Employee Name</label>
          <input type="text" id="empName" placeholder="Enter name" />
        </div>

        <div style="flex: 1">
          <label for="empPosition">Position</label>
          <input type="text" id="empPosition" placeholder="Enter position" />
        </div>
      </div>

      <button class="btn" id="addBtn">Add Employee</button>

      <table id="empTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
          </tr>
        </thead>

        <tbody id="empTableBody"></tbody>
      </table>
    </div>

    <script>
      const empNameInput = document.getElementById("empName");
      const empPositionInput = document.getElementById("empPosition");
      const addBtn = document.getElementById("addBtn");
      const empTableBody = document.getElementById("empTableBody");

      const API = "/api/employees";

      // LOAD DATA FROM DB
      async function loadEmployees() {
        const res = await fetch(API);
        const data = await res.json();

        empTableBody.innerHTML = "";

        data.forEach(emp => {
          const row = document.createElement("tr");

          const nameTd = document.createElement("td");
          const posTd = document.createElement("td");

          nameTd.textContent = emp.name;
          posTd.textContent = emp.position;

          row.appendChild(nameTd);
          row.appendChild(posTd);

          empTableBody.appendChild(row);
        });
      }

      // ADD EMPLOYEE TO DB
      async function addEmployee() {
        const name = empNameInput.value.trim();
        const position = empPositionInput.value.trim();

        if (!name && !position) return;

        await fetch(API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, position })
        });

        empNameInput.value = "";
        empPositionInput.value = "";

        loadEmployees();
      }

      addBtn.addEventListener("click", addEmployee);

      [empNameInput, empPositionInput].forEach(input => {
        input.addEventListener("keydown", e => {
          if (e.key === "Enter") addEmployee();
        });
      });

      loadEmployees();
    </script>
  </body>
</html>
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET employees
    if (url.pathname === "/api/employees" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM employees"
      ).all();

      return Response.json(results);
    }

    // POST employee
    if (url.pathname === "/api/employees" && request.method === "POST") {
      const body = await request.json();

      await env.DB.prepare(
        "INSERT INTO employees (name, position) VALUES (?, ?)"
      )
        .bind(body.name, body.position)
        .run();

      return Response.json({ success: true });
    }

    // FRONTEND
    return new Response(html, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  },
};
