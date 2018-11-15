--addAssessmentItemMgmt.sql - GradeBook

--Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Created for CS305-71
--Date of Revision: 11/8/2018

--this script creates the functions used by Team DOS's Gradebook
--implements management features for AssessmentItems
--This includes: reading, deleting, updating


--This function inserts a new AssessmentComponent with the given parameters
--as values to insert
CREATE OR REPLACE FUNCTION createAssessmentComponent(
                            _Secton INT, _Type VARCHAR, _Weight NUMERIC(5,2),
                            _Description VARCHAR, _NumItems INT)
RETURNS BOOLEAN AS
$$
BEGIN

  --insert given parameters into AssessmentComponent
  INSERT INTO AssessmentComponent(Section, Type, Weight, Description, NumItems)
  VALUES (_Section, _Type, _Weight, _Description, _NumItems);

  RETURN TRUE;

END
$$
LANGUAGE sql
  VOLATILE
  RETURNS NULL ON NULL INPUT
  SECURITY INVOKER;

--this function is used to fully remove an AssessmentItem and it's dependents
--begins by deleting all sumbissions that refference the AssessmentItem to delete
--then deleting the AssessmentItem indicated by the input parameter
CREATE OR REPLACE FUNCTION removeAssessmentItem(ItemID INT)
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
    CALLED ON NULL INPUT
    SECURITY INVOKER;

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
