import pg from "pg";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync("./ca.pem").toString(),
    },
  });


  db.connect(function (err) {
      if (err)
          throw err;
          db.query("SELECT VERSION()", [], function (err, result) {
          if (err)
              throw err;
  
          console.log(result.rows[0].version);
         
      });
  });



export default db;