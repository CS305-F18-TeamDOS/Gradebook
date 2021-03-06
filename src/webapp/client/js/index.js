/*
index.js - Gradebook

Andrew Figueroa
Data Science & Systems Lab (DASSL), Western Connecticut State University


Modified by team DOS (Kyle Bella, Kenneth Kozlowski and Joseph Tether)
CS 305-71 @ WCSU
Last To Make Modification: Kenneth Kozlowski
Date of Last Revision: 12/3/2018


Copyright (c) 2017- DASSL. ALL RIGHTS RESERVED.
Licensed to others under CC 4.0 BY-NC-SA
https://creativecommons.org/licenses/by-nc-sa/4.0/

ALL ARTIFACTS PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

This JavaScript file provides the client-side JS code that is used by the index.html
page. The functionality provided includes accessing the REST API provided by the web
server component of the Gradebook webapp, along with providing interactivity for the
index.html webpage.
*/

/*
Currently, a globally scoped variable is used to store login information.
 At a later point, it may be stored through a more appropriate manner, such as
 client cookies.
*/
var dbInfo = {
	"host":'localhost', "port":5432, "database":'gb_data', // change back to 'gradebook' after testing
	"user":'gb_webapp', "password":null, "instructorid":null
};
var instInfo = { "fname":null, "mname":null, "lname": null, "dept":null };

/*
Each instance of connInfo as a parameter in a function definition refers to an
 object with the following keys, which are used as part of the REST API calls to
 the Gradebook server:
	"host":String, "port":Number, "database":String, "user":String,
	 "password":String, "instructorid":Number
*/

/*
Keep the original assessment data so changing the fields is only permanent when
 user presses "Submit"
*/
var assessOrginInfo = {
	"basePoints":null, "extraCreditPoints":null, "assignedDate":null,
	"dueDate":null, "curve":null
};

$(document).ready(function() {
	$('select').material_select(); //load dropdown boxes

	$('#dbInfoBox').collapsible({
		onOpen: function() {
			$('#dbInfoArrow').html('keyboard_arrow_up');
		},
		onClose: function() {
			$('#dbInfoArrow').html('keyboard_arrow_down');
		}
	});

	$('#attnOptionsBox').collapsible({
		onOpen: function() {
			$('#optionsArrow').html('keyboard_arrow_up');
		},
		onClose: function() {
			$('#optionsArrow').html('keyboard_arrow_down');
		}
	});

	$('#btnLogin').click(function() {
		dbInfo = getDBFields();
		var email = $('#email').val().trim();


		/*This outer if/else checks to verify the domain name of the email address to verify that the user is logging
		in with the correct email address. This will also help to prevent unauthorized users to log into the system
		if the case would arrive where someone would use an email address like 'something@gmail.com' to spoof the
		username of 'something@example.edu' for example to gain access into the system.

		The 'example.edu' domain name and the 'connect.example.edu' domain name can be changed to match any domain name
		that the end uer needs to make  sure will work.

		The connect.example.edu domain name is there to verify that when a student logs into the application that their
		email address will be verified as correct. A different check is done in the if to make sure that a student
		can log in as well as instructors. This is here to make sure that institutions that use different email
		domains for students and faculty is covered.
		*/
		if(email.endsWith('@example.edu') || email.endsWith('@connect.example.edu'))
		{
		    if (dbInfo != null && email != '')
		    {
		        var tmpEmail = $('#email').val();
			var username = tmpEmail.substring(0,tmpEmail.indexOf('@'));
			dbInfo.user = username;
			serverLogin(dbInfo, email, function() {
				//clear login fields and close DB Info box
				$('#email').val('');
				$('#passwordBox').val('');
				$('#dbInfoBox').collapsible('close', 0);
				$('#dbInfoArrow').html('keyboard_arrow_down');

				popYears(dbInfo);

				var assess = $('#goToAssessmentTypeMgmt').prop('checked');
				console.log(assess);
				if (assess === true)
				{
					console.log(assess);
					goToAssessmentTypeMgmt();
				}
				else {
					console.log(assess);
					goToStudentGradesMgmt();
				}
			});
		    }
		    else
		    {
			showAlert('<h5><u>ERROR</u></h5><p>The username or password field is not filled in.' +
				  'Please make sure all fields are filled in</p>');
		    }
		}
		else
		{
		showAlert('<h5><u>Login Incomplete</u></h5><p>The domain name of the email address provided is not recognized' +
			  'by the server.<br> Please try again or contact support if you believe this is an error.</p>');
		}
	});

	$('#yearSelect').change(function() {
		var year = $('#yearSelect').val();
		popSeasons(dbInfo, year);
	});

	$('#seasonSelect').change(function() {
		var year = $('#yearSelect').val();
		var season = $('#seasonSelect').val();
		popCourses(dbInfo, year, season);
	});

	$('#courseSelect').change(function() {
		var year = $('#yearSelect').val();
		var season = $('#seasonSelect').val();
		var course = $('#courseSelect').val();
		popSections(dbInfo, year, season, course);
	});

	$('#sectionSelect').change(function() {
		var sectionID = $('#sectionSelect').val();
		$('#rosterTab, #attnTab, #assessTab, #gradesTab, #reportsTab').css('display', 'inline');
		setAssessmentTypes(null);
		popAttendance(dbInfo, sectionID);
		popAssessmentTypes(dbInfo, sectionID);
	});

	$('#opt-showPresent, #opt-compactTab').change(function() {
		//reload attendance table since options were modified
		var sectionID = $('#sectionSelect').val();
		popAttendance(dbInfo, sectionID);
	});

	$('#btnAddAssessType').click(function() {
		var sectionID = $('#sectionSelect').val();
		var assessType = $('#typeInput').val();
		var assessWeight = $('#weightInput').val();
		var assessDescription = $('#descriptionInput').val();
		insertNewAssessType(dbInfo, sectionID, assessType, assessWeight, assessDescription);
		// repopulate Assessment Types
		popAssessmentTypes(dbInfo, sectionID);
	});

	$('#assessmentTypeSelect').change(function() {
		var sectionID = $('#sectionSelect').val();
		var assessID = $('#assessmentTypeSelect').val();
		popAssessmentItems(dbInfo, sectionID, assessID);
		$('#btnChangeAssessType').css('display', 'inline-block');
		$('#btnDeleteAssessType').css('display', 'inline-block');
	});

	$('#getFields').click(function() {
		$('#newItem').css('display', 'none');
		$('#newItemSubmit, #newItemBasePoints, #newItemExtraPoints, #newItemAssignedDate, #newItemDueDate').css('display', 'inline');
	});

	$('#btnAddAssessItem').click(function() {
		var sectionID = $('#sectionSelect').val();
		var assessID = $('#assessmentTypeSelect').val();
		var basePoints = $('#basePointsInput').val();
		var extraPoints = $('#extraCreditPointsInput').val();
		var assignedDate = $('#assignedDateInput').val();
		var dueDate = $('#dueDateInput').val();
		insertNewAssessItem(dbInfo, assessID, basePoints, extraPoints, assignedDate,
		dueDate);
		// repopulate Assessment Items
		popAssessmentItems(dbInfo, sectionID, assessID);
	});

	$('#btnCloseItemFields').click(function() {
		$('#newItem').css('display', 'inline');
		$('#newItemSubmit, #newItemBasePoints, #newItemExtraPoints, #newItemAssignedDate, #newItemDueDate').css('display', 'none');
	});

	$('#btnChangeAssessType').click(function() {
		var sectionID = $('#sectionSelect').val();
		var assessID = $('#assessmentTypeSelect').val();
		var assessType = $('#typeInput').val();
		var assessWeight = $('#weightInput').val();
		var assessDescription = $('#descriptionInput').val();
		updateAssessType(dbInfo, assessID, assessType, assessWeight, assessDescription);
		// repopulate Assessment Types
		popAssessmentTypes(dbInfo, sectionID);
	});

	$('#btnDeleteAssessType').click(function() {
		var assessType = $('#typeInput').val();
		var msg = '<h5>Confirm deletion of type: ' + assessType + '</h5>' +
				'<p>Deleting type ' + assessType + ' will also delete all its associated ' +
				'items.  Are you sure you want to delete it?</p>';
		$('#genericConfirmBody').html(msg);
		$('#msg-genericConfirm').modal('open');
	});

	$('#btnConfirm').click(function(event) {
		var sectionID = $('#sectionSelect').val();
		var assessID = $('#assessmentTypeSelect').val();
		deleteAssessType(dbInfo, assessID);

		popAssessmentTypes(dbInfo, sectionID);
		$('#typeInput').val(null);
		$('#weightInput').val(null);
		$('#description').val(null);
	});

	$("#assessmentItemTable").on('click', "a[id^='getForUpdate']", function() {
		var tr = $(this).parent().parent();
		tr.find('#sequence').html('<a id="submitUpdate" class="waves-effect waves-light btn">Update</a><br><br>' +
															'<a id="submitDelete" class="waves-effect waves-light btn">Delete</a><br><br>' +
														  '<a id="closeFields" class="waves-effect waves-light btn">Close</a>');
		assessOrginInfo.basePoints = tr.find('#basepoint').html();
		tr.find('#basepoint').html('<input id="basePointsInput" value="' + assessOrginInfo.basePoints + '" type="text"/>');
		assessOrginInfo.extraCreditPoints = tr.find('#extrapoint').html();
		tr.find('#extrapoint').html('<input id="extraCreditPointsInput" value="' + assessOrginInfo.extraCreditPoints + '" type="text"/>');
		assessOrginInfo.assignedDate = tr.find('#assigned').html();
		tr.find('#assigned').html('<input id="assignedDateInput" value="' + assessOrginInfo.assignedDate + '" type="text"/>');
		assessOrginInfo.dueDate = tr.find('#due').html();
		tr.find('#due').html('<input id="dueDateInput" value="' + assessOrginInfo.dueDate + '" type="text"/>');
		assessOrginInfo.curve = tr.find('#curve').html();
		tr.find('#curve').html('<input id="curveInput" value="' + assessOrginInfo.curve + '" type="text"/>');
	});

	$('#assessmentItemTable').on('click', "a[id^='submitUpdate']", function() {
		var tr = $(this).parent().parent();
		var sectionID = $('#sectionSelect').val();
		var assessID = $('#assessmentTypeSelect').val();
		var sequenceInComponent = tr.prop('id');
		var basePoints = tr.find('#basePointsInput').val();
		var extraCreditPoints = tr.find('#extraCreditPointsInput').val();
		var assignedDate = tr.find('#assignedDateInput').val();
		var dueDate = tr.find('#dueDateInput').val();
		var curve = tr.find('#curveInput').val();
		updateAssessItem(dbInfo, assessID, sequenceInComponent, basePoints,
			extraCreditPoints, assignedDate, dueDate, curve);
		// repopulate Assessment Items
		popAssessmentItems(dbInfo, sectionID, assessID);
	});

	$('#assessmentItemTable').on('click', "a[id^='submitDelete']", function() {
		var tr = $(this).parent().parent();
		var sectionID = $('#sectionSelect').val();
		var assessID = $('#assessmentTypeSelect').val();
		var sequenceInComponent = tr.prop('id');
		deleteAssessItem(dbInfo, assessID, sequenceInComponent);

		popAssessmentItems(dbInfo, sectionID, assessID);
	});

	$('#assessmentItemTable').on('click', "a[id^='closeFields']", function() {
		var tr = $(this).parent().parent();
		tr.find('#sequence').html('<a id="getForUpdate" class="waves-effect waves-light btn">' + tr.prop('id') + '</a>');
		tr.find('#basepoint').html(assessOrginInfo.basePoints);
		tr.find('#extrapoint').html(assessOrginInfo.extraCreditPoints);
		tr.find('#assigned').html(assessOrginInfo.assignedDate);
		tr.find('#due').html(assessOrginInfo.dueDate);
		tr.find('#curve').html(assessOrginInfo.curve);
	});

	$('#logout').click(function() {
		dbInfo = null;
		instInfo = null;
		setYears(null); //reset Attendance dropdowns

		//hide and reset profile
		$('#profile').css('display', 'none');
		$('#instName').html('');

		//show Login tab, hide Roster, Attendance, Grades, and Reports tabs
		$('#loginTab').css('display', 'inline');
		$('#rosterTab, #attnTab, #sectionTab, #assessTab, #gradesTab, #reportsTab').css('display', 'none');
		$('ul.tabs').tabs('select_tab', 'login');
	});
});

function showAlert(htmlContent) {
	$('#genericAlertBody').html(htmlContent);
	$('#msg-genericAlert').modal('open');
};

function getDBFields() {
	var host = $('#host').val();
	var port = $('#port').val();
	var db = $('#database').val();
	var uname = $('#user').val();
	var pw =  $('#passwordBox').val().trim();

	if (host === "" || port === "" || db === "" || uname === "" || pw === "") {
		return null;
	}
	else if (host == null || port == null || db == null || uname == null) {
		console.log("WARN: Database info not specified, using defaults");
		host = dbInfo.host;
		port = dbInfo.port;
		db = dbInfo.database;
		uname = dbInfo.user;
	}
	else {
		host = host.trim();
		port = port.trim();
		db = db.trim();
		uname = db.trim();
	}

	pw = JSON.stringify(sjcl.encrypt('dassl2017', pw));

	var connInfo = { 'host':host, 'port':parseInt(port, 10), 'database':db,
	 'user':uname, 'password':pw };
	return connInfo;
};

function serverLogin(connInfo, email, callback) {
	//"create a copy" of connInfo with instructoremail and set to urlParams
	var urlParams = $.extend({}, connInfo, {instructoremail:email});
	$.ajax('login', {
		dataType: 'json',
		data: urlParams ,
		success: function(result) {
			//populate dbInfo and instInfo with info from response
			dbInfo.instructorid = result.instructor.id;
			instInfo = { fname:result.instructor.fname,
			mname:result.instructor.mname, lname:result.instructor.lname,
			dept:result.instructor.department };

			//hide Login tab, show Roster, Attendance, Grades, and Reports tabs
			$('#loginTab').css('display', 'none');
			//$('#sectionTab').css('display', 'inline');
			//$('ul.tabs').tabs('select_tab', 'sections');


			//populate instructor name and display profile (including logout menu)
			//Array.prototype.join is used because in JS: '' + null = 'null'
			var instName = [instInfo.fname, instInfo.mname, instInfo.lname].join(' ');
			$('#instName').html(instName);
			$('#profile').css('display', 'inline');

			callback();
		},
		error: function(result) {
			//currently does not distinguish between credential and connection errors
			switch (result.responseText) {
				case '500 - Authentiaction failed'://Authentiaction failed
					showAlert('<h5>Could not login</h5><p>Login failed - credentials ' +
					'incorrect</p><p>Please re-enter credentials</p>');
					break;
				case '500 - Database does not exist'://Database does not exist
					showAlert('<h5>Could not connect</h5><p> Connnection failed - unknown ' +
					'database, ensure the database name is correct');
					break;
				case '500 - Connnection Refused'://Refused Connnection (likely an incorrect port)
					showAlert('<h5>Could not connect</h5><p> Connnection refused - ' +
					'ensure that the correct port is being used');
					break;
				case '500 - Host not found'://Invalid host
					showAlert('<h5>Could not connect</h5><p> Connnection failed - ' +
					'ensure the hostname is correct');
					break;
				default:
					showAlert('<h5>Could not login</h5><p>Unknown error - Please contact ' +
				  'your administrator');
			}
			console.log(result);
		}
	});
};

function goToAssessmentTypeMgmt() {
	document.cookie = "dbInfo=" + JSON.stringify(dbInfo) + ";path=/";
	document.cookie = "instInfo=" + JSON.stringify(instInfo) + ";path=/";
	console.log(document.cookie);
	window.location.href = "../manageAssessmentTypesForm.html";
};

function goToStudentGradesMgmt() {
	document.cookie = "dbInfo=" + JSON.stringify(dbInfo) + ";path=/";
	document.cookie = "instInfo=" + JSON.stringify(instInfo) + ";path=/";
	console.log(document.cookie);
	window.location.href = "../manageStudentGradesForm.html";
};

function popYears(connInfo) {
	$.ajax('years', {
		dataType: 'json',
		data: connInfo,
		success: function(result) {
			var years = '';
			for (var i = 0; i < result.years.length; i++) {
				years += '<option value="' + result.years[i] + '">' +
				 result.years[i] + '</option>';
			}
			setYears(years);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving years</p>');
			console.log(result);
		}
	});
};

function popSeasons(connInfo, year) {
	var urlParams = $.extend({}, connInfo, {year:year});
	$.ajax('seasons', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var seasons = '';
			for (var i = 0; i < result.seasons.length; i++) {
				seasons += '<option value="' + result.seasons[i].seasonorder +
				 '">' + result.seasons[i].seasonname + '</option>';
			}
			setSeasons(seasons);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving seasons</p>');
			console.log(result);
		}
	});
};

function popCourses(connInfo, year, seasonorder) {
	var urlParams = $.extend({}, connInfo, {year:year, seasonorder:seasonorder});
	$.ajax('courses', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var courses = '';
			for (var i = 0; i < result.courses.length; i++) {
				courses += '<option value="' + result.courses[i] + '">' +
				 result.courses[i] + '</option>';
			}
			setCourses(courses);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving courses</p>');
			console.log(result);
		}
	});
};

function popSections(connInfo, year, seasonorder, coursenumber) {
	var urlParams = $.extend({}, connInfo, {year:year, seasonorder:seasonorder,
	 coursenumber:coursenumber});
	$.ajax('sections', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var sections = '';
			for (var i = 0; i < result.sections.length; i++) {
				sections += '<option value="' + result.sections[i].sectionid +
				 '">' + result.sections[i].sectionnumber + '</option>';
			}
			setSections(sections);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving sections</p>');
			console.log(result);
		}
	});
};

function popAttendance(connInfo, sectionid) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid});
	$.ajax('attendance', {
		dataType: 'html',
		data: urlParams,
		success: function(result) {
			setAttendance(result);
		},
		error: function(result) {
			if (result.responseText == '500 - No Attenance Records') {
				showAlert('<p>No attendance records exist for this section</p>');
			}
			else {
				showAlert('<p>Error while retrieving attendance data</p>');
			}
			setAttendance(null);
			console.log(result);
		}
	});
};

function popAssessmentTypes(connInfo, sectionid) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid});
	$.ajax('assessmentTypes', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var assessTypes = '';
			for (var i = 0; i < result.assessTypes.length; i++) {
				assessTypes += '<option value="' + result.assessTypes[i].componentID +
				 '">' + result.assessTypes[i].componenttype + '</option>';
			}
			setAssessmentTypes(assessTypes);
		},
		error: function(result) {
			if (result.responseText == '500 - No Assessment Types')
			{
				showAlert('<p>No assessment types exist for this section</p>');
			}
			else
			{
				showAlert('<p>Error while retrieving assessment types</p>');
			}
			console.log(result);
		}
	});
};

function popAssessmentItems(connInfo, sectionid, assessid) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid, assessid:assessid});
	$.ajax('assessmentItems', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			$('#typeInput').val(result.assessType);
			$('#weightInput').val(result.assessWeight);
			$('#descriptionInput').val(result.assessDescription);
			setAssessmentItems(result.assessItemTable);
		},
		error: function(result) {
			showAlert('<p>Error while retrieving assessment items</p>');
			console.log(result);
			setAssessmentItems(null);
		}
	});
};

function setYears(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose year</option>' + htmlText;
	$('#yearSelect').html(content);
	$('#yearSelect').prop('disabled', htmlText == null);
	$('#yearSelect').material_select(); //reload dropdown

	setSeasons(null); //reset dependent fields
};

function setSeasons(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose season</option>' + htmlText;
	$('#seasonSelect').html(content);
	$('#seasonSelect').prop('disabled', htmlText == null);
	$('#seasonSelect').material_select(); //reload dropdown

	setCourses(null); //reset dependent fields
};

function setCourses(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose course</option>' + htmlText;
	$('#courseSelect').html(content);
	$('#courseSelect').prop('disabled', htmlText == null);
	$('#courseSelect').material_select(); //reload dropdown

	setSections(null); //reset dependent fields
};

function setSections(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose section</option>' + htmlText;
	$('#sectionSelect').html(content);
	$('#sectionSelect').prop('disabled', htmlText == null);
	$('#sectionSelect').material_select(); //reload dropdown

	setAttendance(null);
	setAssessmentTypes(null);
};

function setAttendance(htmlText) {
	var showPs = $('#opt-showPresent').is(':checked');
	var isCompact = $('#opt-compactTab').is(':checked');

	if (htmlText == null) {
		$('#attendanceData').html('');
		$('#attnOptionsBox').css('display', 'none');
	}
	else {
		if (htmlText.substring(0, 7) !== '<table>') {
			console.log('WARN: setAttendance(): Unable to style attendance table;' +
			 ' first 7 chars did not match "<table>"');
		}
		else {
			if (!showPs) {
				//replace all 'P' fields with a space
				htmlText = htmlText.replace(/>P<\/td>/g, '> </td>');
			}
			if (isCompact) {
				//add attibutes to <table> tag to use compact framework styling
				htmlText = '<table class="striped" style="line-height:1.1;">' +
				 htmlText.substring(7);

				//give all td tags the "compact" class
				htmlText = htmlText.replace(/<td /g, '<td class="compact" ');
			}
			else {
				//add attibutes to <table> tag to use non-compact framework styling
				htmlText = '<table class="striped">' + htmlText.substring(7);
			}
		}
		$('#attnOptionsBox').css('display', 'block');
		$('#attendanceData').html(htmlText);
	}
};

function setAssessmentTypes(htmlText) {
	var content = '<option value="" disabled="true" selected="true">' +
	 'Choose an assessment type</option>' + htmlText;
	$('#assessmentTypeSelect').html(content);
	$('#assessmentTypeSelect').prop('disabled', htmlText == null);
	$('#assessmentTypeSelect').material_select(); //reload dropdown

	setAssessmentItems(null); //reset dependent fields
};

function setAssessmentItems(htmlText) {
	console.log(htmlText);
	if (htmlText == null) {
		$('#newItem').css('display', 'none');
		$('#assessmentItemTable').html('');
		$('#btnChangeAssessType').css('display', 'none');
		$('#btnDeleteAssessType').css('display', 'none');
	}
	else {
		$('#assessmentItemTable').html(htmlText);
		$('#newItem').css('display', 'inline');
	}
	$('#newItemSubmit, #newItemBasePoints, #newItemExtraPoints, #newItemAssignedDate, #newItemDueDate').css('display', 'none');
};

function insertNewAssessType(connInfo, sectionid, componenttype, weight, description) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid, componenttype:componenttype, weight:weight, description:description});
	$.ajax('assessmentTypesInsert', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows added");
		},
		error: function(result) {
			showAlert('<p>Error while inserting assessment type</p>');
			console.log(result);
		}
	});
};

function insertNewAssessItem(connInfo, assessid, basePoints, extraCreditPoints,
														 assignedDate, dueDate) {
	var urlParams = $.extend({}, connInfo, {assessid:assessid, basePoints:basePoints,
		extraCreditPoints:extraCreditPoints, assignedDate:assignedDate, dueDate:dueDate});
	$.ajax('assessmentItemsInsert', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows added");
		},
		error: function(result) {
			showAlert('<p>Error while inserting assessment item</p>');
			console.log(result);
		}
	});
};

function updateAssessType(connInfo, assessid, componenttype, weight, description) {
	var urlParams = $.extend({}, connInfo, {assessid:assessid, componenttype:componenttype, weight:weight, description:description});
	console.log(assessid);
	$.ajax('assessmentTypesUpdate', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows updated");
		},
		error: function(result) {
			showAlert('<p>Error while updating assessment type</p>');
			console.log(result);
		}
	});
};

function updateAssessItem(connInfo, assessid, sequenceincomponent, basepoints, extracreditpoints,
														 assigneddate, duedate, curve) {
  var urlParams = $.extend({}, connInfo, {assessid:assessid,
		sequenceincomponent:sequenceincomponent, basepoints:basepoints,
		extracreditpoints:extracreditpoints, assigneddate:assigneddate,
		duedate:duedate, curve:curve});
	$.ajax('assessmentItemsUpdate', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows updated");
		},
		error: function(result) {
			showAlert('<p>Error while updating assessment item</p>');
			console.log(result);
		}
	});
};

function deleteAssessType(connInfo, assessid)
{
	var urlParams = $.extend({}, connInfo, {assessid:assessid});
	$.ajax('assessmentTypesDelete', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows deleted");
		},
		error: function(result) {
			showAlert('<p>Error while deleting assessment type</p>');
			console.log(result);
		}
	});
};

function deleteAssessItem(connInfo, assessid, sequenceincomponent) {
	var urlParams = $.extend({}, connInfo, {assessid:assessid, sequenceincomponent:sequenceincomponent});
	$.ajax('assessmentItemsDelete', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows deleted");
		},
		error: function(result) {
			showAlert('<p>Error while deleting assessment item</p>');
			console.log(result);
		}
	});
};
