//var Question = require('../models/question');
//var Genre = require('../models/genre');
var db = require('../db');
var async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all questions.
exports.question_list = async function(req, res, next) {
    console.log('questions');
    const findAllQuery = 'SELECT * FROM questions';
    try {
        const { rows, rowCount } = await db.query(findAllQuery);
        console.log(rowCount);
        res.render('question_list', { title: 'Question List', list_questions:  rows});
    } catch(error) {
        return res.status(400).send(error);
    }
};

// Display detail page for a specific question.
exports.question_detail = async function(req, res, next) {
    const findOneQuery = 'SELECT * FROM questions WHERE id=$1';
    try {
        const { rows } = await db.query(findOneQuery, [req.params.id]);
        res.render('question_detail', { title: 'Question Detail', question: rows[0] } );
    } catch(error) {
        return res.status(400).send(error);
    }
};

// Display question create form on GET.
exports.question_create_get = async function(req, res, next) {
    const findAllQuery = 'SELECT * FROM genres';
    try {
        const { rows, rowCount } = await db.query(findAllQuery);
        defaultQuestionType = { questionType : 0 };
        res.render('question_form', { title: 'Create Question', question : defaultQuestionType, genres:rows });
    } catch(error) {
        return res.status(400).send(error);
    }
};

// Handle question create on POST.
exports.question_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },
    // Validate fields.
    body('title', 'title must not be empty.').isLength({ min: 1 }).trim(),
    body('correctAnswer', 'correctAnswer must not be empty.').isLength({ min: 1 }).trim(),
  
    // Sanitize fields.
    //sanitizeBody('*').trim().escape(),
    //sanitizeBody('genre.*').trim().escape(),

    // Process request after validation and sanitization.
    async (req, res, next) => {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        console.log(req.body.genre);
        
        // Create a Question object with escaped and trimmed data.
        var question = 
        [ req.body.title,
            req.body.subText,
            Number(req.body.typeQuestion),              
            req.body.correctAnswer,
            req.body.fakeAnswer1,
            req.body.fakeAnswer2,
            req.body.fakeAnswer3,
            req.body.fakeAnswer4,
            req.body.fakeAnswer5,
            req.body.typeMedia,
            req.body.urlMedia,
            req.body.genre
        ];

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({

            }, function(err, results) {
                if (err) { return next(err); }
                console.log("question render"),
                res.render('question_form', { title: 'Create Question',question: question, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save question.
            const createQuery = 'INSERT INTO questions(title, subtext,  typequestion,  correctanswer ,  fakeanswer1 , fakeanswer2 , fakeanswer3 ,fakeanswer4 , fakeanswer5 , typemedia , urlmedia, genres ) VALUES($1, $2, $3, $4, $5, $6, $7,$8,$9,$10,$11,$12) returning *';
            var values = question;    
            try {
                const { rows } = await db.query(createQuery, values);
                //return res.status(201).send(rows[0]);
                console.log('rows: ' + rows);
                return res.redirect('/questions/'+rows[0].id);
              } catch(error) {
                return res.status(400).send(error);
              }            

        }
    }
];

// Display question delete form on GET.
exports.question_delete_get = async function(req, res, next) {
    const findOneQuery = 'SELECT * FROM questions WHERE id=$1';
    try {
        const { rows } = await db.query(findOneQuery, [req.params.id]);
        res.render('question_delete', { title: 'Question Delete', question: rows[0] } );
    } catch(error) {
        return res.status(400).send(error);
    }
};

// Handle question delete on POST.
exports.question_delete_post = async function(req, res, next) {
    const deleteQuery = 'DELETE FROM questions WHERE id=$1 returning *';
    try {
      const { rows } = await db.query(deleteQuery, [req.params.id]);
      if(!rows[0]) {
        return res.status(404).send({'message': 'question not found'});
      }
      res.redirect('/questions');
    } catch(error) {
      return res.status(400).send(error);
    }


};

// Display question update form on GET.
exports.question_update_get = async function(req, res, next) {
    try {
        const findAllGenresQuery = 'SELECT * FROM genres';
        const { rows, rowCount } = await db.query(findAllGenresQuery);
        var objgenres = rows;
    } catch(error) {
        return res.status(400).send(error);
    }

    try {
        const findOneQuery = 'SELECT * FROM questions WHERE id=$1';
        const { rows } = await db.query(findOneQuery, [req.params.id]);
        const objquestion = rows[0];

        for (var all_g_iter = 0; all_g_iter < objgenres.length; all_g_iter++) {
            for (var question_g_iter = 0; question_g_iter < objquestion.genres.length; question_g_iter++) {
                //console.log('in for2');
                //console.log(objgenres[all_g_iter].id.toString() + "===" + objquestion.genres[question_g_iter].toString());
                if (objgenres[all_g_iter].id.toString()==objquestion.genres[question_g_iter].toString()) {
                    //console.log('in if2');
                    objgenres[all_g_iter].checked='true';
                }
            }
        };            
        res.render('question_form', { title: 'Update Question', question:objquestion, genres:objgenres });    
    } catch(error) {
        return res.status(400).send(error);
    }


};

// Handle question update on POST.
exports.question_update_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },
    // Validate fields.
    body('title', 'title must not be empty.').isLength({ min: 1 }).trim(),
    body('correctAnswer', 'correctAnswer must not be empty.').isLength({ min: 1 }).trim(),
  
    // Sanitize fields.
    //sanitizeBody('*').trim().escape(),
    //sanitizeBody('genre.*').trim().escape(),

    // Process request after validation and sanitization.
    async (req, res, next) => {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        console.log(req.body.typeQuestion);
        
        // Create a Question object with escaped and trimmed data.
        var question = 
        [ req.body.title,
            req.body.subText,
            Number(req.body.typeQuestion),              
            req.body.correctAnswer,
            req.body.fakeAnswer1,
            req.body.fakeAnswer2,
            req.body.fakeAnswer3,
            req.body.fakeAnswer4,
            req.body.fakeAnswer5,
            req.body.typeMedia,
            req.body.urlMedia,
            req.body.genre,
            req.params.id
        ];

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({

            }, function(err, results) {
                if (err) { return next(err); }
                console.log("question render"),
                res.render('question_form', { title: 'Create Question',question: question, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save question.
            const updateQuery = 'UPDATE questions SET title = $1, subtext = $2,  typequestion = $3,  correctanswer = $4 ,  fakeanswer1 = $5 , fakeanswer2 = $6 , fakeanswer3 = $7 ,fakeanswer4 = $8 , fakeanswer5 = $9 , typemedia = $10 , urlmedia = $11, genres = $12 WHERE id = $13 returning *';
            var values = question;    
            try {
                const { rows } = await db.query(updateQuery, values);
                //return res.status(201).send(rows[0]);
                console.log('rows: ' + rows);
                return res.redirect('/questions/'+rows[0].id);
              } catch(error) {
                return res.status(400).send(error);
              }            
        }
    }
];

