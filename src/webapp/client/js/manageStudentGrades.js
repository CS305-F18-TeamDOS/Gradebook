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
var sectionID = getCookie("sectionID");
var assessID = getCookie("assessID");
console.log(sectionID);
console.log(assessID);

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

  $('#assessmentItemSelect').change(function() {
    popEnrollees(dbInfo, sectionID);
  });

  $('#studentSelect').change(function() {
    var sequenceInComponent = $('#assessmentItemSelect').val();
    var enrollee = $('#studentSelect').val();


    getSubmission(dbInfo, sectionID, assessID, enrollee, sequenceInComponent);
  });

  $('#btnAddSubmission').click(function() {
    var sequenceInComponent = $('#assessmentItemSelect').val();
    var enrollee = $('#studentSelect').val();
    var basePointsEarned = $('#basePointsEarnedInput').val();
    var extraCreditPointsEarned = $('#extraCreditPointsEarnedInput').val();
    var submissionDate = $('#submissionDateInput').val();
    var penalty = $('#penaltyInput').val();
    var instructorNote = $('#instructorNotesInput').val();
    insertNewSubmission(dbInfo, sectionID, assessID, enrollee, sequenceInComponent,
                  basePointsEarned, extraCreditPointsEarned, submissionDate,
                  penalty, instructorNote);

    getSubmission(dbInfo, sectionID, assessID, enrollee, sequenceInComponent);
  });

  $('#btnEditSubmission').click(function() {
    var sequenceInComponent = $('#assessmentItemSelect').val();
    var enrollee = $('#studentSelect').val();
    var basePointsEarned = $('#basePointsEarnedInput').val();
    var extraCreditPointsEarned = $('#extraCreditPointsEarnedInput').val();
    var submissionDate = $('#submissionDateInput').val();
    var penalty = $('#penaltyInput').val();
    var instructorNote = $('#instructorNotesInput').val();
    updateSubmission(dbInfo, sectionID, assessID, enrollee, sequenceInComponent,
                  basePointsEarned, extraCreditPointsEarned, submissionDate,
                  penalty, instructorNote);

    getSubmission(dbInfo, sectionID, assessID, enrollee, sequenceInComponent);
  });

  $('#btnDeleteSubmission').click(function() {
    var sequenceInComponent = $('#assessmentItemSelect').val();
    var enrollee = $('#studentSelect').val();
    deleteSubmission(dbInfo, sectionID, assessID, enrollee, sequenceInComponent);

    getSubmission(dbInfo, sectionID, assessID, enrollee, sequenceInComponent);
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

function popAssessmentItems(connInfo, sectionid, assessid) {
  var urlParams = $.extend({}, connInfo, {sectionid:sectionid, assessid:assessid});
	$.ajax('assessmentItemsForSubmission', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var assessItems = '';
			for (var i = 0; i < result.assessItems.length; i++) {
				assessItems += '<option value="' + result.assessItems[i].sequenceincomponent +
				 '">' + result.assessItems[i].sequenceincomponent + '</option>';
			}
			setAssessmentItems(assessItems);
		},
		error: function(result) {
			if (result.responseText == '500 - No Assessment Items')
			{
				showAlert('<p>No assessment items exist for this component</p>');
			}
			else
			{
				showAlert('<p>Error while retrieving assessment items</p>');
			}
			console.log(result);
		}
	});
};

function popEnrollees(connInfo, sectionid) {
  var urlParams = $.extend({}, connInfo, {sectionid:sectionid});
	$.ajax('enrollees', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			var enrollees = '';
			for (var i = 0; i < result.enrollees.length; i++) {
				enrollees += '<option value="' + result.enrollees[i].student +
				 '">' + result.enrollees[i].student + '</option>';
			}
			setEnrollees(enrollees);
		},
		error: function(result) {
			if (result.responseText == '500 - No Assessment Items')
			{
				showAlert('<p>No assessment items exist for this component</p>');
			}
			else
			{
				showAlert('<p>Error while retrieving assessment items</p>');
			}
			console.log(result);
		}
	});
};

function getSubmission(connInfo, sectionid, assessid, enrollee, sequenceincomponent) {
  var urlParams = $.extend({}, connInfo, {sectionid:sectionid, enrollee:enrollee,
  assessid:assessid, sequenceincomponent:sequenceincomponent});
	$.ajax('submission', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
      console.log(result);
      $('#basePointsEarnedInput').prop('disabled', false);
			$('#basePointsEarnedInput').val(result.basepointsearned);
      $('#extraCreditPointsEarnedInput').prop('disabled', false);
      $('#extraCreditPointsEarnedInput').val(result.extracreditpointsearned);
      $('#submissionDateInput').prop('disabled', false);
      $('#submissionDateInput').val(result.submissiondate);
      $('#penaltyInput').prop('disabled', false);
      $('#penaltyInput').val(result.penalty);
      $('#instructorNotesInput').prop('disabled', false);
      $('#instructorNotesInput').val(result.instructornote);

      setSubmission(true);
    },
		error: function(result) {
			if (result.responseText == '500 - No Assessment Items')
			{
				showAlert('<p>No assessment items exist for this component</p>');
			}
			else
			{
				showAlert('<p>Error while retrieving assessment items</p>');
			}
			console.log(result);
		}
	});
};

function setAssessmentItems(htmlText) {
  	var content = '<option value="" disabled="true" selected="true">' +
  	 'Choose an assessment item</option>' + htmlText;
  	$('#assessmentItemSelect').html(content);
  	$('#assessmentItemSelect').prop('disabled', htmlText == null);
  	$('#assessmentItemSelect').material_select(); //reload dropdown

  	setEnrollees(null); //reset dependent fields
};

function setEnrollees(htmlText) {
  	var content = '<option value="" disabled="true" selected="true">' +
  	 'Choose an Enrollee</option>' + htmlText;
  	$('#studentSelect').html(content);
  	$('#studentSelect').prop('disabled', htmlText == null);
  	$('#studentSelect').material_select(); //reload dropdown

  	setSubmission(false); //reset dependent fields
};

function setSubmission(doSet) {
	if (doSet) {
		$('#btnEditSubmission').css('display', 'inline-block');
		$('#btnDeleteSubmission').css('display', 'inline-block');
	}
  else{
    $('#btnEditSubmission').css('display', 'none');
		$('#btnDeleteSubmission').css('display', 'none');
  }
};

function insertNewSubmission(connInfo, sectionid, assessid, enrollee,
   sequenceincomponent, basepointsearned, extracreditpointsearned, submissiondate,
   penalty, instructornote) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid, assessid:assessid,
   enrollee:enrollee, sequenceincomponent:sequenceincomponent,
   basepointsearned:basepointsearned, extracreditpointsearned:extracreditpointsearned,
   submissiondate:submissiondate, penalty:penalty, instructornote:instructornote});
	$.ajax('submissionInsert', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows added");
		},
		error: function(result) {
			showAlert('<p>Error while inserting submission</p>');
			console.log(result);
		}
	});
};

function updateSubmission(connInfo, sectionid, assessid, enrollee,
   sequenceincomponent, basepointsearned, extracreditpointsearned, submissiondate,
   penalty, instructornote) {
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid, assessid:assessid,
   enrollee:enrollee, sequenceincomponent:sequenceincomponent,
   basepointsearned:basepointsearned, extracreditpointsearned:extracreditpointsearned,
   submissiondate:submissiondate, penalty:penalty, instructornote:instructornote});
	console.log(assessid);
	$.ajax('submissionUpdate', {
		dataType: 'json',
		data: urlParams,
		success: function(result) {
			console.log(result.rowCount + " rows updated");
		},
		error: function(result) {
			showAlert('<p>Error while updating submission</p>');
			console.log(result);
		}
	});
};

function deleteSubmission(connInfo, sectionid, assessid, enrollee,
   sequenceincomponent)
{
	var urlParams = $.extend({}, connInfo, {sectionid:sectionid, assessid:assessid,
   enrollee:enrollee, sequenceincomponent:sequenceincomponent});
	$.ajax('submissionDelete', {
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


popAssessmentItems(dbInfo, sectionID, assessID);
