/*
assessmentTypeMgmt.js - Gradebook

Andrew Figueroa
Data Science & Systems Lab (DASSL), Western Connecticut State University


Modified by team DOS (Kyle Bella, Kenneth Kozlowski and Joseph Tether)
CS 305-71 @ WCSU
Last To Make Modification: Kyle Bella
Date of Last Revision: 12/2/2018


Copyright (c) 2017- DASSL. ALL RIGHTS RESERVED.
Licensed to others under CC 4.0 BY-NC-SA
https://creativecommons.org/licenses/by-nc-sa/4.0/

ALL ARTIFACTS PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

This JavaScript file provides the client-side JS code that is used by the manageAssessmentTypesForm.html
page. The functionality provided includes accessing the REST API provided by the web
server component of the Gradebook webapp, along with providing interactivity for the
manageAssessmentTypesForm.html webpage.
*/

/*
This function gets the cookies set by the previous page
*/
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i<ca.length; i++)
  {
    var c = ca[i];
    while (c.charAt(0) == ' ')
    {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0)
    {
      return JSON.parse(c.substring(name.length, c.length));
    }
  }
  return "";
}
/*
Set the global variables to the values of the cookies.
*/
var dbInfo = getCookie("dbInfo");
var instInfo = getCookie("instInfo");
console.log(dbInfo);
console.log(instInfo);

/*
Keep the original assessment data so changing the fields is only permanent when
 user presses "Submit"
*/
var assessOrginInfo = {
	"basePoints":null, "extraCreditPoints":null, "assignedDate":null,
	"dueDate":null, "curve":null
};

popYears(dbInfo);

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
		//$('#rosterTab, #attnTab, #assessTab, #gradesTab, #reportsTab').css('display', 'inline');
    document.cookie = "sectionID=" + sectionID + ";path=/";
    $('#submit_to_Assessment_Mgmt').prop('disabled', false);
    //setAssessmentTypes(null);
		//popAttendance(dbInfo, sectionID);
		//popAssessmentTypes(dbInfo, sectionID);
	});

  $('#submit_to_Assessment_Mgmt').click(function() {
    window.location.href = "../manageAssessments.html";
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
		tr.find('#sequence').html('<a id="submitUpdate" class="waves-effect waves-light btn">Update</a><br/>&nbsp;' +
															'<a id="submitDelete" class="waves-effect waves-light btn">Delete</a><br><br>' +
														  '<a id="closeFields" class="waves-effect waves-light btn">Close</a><br><br>');
		assessOrginInfo.basePoints = tr.find('#basepoint').html();
		tr.find('#basepoint').html('<input id="basePointsInput" value="' + assessOrginInfo.basePoints + '" type="text"/>');
		assessOrginInfo.extraCreditPoints = tr.find('#extrapoint').html();
		tr.find('#extrapoint').html('<input id="extraCreditPointsInput" value="' + assessOrginInfo.extraCreditPoints);
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

	$('#btnLogout').click(function() {
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

popYears(dbInfo);
