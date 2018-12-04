/*
Zach Boylan, Zaid Bhujwala, Andrew Figueroa, Steven Rollo

Data Science & Systems Lab (DASSL), Western Connecticut State University

Copyright (c) 2017- DASSL. ALL RIGHTS RESERVED.
Licensed to others under CC 4.0 BY-NC-SA
https://creativecommons.org/licenses/by-nc-sa/4.0/

ALL ARTIFACTS PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

Gradebook node.js web server
This program serves a Gradebook home page that allows an instructor to
view attendance based on a year, season, course, and section provided
Currently, database connection parameters must also be provided - these must
point to a database with Gradebook installed.  Additionally, the server expects
all Gradebook objects to exist in a schema called "gradebook".

A static page is served at '/', along with some js and css dependencies
Additionally, five REST calls are implemented that this pages uses to
get data from the Gradebook db.


This document in its current version has been modified by Team DOS: Kyle Bella,
Kenneth Kozlowski and Joseph Tether for CS305@WCSU

Last Edited by: Kenneth Kozlowski
Date Of Last Revision: December 3, 2018
*/
//Super secret password - Used for a temporary password encryption scheme
const superSecret = 'dassl2017';

//List of month names used when generating the attendance table
const monthNames = [
   'Jan.',
   'Feb.',
   'Mar.',
   'Apr.',
   'May',
   'Jun.',
   'Jul.',
   'Aug.',
   'Sep.',
   'Oct.',
   'Nov.',
   'Dec.'
];

var pg = require('pg'); //Postgres client module   | https://github.com/brianc/node-postgres
var sjcl = require('sjcl'); //Encryption module    | https://github.com/bitwiseshiftleft/sjcl
var express = require('express'); //Express module | https://github.com/expressjs/express
var bodyParser = require('body-parser');

var app = express();

/*
This function creates and returns a config object for the pg module based on some
supplied parameters.
*/
function createConnectionParams(user, database, passwordText, host, port) {
  //Decrypt the password recieved from the client.  This is a temporary development
  //feature, since we don't have ssl set up yet
  var password = sjcl.decrypt(superSecret, JSON.parse(passwordText));
   var config = {
      user: user.trim(),
      database: database.trim(),
      password: password.trim(),
      host: host.trim(),
      port: port.trim()
   };
   return config;
}

/*
This function creates a new connection to a Postgres instance using the
supplied connection params (var config), and executes queryText with queryParams.
Then, it calls queryCallback with the response recieved from the database.
This should help cut down on repeated code between the url handlers.
*/
function executeQuery(response, config, queryText, queryParams, queryCallback) {
   var client = new pg.Client(config); //Connect to pg instance
   client.connect(function(err) {
      if(err) { //If a connection error happens, 500
         switch (err.code) {
            case '28P01': //Authentiaction failed
            console.log(config);
            response.status(500).send('500 - Authentiaction failed');
            break;
            case '3D000': //Database does not exist
            response.status(500).send('500 - Database does not exist');
            break;
            case 'ECONNREFUSED': //Refused Connnection (likely an incorrect port)
            response.status(500).send('500 - Connnection Refused');
            break;
            case 'ENOTFOUND': //Invalid host
            response.status(500).send('500 - Host not found');
            break;
         default:
            response.status(500).send('500 - Database connection error');
         }
         console.log(err);
         //Currently does not work in index.html
      }
      else { //Try and execute the query
        console.log(queryText);
        console.log(queryParams);
         client.query(queryText, queryParams, function (err, result) {
            if(err) { //If the query returns an error, 500
               response.status(500).send('500 - Query execution error');
               console.log(err);
            }
            else { //Execute the query callback
               queryCallback(result);
               client.end(); //Close the connection
            }
         });
      }
   });
}

//Tell the browser we don't have a favicon
app.get('/favicon.ico', function (request, response) {
   response.status(204).send(); //No content
});

//Serve our homepage when a user goes to the root
app.get('/', function(request, response) {
   response.sendFile('client/html/login.html', {root: __dirname});
});

//Serve our homepage when a user goes to the root
app.get('/index.html', function(request, response) {
   response.sendFile('client/html/login.html', {root: __dirname});
});

//Loads the login page
app.get('/login.html', function(request, response) {
  response.sendFile('client/html/login.html', {root: __dirname});
});

//Loads the about page
app.get('/about.html', function(request, response) {
   response.sendFile('client/html/about.html', {root: __dirname});
});

//Loads the Change Log page
app.get('/changeLog.html', function(request, response) {
   response.sendFile('client/html/changeLog.html', {root: __dirname});
});

//Loads the Assessment Mgmt. Form Page
app.get('/manageAssessmentTypesForm.html', function(request, response) {
   response.sendFile('client/html/manageAssessmentTypesForm.html', {root: __dirname});
});

//Loads the Manage Assessments Page
app.get('/manageAssessments.html', function(request, response) {
   response.sendFile('client/html/manageAssessments.html', {root: __dirname});
});

//Loads the Manage Student Grades Form Page
app.get('/manageAssessments.html', function(request, response) {
   response.sendFile('client/html/manageStudentGradesForm.html', {root: __dirname});
});

//Loads the Manage Student Grades Page
app.get('/manageAssessments.html', function(request, response) {
   response.sendFile('client/html/manageStudentGrades.html', {root: __dirname});
});

//Serve css and js dependencies
app.get('/css/materialize.min.css', function(request, response) {
	response.sendFile('client/css/materialize.min.css', {root: __dirname});
});

app.get('/js/materialize.min.js', function(request, response) {
	response.sendFile('client/js/materialize.min.js', {root: __dirname});
});

app.get('/js/index.js', function(request, response) {
	response.sendFile('client/js/index.js', {root: __dirname});
});

app.get('/js/assessmentTypeMgmt.js', function(request, response) {
  response.sendFile('client/js/assessmentTypeMgmt.js', {root: __dirname});
});

app.get('/js/assessmentMgmt.js', function(request, response) {
  response.sendFile('client/js/assessmentMgmt.js', {root: __dirname});
});

//Returns instructor id and name from a provided email.
app.get('/login', function(request, response) {
   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      request.query.password, request.query.host, request.query.port);

   //Get the params from the url
   var instructorEmail = request.query.instructoremail.trim();

   //Set the query text
   var queryText = 'SELECT ID, FName, MName, LName, Department FROM getInstructor($1);';
   var queryParams = [instructorEmail];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      //Check if any rows are returned.  No rows implies that the provided
      //email does not match an existing instructor
      if(result.rows.length == 0) {
         response.status(401).send('401 - Login failed');
      }
      else {
         var jsonReturn = {
            "instructor": result.rows[0] //getInstructors should return at most one row
         };
         response.send(JSON.stringify(jsonReturn));
      }
   });
});

//Return a list of years a certain instructor has taught sections
app.get('/years', function(request, response) {
   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      request.query.password, request.query.host, request.query.port);

   //Get the params from the url
   var instructorID = request.query.instructorid;

   //Set the query text
   var queryText = 'SELECT Year FROM getInstructorYears($1);';
   var queryParams = [instructorID];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      var years = []; //Put the rows from the query into json format
      for(row in result.rows) {
         years.push(result.rows[row].year);
      }
      var jsonReturn = {
         "years": years
      } //Send the json to the client
      response.send(JSON.stringify(jsonReturn));
   });
});

//Return a list of seasons an instructor taught in during a certain year
app.get('/seasons', function(request, response) {
   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      request.query.password, request.query.host, request.query.port);

   //Get the params from the url
   var instructorID = request.query.instructorid;
   var year = request.query.year;

   //Set the query text
   var queryText = 'SELECT SeasonOrder, SeasonName FROM getInstructorSeasons($1, $2);';
   var queryParams = [instructorID, year];

   //Execute the query
   executeQuery(response, config, queryText, queryParams, function(result) {
      var seasons = []; //Put the rows from the query into json format
      for(row in result.rows) {
         seasons.push(
            {
               "seasonorder": result.rows[row].seasonorder,
               "seasonname": result.rows[row].seasonname
            }
         );
      }
      var jsonReturn = {
         "seasons": seasons
      } //Send the json to the client
      response.send(JSON.stringify(jsonReturn));
   });
});

//Returns a list of courses an instructor has taugh in a certain year
app.get('/courses', function(request, response) {
   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      request.query.password, request.query.host, request.query.port);

   var instructorID = request.query.instructorid;
   var year = request.query.year;
   var seasonOrder = request.query.seasonorder;

   var queryText = 'SELECT Course FROM getInstructorCourses($1, $2, $3);';
   var queryParams = [instructorID, year, seasonOrder];

   executeQuery(response, config, queryText, queryParams, function(result) {
      var courses = [];
      for(row in result.rows) {
         courses.push(result.rows[row].course);
      }
      var jsonReturn = {
         "courses": courses
      };
      response.send(JSON.stringify(jsonReturn));
   });

});

//Returns a list of sesctions an instructor taught in a certain term
app.get('/sections', function(request, response) {
   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      request.query.password, request.query.host, request.query.port);

   var instructorID = request.query.instructorid;
   var year = request.query.year;
   var seasonOrder = request.query.seasonorder;
   var courseNumber = request.query.coursenumber;

   var queryText = 'SELECT SectionID, SectionNumber FROM getInstructorSections($1, $2, $3, $4);';
   var queryParams = [instructorID, year, seasonOrder, courseNumber];

   executeQuery(response, config, queryText, queryParams, function(result) {
      var sections = [];
      for(row in result.rows) {
         sections.push(
            {
               "sectionid": result.rows[row].sectionid,
               "sectionnumber": result.rows[row].sectionnumber
            }
         );
      }
      var jsonReturn = {
         "sections": sections
      };
      response.send(JSON.stringify(jsonReturn));
   });
});

//Return a table containing the attendance for a single section
app.get('/attendance', function(request, response) {
   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      request.query.password, request.query.host, request.query.port);

   //Get attendance param
   var sectionID = request.query.sectionid;

   //Set the query text and package the parameters in an array
   var queryText = 'SELECT AttendanceCSVWithHeader FROM getAttendance($1);';
   var queryParams = [sectionID];

   //Setup the second query, to get the attendance code description table
   var queryTextAttnDesc = 'SELECT Status, Description FROM AttendanceStatus';

   //Execute the attendance description query first
   //attnStatusRes will hold the table containg the code descriptions
   executeQuery(response, config, queryTextAttnDesc, null, function(attnStatusRes) {
      //Then execute the query to get attendance data
      executeQuery(response, config, queryText, queryParams, function(result) {
         //Check if any attendance data was returned from the DB.  One header row is
         //always returned, so if the result contains only one row, then
         //no attendance data was returned
         if(result.rows.length == 1) {
            response.status(500).send('500 - No Attenance Records');
            return;
         }

         var table = '<table>';
         //Extract months from the top row of dates
         //First, split csv of dates
         var dateRow = result.rows[0].attendancecsvwithheader.split(',');
         var rowLen = dateRow.length;

         var maxMonth = 0; //Stores the lastest month found
         var months = ''; //Stores a csv of months
         var days = [dateRow[0], dateRow[1], dateRow[2]]; //Stores a csv of days

         var monthSpanWidths =[]; //Stores the span associated with each month
         var currentSpanWidth = 1; //Width of the current span

         for(i = 3; i < rowLen; i++) { //For each date in the date row
            splitDate = dateRow[i].split('-');
            if(splitDate[0] > maxMonth) { //If the month part is a new month
               maxMonth = splitDate[0];
               months += ',' + monthNames[splitDate[0] - 1]; //Add it to the csv
               if(currentSpanWidth > 0) { //Set the span width of the current month cell
                  //Also include the col. number with the span width
                  monthSpanWidths.push({'col': i, 'width': currentSpanWidth});
                  currentSpanWidth = 1;
               }
            }
            else { //If it's not a new month
               currentSpanWidth++;
            }
            days += ',' + splitDate[1]; //Add day to the day row
         }
         if(currentSpanWidth > 0) { //Add the last month span
            monthSpanWidths.push({'col': i, 'width': currentSpanWidth});
         }
         //Add the month and day rows to the csv rows
         var resultSplitDates = result.rows.slice(1);
         resultSplitDates.unshift({attendancecsvwithheader: days});
         resultSplitDates.unshift({attendancecsvwithheader: months});

         //Execute for each row in the result
         resultSplitDates.forEach(function(row) {
            //Add table row for each result row
            table += '<tr>';
            var splitRow = row.attendancecsvwithheader.split(','); //Split the csv field
            var rowLen = splitRow.length;
            var spanIndex = 0;

            for(cell = 0; cell < rowLen; cell++) { //For each cell in the current row
               var title = '';
               var style = '';
               var spanWidth = 1;
               //Correctly format student names (lname, fnmame mname)
               var cellContents = splitRow[cell];
               if(splitRow[0] == '') {
                  spanWidth = monthSpanWidths[spanIndex].width;
                  spanIndex++;
               }
               if(splitRow[0] != '' && cell == 0) {
                  cellContents = splitRow[cell] + ', ' + splitRow[cell + 1] + ' ' + splitRow[cell + 2];
                  cell += 2;
               }
               if(splitRow[0] != '' && cell > 2) {
                  //Find the matching code description
                  //the some() method allows break-like behavior using return true
                  attnStatusRes.rows.some(function(row) {
                     if(row.status == cellContents) {
                        title = row.description;
                        return true;
                     }
                  });
                  //Check if this column is the first in the month, and add a left border
                  monthSpanWidths.some(function(row) {
                     if(row.col == cell) {
                        style = 'border-left: 2px solid #e0e0e0;';
                        return true;
                     }
                  });
               }
               //Generate table row based on non-empty properties
               table += '<td' + ' colspan=' + spanWidth;
               //Only add title/style properties if they are not empty
               if(title != '') {
                  table += ' title="' + title + '"';
               }
               if(style != '') {
                  table += ' style="' + style + '"';
               }
               table +=  ' >' + cellContents + '</td>';
            }
            table += '</tr>';
         });
         table += '</table>'
         //Set the response type to html since we are sending the striaght html taable
         response.header("Content-Type", "text/html");
         response.send(table);
      });
   });
});

app.get('/assessmentTypes', function(request, response) {
   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      request.query.password, request.query.host, request.query.port);

   var sectionID = request.query.sectionid;

   // the query will call a function in the future
   var queryText = 'SELECT ID, ComponentType FROM AssessmentComponent WHERE Section = $1;';
   var queryParams = [sectionID];

   executeQuery(response, config, queryText, queryParams, function(result) {
      var assessTypes = [];
      if (result.rows.length == 0)
      {
        response.status(500).send('500 - No Assessment Types');
      }
      else {
        for(row in result.rows) {
           assessTypes.push(
              {
                 "componentID": result.rows[row].id,
                 "componenttype": result.rows[row].componenttype
              }
           );
        }
        var jsonReturn = {
           "assessTypes": assessTypes
        };
        response.send(JSON.stringify(jsonReturn));
      }
   });
});

//need to be restructured
app.get('/assessmentItems', function(request, response){
  //Connnection parameters for the Postgres client recieved in the request
  var config = createConnectionParams(request.query.user, request.query.database,
     request.query.password, request.query.host, request.query.port);

  var sectionID = request.query.sectionid;
  var componentID = request.query.assessid;

  // the query will call a function in the future
  var queryText = "SELECT AC.ID, AC.ComponentType, AC.Weight, AC.Description, " +
  "AI.SequenceInComponent, AI.BasePoints, AI.ExtraCreditPoints, " +
  "AI.AssignedDate, AI.DueDate, AI.Curve " +
  "FROM AssessmentComponent AC LEFT OUTER JOIN " +
  "AssessmentItem AI ON AC.ID = AI.Component " +
  "WHERE AC.Section = $1 AND AC.ID = $2 ORDER BY AC.ID, AI.SequenceInComponent;";

  var queryParams = [sectionID, componentID];

  executeQuery(response, config, queryText, queryParams, function(result) {

      var assessType = result.rows[0].componenttype;
      var assessWeight = result.rows[0].weight;
      var assessDescription = result.rows[0].description;

      var table = '<tr><th>Number</th><th>BasePoints</th><th>ExtraCreditPoints</th>' +
        '<th>AssignedDate</th><th>DueDate</th><th>Curve</th></tr>';
      if(result.rows[0].sequenceincomponent != null)
      {
        for (row in result.rows)
        {
          table += '<tr id="' + result.rows[row].sequenceincomponent + '">';
          table += '<td id="sequence"><a id="getForUpdate" class="waves-effect waves-light btn">' + result.rows[row].sequenceincomponent + '</a></td>';
          table += '<td id="basepoint">' + result.rows[row].basepoints + '</td>';
          if (result.rows[row].extracreditpoints == null)
          {
            table += '<td id="extrapoint"></td>';
          }
          else {
            table += '<td id="extrapoint">' + result.rows[row].extracreditpoints + '</td>';
          }
          table += '<td id="assigned">' + result.rows[row].assigneddate + '</td>';
          table += '<td id="due">' + result.rows[row].duedate + '</td>';
          if (result.rows[row].curve == null)
          {
            table += '<td id="curve"></td>';
          }
          else {
            table += '<td id="curve">' + result.rows[row].curve + '</td>';
          }
          table += '</tr>';
        }
      }
      var jsonReturn = {
         "assessType": assessType,
         "assessWeight": assessWeight,
         "assessDescription": assessDescription,
         "assessItemTable": table
      };
      response.send(JSON.stringify(jsonReturn));
  });
});

app.get('/assessmentTypesInsert', function(request, response) {
   //Connnection parameters for the Postgres client recieved in the request
   var config = createConnectionParams(request.query.user, request.query.database,
      request.query.password, request.query.host, request.query.port);

   var sectionID = request.query.sectionid;
   var componenttype = request.query.componenttype;
   var weight = request.query.weight;
   var description = request.query.description;
   // the query will call a function in the future
   var queryText = 'INSERT INTO AssessmentComponent (section, componenttype, weight, description)' +
                   'VALUES ($1, $2, $3, $4);';
   var queryParams = [sectionID, componenttype, weight, description];

   executeQuery(response, config, queryText, queryParams, function(result) {
      if (result.rowCount == 0)
      {
        response.status(500).send('500 - Insert Failed');
      }
      else {
        var jsonReturn = {
           "rowCount": result.rowCount
        };
        response.send(JSON.stringify(jsonReturn));
      }
   });
});

app.get('/assessmentItemsInsert', function(request, response) {
  //Connnection parameters for the Postgres client recieved in the request
  var config = createConnectionParams(request.query.user, request.query.database,
     request.query.password, request.query.host, request.query.port);

  var assessID = parseInt(request.query.assessid);
  var basePoints = parseFloat(request.query.basePoints);
  var extraPoints = request.query.extraCreditPoints;
  var assignedDate = new Date(request.query.assignedDate);
  var dueDate = new Date(request.query.dueDate);

  if (extraPoints != '')
  {
    extraPoints = parseFloat(extraPoints);
  }
  else {
    extraPoints = null;
  }

  var queryCountRowsText = "SELECT SequenceInComponent FROM AssessmentItem WHERE Component = $1 ORDER BY SequenceInComponent;";
  var queryParams = [assessID];

  executeQuery(response, config, queryCountRowsText, queryParams, function(result) {
    var nextInComponent = 1;
    if (result.rows.length != 0)
    {
      nextInComponent = parseInt(result.rows[parseInt(result.rows.length) - 1].sequenceincomponent) + 1;
    }

    var queryText = "INSERT INTO AssessmentItem (Component, SequenceInComponent, BasePoints," +
    "ExtraCreditPoints, AssignedDate, DueDate)" +
    "VALUES ($1, $2, $3, $4, $5, $6);";
    queryParams.push(nextInComponent, basePoints, extraPoints, assignedDate, dueDate);


    executeQuery(response, config, queryText, queryParams, function(result) {
      if (result.rowCount == 0)
      {
        response.status(500).send('500 - Insert Failed');
      }
      else {
        var jsonReturn = {
           "rowCount": result.rowCount
        };
        response.send(JSON.stringify(jsonReturn));
      }
    });
  });
});

app.get('/assessmentTypesUpdate', function(request, response) {
  //Connnection parameters for the Postgres client recieved in the request
  var config = createConnectionParams(request.query.user, request.query.database,
     request.query.password, request.query.host, request.query.port);

  console.log(request.query.assessid);
  var assessID = request.query.assessid;
  console.log(request.query.componenttype);
  var componentType = request.query.componenttype;
  console.log(request.query.weight);
  var weight = request.query.weight;
  console.log(request.query.description);
  var description = request.query.description;

  var queryText = "UPDATE AssessmentComponent " +
  "SET ComponentType = $2, Weight = $3, Description = $4 " +
  "WHERE ID = $1;";
  var queryParams = [assessID, componentType, weight, description];

  executeQuery(response, config, queryText, queryParams, function(result) {
    console.log(result);
    if (result.rowCount == 0)
    {
      response.status(500).send('500 - Update Failed');
    }
    else {
      var jsonReturn = {
         "rowCount": result.rowCount
      };
      response.send(JSON.stringify(jsonReturn));
    }
  });
});

app.get('/assessmentItemsUpdate', function(request, response) {
  //Connnection parameters for the Postgres client recieved in the request
  console.log("On Server");
  var config = createConnectionParams(request.query.user, request.query.database,
     request.query.password, request.query.host, request.query.port);

  var assessID = parseInt(request.query.assessid);
  console.log(assessID);
  var sequenceInComponent = parseInt(request.query.sequenceincomponent);
  console.log(sequenceInComponent);
  var basePoints = parseFloat(request.query.basepoints);
  console.log(basePoints);
  var extraPoints = null;
  if (request.query.extracreditpoints !== '' &&
      request.query.extracreditpoints !== null)
  {
    extraPoints = parseFloat(request.query.extracreditpoints);
  }
  console.log(extraPoints);
  var assignedDate = new Date(request.query.assigneddate);
  console.log(assignedDate);
  var dueDate = new Date(request.query.duedate);
  console.log(dueDate);
  var curve = null;
  if (request.query.curve !== '' && request.query.curve !== null)
  {
    curve = parseFloat(request.query.curve);
  }
  console.log(curve);

  var queryText = "UPDATE AssessmentItem " +
  "SET BasePoints = $3, ExtraCreditPoints = $4, AssignedDate = $5,  " +
  "DueDate = $6, Curve = $7 " +
  "WHERE Component = $1 AND SequenceInComponent = $2;";
  var queryParams = [assessID, sequenceInComponent, basePoints, extraPoints,
  assignedDate, dueDate, curve];

  executeQuery(response, config, queryText, queryParams, function(result) {
    console.log(result);
    if (result.rowCount == 0)
    {
      response.status(500).send('500 - Update Failed');
    }
    else {
      var jsonReturn = {
         "rowCount": result.rowCount
      };
      response.send(JSON.stringify(jsonReturn));
    }
  });
});

app.get('/assessmentTypesDelete', function(request, response) {
  //Connnection parameters for the Postgres client recieved in the request
  var config = createConnectionParams(request.query.user, request.query.database,
     request.query.password, request.query.host, request.query.port);

  var assessID = parseInt(request.query.assessid);
  console.log(assessID);

  var queryText = "DELETE FROM AssessmentItem " +
  "WHERE Component = $1;";
  var queryParams = [assessID];

  executeQuery(response, config, queryText, queryParams, function(result) {
    console.log(result);

    queryText = "DELETE FROM AssessmentComponent " +
    "WHERE ID = $1;"
    executeQuery(response, config, queryText, queryParams, function(result) {
      if (result.rowCount == 0)
      {
        response.status(500).send('500 - Delete Failed');
      }
      else {
        var jsonReturn = {
           "rowCount": result.rowCount
        };
        response.send(JSON.stringify(jsonReturn));
      }
    });
  });
});

app.get('/assessmentItemsDelete', function(request, response) {
  //Connnection parameters for the Postgres client recieved in the request
  var config = createConnectionParams(request.query.user, request.query.database,
     request.query.password, request.query.host, request.query.port);

  var assessID = parseInt(request.query.assessid);
  console.log(assessID);
  var sequenceInComponent = parseInt(request.query.sequenceincomponent);
  console.log(sequenceInComponent);

  var queryText = "DELETE FROM AssessmentItem " +
  "WHERE Component = $1 AND SequenceInComponent = $2;";
  var queryParams = [assessID, sequenceInComponent];

  executeQuery(response, config, queryText, queryParams, function(result) {
    if (result.rowCount == 0)
    {
      response.status(500).send('500 - Delete Failed');
    }
    else {
      var jsonReturn = {
         "rowCount": result.rowCount
      };
      response.send(JSON.stringify(jsonReturn));
    }
  });
});

app.use(function(err, req, res, next){
  console.error(err);
  res.status(500).send('Internal Server Error');
});

server = app.listen(80);
