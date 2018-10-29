var async = require('async');
var db = require('../db');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Genre.
exports.genre_list = async function(req, res, next) {
    const findAllQuery = 'SELECT * FROM genres';
    try {
        const { rows, rowCount } = await db.query(findAllQuery);
        res.render('genre_list', { title: 'Genre List', list_genres:  rows});
    } catch(error) {
        return res.status(400).send(error);
    }
};

// Display detail page for a specific Genre.
exports.genre_detail = async function(req, res, next) {
    //console.log('req: '+ req.params.id);
    const findOneQuery = 'SELECT * FROM genres WHERE id=$1';
    try {
        const { rows } = await db.query(findOneQuery, [req.params.id]);
        res.render('genre_detail', { title: 'Genre Detail', genre: rows[0] } );
    } catch(error) {
        return res.status(400).send(error);
    }
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', { title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),

    // Sanitize (trim and escape) the name field.
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization.
    async (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
/*         var genre = new Genre(
          { name: req.body.name }
        ); */
        var genre = { name: req.body.name };

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            const text = 'SELECT * FROM genres WHERE name = $1';
            const { rows } = await db.query(text, [req.body.name]);
            if (!rows[0]) {
                const createQuery = 'INSERT INTO genres(name) VALUES($1) returning *';
                var values = [req.body.name];    
                try {
                    const { rows } = await db.query(createQuery, values);
                    //return res.status(201).send(rows[0]);
                    return res.redirect('/genres/'+rows[0].id);
                  } catch(error) {
                    return res.status(400).send(error);
                  }            
                //return res.status(404).send({'message': 'reflection not found'});
                console.log('yes');
            }else{
                console.log('no');
            }
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = async function(req, res, next) {
    const findOneQuery = 'SELECT * FROM genres WHERE id=$1';
    try {
        const { rows } = await db.query(findOneQuery, [req.params.id]);
        res.render('genre_delete', { title: 'Genre Detail', genre: rows[0] } );
    } catch(error) {
        return res.status(400).send(error);
    }
};

// Handle Genre delete on POST.
exports.genre_delete_post = async function(req, res, next) {
    const deleteQuery = 'DELETE FROM genres WHERE id=$1 returning *';
    try {
      const { rows } = await db.query(deleteQuery, [req.params.id]);
      if(!rows[0]) {
        return res.status(404).send({'message': 'genre not found'});
      }
      res.redirect('/genres');
    } catch(error) {
      return res.status(400).send(error);
    }

};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {


};

// Handle Genre update on POST.
exports.genre_update_post = [
   

];
