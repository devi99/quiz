var db = require('./db');
var async = require('async');

async function testQuery() {
try {
    const findQuestionsQuery = 'select id from questions limit 2';
    const { rows, rowCount } = await db.query(findQuestionsQuery);
    console.log(rows);
    var arrQuestionIds = new Array();
    
    for (item in rows) {
        console.log('loop');
        console.log(rows[item].id);
        arrQuestionIds.push(rows[item].id);
        //console.log(item.id)
      };
      console.log(arrQuestionIds);
 } 
  catch(error) {
    return console.log('error: ' + error);
  };
} 
module.exports = {
    testQuery
  };
  
require('make-runnable');
