const express = require('express');
const router = express.Router();
//const Game = require('../models/game');
const path = require('path');
const game_controller = require('../controllers/gameController'); 

// GET game home page.
//router.get('/', game_controller.game_index);  
router.get('/', function(req, res){
    res.sendFile('./public/game_index.html', { root: '.' });
  });

/* router.get('/', function(req,res){
       
    res.sendFile('/Users/davy/Projects/Quiz/quiz/public/test.html');
}) */
router.get('/list', game_controller.game_list);

router.get('/list/delete', game_controller.game_list_delete);

module.exports = router;