import express, { response } from "express";
import bodyParser from "body-parser";
import axios from "axios";
import emailjs from "@emailjs/browser";
import pg from "pg";

const app = express();
const port = 3000;

emailjs.init("zQWass4PuP4hjr-zQ");

const db = new pg.Client({
    user : "postgres",
    host : "localhost",
    database : "CarPool",
    password : "123456",
    port : 5432,
});
  
db.connect();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

var currentUser;
var rides;
var data;
var rollNo;
var name;

app.get("/",async(req,res)=>{
    res.render("home.ejs");
    // res.render("startRide.ejs",{location : "Shiridi"});
});

app.get("/logout",async(req,res)=>{
    currentUser = null;
    res.redirect("/");
})

app.get("/signUp",async(req,res)=>{
    res.render("signUp.ejs");
});

app.post("/signupdetails",async(req,res)=>{
    db.query("insert into profile(rollno, name, gender, carname, course, studyyear, phone, pass) values($1,$2,$3,$4,$5,$6,$7,$8)",
        [req.body.rollNo, req.body.name, req.body.gender, req.body.carName, req.body.course, req.body.year, req.body.phoneNumber, req.body.password]);
    // console.log(req.body.rollNo);
    // console.log(typeof(req.body.rollNo));

    data = await db.query("Select * from profile where rollno = $1",[req.body.rollNo]);
    console.log(data.rows);
    currentUser = data.rows[0];

    rollNo = req.body.rollNo;
    name = req.body.name;
    res.redirect("/home");
});

app.get("/login",async(req,res)=>{
    res.render("login.ejs");
});

app.post("/logindetails",async(req,res)=>{
    rollNo = req.body.rollNo;
    data = await db.query("Select * from profile where rollNo = $1",[rollNo]);
    currentUser = data.rows[0];
    // console.log(pass.rows[0]);
    if(req.body.password == currentUser.pass)
    {
        // console.log(currentUser);
        res.render("home.ejs",{user : currentUser});
        name = currentUser.name;
        // res.render("home.ejs",{name : homeName})
    }
    else
    {
        res.render("login.ejs");
    }
})

const user = {
    rollNo: "infifnity",
    name: "HIM",
    gender: "Not Known",
    carName: "Honda Civic",
    course: "all",
    year: 1000,
    phoneNumber: "123-456-7890"
};

// const rides = [
//     {
//         id: 1,
//         driverName: "John Doe",
//         destination: "City Center",
//         startTime: "2024-09-25T15:00:00"
//     },
//     {
//         id: 2,
//         driverName: "Jane Smith",
//         destination: "Town Square",
//         startTime: "2024-09-25T18:00:00"
//     }
// ];

const ride = {
    id: 'ride123',
    driver: {
        rollNo: '12345',
        name: 'John Doe'
    },
    destination: 'New York',
    startTime: '2024-09-18 10:00 AM',
    estimatedTravelTime: '4 hours',
    carName: 'Toyota Prius',
    seatsAvailable: 3,
    seatPositions: ['Front Left', 'Rear Left', 'Rear Right'],
    costPerSeat: 20
};

app.get("/home",async(req,res)=>{
    res.render("home.ejs", {user : currentUser});
});

app.get("/profile",async(req,res)=>{
    res.render("profile.ejs", {user : currentUser});
});

app.get("/editProfile",async(req,res)=>{
    res.render("editProfile.ejs", {user : currentUser});
});

app.post("/updateProfile",async(req,res)=>{
    await db.query("Update profile set rollno = $1, name = $2, gender = $3, carname = $4, course = $5, studyyear = $6, phone = $7 where id = $8",
        [
            req.body.rollNo,
            req.body.name,
            req.body.gender,
            req.body.carName,
            req.body.course,
            req.body.year,
            req.body.phoneNumber,
            req.body.id
        ]
    )
    data = await db.query("Select * from profile where id = $1",[req.body.id]);
    currentUser = data.rows[0];
    res.redirect("/profile");
});

app.get("/createRide",async(req,res)=>{
    res.render("createRide.ejs");
});

app.post("/submitRide",async(req,res)=>{
    await db.query("insert into ridelist(destination,starttime,duration,carname,seatnum,pos,seatcost,rollno,name) values($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [req.body.destination,req.body.startTime,req.body.estimatedTime,req.body.carName,req.body.seatsAvailable,req.body.seatPositions,req.body.seatCost,rollNo,currentUser.name]);
    res.render("rideSubmit.ejs");
});


var cRides;
var bRides;
var allRides;

// app.get("/viewStatus",async(req,res)=>{
//     data  = await db.query("Select * from ride where rollc = $1",[currentUser.rollno]);
//     cRides = data.rows;
//     console.log(cRides);
//     data = await db.query("Select * from ride where rollr = $1",[currentUser.rollno]);
//     bRides = data.rows;

//     data = await db.query("Select * from ridelist where rideid in (1,15)");
//     var check = data.rows;
//     console.log(check);

//     res.render("rideStatus.ejs",{createdRides : cRides,bookedRides : bRides});
// });

app.get("/viewStatus",async(req,res)=>{
    data = await db.query("Select * from ridelist where rollno = $1",[currentUser.rollno]);
    allRides = data.rows;

    data  = await db.query("Select * from ride where rollc = $1",[currentUser.rollno]);
    cRides = data.rows;
    // console.log(cRides);
    data = await db.query("Select * from ride where rollr = $1",[currentUser.rollno]);
    bRides = data.rows;

    res.render("rideStatus.ejs",{ride : allRides, ridelist : cRides, bookedRides : bRides});
});


app.post("/updateRideRequest",async(req,res)=>{
    var rideId = parseInt(req.body.rideId);
    var rollNo = req.body.rider;
    var action = req.body.action;
    var bit;
    var actionText;

    // console.log(rideId,typeof(rideId),rollNo,result);

    if (isNaN(rideId)) {
        // Return an error response if rideId is not a valid number
        return res.status(400).send("Invalid ride ID");
    }

    if (action === "accept") {
        bit = 1;
        actionText = "accepted";
      } else if (action === "reject") {
        bit = -1;
        actionText = "rejected";
      } else {
        return res.status(400).send("Invalid action");
      }

    db.query("Update ride set confirmed = $1 where thisrideid = $2",[bit,rideId]);


    const requesterEmail = rollNo + "@psgtech.ac.in";

    if (requesterEmail) {
    // Prepare parameters for the email
      const templateParams = {
      ride_id: rideId,
      action: actionText,
      reply_to: requesterEmail, // Set the reply_to field
    };

    // Send notification email to the requester
    emailjs
      .send("service_h8fhoqu", "template_por7uyp", templateParams)
      .then((response) => {
        console.log(
          "Email sent to requester successfully!",
          response.status,
          response.text
        );
      })
      .catch((err) => {
        console.log("Failed to send email to requester...", err);
      });
  }



    if(bit == 1)
        res.render("thankyou.ejs");
    else if(bit==-1)
        res.render("better.ejs");
});

var request;
var result1;

app.get("/notify",async(req,res)=>{
    data = await db.query("Select * from ride where rollc = $1 and confirmed = 0",[currentUser.rollno]);
    request = data.rows;

    data = await db.query("select * from ride where rollr = $1 and confirmed not in (0)",[currentUser.rollno]);
    result1 = data.rows;

    res.render("notification.ejs",{newRequests : request, requestStatus : result1});
});

app.get("/searchRide",async(req,res)=>{

    data = await db.query("Select * from ridelist where seatnum > 0 and rollno not in ($1)",[currentUser.rollno]);
    rides = data.rows;

    res.render("searchRide.ejs", {rides : rides});
});

var thisRide;

app.get("/rideInfo/:rideId",async(req,res)=>{
    var rideId = req.params.rideId;
    var rideIdInt = Number(rideId);
    // console.log(typeof(rideIdInt));

    if (isNaN(rideIdInt)) {
        // Return an error response if rideId is not a valid number
        return res.status(400).send("Invalid ride ID");
    }
    data = await db.query("Select * from ridelist where rideid = $1",[rideIdInt]);
    thisRide = data.rows[0];
    // console.log(ride);

    res.render("rideInfo.ejs", {ride : thisRide});
});

app.get("/bookRide",async(req,res)=>{
    var rideId = parseInt(req.query.rideId);
    var seatNum = parseInt(req.query.seatNum);
    // console.log(seatNum);

    if (isNaN(seatNum)) {
        return res.status(400).send("Invalid seat number");
    }
    if (isNaN(rideId)) {
        // Return an error response if rideId is not a valid number
        return res.status(400).send("Invalid ride ID");
    }

    seatNum--;
    // console.log(rideId);
    await db.query("Update ridelist set status = $1,seatnum = $2 where rideid = $3",[1,seatNum,rideId]);
    data = await db.query("Select * from ridelist where rideid = $1",[rideId]);
    thisRide = data.rows[0];

    // console.log(thisRide);
    // console.log(currentUser);
    // console.log(rideId);
    // console.log(typeof(rideId));

    await db.query("insert into ride(rideid, rollc, namec, rollr, namer, seatnum, seatpos, destination, starttime, carname, sents, decides, recvs, confirmed) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
        [thisRide.rideid, thisRide.rollno, thisRide.name,currentUser.rollno,currentUser.name,1,thisRide.pos,thisRide.destination,thisRide.starttime,thisRide.carname,1,0,0,0]
    );

    var creatorEmail = thisRide.rollNo + "@psgtech.ac.in";

  if (creatorEmail) {
    // Send email notification
    const templateParams = {
      user_name: currentUser.name,
      ride_id: rideId,
      reply_to: creatorEmail,
    };

    emailjs
      .send("service_h8fhoqu", "template_j9snk3p", templateParams)
      .then((response) => {
        console.log("Email sent successfully!", response.status, response.text);
      })
      .catch((err) => {
        console.log("Failed to send email...", err);
      });
  }

    res.render("booked.ejs");
});

app.get("/viewProfile",async(req,res)=>{
    var tempRollNo = req.query.rollno;
    // console.log(tempRollNo);

    data = await db.query("Select * from profile where rollno = $1",[tempRollNo]);
    var tempUser = data.rows[0];
    // console.log(tempUser);
    res.render("otherProfile.ejs",{user : tempUser});
});

// app.get("/currentRides",async(req,res)=>{
//     var currentTime = new Date();
//     data = await db.query("Select * from ride ")
// });

app.listen(port,()=>{
    console.log("Currently running on port "+port);
});
