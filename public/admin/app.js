(function () {

    // Enter Global Config Values & Instantiate ADAL AuthenticationContext
    window.config = {
        //apiUrl: 'https://kwispel.herokuapp.com'
        //apiUrl: 'https://qwizz-api.herokuapp.com'
        apiUrl: 'http://localhost'
        //apiUrl: process.env.API_URL
    };

    // Get UI jQuery Objects
    var $panel = $(".panel-body");

    // Handle Navigation Directly to View
    window.onhashchange = function () {
        loadView(stripHash(window.location.hash));
    };
    window.onload = function () {
        $(window).trigger("hashchange");
    };

    // Route View Requests To Appropriate Controller
    function loadCtrl(view) {
        switch (view.toLowerCase()) {
            case 'home':
                return homeCtrl;
            case 'enrollmentlist':
                return enrollmentListCtrl;
            case 'userdata':
                return userDataCtrl;
            case 'webcomponents':
                return webcomponentsCtrl;
            case 'contenteditor':
                return contentEditorCtrl;				
        }
    }

    // Show a View
    function loadView(view) {

        $errorMessage.empty();
        var ctrl = loadCtrl(view);

        if (!ctrl)
            return;

        // Load View HTML
        $.ajax({
            type: "GET",
            url: "admin/views/" + view + '.html',
            dataType: "html"
        }).done(function (html) {

            // Show HTML Skeleton (Without Data)
            var $html = $(html);
            $html.find(".data-container").empty();
            $panel.html($html.html());
            ctrl.postProcess(html);

        }).fail(function () {
            $errorMessage.html('Error loading page.');
        }).always(function () {

        });
    }

    function stripHash(view) {
        return view.substr(view.indexOf('#') + 1);
    }

}());

        

