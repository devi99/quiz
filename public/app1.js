jQuery(function($){
    'use strict';

    var IO = {

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

         /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('newWordData', IO.onNewWordData);
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
            IO.socket.on('showLeader',IO.showLeader);
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function(data) {
            // Cache a copy of the client's socket.IO session ID on the App
            //App.mySocketId = IO.socket.socket.sessionid;
            App.mySocketId = IO.socket.id;
            console.log(data.message + " socketId= " + App.mySocketId );            
        },

        /**
         * A new game has been created and a random game ID has been generated.
         * @param data {{ gameId: int, mySocketId: * }}
         */
        onNewGameCreated : function(data) {
            App.Host.gameInit(data);
        },

        /**
         * A player has successfully joined the game.
         * @param data {{playerName: string, gameId: int, mySocketId: int}}
         */
        playerJoinedRoom : function(data) {
            console.log('playerJoinedRoom');
            // When a player joins a room, do the updateWaitingScreen funciton.
            // There are two versions of this function: one for the 'host' and
            // another for the 'player'.
            //
            // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
            // And on the player's browser, App.Player.updateWaitingScreen is called.
            App[App.myRole].updateWaitingScreen(data);
        },

        /**
         * Both players have joined the game.
         * @param data
         */
        beginNewGame : function(data) {
            App[App.myRole].gameCountdown(data);
        },   

        /**
         * A new set of words for the round is returned from the server.
         * @param data
         */
        onNewWordData : function(data) {
            // Update the current round
            App.currentRound = data.round;

            // Change the word for the Host and Player
            App[App.myRole].newWord(data);
        },   
        
        /**
         * A player answered. If this is the host, check the answer.
         * @param data
         */
        hostCheckAnswer : function(data) {
            if(App.myRole === 'Host') {
                App.Host.checkAnswer(data);
            }
        },

        /**
         * Let everyone know the game has ended.
         * @param data
         */
        gameOver : function(data) {
            App[App.myRole].endGame(data);
        },

        /**
         * An error has occurred.
         * @param data
         */
        error : function(data) {
            alert(data.message);
        }        
    };

    var App = {

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        countdownTimer:0,

        /**
         * This runs when the page initially loads.
         */
        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();

            // Initialize the fastclick library
            //FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function () {
            App.$doc = $(document);

            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateStartGame = $('#start-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
            App.$leaderGame = $('#leaderboard-template').html();
        },

        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
            //App.doTextFit('.title');
        },

        bindEvents: function () {
            // Host
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
            App.$doc.on('click', '#btnStartGame', App.Host.onStartClick);
            App.$doc.on('click', '#btnStartAnyway', App.Host.onStartAnywayClick);

            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '.btnAnswer',App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnAnswer',App.Player.onPlayerAnswerSubmitClick);
            //App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
            //App.$doc.on('click', '#leaderboard', App.onLeaderboardClick);
            //App.$doc.on('click', '#back', App.onBackClick);
        },

        /*  *******************************
            *         HOST CODE           *
            ******************************* */
        Host : {

            /**
             * Contains references to player data
             */
            players : [],

            /**
             * Flag to indicate if a new game is starting.
             * This is used after the first game ends, and players initiate a new game
             * without refreshing the browser windows.
             */
            isNewGame : false,

            /**
             * The number of players that are going to join the game.
             */
            numPlayersInTotal: 0,

            /**
             * The number of Questions that will be answered.
             */
            numQuestions: 0,

            /**
             * Keep track of the number of players that have joined the game.
             */
            numPlayersInRoom: 0,
           
            /**
             * Contains reference to type of game
             */
            gameType : '',

            /**
             * Contains reference to type of answers
             */
            answerType : '',

             /**
             * Keep track of the number of answers that have been given.
             */
            numAnswersGiven: 0,

            /**
             * A reference to the correct answer for the current round.
             */
            currentCorrectAnswer: '',

            /**
             * A reference to the current round.
             */
            activeRound: 1,

            /**
             * Contains references to the selected genres 
             */
            selectedGenres : [],

            /**
             * Handler for the "Create" button on the Title Screen.
             */
            onCreateClick: function () {
                console.log("Clicked Create A Game ");
                App.Host.displayNewGameScreen();
            }, 

            /**
             * Handler for the "Start" button on the Title Screen.
             */
            onStartClick: function () {
                App.Host.gameType = document.getElementById("gameTypes").selectedIndex
                App.Host.answerType = document.getElementById("answerTypes").selectedIndex
                App.Host.numPlayersInTotal = $('#nUsers').val();
                App.Host.numQuestions = $('#nQuestions').val();
                //console.log(getSelectedOptions(document.getElementById("selectedGenres")));
                App.Host.selectedGenres = getSelectedOptions(document.getElementById("selectedGenres"));
                console.log("Clicked Start A Game with " + App.Host.gameType + App.Host.numPlayersInTotal);
                App.Host.displayStartGameScreen();
                IO.socket.emit('hostCreateNewGame');
            }, 

            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: * }}
             */
            gameInit: function (data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;
                App.Host.numAnswersGiven = 0;
                App.Host.activeRound = 0;
                App.Host.displayStartGameScreen();
                console.log("Game Initialized with ID: " + App.gameId + ' by host: ' + App.mySocketId);
            },

            /**
             * Show the Host screen containing the Game Configuration Fields
             */
            displayNewGameScreen : function() {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateNewGame);
                setGenreOptions();
            }, 
            /**
             * Show the Host screen containing the the game URL and unique game ID
             */
            displayStartGameScreen : function() {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateStartGame);

                // Display the URL on screen
                $('#gameURL').text(window.location.href);
                //App.doTextFit('#gameURL');

                // Show the gameId / room id on screen
                $('#spanNewGameCode').text(App.gameId);                
            },
            /**
             * Update the Host screen when the first player joins
             * @param data{{playerName: string}}
             */
            updateWaitingScreen: function(data) {
                // If this is a restarted game, show the screen.
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }
                // Update host screen
                $('#playersWaiting')
                    .append('<p>Player ' + data.playerName + ' joined the game.<p/>');

                // Store the new player's data on the Host.
                App.Host.players.push(data);

                // Increment the number of players in the room
                App.Host.numPlayersInRoom += 1;

                // If two players have joined, start the game!
                if (App.Host.numPlayersInRoom == App.Host.numPlayersInTotal) {
                    console.log('Room is full. Almost ready!');

                    var data = {
                        gameId : App.gameId,
                        numberOfPlayers : App.Host.numPlayersInTotal,
                        gameType: App.Host.gameType,
                        answerType: App.Host.answerType,
                        numQuestions: App.Host.numQuestions,
                        selectedGenres:App.Host.selectedGenres
                    };
                    //var selGenres = ["Kids", "History"];
                    //console.log(data.selectedGenres);
                    //console.log(selGenres);
                    // Let the server know that the players are present.
                    //IO.socket.emit('hostRoomFull',App.gameId);
                    IO.socket.emit('hostRoomFull',data);
                };

                console.log(App.Host.numPlayersInRoom + '/' + App.Host.numPlayersInTotal + ' in Room!');

            },  

            /**
             * Handler for the "Start Anyway" button on the Title Screen.
             */
            onStartAnywayClick: function () {
                
                // Not everybody is going to join so total number of players is adjusted to already joined players
                App.Host.numPlayersInTotal = App.Host.numPlayersInRoom;

                var data = {
                    gameId : App.gameId,
                    numberOfPlayers : App.Host.numPlayersInTotal,
                    gameType: App.Host.gameType,
                    answerType: App.Host.answerType,
                    numQuestions: App.Host.numQuestions,
                    selectedGenres:App.Host.selectedGenres
                };
                IO.socket.emit('hostRoomFull',data);
            }, 
 
            /**
             * Show the countdown screen
             */
            gameCountdown : function() {
                console.log('gamecountdown started...');   
                // Prepare the game screen with new HTML
                App.$gameArea.html(App.$hostGame);
                //App.doTextFit('#hostWord');

                // Begin the on-screen countdown timer
                var $secondsLeft = $('#hostMedia');
                App.countDown( $secondsLeft, 5, function(){
                    IO.socket.emit('hostCountdownFinished', App.gameId);
                });
                
                $.each(App.Host.players, function(index,value){
                    $('#playerScores')
                        .append('<div id="player'+ index++ +'" class="row playerScore"><span class="score"><i id="answer-icon'+ value.mySocketId +'" class="glyphicon glyphicon-question-sign"></i></span><span id="'+ value.mySocketId +'" class="score">0</span><span class="playerName">'+ value.playerName +'</span></div>');
                });

                // Set the Score section on screen to 0 for each player.
                // $('#player1Score').find('.score').attr('id',App.Host.players[0].mySocketId);
                // $('#player2Score').find('.score').attr('id',App.Host.players[1].mySocketId);
            },    
            
            /**
             * Show the word for the current round on screen.
             * @param data{{round: *, word: *, subtext: *, answer: *,typeMedia: *, urlMedia: *, list: Array}}
             */
            newWord : function(data) {
                // Insert the new word into the DOM
                $('#hostWord').html("<h3>" + data.word + "</h3>");
                $('#hostSubText').text(data.subText);
                //App.doTextFit('#hostWord');
                //Insert the Image
                //console.log(data.typeMedia);
                if(data.typeMedia == 'pic') {
                    //$('body').css('backgroundImage','url('+data.urlMedia+')');
                    $('#hostMedia').html("<img id='image' class='object-fit_scale-down' src='"+data.urlMedia+"'>");
                }
                if(data.typeMedia == 'vid') {
                    $('#hostMedia').html("<div class='embed-container'><iframe id='youtubeplayer' onload='setTimeout(makeVisible, 4000);' src='"+data.urlMedia+"' frameborder='0' gesture='media' allow='autoplay;encrypted-media'></iframe></div>");
                }
                $('#image').height( $(window).height() - $("#hostWord").height()- 30 );
                console.log("update the data");
                // Update the data for the current round
                App.Host.currentCorrectAnswer = data.answer;
                App.Host.currentRound = data.round;
            },    

            /**
             * Check the answer clicked by a player.
             * @param data{{round: *, playerId: *, answer: *, gameId: *}}
             */
            checkAnswer : function(data) {
                // Verify that the answer clicked is from the current round.
                // This prevents a 'late entry' from a player whos screen has not
                // yet updated to the current round.
                console.log('NumAnswersGiven=' + App.Host.numAnswersGiven);
                console.log('currentRound=' + App.currentRound);

                if (data.round === App.currentRound){

                    // Get the player's score
                    var $pScore = $('#' + data.playerId);
                    var $pIcon = $('#answer-icon' + data.playerId);

                    //console.log($pScore);
                    // Advance player's score if it is correct
                    var answerGiven = data.answer.toLowerCase().replace(/\s+/g, '') ;
                    var answerCorrect = App.Host.currentCorrectAnswer.toLowerCase().replace(/\s+/g, '') ;
                    if( answerCorrect === answerGiven ) {

                        // Add 5 to the player's score
                        $pScore.text( +$pScore.text() + 1);
                        $pIcon.removeClass("glyphicon glyphicon-question-sign");
                        $pIcon.removeClass("glyphicon glyphicon-remove");   
                        $pIcon.addClass("glyphicon glyphicon-ok");  
                        
                        //Increment Answered Players
                        App.Host.numAnswersGiven +=1;

                    } else {
                        // A wrong answer was submitted, so decrement the player's score.
                        $pScore.text( +$pScore.text());
                        $pIcon.removeClass("glyphicon glyphicon-question-sign");
                        $pIcon.removeClass("glyphicon glyphicon-ok");
                        $pIcon.addClass("glyphicon glyphicon-remove");   
                        //Increment Answered Players
                        App.Host.numAnswersGiven +=1;
                    }

                    // Prepare data to send to the server
                    var newdata = {
                        gameId : App.gameId,
                        round : App.Host.activeRound,
                        gameOver: false
                    }
                    console.log('data.round=' + newdata.round);
                    var playerObject = App.Host.players.filter( obj => obj.mySocketId === data.playerId)[0];
                    playerObject.playerScore++;
                    //Check whether everybody answered so we can progress to the next round
                    if(App.Host.numPlayersInRoom == App.Host.numAnswersGiven){
                        $('#Answer').html('Het juiste antwoord was <b>' + App.Host.currentCorrectAnswer + '</b>');
                        console.log("Next Round !");
                        // Advance the round
                        App.Host.activeRound += 1;
                        newdata.round = App.Host.activeRound;
                        App.Host.numAnswersGiven = 0;

                        if(App.Host.numQuestions == App.Host.activeRound){
                            //IO.sockets.in(data.gameId).emit('gameOver',data);
                            //IO.socket.emit('hostGameOver',data);
                            newdata.gameOver = true;
                        }
                        //console.log(data);
                        score_on();
                        // Countdown 10 seconds for next question
                        var $secondsLeft = $('#countdownOverlay');
                        App.countDown( $secondsLeft, 5, function(){
                            IO.socket.emit('hostNextRound',newdata);
                            score_off();
                        });
                    }
                }
            },

            /**
             * All 10 rounds have played out. End the game.
             * @param data
             */
            endGame : function(data) {
                score_on();
                var scoreboard = [];
                var winnerName ='';
                var winnerScore = 0;
                var test = 0;
                
                $( ".playerScore" ).each(function( index ) {
                    console.log( index + ": " + $( this ).text() );
                    scoreboard.push($( this ).text(),$( this ).score);
                    // Find the winner based on the scores
                    if (Number($(this).score) > winnerScore){
                        winnerName = $( this ).text();
                        winnerScore = Number($(this).score);
                    }
                  });                  


                
                //Clear the Game screen
                $('#hostMedia').html("");
                $('#Answer').html('And the winner is <b>' + winnerName + '</b>');

                //App.doTextFit('#hostWord');
                data.winner=winnerName;
                if(data.done>0)
                {

                }
                else data.done=0;
                //console.log(data);
                //IO.socket.emit("clientEndGame",data);
                // Reset game data
                App.Host.numPlayersInRoom = 0;
                App.Host.isNewGame = true;
                //IO.socket.emit('hostNextRound',data);
                // Reset game data
            },

            /**
             * A player hit the 'Start Again' button after the end of a game.
             */
            restartGame : function() {
                App.$gameArea.html(App.$templateNewGame);
                $('#spanNewGameCode').text(App.gameId);
            }            
        },


        /* *****************************
           *        PLAYER CODE        *
           ***************************** */

        Player : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',

            /**
             * Click handler for the 'JOIN' button
             */
            onJoinClick: function () {
                console.log('Clicked "Join A Game"');
                // Display the Join Game HTML on the player's screen.
                App.$gameArea.html(App.$templateJoinGame);
            },

            /**
             * The player entered their name and gameId (hopefully)
             * and clicked Start.
             */
            onPlayerStartClick: function() {
                console.log('Player clicked "Start"');

                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName : $('#inputPlayerName').val() || 'anon'
                };

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);

                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
            },

            /**
             *  Click handler for the Player hitting a word in the word list.
             */
            onPlayerAnswerClick: function(fakeAnswer) {
                console.log('Clicked Answer Button');
                // Stop the timer and do the callback.
                clearInterval(App.countdownTimer);
                var $btn = $(this);      // the tapped button
                var answer = fakeAnswer === 'tooLate' ? '' : $btn.val(); // The tapped word

                // Replace the answers with a thank you message to prevent further answering
                $('#gameArea')
                    .html('<div class="gameOver">Thanks!</div>');

                // Set the helperfield to true so we know that the user already answered     
                $('#inputAnswered').val('true');

                // Send the player info and tapped word to the server so
                // the host can check the answer.
                var data = {
                    gameId: App.gameId,
                    playerId: App.mySocketId,
                    answer: answer,
                    round: App.currentRound
                };
                IO.socket.emit('playerAnswer',data);
            },

            /**
             *  Click handler for the Player hitting a word in the word list.
             */
            onPlayerAnswerSubmitClick: function() {
                console.log('Clicked Answer Button');
                // Stop the timer and do the callback.
                clearInterval(App.countdownTimer);
                //var $btn = $(this);      // the tapped button
                //var answer = $btn.val(); // The tapped word
                
                var answer = $('#inputAnswer').val();
                // Replace the answers with a thank you message to prevent further answering
                $('#gameArea')
                    .html('<div class="gameOver">Thanks!</div>');

                // Set the helperfield to true so we know that the user already answered     
                $('#inputAnswered').val('true');

                // Send the player info and tapped word to the server so
                // the host can check the answer.
                var data = {
                    gameId: App.gameId,
                    playerId: App.mySocketId,
                    answer: answer,
                    round: App.currentRound
                };

                IO.socket.emit('playerAnswer',data);
            },

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            onPlayerRestart : function() {
                var data = {
                    gameId : App.gameId,
                    playerName : App.Player.myName
                }
                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },

            /**
             * Display the waiting screen for player 1
             * @param data
             */
            updateWaitingScreen : function(data) {
                //if(IO.socket.socket.sessionid === data.mySocketId){
                if(IO.socket.id === data.mySocketId){
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
                }
            },

            /**
             * Display 'Get Ready' while the countdown timer ticks down.
             * @param hostData
             */
            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.mySocketId;
                $('#gameArea')
                    .html('<div class="gameOver">Get Ready!</div>');
            },

            /**
             * Show the list of words for the current round.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            newWord : function(data) {
                score_off();

                if (data.typeQuestion == 1){
                    $list=" <div class='info'><label for='inputAnswer'>Your Answer:</label><input id='inputAnswer' type='text' /></div><button id='btnAnswer' class='btnSendAnswer btn'>SEND</button>";
                }else{
                    console.log('Create an unordered list element');
                    // Create an unordered list element
                    var $list = $('<ul/>').attr('id','ulAnswers');
    
                    // Insert a list item for each word in the word list
                    // received from the server.
                    $.each(data.list, function(){
                        $list                                //  <ul> </ul>
                            .append( $('<li/>')              //  <ul> <li> </li> </ul>
                                .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                    .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                    .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                    .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>                                                      //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                                    .append( $('<div/>')
                                        .addClass('jtextfill')
                                        .append( $('<span/>')
                                            .html(this)
                                        )
                                    )
                                )    
                            )
                    });
                }

                // Insert the list onto the screen.
                $('#gameArea').html('<span id="countdownQuestion"></span><input id="inputAnswered" type="text" value="false" style="display:none" />');
                $('#gameArea').append($list);
                // Set focus on the input field.
                $('#inputAnswer').focus();

                var $secondsLeft = $('#countdownQuestion');
                App.countDown( $secondsLeft, 10, function(){
                    if($('#inputAnswered').val() == 'false'){
                        if (data.typeQuestion == 1 ){
                            App.Player.onPlayerAnswerSubmitClick();
                        }else{
                            App.Player.onPlayerAnswerClick('tooLate');
                        }
                    }
                });
            },

            /**
             * Show the "Game Over" screen.
             */
            endGame : function() {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                        // Create a button to start a new game.
                        $('<button>Start Again</button>')
                            .attr('id','btnPlayerRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            }
        }, 

        /* **************************
                  UTILITY CODE
           ************************** */

        /**
         * Display the countdown timer on the Host screen
         *
         * @param $el The container element for the countdown timer
         * @param startTime
         * @param callback The function to call when the timer ends.
         */
        countDown : function( $el, startTime, callback) {

            // Display the starting time on the screen.
            $el.text(startTime);
            //App.doTextFit('#hostWord');

            console.log('Starting Countdown...');

            // Start a 1 second timer
            App.countdownTimer = setInterval(countItDown,1000);

            // Decrement the displayed timer value on each 'tick'
            function countItDown(){
                console.log('countItDown ' + startTime);
                startTime -= 1
                $el.text(startTime);
                //App.doTextFit('#hostWord');

                if( startTime <= 0 ){
                    console.log('Countdown Finished.');

                    // Stop the timer and do the callback.
                    clearInterval(App.countdownTimer);
                    callback();
                    return;
                }
            }

        },

        /**
         * Make the text inside the given element as big as possible
         * See: https://github.com/STRML/textFit
         *
         * @param el The parent element of some text
         */
        doTextFit : function(el) {
            textFit(
                $(el)[0],
                {
                    alignHoriz:true,
                    alignVert:false,
                    widthOnly:true,
                    reProcess:true,
                    maxFontSize:300
                }
            );
        }        
        
    };

    App.init();
    IO.init();

}($));