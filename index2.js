import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Create transporter for Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tripcompannionx@gmail.com',
    pass: 'bruk ucac swjd pbiw',
  },
});

const app = express();
const port = 3000;

console.log("Application Started");

// Initialize Supabase client
const supabaseUrl = "https://uygoygzrsupdgklbqpbg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Z295Z3pyc3VwZGdrbGJxcGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3OTY4NjUsImV4cCI6MjA0NDM3Mjg2NX0.1PlN3rzm0h1ZMw74zb82nsgyoh9rgyNPzN7wpMmA3fs";
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

var currentUser;
var rides;
var data;
var rollNo;
var name;

app.get("/", async (req, res) => {
    res.render("home.ejs");
});

app.get("/logout", async (req, res) => {
    currentUser = null;
    res.redirect("/");
});

app.get("/signUp", async (req, res) => {
    res.render("signUp.ejs");
});

app.post("/signupdetails", async (req, res) => {
    const { data, error } = await supabase
        .from('profile')
        .insert([
            {
                rollno: req.body.rollNo,
                name: req.body.name,
                gender: req.body.gender,
                carname: req.body.carName,
                course: req.body.course,
                studyyear: req.body.year,
                phone: req.body.phoneNumber,
                pass: req.body.password
            }
        ]);

    if (error) {
        console.error('Error inserting data:', error);
        return res.status(500).send("Error creating profile");
    }

    const { data: userData, error: userError } = await supabase
        .from('profile')
        .select('*')
        .eq('rollno', req.body.rollNo)
        .single();

    if (userError) {
        console.error('Error fetching user data:', userError);
        return res.status(500).send("Error fetching user data");
    }

    currentUser = userData;
    rollNo = req.body.rollNo;
    name = req.body.name;
    res.redirect("/home");
});

app.get("/login", async (req, res) => {
    res.render("login.ejs");
});

app.post("/logindetails", async (req, res) => {
    rollNo = req.body.rollNo;
    const { data: userData, error } = await supabase
        .from('profile')
        .select('*')
        .eq('rollno', rollNo)
        .single();

    if (error) {
        console.error('Error fetching user data:', error);
        return res.status(500).send("Error fetching user data");
    }

    currentUser = userData;

    if (req.body.password == currentUser.pass) {
        res.render("home.ejs", { user: currentUser });
        name = currentUser.name;
    } else {
        res.render("login.ejs");
    }
});

app.get("/home", async (req, res) => {
    res.render("home.ejs", { user: currentUser });
});

app.get("/profile", async (req, res) => {
    res.render("profile.ejs", { user: currentUser });
});

app.get("/viewHistory/:r", async (req, res) => {
    var rollNo = req.params.r;
    
    const { data: result1, error: error1 } = await supabase
        .from('ridelist')
        .select('*')
        .eq('rollno', rollNo)
        .eq('status', 1);

    const { data: result2, error: error2 } = await supabase
        .from('ridehistory')
        .select('*')
        .eq('rollc', rollNo);

    const { data: result3, error: error3 } = await supabase
        .from('ridehistory')
        .select('*')
        .eq('rollr', rollNo);

    if (error1 || error2 || error3) {
        console.error('Error fetching ride history:', error1 || error2 || error3);
        return res.status(500).send("Error fetching ride history");
    }

    res.render("rideHistory1.ejs", { ride: result1, ridelist: result2, bookedRides: result3 });
});

app.get("/editProfile", async (req, res) => {
    res.render("editProfile.ejs", { user: currentUser });
});

app.post("/updateProfile", async (req, res) => {
    const { data, error } = await supabase
        .from('profile')
        .update({
            rollno: req.body.rollNo,
            name: req.body.name,
            gender: req.body.gender,
            carname: req.body.carName,
            course: req.body.course,
            studyyear: req.body.year,
            phone: req.body.phoneNumber
        })
        .eq('id', req.body.id);

    if (error) {
        console.error('Error updating profile:', error);
        return res.status(500).send("Error updating profile");
    }

    const { data: updatedUser, error: fetchError } = await supabase
        .from('profile')
        .select('*')
        .eq('id', req.body.id)
        .single();

    if (fetchError) {
        console.error('Error fetching updated user data:', fetchError);
        return res.status(500).send("Error fetching updated user data");
    }

    currentUser = updatedUser;
    res.redirect("/profile");
});

app.get("/createRide", async (req, res) => {
    res.render("createRide.ejs");
});

app.post("/submitRide", async (req, res) => {
    const { data, error } = await supabase
        .from('ridelist')
        .insert([{
            destination: req.body.destination,
            starttime: req.body.startTime,
            duration: req.body.estimatedTime,
            carname: req.body.carName,
            seatnum: req.body.seatsAvailable,
            pos: req.body.seatPositions,
            seatcost: req.body.seatCost,
            rollno: rollNo,
            name: currentUser.name
        }]);

    if (error) {
        console.error('Error submitting ride:', error);
        return res.status(500).send("Error submitting ride");
    }

    res.render("rideSubmit.ejs");
});

app.get("/viewStatus", async (req, res) => {
    const { data: allRides, error: allRidesError } = await supabase
        .from('ridelist')
        .select('*')
        .eq('rollno', currentUser.rollno)
        .eq('status', 0);

    const { data: cRides, error: cRidesError } = await supabase
        .from('ride')
        .select('*')
        .eq('rollc', currentUser.rollno);

    const { data: bRides, error: bRidesError } = await supabase
        .from('ride')
        .select('*')
        .eq('rollr', currentUser.rollno);

    if (allRidesError || cRidesError || bRidesError) {
        console.error('Error fetching rides:', allRidesError || cRidesError || bRidesError);
        return res.status(500).send("Error fetching rides");
    }

    res.render("rideStatus.ejs", { ride: allRides, ridelist: cRides, bookedRides: bRides });
});

app.get("/rideHistory", async (req, res) => {
    const { data: allRides, error: allRidesError } = await supabase
        .from('ridelist')
        .select('*')
        .eq('rollno', currentUser.rollno)
        .eq('status', 1);

    const { data: cRides, error: cRidesError } = await supabase
        .from('ridehistory')
        .select('*')
        .eq('rollc', currentUser.rollno);

    const { data: bRides, error: bRidesError } = await supabase
        .from('ridehistory')
        .select('*')
        .eq('rollr', currentUser.rollno);

    if (allRidesError || cRidesError || bRidesError) {
        console.error('Error fetching ride history:', allRidesError || cRidesError || bRidesError);
        return res.status(500).send("Error fetching ride history");
    }

    res.render("rideStatus.ejs", { ride: allRides, ridelist: cRides, bookedRides: bRides });
});

app.get("/updateRideRequest", async (req, res) => {
    const rideId = parseInt(req.query.rideId);
    const rollNo = req.query.rollNo;
    const action = req.query.action;
    let bit;
    let actionText;

    if (isNaN(rideId)) {
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

    const { data, error } = await supabase
        .from('ride')
        .update({ confirmed: bit })
        .eq('thisrideid', rideId);

    if (error) {
        console.error('Error updating ride request:', error);
        return res.status(500).send("Error updating ride request");
    }

    const requesterEmail = rollNo + "@psgtech.ac.in";

    if (requesterEmail) {
        const mailOptions = {
            from: 'tripcompannionx@gmail.com',
            to: requesterEmail,
            subject: `Ride Request ${actionText}`,
            text: `Your ride request for Ride ID ${rideId} has been ${actionText}.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Failed to send email to requester...", error);
            } else {
                console.log("Email sent to requester successfully!", info.response);
            }
        });
    }

    if (bit === 1) {
        res.render("thankyou.ejs");
    } else {
        res.render("better.ejs");
    }
});

app.get("/notify", async (req, res) => {
    const { data: request, error: requestError } = await supabase
        .from('ride')
        .select('*')
        .eq('rollc', currentUser.rollno)
        .eq('confirmed', 0);

    const { data: result1, error: result1Error } = await supabase
        .from('ride')
        .select('*')
        .eq('rollr', currentUser.rollno)
        .neq('confirmed', 0);

    const { data: result2, error: result2Error } = await supabase
        .from('ridehistory')
        .select('*')
        .eq('rollr', currentUser.rollno)
        .eq('fbit', 0);

    if (requestError || result1Error || result2Error) {
        console.error('Error fetching notifications:', requestError || result1Error || result2Error);
        return res.status(500).send("Error fetching notifications");
    }

    res.render("notification.ejs", { newRequests: request, requestStatus: result1, feedbackPending: result2 });
});

app.post("/submitFeedback", async (req, res) => {
    var id = parseInt(req.body.id);
    
    const { data, error } = await supabase
        .from('ridehistory')
        .select('*')
        .eq('thisrideid', id)
        .single();

    if (error) {
        console.error('Error fetching ride for feedback:', error);
        return res.status(500).send("Error fetching ride for feedback");
    }

    res.render("feedback.ejs", { ride: data });
});

app.post("/getFeedback", async (req, res) => {
    var id = parseInt(req.body.id);
    var rating = parseInt(req.body.rating);
    var desc = req.body.comments;
    var comfort = req.body.comfort;

    const { data, error } = await supabase
        .from('ridehistory')
        .update({ feedback: desc, rating: rating, comfort: comfort, fbit: 1 })
        .eq('thisrideid', id);

    if (error) {
        console.error('Error updating feedback:', error);
        return res.status(500).send("Error updating feedback");
    }

    res.render("feedThank.ejs");
});

app.get("/searchRide", async (req, res) => {
    var currentTime = new Date();

    const { data, error } = await supabase
    .from('ridelist')
    .select('*')
    .eq('status', 0);


    // if (error) {
    //     console.error('Error searching rides:', error);
    //     return res.status(500).send("Error searching rides");
    // }

    // console.log('Retrieved rides:', data);

    // if (data.length === 0) {
    //     console.log('No rides found in the ridelist');
    // }

    res.render("searchRide.ejs", { rides: data });
});
app.get("/rideInfo/:rideId", async (req, res) => {
    var rideId = req.params.rideId;
    var rideIdInt = Number(rideId);

    if (isNaN(rideIdInt)) {
        return res.status(400).send("Invalid ride ID");
    }

    const { data, error } = await supabase
        .from('ridelist')
        .select('*')
        .eq('rideid', rideIdInt)
        .single();

    if (error) {
        console.error('Error fetching ride info:', error);
        return res.status(500).send("Error fetching ride info");
    }

    res.render("rideInfo.ejs", { ride: data });
});

app.get("/bookRide", async (req, res) => {
    var rideId = parseInt(req.query.rideId);
    var seatNum = parseInt(req.query.seatNum);

    if (isNaN(seatNum) || isNaN(rideId)) {
        return res.status(400).send("Invalid seat number or ride ID");
    }

    seatNum--;

    const { data: updateData, error: updateError } = await supabase
        .from('ridelist')
        .update({ status: 0, seatnum: seatNum })
        .eq('rideid', rideId);

    if (updateError) {
        console.error('Error updating ride:', updateError);
        return res.status(500).send("Error updating ride");
    }

    const { data: rideData, error: rideError } = await supabase
        .from('ridelist')
        .select('*')
        .eq('rideid', rideId)
        .single();

    if (rideError) {
        console.error('Error fetching ride data:', rideError);
        return res.status(500).send("Error fetching ride data");
    }

    const { data: insertData, error: insertError } = await supabase
        .from('ride')
        .insert([{
            rideid: rideData.rideid,
            rollc: rideData.rollno,
            namec: rideData.name,
            rollr: currentUser.rollno,
            namer: currentUser.name,
            seatnum: 1,
            seatpos: rideData.pos,
            destination: rideData.destination,
            starttime: rideData.starttime,
            carname: rideData.carname,
            sents: 1,
            decides: 0,
            recvs: 0,
            confirmed: 0
        }]);

    if (insertError) {
        console.error('Error inserting booking record:', insertError);
        return res.status(500).send("Error inserting booking record");
    }

    const creatorEmail = rideData.rollno + "@psgtech.ac.in";

    if (creatorEmail) {
        const mailOptions = {
            from: 'tripcompannionx@gmail.com',
            to: creatorEmail,
            subject: `Ride Booking Confirmation for Ride ID ${rideId}`,
            text: `Hello, ${currentUser.name} has booked a seat on your ride.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Failed to send email...", error);
            } else {
                console.log("Email sent successfully!", info.response);
            }
        });
    }

    res.render("booked.ejs");
});

app.get("/viewProfile", async (req, res) => {
    var tempRollNo = req.query.rollno;

    const { data: tempUser, error } = await supabase
        .from('profile')
        .select('*')
        .eq('rollno', tempRollNo)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).send("Error fetching user profile");
    }

    res.render("otherProfile.ejs", { user: tempUser });
});

app.get("/currentRides", async (req, res) => {
    const currentTime = new Date().toISOString().slice(0, 16);

    const { data: ongoing, error } = await supabase
        .from('ride')
        .select('*')
        .gt('starttime', currentTime)
        .or(`rollr.eq.${currentUser.rollno},rollc.eq.${currentUser.rollno}`);

    if (error) {
        console.error('Error fetching current rides:', error);
        return res.status(500).send("Error fetching current rides");
    }

    var bit = 0;
    if (ongoing.length != 0 && ongoing[0].rollc == currentUser.rollno) {
        bit = 1;
    }

    var display = [ongoing[0]];
    res.render("ongoing.ejs", { ongoingRides: display, bit: bit });
});

app.post("/completeRide", async (req, res) => {
    var rideId = parseInt(req.body.id);

    const { data: updateData, error: updateError } = await supabase
        .from('ridelist')
        .update({ status: 1 })
        .eq('rideid', rideId);

    if (updateError) {
        console.error('Error updating ride status:', updateError);
        return res.status(500).send("Error updating ride status");
    }

    const { data: rides, error: ridesError } = await supabase
        .from('ride')
        .select('*')
        .eq('rideid', rideId);

    if (ridesError) {
        console.error('Error fetching rides:', ridesError);
        return res.status(500).send("Error fetching rides");
    }

    for (let ride of rides) {
        const { data: insertData, error: insertError } = await supabase
            .from('ridehistory')
            .insert([{
                rideid: ride.rideid,
                rollc: ride.rollc,
                namec: ride.namec,
                rollr: ride.rollr,
                namer: ride.namer,
                seatnum: ride.seatnum,
                seatpos: ride.seatpos,
                destination: ride.destination,
                starttime: ride.starttime,
                carname: ride.carname,
                thisrideid: ride.thisrideid,
                fbit: 0
            }]);

        if (insertError) {
            console.error('Error inserting ride history:', insertError);
            return res.status(500).send("Error inserting ride history");
        }

        const { data: deleteData, error: deleteError } = await supabase
            .from('ride')
            .delete()
            .eq('thisrideid', ride.thisrideid);

        if (deleteError) {
            console.error('Error deleting ride:', deleteError);
            return res.status(500).send("Error deleting ride");
        }
    }

    res.redirect("/home");
});

app.get("/current-location", async (req, res) => {
    res.render("startRide.ejs");
});

app.listen(port, () => {
    console.log("Currently running on port " + port);
});