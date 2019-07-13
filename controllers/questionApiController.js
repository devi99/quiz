const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.on('connect', () => {
  //console.log('connected to the db');
});

const getQuestions = (request, response) => {
    pool.query('SELECT * FROM questions ORDER BY id ASC', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  };

  const updateQuestion = (request, response) => {
    //const updateQuery = 'UPDATE questions SET title = $1, subtext = $2,  typequestion = $3,  correctanswer = $4 ,  fakeanswer1 = $5 , fakeanswer2 = $6 , fakeanswer3 = $7 ,fakeanswer4 = $8 , fakeanswer5 = $9 , typemedia = $10 , urlmedia = $11, genres = $12 WHERE id = $13 returning *';
    var question = 
    [ request.body.title,
      request.body.typequestion,
        request.body.id
    ];
    const updateQuery = 'UPDATE questions SET title = $1, typeQuestion = $2 WHERE id = $3 returning *';
    var values = question;    
    pool.query(updateQuery, values, (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  };

  module.exports = {
    getQuestions,
    updateQuestion
  }  