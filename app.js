const express = require("express");
const app = express();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "Posts.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDBAndServer();

const database = new sqlite3.Database(
  "./Posts.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) return console.log(err.message);

    console.log("Connection Succesfull");
  }
);

/*
database.run(
  `CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  desc TEXT NOT NULL,
  tag TEXT NOT NULL,
  image TEXT NOT NULL
)`
);
*/

/*
const sql = `INSERT INTO posts (id,title,desc,tag,image)
VALUES(?,?,?,?,?)`;

database.run(
  sql,
  [
    10,
    "Data Privacy in the Digital Age",
    "Uncover the importance of data privacy and security measures in safeguarding personal information in an interconnected world.",
    "Technology",
    "https://res.cloudinary.com/anilkumarsala-ccbp-tech/image/upload/v1714655911/utxdnedwbxddc5ivbtxj.webp",
  ],
  (err) => {
    if (err) return console.error(err.message);

    console.log("A new row has been created");
  }
);

database.close((err) => {
  if (err) return console.error(err.message);
});
*/

app.get("/posts/", async (req, res) => {
  let { page = 1, limit = 10, sort, tag, keyword } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  let offset = (page - 1) * limit;
  let order = "DESC";

  if (sort) {
    order = sort.toUpperCase() === "ASC" ? "ASC" : "DESC";
  }

  let whereConditions = [];
  let params = [];

  if (tag) {
    whereConditions.push("tag = ?");
    params.push(tag);
  }

  if (keyword) {
    whereConditions.push("title LIKE ?");
    whereConditions.push("desc LIKE ?");
    params.push(...params, `%${keyword}%`, `%${keyword}%`);
  }

  let whereClause =
    whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : "";

  try {
    const query = `
  SELECT *
  FROM posts
  ${whereClause}
  ORDER BY id ${order}
  LIMIT ? OFFSET ?;
`;

    const posts = await db.all(query, [...params, limit, offset]);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
