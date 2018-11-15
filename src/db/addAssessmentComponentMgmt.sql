--addAssessmentComponentMgmt.sql - GradeBook

--Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Created for CS305-71
--Date of Revision: 11/7/2018

--this script creates the functions used by Team DOS's Gradebook
--implements management features for AssessmentComponents
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

--Deletes the AssessmentComponent with an ID == the input value
--First, mus delete all tables with the ComponentToDelete as a foreign key
--begins by deleting all Sumbissions with a foreign key to the ComponentToDelete
--then deleting all AssessmentItems that refference the ComponentToDelete
--then deleting the AssessmentComponent instance with an ID == ComponentToDelete
CREATE OR REPLACE FUNCTION removeAssessmentComponent(ComponentToDelete INT)
RETURNS BOOLEAN AS
$$
BEGIN

  --delete submissions first
  --submission have a foreign key to AssessmentComponent and AssessmentItem
  DELETE FROM Submission WHERE Component = $1;

  --now we can delete from AssessmentItem
  --AssessmentItem has a foreign key to AssessmentComponent
  DELETE FROM AssessmentItem WHERE Component = $1;

  --now delete from AssessmentComponent
  DELETE FROM AssessmentComponent WHERE ID = $1;

  --returns true if successful
  RETURN TRUE;

END;
$$ LANGUAGE plpgsql
   VOLATILE
   RETURNS NULL ON NULL INPUT
   SECURITY INVOKER;


--This functions returns all assessment components
CREATE OR REPLACE FUNCTION getAssessmentComponents()
RETURNS TABLE
(
  ID INT,
  Section INT,
  Type VARCHAR,
  Weight NUMERIC(5,2),
  Description VARCHAR,
  NumItems INT
)
AS
$$

      SELECT  ID, Section, Type, Weight, Description, NumItems
      FROM AssessmentComponent;

$$ LANGUAGE sql
    STABLE
    ROWS 1;


--This functions returns a 1 row table containing an AssessmentComponent
--When given a single parameter, which is a ComponentID
CREATE OR REPLACE FUNCTION getAssessmentComponent(ComponentID INT)
RETURNS TABLE
(
  Section INT,
  Type VARCHAR,
  Weight NUMERIC(5,2),
  Description VARCHAR,
  NumItems INT
)
AS
$$

      SELECT  Section, Type, Weight, Description, NumItems
      FROM AssessmentComponent
      WHERE ID = $1;

$$ LANGUAGE sql
    STABLE
    RETURNS NULL ON NULL INPUT
    ROWS 1;


--This functions returns a table containing each AssessmentComponent
--with a Section == the given parameter
CREATE OR REPLACE FUNCTION getAssessmentComponentWithSection(SectionID INT)
RETURNS TABLE
(
  ID INT,
  Type VARCHAR,
  Weight NUMERIC(5,2),
  Description VARCHAR,
  NumItems INT
)
AS
$$

      SELECT  ID, Type, Weight, Description, NumItems
      FROM AssessmentComponent
      WHERE Section = $1;

$$ LANGUAGE sql
    STABLE
    RETURNS NULL ON NULL INPUT;
