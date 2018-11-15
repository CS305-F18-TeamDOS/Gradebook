/*
index.js - Gradebook

Andrew Figueroa
Data Science & Systems Lab (DASSL), Western Connecticut State University

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
	"host":null, "port":null, "database":null, "user":null, "password":null,
	 "instructorid":null
};
var instInfo = { "fname":null, "mname":null, "lname": null, "dept":null };

/*
Each instance of connInfo as a parameter in a function definition refers to an
 object with the following keys, which are used as part of the REST API calls to
 the Gradebook server:
	"host":String, "port":Number, "database":String, "user":String,
	 "password":String, "instructorid":Number
*/


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
		if (dbInfo != null && email != '') {
			serverLogin(dbInfo, email, function() {
				//clear login fields and close DB Info box
				$('#email').val('');
				$('#passwordBox').val('');
				$('#dbInfoBox').collapsible('close', 0);
				$('#dbInfoArrow').html('keyboard_arrow_down');

				popYears(dbInfo);
			});
		}
		else {
			showAlert('<h5>Missing field(s)</h5><p>One or more fields are ' +
			 'not filled in.</p><p>All fields are required, including those in ' +
			 'DB Info.</p>');
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
	});

	$('#getFields').click(function() {
		// to be implemented
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
	var host = $('#host').val().trim();
	var port = $('#port').val().trim();
	var db = $('#database').val().trim();
	var uname = $('#user').val().trim();
	var pw =  $('#passwordBox').val().trim();

	if (host === "" || port === "" || db === "" || uname === "" || pw === "") {
		return null;
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
			$('#sectionTab').css('display', 'inline');
			$('ul.tabs').tabs('select_tab', 'sections');

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
	if (htmlText == null) {
		$('#assessmentItemTable').html('');
	}
	else {
		if (htmlText.substring(0, 7) !== '<table>') {
			console.log('WARN: setAssessmentItems(): Unable to style assessment item table;' +
			 ' first 7 chars did not match "<table>"');
		}
		else {
			//add attibutes to <table> tag to use non-compact framework styling
			htmlText = '<table class="striped">' + htmlText.substring(7);
		}
		$('#assessmentItemTable').html(htmlText);
	}
};

function insertNewAssessType(connInfo, sectionid, type, weight, description) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid, type:type, weight:weight, description:description});
	$.ajax('assessmentTypesInsert', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {

		},
		error: function(result) {
			showAlert('<p>Error while inserting assessment type</p>');
			console.log(result);
		}
	});
}

function insertNewAssessItem(connInfo, assessid, basePoints, extraCreditPoints,
														 assignedDate, dueDate) {
	var urlParams = $.extend({}, connInfo, {assessid:assessid, basePoints:basePoints,
		extraCreditPoints:extraCreditPoints, assignedDate:assignedDate, dueDate:dueDate});
	$.ajax('assessmentItemsInsert', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {

		},
		error: function(result) {
			showAlert('<p>Error while inserting assessment item</p>');
			console.log(result);
		}
	});
}
