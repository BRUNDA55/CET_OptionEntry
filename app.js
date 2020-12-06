const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");

const app = express();

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

// new show
// app.get("/optionEntry/:id", (req, res)=>{
//     const id = req.params.id;
//     const q1 = `select * from Student where ID = ${mysql.escape(id)}`;
//     connection.query(q1, (err, result1)=>{
//         if (err) 
//             throw err;
//         else 
//         {
//             if (result1.length == 0) {
//                 req.flash("error", "Invalid student ID");
//                 res.redirect("/");
//             }
//             else{
//                 const q2 = `select ID, name from University`;
//                 connection.query(q2, (err, result2)=>{
//                     if(err) throw err;
//                     else{
//                         const q3 = `select ID, name from Course`;
//                         connection.query(q3, (err, result3)=>{
//                             if(err) throw err;
//                             console.log(result2);
//                             console.log(result3);
//                             console.log(result1[0]);
//                             res.render('option', {student: result1[0], university: result2[0], course: result3[0]})
//                         })
//                     }
//                 })
//             }
//         }
//     })
// })

// show route 
app.get("/optionEntry/:id", (req, res) => {
    const id = req.params.id;
    const q = `select * from Student where ID = ${mysql.escape(id)}`;
    connection.query(q, (err, results) => {
        if (err) throw err;
        else {
            if (results.length == 0) {
                req.flash("error", "Invalid student ID");
                res.redirect("/");
            } else {
                const q2 =
                    "select univID, U.name as univName, courseID, C.name as courseName, numOfSeats from course C, university U, seatmatrix M where M.univID = U.ID and M.courseID = C.ID order by univID, courseID";
                connection.query(q2, (err, results2) => {
                    if (err) throw err;
                    else {
                        // console.log(results2);
                        const q3 = `select * from Preference where studID = ${mysql.escape(id)} order by Pnum`;
                        connection.query(q3, (err, results3) => {
                            if (err) throw err;
                            console.log(results3);
                            res.render("option", {
                                student: results[0],
                                seatmatrix: results2,
                                preference: results3,
                            });
                        });
                    }
                });
            }
        }
    });
});

// create route
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

// edit route
app.get('/edit/:id/:num', (req, res)=>{
    const {id, num} = req.params;
    const q = `select * from Preference where studID = ${mysql.escape(id)} and Pnum = ${mysql.escape(num)}`;
    connection.query(q, (err, result)=>{
        if(err) throw err;
        res.render('edit_form', {preference: result[0]});
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
        }
        res.redirect(`/optionEntry/${id}`);
    })
})

// delete route
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

const port = process.env.PORT || 3000;
app.listen(port);
console.log("app is listening on port " + port);
