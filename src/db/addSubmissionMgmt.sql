--addSubmissionMgmt.sql - GradeBook

--Created By Team DOS - Fall 2018 CS305-71
-- Kyle Bella, Kenneth Kozlowski, Joe Tether


--this script creates the functions used by Team DOS's Gradebook
--implements management features for Submissions
--This includes: reading, deleting, updating

--Spool results to a file in the current directory
\o spoolAddSubmissionMgmt.txt

--Echo time, date and user/server/DB info
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS CreateSubmission(INT, INT, INT, INT, NUMERIC, NUMERIC, DATE, NUMERIC, VARCHAR);
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
DROP FUNCTION IF EXISTS removeSubmission(INT, INT, INT, INT);
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
DROP FUNCTION IF EXISTS getSubmission(INT, INT, INT, INT);
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
DROP FUNCTION IF EXISTS updateSubmission(INT, INT, INT, INT, NUMERIC, NUMERIC, DATE, NUMERIC, VARCHAR);
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

\o
