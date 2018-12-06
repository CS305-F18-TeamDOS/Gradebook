--addAssessmentItemMgmt.sql - GradeBook

--Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Created for CS305-71
--Date of Revision: 11/8/2018

--this script creates the functions used by Team DOS's Gradebook
--implements management features for AssessmentItems
--This includes: reading, deleting, updating

--Spool results to a file in the current directory
\o spoolAddAssessmentItemMgmt.txt

--Echo time, date and user/server/DB info
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS createAssessmentItem(INT, INT, NUMERIC(6, 2), NUMERIC(6, 2), DATE, DATE, NUMERIC(5, 2));
--This function inserts a new AssessmentComponent with the given parameters
--as values to insert
CREATE OR REPLACE FUNCTION createAssessmentItem(
                                Component INT, SequenceInComponent INT,
                                BasePoints NUMERIC(6,2), ExtraCreditPoints NUMERIC(6,2),
                                AssignedDate DATE, DueDate DATE, Curve NUMERIC(5,2))
RETURNS BOOLEAN AS
$$
BEGIN

  --insert given parameters into AssessmentComponent
  INSERT INTO AssessmentItem(Component, SequenceInComponent, BasePoints, ExtraCreditPoints,
                              AssignedDate, DueDate, Curve)
  VALUES ($1, $2, $3, $4, $5, $6, $7);

  RETURN TRUE;

END
$$
LANGUAGE plpgsql
  VOLATILE
  CALLED ON NULL INPUT
  SECURITY INVOKER;

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS removeAssessmentItem(INT, INT);
--this function is used to fully remove an AssessmentItem and it's dependents
--begins by deleting all sumbissions that refference the AssessmentItem to delete
--then deleting the AssessmentItem indicated by the input parameter
CREATE OR REPLACE FUNCTION removeAssessmentItem(Component INT, ItemID INT)
RETURNS BOOLEAN AS
$$
BEGIN

  --delete submissions first
  --submission have a foreign key to AssessmentComponent and AssessmentItem
  DELETE FROM Submission WHERE Submission.Component = $1 AND SequenceInComponent = $2;

  --now we can delete from AssessmentItem
  --AssessmentItem has a foreign key to AssessmentComponent
  DELETE FROM AssessmentItem WHERE AssessmentItem.Component = $1 AND SequenceInComponent = $2;

  --returns true if successful
  RETURN TRUE;

END;
$$ LANGUAGE plpgsql
   VOLATILE
   RETURNS NULL ON NULL INPUT
   SECURITY INVOKER;

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS getAssessmentItem(INT, INT);
--This functions returns 1 rows of AssessmentItem,
--where the item has the given ComponentID and SequenceInComponent
CREATE OR REPLACE FUNCTION getAssessmentItem(ComponentID INT,
                                              SequenceInComponent INT)
RETURNS TABLE
(
  Component INT,
  SequenceInComponent INT,
  BasePoints NUMERIC(6,2),
  ExtraCreditPoints NUMERIC(6,2),
  AssignedDate DATE,
  DueDate DATE,
  Curve NUMERIC(5,2)
)
AS
$$

      SELECT  Component, SequenceInComponent, BasePoints, ExtraCreditPoints,
      AssignedDate, DueDate, Curve
      FROM AssessmentItem WHERE AssessmentItem.Component = $1 AND
                                AssessmentItem.SequenceInComponent = $2;

$$ LANGUAGE sql
    STABLE
    RETURNS NULL ON NULL INPUT
    SECURITY INVOKER;

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS getAssessmentItemsFromComponent(INT);
--This functions returns a table containing 0 or more rows of AssessmentItems
--where each row shares a Component
CREATE OR REPLACE FUNCTION getAssessmentItemsFromComponent(ComponentID INTEGER)
RETURNS TABLE
(
  SequenceInComponent INT,
  BasePoints NUMERIC(6,2),
  ExtraCreditPoints NUMERIC(6,2),
  AssignedDate DATE,
  DueDate DATE,
  Curve NUMERIC(5,2)
)
AS
$$

      SELECT SequenceInComponent, BasePoints, ExtraCreditPoints,
      AssignedDate, DueDate, Curve
      FROM AssessmentItem
      WHERE AssessmentItem.Component = $1;

$$ LANGUAGE sql
    STABLE
    RETURNS NULL ON NULL INPUT
    SECURITY INVOKER;

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS updateAssessItem(INT, INT, NUMERIC(6, 2), NUMERIC(6, 2), DATE, DATE, NUMERIC(5, 2));
--Takes 6 parameters, one for each attribute of AssessmentItem
--The first two paramters, ComponentID and SequenceInComponent, form the PK
-- of the Item to update
--The other parameters are updated attrbiute values
--Any NULL input for BasePoints will be ignored, as it does not allow NULL
--AssignedDate, DueDate, and Curve allows a change to a NULL input,
-- as per the table's definition
CREATE OR REPLACE FUNCTION updateAssessmentItem(ComponentID INT,
                                                SequenceInComponent INT,
                                                BasePoints NUMERIC(6,2),
                                                ExtraCreditPoints NUMERIC(6,2),
                                                AssignedDate DATE,
                                                DueDate DATE,
                                                Curve NUMERIC(5,2))
RETURNS INTEGER AS
$$
DECLARE
  affectedRowCount INTEGER;
BEGIN

  UPDATE AssessmentItem
  SET    BasePoints = COALESCE($3, AssessmentItem.BasePoints),
         ExtraCreditPoints = COALESCE($4, AssessmentItem.ExtraCreditPoints),
         AssignedDate = $5,
         DueDate = $6,
         Curve = COALESCE($7, AssessmentItem.Curve)
  WHERE (Component = $1 AND AssessmentItem.SequenceInComponent = $2);
  GET DIAGNOSTICS affectedRowCount = ROW_COUNT;

  RETURN affectedRowCount;

END;
$$ LANGUAGE plpgsql
    VOLATILE
    CALLED ON NULL INPUT
    SECURITY INVOKER;

\o
