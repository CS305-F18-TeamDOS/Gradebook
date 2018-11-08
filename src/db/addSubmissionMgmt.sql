--addSubmissionMgmt.sql - GradeBook

--Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Created for CS305-71
--Date of Revision: 11/8/2018

--this script creates the functions used by Team DOS's Gradebook
--implements management features for Submissions
--This includes: reading, deleting, updating



CREATE OR REPLACE FUNCTION CreateSubmission(Student INT, Section INT,
                                            Component INT, SequenceInComponent INT
                                            BasePointsEarned NUMERIC,
                                            ExtraCreditPointsEarned NUMERIC
                                            SubmissionDate DATE, Penalty NUMERIC,
                                            InstructorNote VARCHAR)
RETURNS BOOLEAN AS
$$
BEGIN

  INSERT INTO Submission
  VALUES(Student, Section, Component, SequenceInComponent BasePointsEarned,
        ExtraCreditPointsEarned, SubmissionDate, Penalty, InstructorNote);

  --returns true if successful
  RETURN TRUE;

END;
$$ LANGUAGE plpgsql
   VOLATILE
   RETURNS NULL ON NULL INPUT
   SECURITY INVOKER;
