--addAssessmentComponentMgmt.sql - GradeBook

--Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Created for CS305-71
--Date of Revision: 11/7/2018

--this script creates the functions used by Team DOS's Gradebook
--implements management features for AssessmentComponents
--This includes: reading, deleting, updating

--Spool results to a file in the current directory
\o spoolAddAssessmentComponentMgmt.txt

--Echo time, date and user/server/DB info
\qecho -n 'Script run on '
\qecho -n `date /t`
\qecho -n 'at '
\qecho `time /t`
\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
\qecho ' '

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS createAssessmentComponent(INT, VARCHAR, NUMERIC(5,2), VARCHAR, INT);
--This function inserts a new AssessmentComponent with the given parameters
--as values to insert
CREATE OR REPLACE FUNCTION createAssessmentComponent(
                            Section INT, ComponentType VARCHAR, Weight NUMERIC(5,2),
                            Description VARCHAR, NumItems INT)
RETURNS BOOLEAN AS
$$
BEGIN

  --insert given parameters into AssessmentComponent
  INSERT INTO AssessmentComponent(Section, ComponentType, Weight, Description, NumItems)
  VALUES ($1, $2, $3, $4, $5);

  RETURN TRUE;

END
$$
LANGUAGE plpgsql
  VOLATILE
  CALLED ON NULL INPUT
  SECURITY INVOKER;

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS removeAssessmentComponent(INT);
--Deletes the AssessmentComponent with an ID == the input value
--First, must delete all tables with the ComponentToDelete as a foreign key
--begins by deleting all Sumbissions with a foreign key to the ComponentToDelete
--then deleting all AssessmentItems that refference the ComponentToDelete
--then deleting the AssessmentComponent instance with an ID == ComponentToDelete
CREATE OR REPLACE FUNCTION removeAssessmentComponent(ComponentToDelete INT)
RETURNS BOOLEAN AS
$$
BEGIN

  --delete submissions first
  --submission have a foreign key to AssessmentComponent and AssessmentItem
  DELETE FROM Submission WHERE Submission.Component = $1;

  --now we can delete from AssessmentItem
  --AssessmentItem has a foreign key to AssessmentComponent
  DELETE FROM AssessmentItem WHERE AssessmentItem.Component = $1;

  --now delete from AssessmentComponent
  DELETE FROM AssessmentComponent WHERE AssessmentComponent.ID = $1;

  --returns true if successful
  RETURN TRUE;

END;
$$ LANGUAGE plpgsql
   VOLATILE
   RETURNS NULL ON NULL INPUT
   SECURITY INVOKER;

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS getAssessmentComponent(INT);
--This functions returns a 1 row table containing an AssessmentComponent
--When given a single parameter, which is a ComponentID
CREATE OR REPLACE FUNCTION getAssessmentComponent(ComponentID INT)
RETURNS TABLE
(
  Section INT,
  ComponentType VARCHAR,
  Weight NUMERIC(5,2),
  Description VARCHAR,
  NumItems INT
)
AS
$$

      SELECT  Section, ComponentType, Weight, Description, NumItems
      FROM AssessmentComponent
      WHERE AssessmentComponent.ID = $1;

$$ LANGUAGE sql
    ROWS 1
    STABLE
    RETURNS NULL ON NULL INPUT
    SECURITY INVOKER;

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS getAssessmentComponentsFromSection(INT);
--This functions returns a table containing each AssessmentComponent
--with a Section == the given parameter
CREATE OR REPLACE FUNCTION getAssessmentComponentsFromSection(SectionID INT)
RETURNS TABLE
(
  ID INT,
  ComponentType VARCHAR,
  Weight NUMERIC(5,2),
  Description VARCHAR,
  NumItems INT
)
AS
$$

      SELECT  ID, ComponentType, Weight, Description, NumItems
      FROM AssessmentComponent
      WHERE AssessmentComponent.Section = $1;

$$ LANGUAGE sql
    STABLE
    RETURNS NULL ON NULL INPUT
    SECURITY INVOKER;

--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS updateAssessmentComponent(INT, VARCHAR, NUMERIC(5, 2), VARCHAR, INT);
--Takes 5 parameters, one for each attribute of AssessmentComponent
--The first paramter, ID, is the ID of the Component to update
--The other parameters are updated attrbiute values
--Any NULL input for ComponentType, Weight, or NumItems will be ignored as they do no allow NULL
--Decription allows a change to a NULL input, as per the table's definition
CREATE OR REPLACE FUNCTION updateAssessmentComponent(ComponentID INT, Component VARCHAR,
                                                     Weight NUMERIC(5, 2),
                                                    Description VARCHAR, NumItems INT)
RETURNS INTEGER AS
$$
DECLARE
  affectedRowCount INTEGER;
BEGIN

  UPDATE AssessmentComponent
  SET    ComponentType = COALESCE($2, AssessmentComponent.ComponentType),
         Weight = COALESCE($3, AssessmentComponent.Weight),
         Description = $4,
         NumItems = COALESCE($5, AssessmentComponent.NumItems)
  WHERE ID = $1;
  GET DIAGNOSTICS affectedRowCount = ROW_COUNT;

  RETURN affectedRowCount;

END;
$$ LANGUAGE plpgsql
    VOLATILE
    CALLED ON NULL INPUT
    SECURITY INVOKER;

\o
