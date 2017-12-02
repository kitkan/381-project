var express = require('express');
var app = express();
var mongo = require('mongodb');
var ejs = require('ejs');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var port = process.env.PORT || 30000;
var session = require('express-session');
var path = require('path');
var db;
var User = new Array();

app.use(bodyParser.urlencoded({ extended: true}));
app.set('view engine', 'ejs'); 
app.engine('ejs', require('ejs').renderFile);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('ejs'));
app.set('views', path.join(__dirname, 'ejs'));
app.use(session({
  secret: 'keyboard cat',
  keys: ['asdasdw','qihiwih'],
    proxy: true,
    resave: true,
    saveUninitialized: true,
  	duration:1000000,
    activeDuration:1000000,
}))



MongoClient.connect('mongodb://kitkan:kitkan@ds123926.mlab.com:23926/restaurant', (err, database) => {
  if (err) 
	  return console.log(err)
   db = database;
app.listen(port, function () {
   console.log('port: ' + port);
 });
});

  


 app.get('/register', function(req, res) {
        res.render('register.ejs', {
          message:""
        });
    });

 app.post('/register', function(req, res) {
       var user={};
	   user.userid='';
	   user.password='';
	   var upUser=true;
		user.userid=req.body.userid;
		user.password=req.body.password;
			for(var i =0 ;i<User.length;i++){
				if(user.userid==User[i].userid){
					upUser=false;
					console.log('coming');
						res.render('registerErr.ejs',{message:"userid has already taken"});
				}
			}
			if(upUser){
		User.push(user);
		console.log(User);
		res.redirect('/');
			}
	});

	
  app.get('/', function(req, res) {
        res.render('login.ejs', {
		});
    });

  app.post('/login',function(req,res,next) {

		
		if(req.body.userid=="demo"){
			req.session.authenticated = true;
			req.session.userid = req.body.userid;
			res.redirect('/main');
			return next()
		}
		if (req.body.password=="demo") {
			req.session.authenticated = true;
			res.redirect('/main');
			return next()
		}
		for (var i=0; i<User.length; i++) {
		if (User[i].userid == req.body.userid && User[i].password == req.body.password) {
			req.session.userid = User[i].userid;
	     	req.session.authenticated = true;
			res.redirect('/main');
			return next()
		}
		}
		res.redirect('/');
		

		

  }); 	
   app.get('/search',loginMiddleware,function(req,res){
		res.render('search.ejs');
   });
   
   	app.get('/rate', loginMiddleware,function(req, res) {
        res.render('rate.ejs', {
			restaurant_id:req.query._id});
    });
	 	
	app.get('/rating/:id', function(req, res) {
	
		db.collection('restaurant').findOne({_id:ObjectId(req.params.id)},function(err,restaurant){
		var grades={};
		var updateRate=true;
		grades.userid = req.session.userid;
		grades.score = req.query.score;	
		console.log("1:"+grades.userid);
				console.log("2:"+grades.score);
		console.log(restaurant);
		
		if(restaurant.grades.length!=0){
		for (var i=0 ; i<=restaurant.grades.length-1;i++){
		       if (req.session.userid == restaurant.grades[i].userid){
				   updateRate=false;
				   res.render('info.ejs',{message:"u have rated"});
				}
			}
		}
				
				if(updateRate){
					db.collection('restaurant').update({_id:ObjectId(req.params.id)},{$push:{'grades':grades}},(err, result) => {
						if (err) 	
								console.log("err:"+err);
						else
							res.render('info.ejs',{message:"rated successfully"});
		  });
				}
		
		
}); 
	});
		 

	  
  app.get('/filter',loginMiddleware,function(req,res){
		 var criteria={};		
		 criteria[req.query.sKey]=req.query.sPair;
		 var temp=[];
		 var cursor=db.collection('restaurant').find(criteria);
		 cursor.each(function(err,restaurant){  
		  if(restaurant!=null){
		    temp.push(restaurant);
		   }else{
		     res.render('mainpage.ejs', 
			 {restaurant:temp,criteria:criteria});
		   }
		});
	});
  
  app.get('/main' ,loginMiddleware,function(req, res ,next) {
	  console.log(req.session.userid);
	    var criteria={};
		for (key in req.query) {
                		criteria[key] = req.query[key];				
        }
	
		var cursor=db.collection('restaurant').find(criteria);
			var temp=[];
		cursor.each(function(err,restaurant){  
		  if(restaurant!=null){
		    temp.push(restaurant);
		   }else{
		     res.render('mainpage.ejs', {restaurant:temp,criteria:criteria});
		   }
		});
	});
  
   app.get('/create',loginMiddleware,function(req, res) {
        res.render('create.ejs', {});
		});
	

   app.post('/create',function(req, res) { 

	var restaurant=[];
	restaurant=req.body;
	restaurant.grades=[];
	restaurant.owner= req.session.userid;
	 db.collection('restaurant').insert(restaurant,(err, getRestaurant)=>{
		if (err){
			console.log("err:"+err);
		}else{
		res.redirect('/main');
		}
     });
});

   app.post('/modify', function(req, res) {
		
		var criteria={};
        criteria = req.body;				

        db.collection('restaurant').updateOne({_id:ObjectId(req.query._id)},{$set :criteria},(err, updatedRestaurant) => {
		if (err)
		console.log("err:"+err);
		else{
		db.collection('restaurant').find({_id:ObjectId(req.query._id)},(err, restaurant) => {
		if (err) 
		console.log("err:"+err);			
		else{
		criteria._id= ObjectId(req.query._id);
        res.redirect('/main');
		}
		});
		}		
		
		
		
  });
		
    });

 app.get('/modify',loginMiddleware,function(req,res){
		db.collection('restaurant').findOne({_id:ObjectId(req.query._id)},function(err,restaurant){
		if(restaurant.owner!=req.session.userid){
			res.render('info.ejs',{message: "you are not owner"});
		}else{	
			var temp;
			var cursor=db.collection('restaurant').find({_id: ObjectId(req.query._id)});
			cursor.each(function(err,getRestaurant){  
			  if(getRestaurant!=null){
				console.log(getRestaurant);
				temp=getRestaurant;
			   }else{
				 res.render('modify.ejs', 
				 {restaurant:temp});
			   }
		});
		}
		});
   });
   
	 app.get('/restaurant',loginMiddleware,function(req, res) {
			 db.collection('restaurant').findOne({_id:ObjectId(req.query._id)},function(err,restaurant){
				res.render('show.ejs', {restaurant :restaurant});
			});
       });
	

		
	app.get('/remove',loginMiddleware, function(req, res) {  
	var id = req.query._id;
		var criteria = {};
			for (key in req.query) {
				criteria[key] = req.query[key];
			}
	db.collection('restaurant').findOne({_id:ObjectId(id)},function(err,findOwner){		 
	if(req.session.userid != findOwner.owner){
		res.render('info.ejs',
		{message:"You are not owner!"});
	
	}else{
	
	db.collection('restaurant').remove({_id:ObjectId(id)},(err, restaurant) => {
		if (err) 	
			console.log(err);
		else{
		 res.render('info.ejs', {message:"Delete was successful"});
	 } 
	 });
	}
  });
  });
  
   app.get("/map",loginMiddleware,function (req,res)
    {
        res.render("gmap.ejs", {title:req.query.title, lat:req.query.lat, lon:req.query.lon});
    });	
	

	app.get('/api/restaurant/read/:sKey/:sPair', function(req, res) {  
	  var criteria={};
		 criteria[req.params.sKey]=req.params.sPair;
		 
		var temp=[];
		 var cursor=db.collection('restaurant').find(criteria);
		 cursor.each(function(err,restaurant){  
		  if(restaurant!=null){
		    temp.push(restaurant);
		   }else{
			   res.json(temp);
		   }
		});	
  });	
  
    app.post('/api/restaurant/create', function(req, res) { 
	  var criteria={};
	  for (sKey in req.query){
		  criteria[sKey]=req.query[sKey];  
	  }
	
	    db.collection('restaurant').insert(criteria,(err, restaurant) => {
			
		if (err) {
                response = { "status": false };              
               
                   
            } else {
                response = {"status": true };
  }

		 res.json(response);
		});
  });	  

function loginMiddleware(req, res, next) {

    if (req.session.authenticated)
        return next();
	else
        res.render('login.ejs');
}
