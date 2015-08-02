//setup Dependencies
var express  = require('express'),
bodyParser   = require('body-parser'),
cookieParser = require('cookie-parser'),
csrf         = require('csurf'),
session      = require('express-session'),
state        = require('express-state'),
flash        = require('express-flash'),
cluster      = require('express-cluster'),
compression  = require('compression'),
hbs          = require('./lib/exphbs'),
routes       = require('./routes'),
middleware   = require('./middleware'),
config       = require('./config'),
utils        = require('./lib/utils'),
fs           = require('fs'),
port         = (process.env.PORT || 8000);


//Comment out the line below if you want to enable cluster support.
setupServer();

//Uncomment the line below if you want to enable cluster support.
//cluster(setupServer);


function setupServer (worker) {
    var app = express(),
        server = app.listen(port, function () {
            console.log("Bedrock App is now listening on port " + server.address().port);
        }),
        router;

    //Setup Express App
    state.extend(app);
    app.engine(hbs.extname, hbs.engine);
    app.set('view engine', hbs.extname);
    app.enable('view cache');

    //Uncomment this if you want strict routing (ie: /foo will not resolve to /foo/)
    //app.enable('strict routing');

    //Change "App" to whatever your application's name is, or leave it like this.
    app.set('state namespace', 'App');

    //Create an empty Data object and expose it to the client. This
    //will be available on the client under App.Data.
    //This is just an example, so feel free to remove this.
    app.expose({}, 'Data');

    if (app.get('env') === 'development') {
      app.use(middleware.logger('tiny'));
    }

    // Set default views directory. 
    app.set('views', config.dirs.views);

    router = express.Router({
        caseSensitive: app.get('case sensitive routing'),
        strict       : app.get('strict routing')
    });

    // Parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }))

    // Parse application/json
    app.use(bodyParser.json())

    // Parse cookies.
    app.use(cookieParser());

    // Session Handling
    app.use(session({secret: 'keyboard cat', resave: true, saveUninitialized: true}));


    // Flash Message Support
    app.use(flash());

    //GZip Support
    app.use(compression()); 

    // Specify the public directory.
    app.use(express.static(config.dirs.pub));

    // Uncomment this line if you are using Bower, and have a bower_components directory.
    // Before uncommenting this line, go into config/index.js and add config.dirs.bower there.
    //app.use(express.static(config.dirs.bower));

    app.use(csrf());
    app.use(function(req, res, next) {
        var token = req.csrfToken();
        res.cookie('XSRF-TOKEN', token);
        res.locals._csrf = token;
        next();
    });

    /*
        B18AA:   Persons: White (single race)
        B18AB:   Persons: Black or African American (single race)
        B18AC:   Persons: American Indian and Alaska Native (single race)
        B18AD:   Persons: Asian and Pacific Islander and Other Race (single race)
        B18AE:   Persons: Two or More Races
    */

    // Use the router.
    app.use(router);
    ///////////////////////////////////////////
    //              Routes                   //
    ///////////////////////////////////////////

    /////// ADD ALL YOUR ROUTES HERE  /////////

    // The exposeTemplates() method makes the Handlebars templates that are inside /shared/templates/
    // available to the client.
    router.get('/', [ middleware.exposeTemplates(), routes.render('home') ]);

    var _ = require('underscore');

    app.get('/query/state/:year/:race', function(req, res) {
        // res.setHeader('Content-Type', 'application/json');
        // console.log(req.params);
        var level = "state";
        var year = req.params.year;
        var filename = "/"+year+"_"+level+".json";
        var pathtoFile = config.dirs.csv + filename;
        var json = require(pathtoFile);
        console.log(json.length);
        var obj = {}
        for(x = 0; x < json.length; x++)
        {
            var totalPop = 0;
            var A =  parseInt(json[x]["B18AA"+year])
            if(!isNaN(A)) 
                totalPop+= A;
            var B =  parseInt(json[x]["B18AB"+year])
            if(!isNaN(B)) 
                totalPop+= B;
            var C =  parseInt(json[x]["B18AC"+year]) 
            if(!isNaN(C)) 
                totalPop+= C;
            var D =  parseInt(json[x]["B18AD"+year]) 
            if(!isNaN(D)) 
                totalPop+= D;
            var E =  parseInt(json[x]["B18AE"+year])
            if(!isNaN(E)) 
                totalPop+= E; 
            var race = req.params.race;
            var target = parseInt(json[x][race+year])
            if(isNaN(target))
                var density = 0;
            else
                var density = target*1.0/totalPop * 100;
            obj[json[x]["STATE"]] = Math.round(density,2)
        }
        res.send(JSON.stringify(obj));
    });

     app.get('/query/county/:state/:year/:race', function(req, res) {
        // res.setHeader('Content-Type', 'application/json');
        // console.log(req.params);
        var level = "county";
        var year = req.params.year;
        var state = req.params.state;
        var filename = "/"+year+"_"+level+".json";
        var pathtoFile = config.dirs.csv + filename;
        var json = require(pathtoFile);
        var data = _.filter(json, function(point){ 
                  return point["STATE"] == state; 
             });
        var obj = {}
        for(x = 0; x < data.length; x++)
        {
            var totalPop = 0;
            var A =  parseInt(data[x]["B18AA"+year]);
            if(!isNaN(A)) 
                totalPop+= A;
            var B =  parseInt(data[x]["B18AB"+year])
            if(!isNaN(B)) 
                totalPop+= B;
            var C =  parseInt(data[x]["B18AC"+year]) 
            if(!isNaN(C)) 
                totalPop+= C;
            var D =  parseInt(data[x]["B18AD"+year]) 
            if(!isNaN(D)) 
                totalPop+= D;
            var E =  parseInt(data[x]["B18AE"+year])
            if(!isNaN(E)) 
                totalPop+= E; 
            var race = req.params.race;
            var target = parseInt(data[x][race+year])
            if(isNaN(target))
                var density = 0;
            else
                var density = target*1.0/totalPop * 100;
            obj[data[x]["COUNTY"]] = Math.round(density,2)
        }
        res.send(JSON.stringify(obj));
    });

    app.get('/query/state/:state/:year/:race', function(req, res) {
        // res.setHeader('Content-Type', 'application/json');
        console.log(req.params);
        var level = "state";
        var year = req.params.year;
        var state = req.params.state;
        var filename = "/"+year+"_"+level+".json";
        var pathtoFile = config.dirs.csv + filename;
        var json = require(pathtoFile);
        var data = _.filter(json, function(point){ 
                  return point["STATE"] == state; 
             });
        var totalPop = 0;
        var A =  parseInt(data[0]["B18AA"+year])
        if(!isNaN(A)) 
            totalPop+= A;
        var B =  parseInt(data[0]["B18AB"+year])
        if(!isNaN(B)) 
            totalPop+= B;
        var C =  parseInt(data[0]["B18AC"+year]) 
        if(!isNaN(C)) 
            totalPop+= C;
        var D =  parseInt(data[0]["B18AD"+year]) 
        if(!isNaN(D)) 
            totalPop+= D;
        var E =  parseInt(data[0]["B18AE"+year])
        if(!isNaN(E)) 
            totalPop+= E; 
        var race = req.params.race;
        console.log(totalPop);
        var target = parseInt(data[0][race+year])
        if(isNaN(target))
            var density = 0;
        else
            var density = parseInt(data[0][race+year])*1.0/totalPop * 100;
        var obj = {}
        obj[state] = Math.round(density,2);  
        res.send(JSON.stringify(obj));
    });

    app.get('/query/state/:state/:year/', function(req, res) {
        // res.setHeader('Content-Type', 'application/json');
        console.log(req.params);
        var level = "state";
        var year = req.params.year;
        var state = req.params.state;
        var filename = "/"+year+"_"+level+".json";
        var pathtoFile = config.dirs.csv + filename;
        var json = require(pathtoFile);
        var data = _.filter(json, function(point){ 
                  return point["STATE"] == state; 
             });
        res.send(JSON.stringify(data[0]));
    });

    app.get('/query/:level/:year', function(req, res) {
        // res.setHeader('Content-Type', 'application/json');
        console.log(req.params)
        var level = req.params.level;
        var year = req.params.year;
        var filename = "/"+year+"_"+level+".json";
        var pathtoFile = config.dirs.csv + filename;
        res.sendFile(pathtoFile);
        // fs.createReadStream(pathtoFile)
        //     .pipe(csv())
        //     .on('data', function(data) {
        //         res.send(JSON.stringify(data));
        //     })
        //convert to json
        //display
    });

    app.get('/test', function(req, res) {
        res.render('test')
    })
    // Error handling middleware
    app.use(function(req, res, next){
        res.render('404', { status: 404, url: req.url });
    });

    app.use(function(err, req, res, next){
        res.render('500', {
            status: err.status || 500,
            error: err
        });
    });

    return server;
}

