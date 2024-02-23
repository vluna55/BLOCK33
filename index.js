const express = require("express");
const app = express();
const pg = require("pg");
const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost/acme_hr_db",
});
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = "SELECT * FROM employees";
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = "SELECT * FROM department ORDER BY name";
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL =
      "INSERT INTO employees(name, department_id) VALUES($1, $2) RETURNING *";
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL =
      "UPDATE employees SET name=$1, department_id=$2, updated_at=now() WHERE id=$3 RETURNING *";
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = "DELETE FROM employees WHERE id = $1";
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  await client.connect();
  let SQL = `DROP TABLE IF EXISTS notes;
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS department;

    CREATE TABLE department(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100)
    );

    CREATE TABLE employees(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      department_id INTEGER REFERENCES department(id) NOT NULL,
      name VARCHAR(255) NOT NULL
    );

    INSERT INTO department(name) VALUES('Produce');
    INSERT INTO department(name) VALUES('Electronics');
    INSERT INTO department(name) VALUES('Register');

    INSERT INTO employees(name, department_id) VALUES('Leo', 1);
    INSERT INTO employees(name, department_id) VALUES('Morgen', 2);
    INSERT INTO employees(name, department_id) VALUES('Torie', 3);
`;
  await client.query(SQL);
  console.log("Tables created and data seeded");
  app.listen(port, () => console.log(`Listening on port ${port}`));
};

init();
