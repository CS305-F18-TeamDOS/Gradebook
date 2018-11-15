--addAssessmentItemMgmt.sql - GradeBook

--Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Created for CS305-71
--Date of Revision: 11/8/2018

--this script creates the functions used by Team DOS's Gradebook
--implements management features for AssessmentItems
--This includes: reading, deleting, updating

--this function is used to fully remove an AssessmentItem and it's dependents
--begins by deleting all sumbissions that refference the AssessmentItem to delete
--then deleting the AssessmentItem indicated by the input parameter
CREATE OR REPLACE FUNCTION RemoveAssessmentItem(ItemToDelete INT)
RETURNS BOOLEAN AS
$$
BEGIN

  --delete submissions first
  --submission have a foreign key to AssessmentComponent and AssessmentItem
  DELETE FROM Submission WHERE Component = $1;

  --now we can delete from AssessmentItem
  --AssessmentItem has a foreign key to AssessmentComponent
  DELETE FROM AssessmentItem WHERE Component = $1;

  --returns true if successful
  RETURN TRUE;

END;
$$ LANGUAGE plpgsql
   VOLATILE
   RETURNS NULL ON NULL INPUT
   SECURITY INVOKER;

--This functions returns all rows of AssessmentItem
CREATE OR REPLACE FUNCTION getAssessmentItems()
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
      FROM AssessmentItem;

$$ LANGUAGE sql
    STABLE
    ROWS 1;

--This functions returns a table containing 1 row of an AssessmentItem
--where the row has the given Component and SequenceInComponent
CREATE OR REPLACE FUNCTION getAssessmentItemsWithComponent
                              (ComponentID INT, SequenceInComponent INT)
RETURNS TABLE
(
  BasePoints NUMERIC(6,2),
  ExtraCreditPoints NUMERIC(6,2),
  AssignedDate DATE,
  DueDate DATE,
  Curve NUMERIC(5,2)
)
AS
$$

      SELECT BasePoints, ExtraCreditPoints,
      AssignedDate, DueDate, Curve
      FROM AssessmentItem
      WHERE Component = $1 AND SequenceInComponent = $2;

$$ LANGUAGE sql
    STABLE
    RETURNS NULL ON NULL INPUT;

--This functions returns a table containing 0 or more rows of AssessmentItems
--where each row shares a Component
CREATE OR REPLACE FUNCTION getAssessmentItemsWithComponent(ComponentID INTEGER)
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
      WHERE Component = $1;

$$ LANGUAGE sql
    STABLE
    RETURNS NULL ON NULL INPUT;
