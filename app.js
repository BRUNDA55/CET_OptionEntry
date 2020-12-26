const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");

const app = express();
// just checking
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "SeatAllocation",
    port: "3306",
});

connection.connect((err) => {
    if (err) throw err;
    else console.log("connected");
});

app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// ----------- ROUTES -------------

app.post("/optionEntry", function (req, res) {
    let id = req.body.studId;
    res.redirect(`/optionEntry/${id}`); 
});

app.get("/", function (req, res) {
    res.render("login");
});

app.get('/showSeatMatrix', (req, res)=>{
    const q = `select univID, U.name as univName, courseID, C.name as courseName, numOfSeats, fees from course C, university U, seatmatrix M where M.univID = U.ID and M.courseID = C.ID order by univID, courseID`;
    connection.query(q, (err, result)=>{
        if(err) throw err;
        res.render('seatmatrix',{seatmatrix: result});
    })
})

// new show
app.get("/optionEntry/:id", (req, res)=>{
    const id = req.params.id;
    const q1 = `select * from Student where ID = ${mysql.escape(id)}`;
    connection.query(q1, (err, result1)=>{
        if (err) 
            throw err;
        else 
        {
            if (result1.length == 0) {
                req.flash("error", "Invalid student ID");
                res.redirect("/");
            }
            else{
                const q2 = `select * from University`;
                connection.query(q2, (err, result2)=>{
                    if(err) throw err;
                    else{
                        const q3 = `select * from Course`;
                        connection.query(q3, (err, result3)=>{
                            if(err) throw err;
                            else{
                                const q4 = `select * from Preference where studID = ${mysql.escape(id)} order by Pnum`;
                                connection.query(q4, (err, result4)=>{
                                    if(err) throw err;
                                    res.render('option', {student: result1[0], university: result2, course: result3, preference: result4})
                                })
                            }
                        })
                    }
                })
            }
        }
    })
})

// insert/create preference route
app.post("/insertNew/:id", (req, res) => {
    const id = req.params.id;
    const pref = {
        studID: id,
        Pnum: req.body.number,
        univID: req.body.univ,
        courseID: req.body.course,
    };
    const q = "INSERT INTO Preference set ?";
    connection.query(q, pref, (err, results) => {
        if (err) {
            console.log(err.sqlMessage);
            req.flash("error", err.sqlMessage);
        }
        res.redirect(`/optionEntry/${id}`);
    });
});


// edit preference route
app.get('/edit/:id/:num', (req, res)=>{
    const {id, num} = req.params;
    const q = `select * from Preference where studID = ${mysql.escape(id)} and Pnum = ${mysql.escape(num)}`;
    connection.query(q, (err, result)=>{
        if(err) throw err;
        else{
            const q1 = `select * from University`;
            connection.query(q1, (err, result1)=>{
                if(err) throw err;
                else{
                    const q2 = `select * from Course`;
                    connection.query(q2, (err, result2)=>{
                        if(err) throw err;
                        res.render('edit_form', {preference: result[0], university: result1, course: result2});
                    })
                }
            })
        }
    })
})
app.post('/edit/:id/:num', (req, res)=>{
    const {id, num} = req.params;
    const univ = req.body.univ;
    const course =  req.body.course;
    const q = `update Preference set courseID = ${mysql.escape(course)}, univID = ${mysql.escape(univ)} where studID = ${mysql.escape(id)} and Pnum = ${mysql.escape(num)}`;
    connection.query(q, (err, result)=>{
        if(err) {
            console.log(err.sqlMessage);
            req.flash("error", err.sqlMessage);
            res.redirect(`/edit/${id}/${num}`);
        }
        else
            res.redirect(`/optionEntry/${id}`);
    })
})

// delete preference route
app.get('/delete/:id/:num', (req, res)=>{
    const {id, num} = req.params;
    const q = `delete from Preference where studID = ${mysql.escape(id)} and Pnum = ${mysql.escape(num)}`;
    connection.query(q, (err, result)=>{
        if(err){
            console.log(err.sqlMessage);
            req.flash("error", err.sqlMessage);
        }
        req.flash("error", "option deleted!!!");
        res.redirect(`/optionEntry/${id}`);
    })
})

//ADMIN ROUTES

app.post('/admin', (req, res)=>{
    let id = req.body.adminId;
    res.redirect(`/showAdmin/${id}`);
})

app.get('/showAdmin/:id', (req, res)=>{
    const q1 = `select * from Offers, University where univID = ID and univID in (select ID from University where adminID = ${mysql.escape(req.params.id)})`
    connection.query(q1, (err, result1)=>{
        if(err) throw err;
        else{
            if(result1.length == 0){
                console.log(result1[0]);
                req.flash("error", "Invalid admin ID");
                res.redirect("/");
            }
            else{
               console.log(result1);
               res.render('showAdmin', {univ: result1});
            }
        }
    })
})

app.post('/editCredits/:univID/:adminID/:courseID', (req, res)=>{
    const {univID, adminID, courseID} = req.params;
    const credits = req.body.credits;
    const q = `update offers set totalCredits = ${mysql.escape(credits)} where univID = ${mysql.escape(univID)} and courseID = ${mysql.escape(courseID)}`;
    connection.query(q, (err, result)=>{
        if(err) throw err;
        else{
            req.flash("success", 'successfull updated');
            res.redirect(`/showAdmin/${adminID}`);
        }
    })
})

app.post('/addCourse/:adminID/:univID', (req, res)=>{
    const univID = req.params.univID;
    const courseID =  req.body.courseID;
    const credits = req.body.credits;
    const numOfSeats = req.body.numOfSeats;
    const course = {
        univID: req.params.univID,
        courseID: req.body.courseID,
        totalCredits: req.body.credits
    };
    const seat = {
        univID: req.params.univID,
        courseID: req.body.courseID,
        numOfSeats: req.body.numOfSeats
    }
    const q1 = 'insert into Offers set ?';
    const q2 = 'insert into SeatMatrix set ?';
    connection.query(q1, course, (err, result1)=>{
        if(err){
            console.log(err.sqlMessage);
            req.flash("error", err.sqlMessage);
        }
        else{
            connection.query(q2, seat, (err, result2)=>{
                if(err)
                {
                    console.log(err.sqlMessage);
                    req.flash("error", err.sqlMessage);
                }
                req.flash("success", 'successfully added course');
                res.redirect(`/showAdmin/${req.params.adminID}`);
            })            
        }
    })
})

const port = process.env.PORT || 3000;
app.listen(port);
console.log("app is listening on port " + port);
