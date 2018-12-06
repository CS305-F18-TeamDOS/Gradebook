--addSubmissionMgmt.sql - GradeBook

--Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Created for CS305-71
--Date of Revision: 11/8/2018

--this script creates the functions used by Team DOS's Gradebook
--implements management features for Submissions
--This includes: reading, deleting, updating

--------------------------------------------------------------------------------
--Insert a submission into the database
CREATE OR REPLACE FUNCTION CreateSubmission(Student INT, Section INT,
                                            Component INT, SequenceInComponent INT,
                                            BasePointsEarned NUMERIC,
                                            ExtraCreditPointsEarned NUMERIC,
                                            SubmissionDate DATE, Penalty NUMERIC,
                                            InstructorNote VARCHAR)
RETURNS BOOLEAN AS
$$
BEGIN

  INSERT INTO Submission(Student, Section, Component, SequenceInComponent, BasePointsEarned,
                          ExtraCreditPointsEarned, SubmissionDate, Penalty, InstructorNote)
  VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9);

  --returns true if successful
  RETURN TRUE;

END
$$ LANGUAGE plpgsql
   VOLATILE
   CALLED ON NULL INPUT
   SECURITY INVOKER;

--------------------------------------------------------------------------------
--remove a submission where the Student, Section, Component, and SequenceInComponent
--are all a match for the given parameters
CREATE OR REPLACE FUNCTION removeSubmission(StudentID INT, SectionID INT, ComponentID INT,
                                            SequenceInComponent INT)
RETURNS BOOLEAN AS
$$
BEGIN

  DELETE FROM Submission
  WHERE Submission.Student = $1 AND Submission.Section = $2 AND
        Submission.Component = $3 AND Submission.SequenceInComponent = $4;

  RETURN TRUE;

END
$$ LANGUAGE plpgsql
    VOLATILE
    RETURNS NULL ON NULL INPUT
    SECURITY INVOKER;

--------------------------------------------------------------------------------
--This function returns one instance of submission, where the given StudentID, SectionID
--AssessmentComponentID, and SequenceInComponent match the values of that instance
CREATE OR REPLACE FUNCTION getSubmission(StudentID INT, SectionID INT, ComponentID INT,
                                          SequenceInComponent INT)
RETURNS TABLE
(
  BasePointsEarned NUMERIC(6,2),
  ExtraCreditPointsEarned NUMERIC(6,2),
  SubmissionDate DATE,
  Penalty NUMERIC(6,2),
  InstructorNote VARCHAR
)
AS
$$

  SELECT BasePointsEarned, ExtraCreditPointsEarned, SubmissionDate, Penalty, InstructorNote
  FROM Submission WHERE Submission.Student = $1 AND Submission.Section = $2 AND
                        Submission.Component = $3 AND Submission.SequenceInComponent = $4;
$$ LANGUAGE sql
    STABLE
    RETURNS NULL ON NULL INPUT
    SECURITY INVOKER;

--------------------------------------------------------------------------------
--Takes 6 parameters, one for each attribute of Submission
--The first four paramters, Student, Section, Component and SequenceInComponent, form the PK
-- of the Submission to update
--The other parameters are updated attrbiute values
--All attributes of a Submission (except the PK attributes) allow NULL,
-- so entires of NULL will be changed as such
CREATE OR REPLACE FUNCTION updateSubmission(Student INT, Section INT,
                                            Component INT, SequenceInComponent INT,
                                            BasePointsEarned NUMERIC,
                                            ExtraCreditPointsEarned NUMERIC,
                                            SubmissionDate DATE, Penalty NUMERIC,
                                            InstructorNote VARCHAR)
RETURNS INTEGER AS
$$
DECLARE
  affectedRowCount INTEGER;
BEGIN

  UPDATE Submission
  SET    BasePointsEarned = $5,
         ExtraCreditPointsEarned = $6,
         SubmissionDate = $7,
         Penalty = $8,
         InstructorNote = $9
  WHERE Submission.Student = $1 AND Submission.Section = $2 AND
        Submission.Component = $3 AND Submission.SequenceInComponent = $4;
  GET DIAGNOSTICS affectedRowCount = ROW_COUNT;

  RETURN affectedRowCount;

END;
$$ LANGUAGE plpgsql
    VOLATILE
    CALLED ON NULL INPUT
    SECURITY INVOKER;
