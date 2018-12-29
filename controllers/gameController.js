//var Game = require('../models/game');
var async = require('async');
var db = require('../db');

exports.game_index = async function(req, res) {
/*     async.parallel({
        Game_count: function(callback) {
            Game.countDocuments(callback);
        },
    }, function(err, results) {
        res.render('game_index', { title: 'Let us play a Quiz', error: err, data: results });
    }); */
    const findAllQuery = 'SELECT * FROM genres';
    try {
        const { rows, rowCount } = await db.query(findAllQuery);
        //console.log(rows);
        res.render('game_index', { title: 'Let us play a Quiz', list_genres:  rows });
    } catch(error) {
        return res.status(400).send(error);
    }
    //res.render('game_index', { title: 'Let us play a Quiz' });
};

exports.game_list = async function(req, res) {
        const findAllQuery = 'SELECT * FROM games';
        try {
            const { rows, rowCount } = await db.query(findAllQuery);
            //console.log(rows);
            res.render('game_list', { title: 'Let us play a Quiz', list_games:  rows });
        } catch(error) {
            return res.status(400).send(error);
        }
        //res.render('game_index', { title: 'Let us play a Quiz' });
    };

exports.game_create_get = function(req, res, next) {
    //console.log("game_create_get");
    res.render('game_create', { title: 'Create Game' });
};

exports.game_list_delete = async function(req, res) {
    const deleteAllQuery = 'DELETE FROM games';
    try {
        const { rows, rowCount } = await db.query(deleteAllQuery);
        //console.log(rows);
        res.redirect('http://localhost');
    } catch(error) {
        return res.status(400).send(error);
    }
    //res.render('game_index', { title: 'Let us play a Quiz' });
};

// Handle game create on POST.
exports.game_create_post = [
    
    // Validate fields.
    //body('game', 'game must not be empty.').isLength({ min: 1 }).trim(),
    //body('correctAnswer', 'correctAnswer must not be empty.').isLength({ min: 1 }).trim(),

  
    // Sanitize fields.
    //sanitizeBody('*').trim().escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {
        

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Game object with escaped and trimmed data.
        var game = new Game(
          { gameId: ( Math.random() * 100000 ) | 0,
            gameStatus: 'Not started',
            gameType:'0',
            numberOfPlayers:2
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({

            }, function(err, results) {
                if (err) { return next(err); }
                //console.log("game render"),
                res.render('game_form', { title: 'Create Game',game: game, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save game.
            game.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new game record.
                   res.redirect(game.url);
                });
        }
    }
];
