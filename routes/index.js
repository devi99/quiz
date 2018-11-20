const express = require('express');
const router = express.Router();
//const Game = require('../models/game');
const path = require('path');
const game_controller = require('../controllers/gameController'); 

// GET game home page.
router.get('/', game_controller.game_index);  

/* router.get('/', function(req,res){
       
    res.sendFile('/Users/davy/Projects/Quiz/quiz/public/test.html');
}) */

module.exports = router;