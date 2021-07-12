// db.js
//const { Pool } = require('pg');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config();

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/quiz",
//   ssl: {
//     rejectUnauthorized: false
//   }
// });
const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/quiz",
  ssl: {
    rejectUnauthorized: false
  }
});

client.on('connect', () => {
  //console.log('connected to the db');
});

/**
 * DB Query
 * @param {string} text
 * @param {Array} params
 * @returns {object} object 
 */
const query = (text, params) => {
  return new Promise((resolve, reject) => {
    //console.log('text: ' + text);
    //console.log('params: ' + params);
    client.query(text, params)
    .then((res) => {
      //console.log('res: ' + res);
      resolve(res);
    })
    .catch((err) => {
      console.log('err query index.js: ' + err);
      reject(err);
    })
  })
}

module.exports = {
  query
};
