const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "SeatAllocation",
    port: "3306",
});


app.post('/optionEntry', function(req, res){
    let id = req.body.studId;
    res.redirect('/optionEntry/'+id);
})

app.get('/', function(req, res){
    res.render('login')
});


app.get('/optionEntry/:id', function(req, res){
    const id = req.params.id;
    const q = "select * from Student where ID = " + mysql.escape(id) ;
    connection.query(q, function(err, results){
        if(err) throw err;
        else{
            if(results.length == 0)
                res.render('error');
            else
            {
                const q2 = 'select univID, U.name as univName, courseID, C.name as courseName, numOfSeats from course C, university U, seatmatrix M where univID = U.ID and courseID = C.ID';
                connection.query(q2, function(err, results2){
                    if(err) throw err;
                    else{
                        // console.log(results2);
                        const q3 = 'select * from Preference where studID = ' + mysql.escape(id);
                        connection.query(q3, function(err, results3){
                            if(err) throw err;
                            console.log(results3);
                            res.render('option', {student: results[0], seatmatrix: results2, preference: results3})
                        })
                        
                    }   
                })
                // console.log(results[0]);
            }
                
        }
    });
})

app.post('/insertNew/:id', function(req, res){
    const id = req.params.id;
    const pref = {
        studID: id,
        Pnum: req.body.number,
        univID: req.body.univ,
        courseID: req.body.course
    };
    const q = 'INSERT INTO Preference set ?';
    connection.query(q, pref, function(err, results){
        if(err)throw err;
        console.log(results);
    })
    res.redirect('/optionEntry/'+id);
})

connection.connect(function (err) {
    if (err) throw err;
    else console.log("connected");
});

const port = process.env.PORT || 3000;
app.listen(port);
console.log("app is listening on port " + port);